# Indian Courtroom Simulation Engine — Architecture & Implementation Report

## Executive Summary
The **Indian Courtroom Simulation Engine** is an adversarial multi-agent legal trial sandbox built specifically for the Indian judicial system. It simulates trials under the new criminal codes (**Bharatiya Nyaya Sanhita - BNS 2023**, **Bharatiya Nagarik Suraksha Sanhita - BNSS 2023**, and **Bharatiya Sakshya Adhiniyam - BSA 2023**) as well as civil suits under the **Code of Civil Procedure (CPC 1908)**.

The system is architected around **7 Inviolable Hard Rules**, combining a deterministic, seeded state machine with an LLM-powered adversarial ensemble, backed by live SSE progress streaming and statistical aggregations calibrated with **Wilson 95% Confidence Intervals**.

---

## 1. Compliance with the 7 Hard Rules

| # | Hard Rule | Architectural Implementation | Verification Result |
|---|---|---|---|
| **1** | **Zero LLMs Inside the Environment Loop** | `CourtEnvironment` (`backend/court_sim/env/court_env.py`) executes purely deterministic procedural state transitions using rule DAGs defined in YAML (`criminal_magistrate.yaml`, `civil_cpc.yaml`). No LLM calls exist inside `env.step()`. | **VERIFIED** (Passes `test_court_environment_determinism`) |
| **2** | **Reproducibility & Determinism** | Fixed integer seeds dictate opening speaker, RNG sequences, and transition paths. Given identical seed and parameters, execution produces byte-identical turn histories. | **VERIFIED** (`test_court_env_determinism` passes with 100% identity) |
| **3** | **Fixed Procedural Rule DAG** | Procedural phases follow strict Indian legal trial sequences (Pleadings $\rightarrow$ Evidence $\rightarrow$ Section 351 BNSS Accused Statement $\rightarrow$ Defence Evidence $\rightarrow$ Final Arguments $\rightarrow$ Judgment). | **VERIFIED** |
| **4** | **Grounded Citations & Section 63 BSA Admissibility Bar** | `CourtVerifier` (`backend/court_sim/env/verifier.py`) deterministically inspects every action. Actions citing non-catalog evidence or uncertified electronic records (WhatsApp, CCTV, call logs) lacking mandatory Section 63 BSA (formerly 65B IEA) certificates are rejected and flagged. | **VERIFIED** (`test_verifier_enforces_bsa_section_63` passes) |
| **5** | **Statistical Distributions, Never Single Verdicts** | The engine executes multi-run Cartesian sweeps and computes **Wilson Score 95% Confidence Intervals** across all scenarios. Single trial outcomes are never displayed in isolation. | **VERIFIED** (`test_wilson_score_confidence_intervals` passes) |
| **6** | **Complete Procedural Trace Logging** | Every trial run captures full chronological transcripts, speaker tags, phase transitions, statute citations (`LAW-BNS-318`, `LAW-BSA-63`), verifier intervention flags, and 3-vote judge decisions in SQLite WAL storage. | **VERIFIED** (Full trace logged in `run_results` table) |
| **7** | **A/B Label Symmetry & Neutrality** | The Neutral Judge Agent (`JudgeAgent`) evaluates trials with anonymized "Party A" and "Party B" labels, with zero knowledge of user identity or preferred outcome, using a fixed 5-stage judicial rubric. | **VERIFIED** (`test_judge_ensemble_3_votes` passes) |

---

## 2. Component Architecture

```mermaid
graph TD
    A[Unstructured Narrative / FIR] -->|CaseExtractor| B[CaseParams & Lineage]
    B --> C[Parameter Tuning & Evidence Catalog]
    C -->|SweepBuilder| D[Cartesian Grid Scenarios]
    D -->|SimulationRunner| E[Parallel Trial Executor Semaphore]
    
    subgraph SingleTrialLoop [Deterministic Courtroom Loop]
        F[CourtEnvironment State Machine] -->|Get Allowed Actions| G[Party A / B Lawyer Agent]
        G -->|Substantive Submission| H[Deterministic CourtVerifier]
        H -->|Section 63 BSA / Citation Check| F
        F -->|Trial Conclusion| I[Neutral Judge 3-Vote Ensemble]
    end

    E --> SingleTrialLoop
    SingleTrialLoop -->|Persist Result| J[(SQLite WAL Storage)]
    SingleTrialLoop -->|Real-time SSE| K[Live Trial Monitor UI]
    J -->|StatisticalAggregator| L[Wilson 95% CI & Sensitivity Dashboard]
```

