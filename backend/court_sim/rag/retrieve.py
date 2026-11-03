from __future__ import annotations
import os
import json
import re
from typing import Dict, List, Any, Optional

CORPUS_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "corpus", "statutes.json")

class StatutoryRetriever:
    """
    RAG retriever for statutory grounding in court simulations.
    Indexed by section ID (LAW-BNS-103) and searchable by legal keywords.
    """
    def __init__(self, corpus_path: str = CORPUS_PATH):
        self.corpus_path = corpus_path
        self.corpus: Dict[str, Dict[str, str]] = self._load_corpus()

    def _load_corpus(self) -> Dict[str, Dict[str, str]]:
        if os.path.exists(self.corpus_path):
            with open(self.corpus_path, "r", encoding="utf-8") as f:
                return json.load(f)
        return {}

    def get_by_id(self, law_id: str) -> Optional[Dict[str, str]]:
        return self.corpus.get(law_id.upper())

    def retrieve_for_sections(self, sections: List[str], max_chunks: int = 8) -> Dict[str, str]:
        """
        Retrieves matching law chunks given sections like ['BNS 318', 'BSA 63'].
        """
        results: Dict[str, str] = {}
        for s in sections:
            s_clean = s.strip().upper().replace("SECTION", "").replace("SEC", "").strip()
            s_hyphen = s_clean.replace(" ", "-")
            tokens = set(re.findall(r"\w+", s_clean))
            
            for law_id, item in self.corpus.items():
                if len(results) >= max_chunks:
                    break
                sec_num = str(item.get("section", "")).upper()
                law_tokens = set(re.findall(r"\w+", law_id))
                
                # Direct match: s_hyphen in law_id or sec_num in tokens
                if s_hyphen in law_id or (sec_num in tokens and (tokens.intersection(law_tokens) or sec_num == s_clean)):
                    results[law_id] = f"{item['title']} ({item['statute']} Sec {item['section']}): {item['text']}"

        # If empty or fewer than max, add foundational provisions (e.g. BSA Section 63 & 104)
        for base_id in ["LAW-BSA-63", "LAW-BSA-104", "LAW-BNS-318"]:
            if len(results) < max_chunks and base_id in self.corpus and base_id not in results:
                item = self.corpus[base_id]
                results[base_id] = f"{item['title']} ({item['statute']} Sec {item['section']}): {item['text']}"

        return results

    def search(self, query: str, top_k: int = 5) -> Dict[str, str]:
        """
        Keyword search over statutory provisions.
        Ensures queries like 'electronic record certificate' match LAW-BSA-63.
        """
        query_tokens = set(re.findall(r"\w+", query.lower()))
        scored: List[Tuple[float, str, str]] = []

        for law_id, item in self.corpus.items():
            full_text = f"{item.get('title', '')} {item.get('text', '')} {item.get('statute', '')} {item.get('section', '')}".lower()
            item_tokens = set(re.findall(r"\w+", full_text))
            
            overlap = query_tokens.intersection(item_tokens)
            score = len(overlap) / (len(query_tokens) + 1e-5)
            
            # Extra boost for exact phrase match
            if query.lower() in full_text:
                score += 2.0

            if score > 0:
                summary = f"{item['title']} ({item['statute']} Sec {item['section']}): {item['text']}"
                scored.append((score, law_id, summary))

        scored.sort(key=lambda x: x[0], reverse=True)
        return {law_id: text for _, law_id, text in scored[:top_k]}

retriever = StatutoryRetriever()
