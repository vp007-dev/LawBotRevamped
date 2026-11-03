from __future__ import annotations
import copy
import itertools
from typing import Dict, List, Any, Tuple
from court_sim.schemas import CaseParams

class SweepBuilder:
    """
    Builds Cartesian product scenario grids from parameter sweep configurations.
    Supports dotted path access for nested evidence and witness properties.
    """
    @staticmethod
    def apply_param_override(params: CaseParams, key: str, value: Any) -> None:
        """
        Applies parameter override, supporting top-level and dotted paths:
        e.g. 'lawyer_skill_a' or 'evidence.EX-1.admissible' or 'witnesses.PW-1.credibility'
        """
        parts = key.split(".")
        if len(parts) == 1:
            if hasattr(params, key):
                setattr(params, key, value)
        elif len(parts) == 3 and parts[0] == "evidence":
            ev_id, prop = parts[1], parts[2]
            for ev in params.evidence:
                if ev.id.upper() == ev_id.upper() and hasattr(ev, prop):
                    setattr(ev, prop, value)
        elif len(parts) == 3 and parts[0] == "witnesses":
            w_id, prop = parts[1], parts[2]
            for w in params.witnesses:
                if w.id.upper() == w_id.upper() and hasattr(w, prop):
                    setattr(w, prop, value)

    @classmethod
    def generate_scenarios(
        cls,
        base_params: CaseParams,
        sweeps: Dict[str, List[Any]]
    ) -> Dict[str, Tuple[CaseParams, Dict[str, Any]]]:
        """
        Generates scenarios dictionary:
        { scenario_id: (CaseParams, param_diff) }
        """
        if not sweeps:
            return {"scenario_base": (base_params.model_copy(deep=True), {})}

        keys = list(sweeps.keys())
        value_lists = [sweeps[k] for k in keys]
        
        scenarios: Dict[str, Tuple[CaseParams, Dict[str, Any]]] = {}
        for idx, combination in enumerate(itertools.product(*value_lists)):
            scenario_id = f"scenario_{idx + 1}"
            cloned = base_params.model_copy(deep=True)
            diff: Dict[str, Any] = {}
            for k, val in zip(keys, combination):
                cls.apply_param_override(cloned, k, val)
                diff[k] = val
            scenarios[scenario_id] = (cloned, diff)

        return scenarios
