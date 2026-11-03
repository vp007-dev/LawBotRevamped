"""
Case Intake and Parameter Extractor for Indian Court Simulator.
Parses raw FIRs, plaints, written statements, or case briefs into validated CaseParams.
Flags electronic records lacking BSA Section 63 certificates.
"""

from __future__ import annotations

import json
import logging
import uuid
import re
from typing import Dict, List, Any, Optional, Tuple

from court_sim.schemas import CaseParams, Evidence, Witness
from court_sim.agents.base import BaseLLMClient, llm_client

logger = logging.getLogger("court_sim.intake")

INTAKE_SYSTEM_PROMPT = """You are an expert Indian Legal Registrar.
Analyze the user's case narrative (FIR, plaint, charge sheet, or brief) and extract a structured configuration adhering strictly to Indian Law (BNS, BNSS, BSA 2023 or CPC).

Respond strictly with a JSON object with these keys:
{
  "title": "Short case title",
  "case_type": "criminal" or "civil",
  "court": "Magistrate" | "Sessions" | "Civil" | "HighCourt",
  "sections": ["BNS 103", "BSA 63", ...],
  "facts": "Concise factual matrix of contested and uncontested points",
  "party_a_role": "Prosecution" (if criminal) or "Plaintiff" (if civil),
  "party_b_role": "Defence" (if criminal) or "Defendant" (if civil),
  "evidence": [
    {
      "id": "EX-1",
      "description": "WhatsApp chat export",
      "type": "electronic" | "document" | "physical",
      "strength": 0.75,
      "admissible": true or false,
      "produced_by": "A" or "B"
    }
  ],
  "witnesses": [
    {
      "id": "PW-1" (for party A) or "DW-1" (for party B),
      "side": "A" or "B",
      "credibility": 0.8,
      "consistency": 0.7,
      "statement_summary": "Summary of deposition"
    }
  ],
  "burden_standard": "beyond_reasonable_doubt" or "preponderance",
  "lineage_notes": {
    "electronic_certificate_status": "Explanation of whether Section 63 BSA certificate was provided or missing",
    "sources": "Key source elements extracted from text"
  }
}

CRITICAL RULES:
1. For any electronic record (WhatsApp, CCTV, email, phone records, audio/video), verify whether a Section 63 BSA (formerly 65B IEA) electronic certificate was explicitly stated. If not mentioned or absent, you MUST set 'admissible': false.
2. Return ONLY JSON.
"""

