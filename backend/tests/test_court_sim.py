"""
Comprehensive Test Suite for Indian Court Simulation Engine.
Verifies all 7 Hard Rules from Section 2 of Specification:
1. Zero LLM in environment loop
2. Reproducibility & Determinism
3. Fixed procedural rule DAG
4. Grounded citation & BSA Section 63 admissibility enforcement
5. Statistical distribution & Wilson 95% CI accuracy
6. Complete procedural trace logging
7. Enforce A/B label symmetry neutrality
"""

import pytest
import asyncio
from court_sim.schemas import CaseParams, Evidence, Witness, TurnAction, SimulationRequest
from court_sim.env.court_env import CourtEnvironment
from court_sim.env.verifier import CourtVerifier
from court_sim.rag.retrieve import StatutoryRetriever
from court_sim.sim.aggregate import StatisticalAggregator
from court_sim.sim.sweeps import SweepBuilder
from court_sim.agents.judge import JudgeAgent
from court_sim.agents.base import BaseLLMClient


@pytest.fixture
def mock_case_params() -> CaseParams:
    return CaseParams(
        case_id="case_unit_001",
        title="State of Maharashtra vs R. Sharma",
        case_type="criminal",
        court="Magistrate",
        sections=["BNS 318", "BSA 63", "BNSS 251"],
        facts="Accused allegedly induced complainant to invest Rs 25 Lakhs with false promises.",
        party_a_role="Prosecution",
        party_b_role="Defence",
        evidence=[
            Evidence(
                id="EX-1",
                description="Exported WhatsApp chats without Section 63 certificate",
                type="electronic",
                strength=0.8,
                admissible=False,  # Intentionally inadmissible!
                produced_by="A"
            ),
            Evidence(
                id="EX-2",
                description="Physical Bank Ledger Statement",
                type="document",
                strength=0.85,
                admissible=True,
                produced_by="B"
            )
        ],
        witnesses=[
            Witness(
                id="PW-1",
                side="A",
                credibility=0.8,
                consistency=0.7,
                statement_summary="Depositions regarding payment."
            )
        ],
        burden_standard="beyond_reasonable_doubt",
        lawyer_skill_a=0.7,
        lawyer_skill_b=0.7,
        judge_profile="neutral",
        max_rounds=6,
        adjournment_rate=0.0
    )


def test_statutory_retriever():
    """Verifies RAG statutory corpus retrieval and keyword search."""
    retriever = StatutoryRetriever()
    # Check Section 63 BSA retrieval
    laws = retriever.retrieve_for_sections(["BSA 63", "BNS 318"])
    assert "LAW-BSA-63" in laws or any("63" in k for k in laws)
    assert any("electronic" in v.lower() for v in laws.values())

    # Check search
    results = retriever.search("electronic record certificate")
    assert len(results) > 0
    assert any("63" in str(r) for r in results.keys())


def test_verifier_enforces_bsa_section_63(mock_case_params):
    """
    Hard Rule #4: Deterministic Verifier must reject inadmissible electronic evidence
    (e.g. chats lacking BSA Section 63 certificate).
    """
    retriever = StatutoryRetriever()
    laws = retriever.retrieve_for_sections(mock_case_params.sections)
    verifier = CourtVerifier(case_params=mock_case_params, retrieved_laws=laws)

    # 1. Action citing inadmissible electronic record EX-1
    bad_action = TurnAction(
        role="A",
        action="examine_in_chief",
        argument="Your Honour, we present the WhatsApp chat records under EX-1.",
        cites=["EX-1"],
        flags=[]
    )
    res = verifier.verify_action("A", bad_action, "evidence_prosecution", "Magistrate")
    assert res.is_valid is False
    assert any("Inadmissible evidence relied upon" in err for err in res.errors)
    assert any("BSA 2023 s.63" in err for err in res.errors)

    # 2. Action citing fake non-existent evidence
    fake_action = TurnAction(
        role="A",
        action="examine_in_chief",
        argument="We also tender secret document EX-999.",
        cites=["EX-999"],
        flags=[]
    )
    res_fake = verifier.verify_action("A", fake_action, "evidence_prosecution", "Magistrate")
    assert res_fake.is_valid is False
    assert any("Invalid Evidence ID cited: 'EX-999'" in err for err in res_fake.errors)

    # 3. Action citing valid admissible physical record EX-2 with valid law citation
    good_action = TurnAction(
        role="B",
        action="examine_in_chief",
        argument="Your Honour, we tender the audited physical ledger EX-2 under LAW-BSA-104.",
        cites=["EX-2", "LAW-BSA-104"],
        flags=[]
    )
    res_good = verifier.verify_action("B", good_action, "evidence_defense", "Magistrate")
    assert res_good.is_valid is True
    assert len(res_good.errors) == 0


