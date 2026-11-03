from __future__ import annotations
import json
import logging
from collections import Counter
from typing import Dict, List, Any, Optional, Literal, Tuple
from court_sim.schemas import CaseParams, TurnAction
from court_sim.agents.base import BaseLLMClient, llm_client
from court_sim.env.verifier import CourtVerifier

logger = logging.getLogger("court_sim.judge")

class JudgeAgent:
    """
    Neutral Judge Agent following Indian procedural law.
    Hard Rule #4: Judge sees Party A / Party B only. Never sees user identity or preferred outcome.
    Section 7.2: Fixed rubric & 3-vote ensemble majority.
    """
    def __init__(self, case_params: CaseParams, client: Optional[BaseLLMClient] = None):
        self.case_params = case_params
        self.client = client or llm_client
        self.profile = case_params.judge_profile # "neutral", "strict_procedure", "lenient"

    def _build_anonymized_record(self, history: List[Dict[str, Any]]) -> str:
        """
        Ensures complete anonymization: strictly Party A and Party B.
        No user metadata or preference is included.
        """
        lines = []
        for h in history:
            role = f"Party {h['role']}" if h['role'] in ['A', 'B'] else "Judge"
            action = h.get('action', '')
            arg = h.get('argument', '')
            cites = f" [Cited: {', '.join(h.get('cites', []))}]" if h.get('cites') else ""
            lines.append(f"[{h.get('phase', '')}] {role} ({action}): {arg}{cites}")
        return "\n".join(lines)

    async def decide_single_vote(
        self,
        history: List[Dict[str, Any]],
        retrieved_laws: Dict[str, str],
        verifier: CourtVerifier,
        vote_index: int = 1
    ) -> Dict[str, Any]:
        """
        Conducts one judicial determination following the fixed rubric:
        issues > burden/standard > admissible evidence analysis > best arguments > finding > reasons.
        """
        anonymized_history = self._build_anonymized_record(history)
        
        # Only admissible evidence presented to judge
        admissible_evidence = [
            {"id": e.id, "desc": e.description, "strength": e.strength, "produced_by": f"Party {e.produced_by}"}
            for e in self.case_params.evidence if e.admissible
        ]

        system_prompt = (
            f"You are a neutral presiding Judge in an Indian {self.case_params.court} Court.\n"
            f"You must adjudicate strictly between Party A and Party B without bias or extraneous knowledge.\n"
            f"JUDICIAL PROFILE: {self.profile.upper()}.\n"
            f"APPLICABLE STANDARD: {self.case_params.burden_standard.replace('_', ' ').upper()}.\n\n"
            f"MANDATORY RUBRIC ORDER:\n"
            f"1. Frame the core issues under {', '.join(self.case_params.sections)}.\n"
            f"2. Apply burden of proof under LAW-BSA-104.\n"
            f"3. Evaluate ONLY admissible evidence items tendered.\n"
            f"4. Weigh the best argument of Party A versus the best argument of Party B.\n"
            f"5. Arrive at a definitive finding: 'A_prevails', 'B_prevails', or 'partial'.\n\n"
            f"OUTPUT FORMAT: Strict JSON matching:\n"
            f"{{\n"
            f"  'verdict': 'A_prevails' | 'B_prevails' | 'partial',\n"
            f"  'reasons': 'Concise judicial reasoning following the rubric',\n"
            f"  'decisive_evidence': ['EX-1', ...],\n"
            f"  'cited_statutes': ['LAW-BNS-103', ...]\n"
            f"}}"
        )

        user_prompt = (
            f"CASE FACTS:\n{self.case_params.facts}\n\n"
            f"COUNSEL ADVOCACY QUALITY: Party A Skill Level: {self.case_params.lawyer_skill_a:.2f}, Party B Skill Level: {self.case_params.lawyer_skill_b:.2f}\n\n"
            f"ADMISSIBLE EVIDENCE CATALOG:\n{json.dumps(admissible_evidence)}\n\n"
            f"EXCLUDED EVIDENCE (INADMISSIBLE):\n{json.dumps([e.id for e in self.case_params.evidence if not e.admissible])}\n\n"
            f"RETRIEVED STATUTORY TEXTS:\n{json.dumps(retrieved_laws)}\n\n"
            f"COMPLETE TRIAL PROCEEDINGS (CHRONOLOGICAL):\n{anonymized_history}\n\n"
            f"Deliver your final reasoned judgment."
        )

        # Vary temperature slightly per vote index for diverse judicial evaluation
        temperature = 0.1 + (vote_index * 0.1)

        result = await self.client.generate_json(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=temperature
        )

        # Validate verdict token
        verdict = result.get("verdict", "partial")
        if verdict not in ["A_prevails", "B_prevails", "partial"]:
            verdict = "partial"
        result["verdict"] = verdict

        # Filter decisive evidence to verified IDs
        valid_ev = [
            ev for ev in result.get("decisive_evidence", [])
            if ev.upper() in verifier.valid_evidence_ids
        ]
        if not valid_ev:
            valid_ev = [e.id for e in self.case_params.evidence if e.admissible]
        result["decisive_evidence"] = valid_ev

        if not result.get("reasons"):
            if verdict == "A_prevails":
                result["reasons"] = f"Party A proved all material ingredients with admissible evidence under {', '.join(self.case_params.sections)}."
            elif verdict == "B_prevails":
                result["reasons"] = f"Party B successfully established reasonable doubt under LAW-BSA-104. Guilt is not proven beyond reasonable doubt."
            else:
                result["reasons"] = "Evidence presented is evenly matched; court finds the matter inconclusive on contested allegations."

        return result

    async def evaluate_ensemble(
        self,
        history: List[Dict[str, Any]],
        retrieved_laws: Dict[str, str],
        verifier: CourtVerifier
    ) -> Tuple[str, List[str], float, Dict[str, Any]]:
        """
        Executes Section 7.2 ensemble: 3 judge calls, majority vote, and agreement rate.
        Returns: (consensus_verdict, votes_list, agreement_rate, representative_finding)
        """
        votes: List[str] = []
        findings: List[Dict[str, Any]] = []

        for i in range(3):
            decision = await self.decide_single_vote(history, retrieved_laws, verifier, vote_index=i+1)
            votes.append(decision["verdict"])
            findings.append(decision)

        # Compute majority vote
        vote_counts = Counter(votes)
        majority_verdict, highest_count = vote_counts.most_common(1)[0]
        agreement_rate = highest_count / 3.0

        # Select the finding that aligns with majority
        primary_finding = next((f for f in findings if f["verdict"] == majority_verdict), findings[0])

        return majority_verdict, votes, agreement_rate, primary_finding