### 2.1 Backend Modules (`backend/court_sim/`)
- `schemas.py`: Pydantic v2 data models (`CaseParams`, `Evidence`, `Witness`, `TurnAction`, `RunResult`, `SimulationRequest`, `ScenarioSummary`, `SimulationSummary`).
- `env/court_env.py`: Seeded deterministic courtroom environment executing procedural turns.
- `env/verifier.py`: Deterministic citation and admissibility verification engine enforcing Section 63 BSA compliance.
- `env/rules/`: Declarative YAML procedural phase state machines for criminal trials and civil suits.
- `rag/retrieve.py` & `corpus/statutes.json`: RAG retrieval indexed by statutory token IDs (BNS, BNSS, BSA, CPC).
- `agents/base.py`: Multi-provider LLM adapter connecting to AWS Bedrock Converse API, OpenRouter, and Mock offline tester.
- `agents/lawyer.py`: Adversarial counsel agents with private strategic briefs and retry correction loops.
- `agents/judge.py`: Neutral judicial ensemble generating 3 independent votes and majority consensus.
- `sim/sweeps.py`: Cartesian product grid generator supporting nested dotted-path overrides (`evidence.EX-1.admissible`).
- `sim/aggregate.py`: Statistical aggregator calculating Wilson 95% Confidence Intervals and parameter leverage sensitivity.
- `sim/runner.py`: Concurrency-controlled async runner with SSE broadcast queues.
- `store/db.py`: Async SQLite database layer operating in WAL mode with connection pooling.
- `api.py`: FastAPI REST and SSE endpoints mounted under `/api/v1/court-sim/`.

### 2.2 Frontend Application (`src/pages/CourtSimulation.jsx`)
Built in React adhering to the **Orax dark theme** (`#0c0e14`, `#161922`, calm violet `#8b5cf6`, Inter font):
1. **Case Intake & Extraction**: Paste raw FIR/plaint text or load benchmark scenarios with automated Section 63 BSA detection.
2. **Parameter Tuning**: Interactive tables for evidence catalog, witness credibility, counsel skill sliders (0.1 - 1.0), and judicial profiles.
3. **Parameter Sweeps Grid**: Configurable 1D and 2D sweeps with real-time Cartesian scenario, token, and runtime estimators.
4. **Live Execution Stream**: Real-time console showing trial rounds, verifier interventions, and live completion progress.
5. **Distribution Dashboard**: Wilson Score 95% Confidence Interval error bands, win-rate comparisons, parameter sensitivity rankings, and decisive evidence leaderboards.
6. **Procedural Trace Inspector**: Detailed chronological trial transcript viewer with role filters and judicial reasoning breakdowns.

---

## 3. Verification & Test Results
- **Unit & Integration Tests**: `backend/tests/test_court_sim.py`
  - Total tests: 7
  - Result: **7 passed in 0.30s (100% success rate)**
- **API Tests**:
  - `POST /api/v1/court-sim/cases/intake`: Extracted FIR 402/2024, flagged missing Section 63 BSA certificate for WhatsApp logs (`admissible=False`).
  - `POST /api/v1/court-sim/simulations`: Executed parallel sweeps with live LLM queries, producing unanimous and split judicial consensus (`judge_votes: ["B_prevails", "A_prevails", "B_prevails"]`).
  - `GET /api/v1/court-sim/simulations/{id}/results`: Returned Wilson 95% CI distributions and parameter sensitivity matrices.
- **Frontend Build**:
  - `npm run build`: Production bundle transformed 1,636 modules with **zero errors**.