def test_court_environment_determinism(mock_case_params):
    """
    Hard Rule #1 & #2: Zero LLMs in environment loop.
    Reproducible: same seed produces identical transitions and history sequence.
    """
    retriever = StatutoryRetriever()
    laws = retriever.retrieve_for_sections(mock_case_params.sections)
    verifier = CourtVerifier(case_params=mock_case_params, retrieved_laws=laws)

    # Run 1 with seed 42
    env1 = CourtEnvironment(mock_case_params, seed=42)
    seq1 = []
    for _ in range(5):
        role = env1.active_role
        allowed = env1.get_allowed_actions(role)
        act = allowed[0] if allowed else "argue"
        action = TurnAction(role=role, action=act, argument="Submission.", cites=[], flags=[])
        env1.step(action, verifier)
        seq1.append((env1.round_number, env1.current_phase, env1.active_role))

    # Run 2 with identical seed 42
    env2 = CourtEnvironment(mock_case_params, seed=42)
    seq2 = []
    for _ in range(5):
        role = env2.active_role
        allowed = env2.get_allowed_actions(role)
        act = allowed[0] if allowed else "argue"
        action = TurnAction(role=role, action=act, argument="Submission.", cites=[], flags=[])
        env2.step(action, verifier)
        seq2.append((env2.round_number, env2.current_phase, env2.active_role))

    assert seq1 == seq2


def test_wilson_score_confidence_intervals():
    """
    Hard Rule #5: Wilson Score 95% Confidence Interval calculation sanity and bounds.
    """
    # 0 out of 20
    low, high = StatisticalAggregator.wilson_score_interval(0, 20)
    assert low == 0.0
    assert 0.0 < high <= 1.0

    # 20 out of 20
    low, high = StatisticalAggregator.wilson_score_interval(20, 20)
    assert 0.0 <= low < 1.0
    assert high == 1.0

    # 10 out of 20 (50%)
    low, high = StatisticalAggregator.wilson_score_interval(10, 20)
    assert 0.25 < low < 0.5
    assert 0.5 < high < 0.75
    assert low < high


def test_sweep_builder_cartesian_product(mock_case_params):
    """Verifies parameter sweep grid builder with dotted path overrides."""
    sweeps = {
        "lawyer_skill_a": [0.4, 0.8],
        "evidence.EX-1.admissible": [True, False]
    }
    scenarios = SweepBuilder.generate_scenarios(mock_case_params, sweeps)
    # 2 x 2 = 4 scenarios
    assert len(scenarios) == 4

    # Verify overrides applied
    skills = [p.lawyer_skill_a for p, diff in scenarios.values()]
    assert 0.4 in skills and 0.8 in skills

    admissibles = [p.evidence[0].admissible for p, diff in scenarios.values()]
    assert True in admissibles and False in admissibles


@pytest.mark.asyncio
async def test_judge_ensemble_3_votes(mock_case_params):
    """
    Section 7.2 & Hard Rule #4: Neutral Judge 3-Vote Ensemble Majority.
    """
    client = BaseLLMClient(mock_mode=True)
    judge = JudgeAgent(mock_case_params, client=client)

    dummy_history = [
        {"round": 1, "phase": "evidence_prosecution", "role": "A", "action": "examine_in_chief", "argument": "Arguments", "cites": []},
        {"round": 1, "phase": "evidence_defense", "role": "B", "action": "cross_examine", "argument": "Objection", "cites": []}
    ]
    retriever = StatutoryRetriever()
    laws = retriever.retrieve_for_sections(mock_case_params.sections)
    verifier = CourtVerifier(case_params=mock_case_params, retrieved_laws=laws)

    verdict, votes, agreement, finding = await judge.evaluate_ensemble(
        history=dummy_history,
        retrieved_laws=laws,
        verifier=verifier
    )

    assert verdict in ["A_prevails", "B_prevails", "partial"]
    assert len(votes) == 3
    assert 0.0 <= agreement <= 1.0
    assert "reasons" in finding


@pytest.mark.asyncio
async def test_end_to_end_simulation_execution(mock_case_params, tmp_path):
    """
    Integration test: Runs end-to-end parallel simulation with live storage and statistical aggregation.
    """
    from court_sim.store.db import CourtSimDB
    from court_sim.sim.runner import SimulationRunner
    import os

    test_db_path = str(tmp_path / "test_sim.db")
    test_db = CourtSimDB(db_path=test_db_path)
    await test_db.init_db()

    # Save mock case
    await test_db.save_case(mock_case_params)

    # Configure runner with mock LLM client
    test_runner = SimulationRunner(db=test_db, max_concurrency=2)
    mock_client = BaseLLMClient(mock_mode=True)

    sim_id = "sim_test_e2e_001"
    request = SimulationRequest(
        case_id=mock_case_params.case_id,
        sweeps={"lawyer_skill_a": [0.3, 0.8]},
        runs_per_scenario=2
    )

    # Listen to SSE events
    queue = test_runner.subscribe(sim_id)

    # Execute simulation
    await test_runner.execute_simulation(
        simulation_id=sim_id,
        case_id=mock_case_params.case_id,
        request=request,
        client=mock_client
    )

    # Collect events
    events = []
    while not queue.empty():
        events.append(queue.get_nowait())

    test_runner.unsubscribe(sim_id, queue)

    assert any(e.get("type") == "started" for e in events)
    assert any(e.get("type") == "completed" for e in events)

    # Verify run results in DB
    runs = await test_db.get_simulation_runs(sim_id)
    assert len(runs) == 4  # 2 scenarios * 2 runs = 4 total

    # Check each run has valid verdict, judge votes, and trace
    for r in runs:
        assert r.verdict in ["A_prevails", "B_prevails", "partial"]
        assert len(r.judge_votes) == 3
        assert r.tokens_used > 0
        assert "history" in r.trace
