from __future__ import annotations
from pydantic import BaseModel, Field, ConfigDict
from typing import Literal, Optional, List, Dict, Any, Union

class Evidence(BaseModel):
    id: str = Field(..., description="Unique evidence identifier, e.g. EX-1")
    description: str = Field(..., description="Detailed description of the evidence")
    type: Literal["document", "electronic", "witness", "physical"] = Field(
        "document", description="Nature of the evidence"
    )
    strength: float = Field(0.5, ge=0.0, le=1.0, description="Probative strength from 0 to 1")
    admissible: bool = Field(True, description="Whether this evidence meets statutory admissibility (e.g. BSA Section 63)")
    produced_by: Literal["A", "B"] = Field("A", description="Party who produced this evidence")
    source_file: Optional[str] = Field(None, description="Original source file name or reference")

class Witness(BaseModel):
    id: str = Field(..., description="Witness identifier, e.g. PW-1 (Prosecution) or DW-1 (Defence)")
    side: Literal["A", "B"] = Field(..., description="Which party calls this witness")
    credibility: float = Field(0.5, ge=0.0, le=1.0, description="Baseline witness credibility")
    consistency: float = Field(0.5, ge=0.0, le=1.0, description="Consistency under cross-examination (0 to 1)")
    statement_summary: str = Field("", description="Summary of the witness's deposition or statement")

class CaseParams(BaseModel):
    case_id: str = Field(..., description="Unique case identifier")
    title: str = Field("Untitled Case", description="Short human-readable title of the case")
    case_type: Literal["criminal", "civil"] = Field("criminal", description="Substantive procedure type")
    court: Literal["Magistrate", "Sessions", "HighCourt", "SupremeCourt", "Civil"] = Field(
        "Magistrate", description="Court level deciding the matter"
    )
    sections: List[str] = Field(
        default_factory=lambda: ["BNS 103", "BNSS 480"],
        description="Statutory provisions in question"
    )
    facts: str = Field(..., description="Uncontested and contested factual matrix")
    party_a_role: str = Field("Prosecution", description="Procedural title for Party A (e.g. Prosecution/Plaintiff)")
    party_b_role: str = Field("Defence", description="Procedural title for Party B (e.g. Defence/Defendant)")
    evidence: List[Evidence] = Field(default_factory=list, description="All tendered items of evidence")
    witnesses: List[Witness] = Field(default_factory=list, description="All cited witnesses")
    burden_standard: Literal["beyond_reasonable_doubt", "preponderance"] = Field(
        "beyond_reasonable_doubt", description="Applicable legal standard of proof"
    )
    lawyer_skill_a: float = Field(0.5, ge=0.0, le=1.0, description="Procedural capability index of Counsel A")
    lawyer_skill_b: float = Field(0.5, ge=0.0, le=1.0, description="Procedural capability index of Counsel B")
    judge_profile: Literal["neutral", "strict_procedure", "lenient"] = Field(
        "neutral", description="Judicial leaning and scrutiny style"
    )
    max_rounds: int = Field(6, ge=1, le=20, description="Maximum procedural turns permitted")
    adjournment_rate: float = Field(0.0, ge=0.0, le=1.0, description="Chance of adjournment per turn (0 skips delays)")

    model_config = ConfigDict(extra="ignore")

class TurnAction(BaseModel):
    role: Literal["A", "B", "judge"] = Field(...)
    action: str = Field(..., description="Action taken, e.g. examine_in_chief, object, rule_on_objection")
    argument: str = Field(..., description="Substantive submission or judicial direction")
    cites: List[str] = Field(default_factory=list, description="Strictly evidence IDs (EX-1) or law IDs (LAW-BNS-103)")
    flags: List[str] = Field(default_factory=list, description="Verifier notes or protocol warnings")

class RunResult(BaseModel):
    run_id: str
    scenario_id: str
    seed: int
    first_speaker: Literal["A", "B"]
    verdict: Literal["A_prevails", "B_prevails", "partial"]
    judge_votes: List[str] = Field(default_factory=list, description="Three independent judge decisions")
    judge_agreement: float = Field(1.0, ge=0.0, le=1.0, description="Agreement proportion among judges (e.g. 1.0 or 0.67)")
    cited_evidence: List[str] = Field(default_factory=list, description="Evidence items cited in findings")
    cited_statutes: List[str] = Field(default_factory=list, description="Statutory sections relied on")
    tokens_used: int = 0
    trace: Dict[str, Any] = Field(default_factory=dict, description="Complete chronological procedural transcript")

class SimulationRequest(BaseModel):
    case_id: str
    sweeps: Dict[str, List[Any]] = Field(default_factory=dict, description="Grid sweep parameters (e.g. lawyer_skill_a: [0.3, 0.7])")
    runs_per_scenario: int = Field(10, ge=1, le=100, description="Number of independent parallel simulations per scenario")
    max_concurrency: Optional[int] = Field(None, ge=1, le=32, description="Parallel thread concurrency limit")

class ScenarioSummary(BaseModel):
    scenario_id: str
    params_diff: Dict[str, Any]
    runs_count: int
    win_rate_a: float
    win_rate_b: float
    partial_rate: float
    ci_95_a: List[float] = Field(default_factory=lambda: [0.0, 0.0], description="Wilson 95% Confidence Interval for Party A")
    ci_95_b: List[float] = Field(default_factory=lambda: [0.0, 0.0], description="Wilson 95% Confidence Interval for Party B")
    avg_agreement: float
    decisive_evidence: List[Dict[str, Any]] = Field(default_factory=list)

class SimulationSummary(BaseModel):
    simulation_id: str
    case_id: str
    total_runs: int
    scenarios: List[ScenarioSummary] = Field(default_factory=list)
    sensitivity: List[Dict[str, Any]] = Field(default_factory=list)
