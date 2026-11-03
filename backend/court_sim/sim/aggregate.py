from __future__ import annotations
import math
from collections import Counter
from typing import List, Dict, Any, Tuple
from court_sim.schemas import RunResult, ScenarioSummary, SimulationSummary

class StatisticalAggregator:
    """
    Computes statistical distributions with Wilson 95% Confidence Intervals
    and parameter sensitivity analysis over simulation results.
    """
    @staticmethod
    def wilson_score_interval(successes: int, total: int, confidence: float = 0.95) -> Tuple[float, float]:
        """
        Calculates Wilson score 95% confidence interval for proportion.
        Handles zero and edge cases correctly.
        """
        if total == 0:
            return 0.0, 0.0

        z = 1.95996  # 95% confidence z-score
        p_hat = successes / total
        
        denominator = 1 + (z ** 2) / total
        centre_adjusted_probability = p_hat + (z ** 2) / (2 * total)
        adjusted_standard_deviation = math.sqrt((p_hat * (1 - p_hat) / total) + (z ** 2) / (4 * (total ** 2)))
        
        lower_bound = (centre_adjusted_probability - z * adjusted_standard_deviation) / denominator
        upper_bound = (centre_adjusted_probability + z * adjusted_standard_deviation) / denominator
        
        return round(max(0.0, lower_bound), 4), round(min(1.0, upper_bound), 4)

    @classmethod
    def aggregate_scenario(
        cls,
        scenario_id: str,
        params_diff: Dict[str, Any],
        runs: List[RunResult]
    ) -> ScenarioSummary:
        total = len(runs)
        if total == 0:
            return ScenarioSummary(
                scenario_id=scenario_id,
                params_diff=params_diff,
                runs_count=0,
                win_rate_a=0.0,
                win_rate_b=0.0,
                partial_rate=0.0,
                ci_95_a=[0.0, 0.0],
                ci_95_b=[0.0, 0.0],
                avg_agreement=1.0,
                decisive_evidence=[]
            )

        verdicts = [r.verdict for r in runs]
        count_a = verdicts.count("A_prevails")
        count_b = verdicts.count("B_prevails")
        count_partial = verdicts.count("partial")

        win_rate_a = round(count_a / total, 4)
        win_rate_b = round(count_b / total, 4)
        partial_rate = round(count_partial / total, 4)

        ci_a_low, ci_a_high = cls.wilson_score_interval(count_a, total)
        ci_b_low, ci_b_high = cls.wilson_score_interval(count_b, total)

        avg_agreement = round(sum(r.judge_agreement for r in runs) / total, 4)

        # Decisive evidence tally
        ev_counter: Counter[str] = Counter()
        for r in runs:
            for ev_id in r.cited_evidence:
                ev_counter[ev_id] += 1

        decisive_evidence = [
            {"evidence_id": ev_id, "cited_count": cnt, "frequency": round(cnt / total, 3)}
            for ev_id, cnt in ev_counter.most_common(10)
        ]

        return ScenarioSummary(
            scenario_id=scenario_id,
            params_diff=params_diff,
            runs_count=total,
            win_rate_a=win_rate_a,
            win_rate_b=win_rate_b,
            partial_rate=partial_rate,
            ci_95_a=[ci_a_low, ci_a_high],
            ci_95_b=[ci_b_low, ci_b_high],
            avg_agreement=avg_agreement,
            decisive_evidence=decisive_evidence
        )

    @classmethod
    def compute_sensitivity(cls, scenario_summaries: List[ScenarioSummary]) -> List[Dict[str, Any]]:
        """
        Calculates parameter outcome leverage across sweeps.
        Identifies which parameter swing creates the largest variation in win rates.
        """
        param_effects: Dict[str, List[float]] = {}
        for s in scenario_summaries:
            for param_key in s.params_diff.keys():
                if param_key not in param_effects:
                    param_effects[param_key] = []
                param_effects[param_key].append(s.win_rate_a)

        sensitivity_list = []
        for param_key, rates in param_effects.items():
            if len(rates) > 1:
                spread = round(max(rates) - min(rates), 4)
                mean_rate = round(sum(rates) / len(rates), 4)
                variance = round(sum((r - mean_rate) ** 2 for r in rates) / len(rates), 4)
                sensitivity_list.append({
                    "parameter": param_key,
                    "max_spread": spread,
                    "max_delta": spread,
                    "variance": variance,
                    "impact": "High" if spread >= 0.3 else ("Medium" if spread >= 0.15 else "Low")
                })

        sensitivity_list.sort(key=lambda x: x["max_spread"], reverse=True)
        return sensitivity_list
