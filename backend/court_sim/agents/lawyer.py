from __future__ import annotations
import json
import logging
from typing import Dict, List, Any, Optional, Literal
from court_sim.schemas import CaseParams, TurnAction
from court_sim.agents.base import BaseLLMClient, llm_client
from court_sim.env.verifier import CourtVerifier

logger = logging.getLogger("court_sim.lawyer")

class LawyerAgent:
    """
    Lawyer Agent representing either Party A or Party B.
    Follows Indian courtroom procedure, cites only valid evidence IDs & retrieved law chunks.
    """
    def __init__(
        self,
        role: Literal["A", "B"],
        case_params: CaseParams,
        client: Optional[BaseLLMClient] = None
    ):
        self.role = role
        self.case_params = case_params
        self.client = client or llm_client
        self.skill = case_params.lawyer_skill_a if role == "A" else case_params.lawyer_skill_b
        self.role_name = case_params.party_a_role if role == "A" else case_params.party_b_role
        
        # Private strategy notes (never shared with opponent)
        self.strategy_notes = self._generate_strategy_notes()

    def _generate_strategy_notes(self) -> str:
        if self.role == "A":
            return (
                f"STRATEGY FOR {self.role_name}: Maximize reliance on primary documentary exhibits. "
                f"Establish each ingredient of the statutory offence under {', '.join(self.case_params.sections)}. "
                f"Ensure all digital proofs are grounded in valid certificates."
            )
        else:
            return (
                f"STRATEGY FOR {self.role_name}: Challenge admissibility of prosecution exhibits under BSA 2023. "
                f"Expose internal contradictions during cross-examination. Emphasize standard of reasonable doubt."
            )

    async def get_turn_action(
        self,
        current_phase: str,
        allowed_actions: List[str],
        history: List[Dict[str, Any]],
        retrieved_laws: Dict[str, str],
        verifier: CourtVerifier,
        max_retries: int = 2
    ) -> TurnAction:
        """
        Executes turn generation with deterministic verification and retry loop.
        """
        system_prompt = (
            f"You are an Indian advocate representing Party {self.role} ({self.role_name}) "
            f"before the {self.case_params.court} Court.\n"
            f"HARD RULES:\n"
            f"1. You must pick exactly one action from ALLOWED ACTIONS: {allowed_actions}.\n"
            f"2. You may ONLY cite Evidence IDs present in the evidence catalog or statutory IDs from RETRIEVED LAWS.\n"
            f"3. Inadmissible evidence cannot be tendered or relied upon.\n"
            f"4. Respond with strict JSON matching schema: {{'action': str, 'argument': str, 'cites': [str]}}.\n"
            f"Skill level: {self.skill:.2f}."
        )

        evidence_catalog = [
            {"id": e.id, "desc": e.description, "admissible": e.admissible, "produced_by": e.produced_by}
            for e in self.case_params.evidence
        ]
        witness_catalog = [
            {"id": w.id, "side": w.side, "credibility": w.credibility, "statement": w.statement_summary}
            for w in self.case_params.witnesses
        ]

        recent_history = history[-4:] if len(history) > 4 else history

        user_prompt = (
            f"CASE FACTS:\n{self.case_params.facts}\n\n"
            f"PRIVATE STRATEGY:\n{self.strategy_notes}\n\n"
            f"CURRENT PHASE: {current_phase}\n"
            f"ALLOWED ACTIONS: {allowed_actions}\n"
            f"EVIDENCE CATALOG: {json.dumps(evidence_catalog)}\n"
            f"WITNESS CATALOG: {json.dumps(witness_catalog)}\n"
            f"RETRIEVED LAWS: {json.dumps(retrieved_laws)}\n"
            f"RECENT PROCEEDINGS:\n{json.dumps(recent_history, default=str)}\n\n"
            f"Select your best procedural action and formulate your substantive argument citing valid IDs."
        )

        error_feedback = ""
        for attempt in range(max_retries + 1):
            prompt_with_feedback = user_prompt + (f"\nPREVIOUS ERROR: {error_feedback}. Fix your action and citations." if error_feedback else "")
            
            raw_response = await self.client.generate_json(
                system_prompt=system_prompt,
                user_prompt=prompt_with_feedback,
                temperature=0.2 if self.skill > 0.5 else 0.4
            )

            action_name = raw_response.get("action", "")
            if action_name not in allowed_actions and allowed_actions:
                action_name = allowed_actions[0]

            action = TurnAction(
                role=self.role,
                action=action_name,
                argument=raw_response.get("argument", f"Submissions on behalf of Party {self.role}."),
                cites=raw_response.get("cites", [])
            )

            v_res = verifier.verify_action(
                role=self.role,
                action=action,
                current_phase=current_phase,
                court_level=self.case_params.court
            )

            if v_res.is_valid:
                action.flags.extend(v_res.flags)
                return action

            # Verifier rejected citations
            error_feedback = "; ".join(v_res.errors)
            logger.warning("Attempt %d failed verification for Party %s: %s", attempt, self.role, error_feedback)

        # Max retries exhausted: apply penalty flag and filter cites to strictly admissible and valid tokens
        valid_cites = [
            c for c in action.cites 
            if (c.upper() in verifier.valid_evidence_ids and verifier.valid_evidence_ids[c.upper()].admissible)
            or c.upper() in verifier.valid_witness_ids
            or c.upper() in verifier.valid_law_ids
        ]
        action.cites = valid_cites
        action.flags.append(f"Notice: Cites trimmed to admissible exhibits after {max_retries} attempts.")
        return action