class CaseExtractor:
    """
    Parses unstructured case narratives into structured CaseParams.
    """
    def __init__(self, client: Optional[BaseLLMClient] = None):
        self.client = client or llm_client

    async def extract_from_narrative(self, narrative: str) -> Tuple[CaseParams, Dict[str, Any]]:
        """Parses narrative and returns (CaseParams, lineage_metadata)."""
        narrative_clean = narrative.strip()
        if not narrative_clean:
            raise ValueError("Narrative text is empty.")

        # If offline or mock
        if self.client.mock_mode:
            return self._heuristic_extraction(narrative_clean)

        try:
            data = await self.client.generate_json(
                system_prompt=INTAKE_SYSTEM_PROMPT,
                user_prompt=f"CASE NARRATIVE:\n{narrative_clean}"
            )
            return self._parse_extracted_dict(data, narrative_clean)
        except Exception as e:
            logger.warning("LLM extraction failed (%s); using deterministic heuristic extractor", e)
            return self._heuristic_extraction(narrative_clean)

    def _parse_extracted_dict(self, data: Dict[str, Any], raw_narrative: str) -> Tuple[CaseParams, Dict[str, Any]]:
        case_id = f"case_{uuid.uuid4().hex[:8]}"
        case_type = data.get("case_type", "criminal")
        if case_type not in ["criminal", "civil"]:
            case_type = "criminal"

        court = data.get("court", "Magistrate" if case_type == "criminal" else "Civil")

        ev_list: List[Evidence] = []
        for idx, item in enumerate(data.get("evidence", [])):
            ev_id = item.get("id") or f"EX-{idx+1}"
            ev_type = item.get("type", "document")
            admissible = bool(item.get("admissible", True))

            # Hard Rule #4: Section 63 BSA compliance for electronic records
            if ev_type == "electronic" and "63" not in raw_narrative.lower() and "65b" not in raw_narrative.lower() and "certificate" not in raw_narrative.lower():
                admissible = False

            ev_list.append(Evidence(
                id=ev_id,
                description=item.get("description", f"Document {idx+1}"),
                type=ev_type,
                strength=float(item.get("strength", 0.6)),
                admissible=admissible,
                produced_by=item.get("produced_by", "A"),
                source_file=None
            ))

        wit_list: List[Witness] = []
        for idx, item in enumerate(data.get("witnesses", [])):
            side = item.get("side", "A")
            prefix = "PW" if side == "A" else "DW"
            wit_id = item.get("id") or f"{prefix}-{idx+1}"
            wit_list.append(Witness(
                id=wit_id,
                side=side,
                credibility=float(item.get("credibility", 0.7)),
                consistency=float(item.get("consistency", 0.7)),
                statement_summary=item.get("statement_summary", "Witness statement")
            ))

        # Default fallback evidence if none provided
        if not ev_list:
            ev_list = [
                Evidence(id="EX-1", description="Primary Formal Complaint Copy", type="document", strength=0.8, admissible=True, produced_by="A"),
                Evidence(id="EX-2", description="Rebuttal Records & Proof of Delivery", type="document", strength=0.7, admissible=True, produced_by="B")
            ]

        # Default fallback witnesses if none provided
        if not wit_list:
            wit_list = [
                Witness(id="PW-1", side="A", credibility=0.8, consistency=0.75, statement_summary="Complainant testimony verifying transaction events."),
                Witness(id="DW-1", side="B", credibility=0.75, consistency=0.7, statement_summary="Defense witness confirming bona fide absence of fraudulent intent.")
            ]

        params = CaseParams(
            case_id=case_id,
            title=data.get("title", raw_narrative[:60]),
            case_type=case_type,
            court=court,
            sections=data.get("sections", ["BNS 318", "BSA 63"] if case_type == "criminal" else ["CPC Order XIV", "BSA 104"]),
            facts=data.get("facts", raw_narrative),
            party_a_role=data.get("party_a_role", "Prosecution" if case_type == "criminal" else "Plaintiff"),
            party_b_role=data.get("party_b_role", "Defence" if case_type == "criminal" else "Defendant"),
            evidence=ev_list,
            witnesses=wit_list,
            burden_standard=data.get("burden_standard", "beyond_reasonable_doubt" if case_type == "criminal" else "preponderance"),
            lawyer_skill_a=0.7,
            lawyer_skill_b=0.7,
            judge_profile="neutral",
            max_rounds=6,
            adjournment_rate=0.0
        )

        lineage = data.get("lineage_notes", {
            "source": "LLM extracted from narrative",
            "electronic_certificate_status": "Assessed under BSA 2023 Section 63"
        })

        return params, lineage

    def _heuristic_extraction(self, narrative: str) -> Tuple[CaseParams, Dict[str, Any]]:
        lower = narrative.lower()
        is_civil = any(w in lower for w in ["plaintiff", "defendant", "suit", "property", "injunction", "cpc", "specific performance"])
        case_type = "civil" if is_civil else "criminal"
        court = "Civil" if is_civil else ("Sessions" if "murder" in lower or "103" in lower else "Magistrate")

        has_electronic = any(w in lower for w in ["whatsapp", "cctv", "email", "chat", "recording", "call log", "electronic"])
        has_cert = "section 63" in lower or "65b" in lower or "certificate" in lower

        ev1_admissible = True if (not has_electronic or has_cert) else False

        evidence = [
            Evidence(
                id="EX-1",
                description="Digital Records & Chat Transcripts" if has_electronic else "Primary Document / FIR Complaint Copy",
                type="electronic" if has_electronic else "document",
                strength=0.85 if ev1_admissible else 0.25,
                admissible=ev1_admissible,
                produced_by="A",
                source_file=None
            ),
            Evidence(
                id="EX-2",
                description="Transactional Statement / Alibi Proof",
                type="document",
                strength=0.75,
                admissible=True,
                produced_by="B",
                source_file=None
            )
        ]

        witnesses = [
            Witness(
                id="PW-1",
                side="A",
                credibility=0.8,
                consistency=0.75,
                statement_summary="Complainant attesting to the timeline and material facts."
            ),
            Witness(
                id="DW-1",
                side="B",
                credibility=0.75,
                consistency=0.7,
                statement_summary="Independent defense witness testifying to legitimate transaction."
            )
        ]

        sections = (
            ["CPC Order XIV", "CPC Sec 33", "BSA 104"]
            if is_civil
            else (["BNS 103", "BSA 63", "BNSS 251"] if "murder" in lower or "kill" in lower else ["BNS 318", "BNS 316", "BSA 63"])
        )

        title = narrative.split("\n")[0][:60] or ("Civil Commercial Suit" if is_civil else "State vs Accused")
        case_id = f"case_{uuid.uuid4().hex[:8]}"

        params = CaseParams(
            case_id=case_id,
            title=title,
            case_type=case_type,
            court=court,
            sections=sections,
            facts=narrative,
            party_a_role="Plaintiff" if is_civil else "Prosecution",
            party_b_role="Defendant" if is_civil else "Defence",
            evidence=evidence,
            witnesses=witnesses,
            burden_standard="preponderance" if is_civil else "beyond_reasonable_doubt",
            lawyer_skill_a=0.7,
            lawyer_skill_b=0.7,
            judge_profile="neutral",
            max_rounds=6,
            adjournment_rate=0.0
        )

        lineage = {
            "source": "Heuristic classifier based on keywords",
            "electronic_evidence_detected": has_electronic,
            "bsa_section_63_certificate": "Present" if has_cert else ("MISSING - Marked EX-1 inadmissible" if has_electronic else "N/A"),
            "court_classified": court
        }

        return params, lineage
