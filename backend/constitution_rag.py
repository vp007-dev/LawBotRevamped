import os
import json
import re
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger("constitution_rag")

class ConstitutionRAG:
    """
    RAG retrieval engine for the official Constitution of India database.
    Contains 448 Articles across 25 Parts and 122 Landmark Supreme Court Precedents.
    """
    def __init__(self, data_path: Optional[str] = None):
        if not data_path:
            base_dir = os.path.dirname(os.path.abspath(__file__))
            data_path = os.path.join(base_dir, "data", "constitution_of_india.json")
        
        self.data_path = data_path
        self.articles: List[Dict[str, Any]] = []
        self.parts: List[Dict[str, Any]] = []
        self.article_map: Dict[str, Dict[str, Any]] = {}
        self.load_data()

    def load_data(self):
        try:
            if not os.path.exists(self.data_path):
                logger.error(f"Constitution database file not found at {self.data_path}")
                return

            with open(self.data_path, "r", encoding="utf-8") as f:
                raw_data = json.load(f)

            if isinstance(raw_data, list) and len(raw_data) >= 2:
                self.articles = raw_data[0] or []
                self.parts = raw_data[1] or []
            elif isinstance(raw_data, list):
                self.articles = raw_data

            # Build rapid lookup map
            for art in self.articles:
                art_no = str(art.get("ArtNo", "")).strip().upper()
                clean_no = re.sub(r'[\.\s]+', '', art_no)
                if clean_no:
                    self.article_map[clean_no] = art
                    self.article_map[f"ARTICLE{clean_no}"] = art
                    self.article_map[f"ART{clean_no}"] = art

            # Special alias for Preamble
            if "0" in self.article_map:
                self.article_map["PREAMBLE"] = self.article_map["0"]

            logger.info(f"ConstitutionRAG initialized with {len(self.articles)} articles and {len(self.parts)} parts.")
        except Exception as e:
            logger.error(f"Failed to load constitution database: {e}")

    def get_article(self, art_no: str) -> Optional[Dict[str, Any]]:
        if not art_no:
            return None
        clean_key = re.sub(r'[\.\s]+', '', str(art_no).strip().upper())
        clean_key = re.sub(r'^(ARTICLE|ART)', '', clean_key)
        return self.article_map.get(clean_key)

    def search(self, query: str, max_results: int = 3) -> List[Dict[str, Any]]:
        if not query or not isinstance(query, str):
            return []

        lower_query = query.lower()

        # 1. Direct Article number extraction (e.g., "Article 21", "Art 14", "Article 300A")
        direct_match = re.search(r'\b(?:article|art\.?)\s*([0-9]+[a-z]?)\b', lower_query)
        if direct_match:
            art_no = direct_match.group(1).upper()
            art = self.get_article(art_no)
            if art:
                return [{
                    "article": art,
                    "score": 100,
                    "direct_match": True,
                    "voice_summary": self.summarize_for_voice(art)
                }]

        # Check for Preamble mention
        if "preamble" in lower_query:
            preamble = self.get_article("0")
            if preamble:
                return [{
                    "article": preamble,
                    "score": 95,
                    "direct_match": True,
                    "voice_summary": self.summarize_for_voice(preamble)
                }]

        # 2. Tokenized keyword scoring
        tokens = [w for w in re.findall(r'\b\w{3,}\b', lower_query)]
        if not tokens:
            return []

        scored = []
        for art in self.articles:
            score = 0
            art_no = str(art.get("ArtNo", "")).lower()
            name = (art.get("Name") or "").lower()
            desc = (art.get("ArtDesc") or "").lower()
            category = (art.get("category") or "").lower()
            keywords = [k.lower() for k in art.get("keywords", [])]
            landmark_cases = [c.lower() for c in art.get("landmark_cases", [])]
            part_no = art.get("PartNo", "")

            # Boost fundamental rights (Part III)
            if part_no == "III":
                score += 4
            if art.get("importance") == "fundamental":
                score += 5

            # Exact article match in query
            if f"article {art_no}" in lower_query or f"art {art_no}" in lower_query:
                score += 50

            # Title matches
            if name and any(token in name for token in tokens):
                score += 15
            if lower_query in name:
                score += 30

            # Keywords match
            for t in tokens:
                if any(t in kw for kw in keywords):
                    score += 8
                if any(t in c for c in landmark_cases):
                    score += 10
                if t in desc:
                    score += 3
                if t in category:
                    score += 6

            # Semantic / Legal concept boosts
            if any(w in lower_query for w in ["speech", "expression", "press", "media", "censorship"]) and art_no == "19":
                score += 35
            if any(w in lower_query for w in ["life", "liberty", "privacy", "surveillance", "dignity", "phone"]) and art_no == "21":
                score += 40
            if any(w in lower_query for w in ["arrest", "custody", "detention", "police", "fir"]) and art_no in ["21", "22"]:
                score += 35
            if any(w in lower_query for w in ["equal", "equality", "discrimination", "caste", "gender"]) and art_no in ["14", "15"]:
                score += 35
            if any(w in lower_query for w in ["writ", "habeas corpus", "mandamus", "certiorari", "quo warranto"]) and art_no in ["32", "226"]:
                score += 40
            if any(w in lower_query for w in ["reservation", "quota", "ews", "employment"]) and art_no in ["15", "16", "335"]:
                score += 35
            if any(w in lower_query for w in ["property", "land acquisition", "compensation"]) and art_no in ["300a", "31a"]:
                score += 35
            if any(w in lower_query for w in ["religion", "worship", "faith", "temple", "kirpan"]) and art_no in ["25", "26"]:
                score += 35
            if any(w in lower_query for w in ["education", "school", "children"]) and art_no in ["21a", "45"]:
                score += 35
            if any(w in lower_query for w in ["untouchability", "dalit", "atrocities"]) and art_no in ["17", "15"]:
                score += 40
            if any(w in lower_query for w in ["amendment", "amend", "basic structure"]) and art_no in ["368", "13"]:
                score += 40
            if any(w in lower_query for w in ["legal aid", "free lawyer", "poor"]) and art_no == "39a":
                score += 35
            if any(w in lower_query for w in ["uniform civil code", "ucc"]) and art_no == "44":
                score += 40
            if any(w in lower_query for w in ["bail", "undertrial", "speedy trial"]) and art_no == "21":
                score += 35

            if score > 0:
                scored.append({
                    "article": art,
                    "score": score,
                    "voice_summary": self.summarize_for_voice(art)
                })

        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored[:max_results]

    def summarize_for_voice(self, art: Dict[str, Any]) -> str:
        """
        Creates a crisp spoken summary of the article suitable for voice synthesis.
        """
        art_no = art.get("ArtNo", "")
        name = art.get("Name", "")
        landmark = art.get("landmark_cases", [])
        
        art_prefix = f"Article {art_no}" if art_no != "0" else "The Preamble"
        summary = f"{art_prefix} guarantees {name.lower()}."
        
        if landmark:
            primary_case = landmark[0]
            summary += f" Landmark precedent: {primary_case}."
            
        return summary

    def format_rag_context(self, query: str, max_results: int = 3) -> str:
        results = self.search(query, max_results=max_results)
        if not results:
            return ""

        context_lines = [
            "=== AUTHORITATIVE CONSTITUTION OF INDIA DATABASE (448 ARTICLES • 25 PARTS • 122 PRECEDENTS) ===",
            "Ground your verbal response strictly in these statutory provisions and cite exact Article numbers:"
        ]

        for idx, res in enumerate(results, 1):
            art = res["article"]
            art_no = art.get("ArtNo", "")
            name = art.get("Name", "")
            part_name = art.get("PartName", "")
            desc = art.get("ArtDesc", "")
            cases = art.get("landmark_cases", [])
            related = art.get("related_articles", [])

            context_lines.append(f"\n[CITATION #{idx}: Article {art_no} - {name}]")
            if part_name:
                context_lines.append(f"Part: {part_name}")
            if desc:
                # Truncate desc if overly long for voice context
                truncated_desc = desc[:300] + "..." if len(desc) > 300 else desc
                context_lines.append(f"Statutory Text: {truncated_desc}")
            if cases:
                context_lines.append(f"Landmark Supreme Court Precedents: {', '.join(cases)}")
            if related:
                context_lines.append(f"Interconnected Articles: {', '.join(related)}")

        context_lines.append("\n=== END OF CONSTITUTIONAL RAG CONTEXT ===")
        return "\n".join(context_lines)

# Global singleton
constitution_rag = ConstitutionRAG()
