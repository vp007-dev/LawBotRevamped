"""
FastAPI Router for Indian Court Simulation Engine.
Implements Section 11 API specifications:
- Case intake and parameter tuning
- Multi-scenario parallel simulation sweeps
- Live SSE stream for real-time progress
- Statistical distributions & Wilson 95% CI results
- Full procedural run trace inspection
"""

from __future__ import annotations

import asyncio
import json
import logging
import uuid
from typing import Dict, List, Any, Optional

from fastapi import APIRouter, HTTPException, Query, Request, status
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from court_sim.schemas import CaseParams, SimulationRequest, RunResult, SimulationSummary
from court_sim.intake.extractor import CaseExtractor
from court_sim.sim.runner import runner as sim_runner
from court_sim.rag.retrieve import StatutoryRetriever
from court_sim.store.db import db as sim_db

logger = logging.getLogger("court_sim.api")

router = APIRouter(prefix="/court-sim", tags=["court-sim"])


class IntakeRequest(BaseModel):
    narrative: str


class IntakeResponse(BaseModel):
    case_id: str
    params: CaseParams
    lineage: Dict[str, Any]


class CaseUpdateRequest(BaseModel):
    params: CaseParams


@router.post("/cases/intake", response_model=IntakeResponse)
async def intake_case(req: IntakeRequest):
    """
    Parses raw FIR or case narrative into structured CaseParams.
    Enforces Section 63 BSA certificate compliance for digital records.
    """
    if not req.narrative.strip():
        raise HTTPException(status_code=400, detail="Narrative text cannot be empty.")

    extractor = CaseExtractor()
    params, lineage = await extractor.extract_from_narrative(req.narrative)

    await sim_db.save_case(params)

    return IntakeResponse(
        case_id=params.case_id,
        params=params,
        lineage=lineage
    )


@router.get("/cases")
async def list_cases():
    """Returns list of all saved cases in the simulation store."""
    return await sim_db.list_cases()


@router.get("/cases/{case_id}")
async def get_case(case_id: str):
    """Fetches CaseParams by case ID."""
    case = await sim_db.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found.")
    return case


@router.put("/cases/{case_id}")
async def update_case(case_id: str, update: CaseUpdateRequest):
    """Updates parameters for a case (e.g. tuning lawyer skill, evidence, or judge style)."""
    existing = await sim_db.get_case(case_id)
    if not existing:
        raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found.")

    update.params.case_id = case_id
    await sim_db.save_case(update.params)
    return {"status": "success", "case_id": case_id, "params": update.params}


@router.post("/simulations")
async def start_simulation(request: SimulationRequest):
    """
    Launches a parallel parameter sweep simulation in the background.
    """
    case = await sim_db.get_case(request.case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case '{request.case_id}' not found.")

    simulation_id = f"sim_{uuid.uuid4().hex[:10]}"

    # Launch background task
    asyncio.create_task(
        sim_runner.execute_simulation(
            simulation_id=simulation_id,
            case_id=request.case_id,
            request=request
        )
    )

    return {
        "simulation_id": simulation_id,
        "status": "running",
        "message": "Simulation suite initiated successfully."
    }


@router.get("/simulations/{simulation_id}/stream")
async def stream_simulation(simulation_id: str, req: Request):
    """
    SSE stream yielding real-time run completions and final aggregations.
    """
    queue = sim_runner.subscribe(simulation_id)

    async def event_generator():
        try:
            while True:
                if await req.is_disconnected():
                    break
                try:
                    event_data = await asyncio.wait_for(queue.get(), timeout=30.0)
                    yield {
                        "event": "message",
                        "data": json.dumps(event_data)
                    }
                    if event_data.get("type") in ["completed", "failed", "cancelled"]:
                        break
                except asyncio.TimeoutError:
                    # Keep-alive heartbeat ping
                    yield {"event": "ping", "data": "heartbeat"}
        finally:
            sim_runner.unsubscribe(simulation_id, queue)

    return EventSourceResponse(event_generator())


@router.get("/simulations/{simulation_id}/results")
async def get_simulation_results(simulation_id: str):
    """
    Returns aggregated statistical distributions (win rates, Wilson 95% CIs, sensitivity).
    """
    sim = await sim_db.get_simulation(simulation_id)
    if not sim:
        raise HTTPException(status_code=404, detail=f"Simulation '{simulation_id}' not found.")

    runs = await sim_db.get_simulation_runs(simulation_id)
    if not runs:
        return {
            "simulation_id": simulation_id,
            "status": sim.get("status", "running"),
            "total_runs": sim.get("total_runs", 0),
            "completed_runs": sim.get("completed_runs", 0),
            "summary": None,
            "runs": []
        }

    # If completed summary was persisted, return it directly
    if sim.get("summary"):
        return {
            "simulation_id": simulation_id,
            "status": sim.get("status", "completed"),
            "total_runs": len(runs),
            "summary": sim["summary"],
            "runs": [r.model_dump() for r in runs]
        }

    # Otherwise reconstruct with real scenario diffs from sweeps
    from court_sim.sim.aggregate import StatisticalAggregator
    from court_sim.sim.sweeps import SweepBuilder

    diff_map: Dict[str, Any] = {}
    case = await sim_db.get_case(sim.get("case_id", ""))
    if case:
        generated = SweepBuilder.generate_scenarios(case, sim.get("sweeps", {}))
        for s_id, (_, diff) in generated.items():
            diff_map[s_id] = diff

    scenarios_map: Dict[str, List[RunResult]] = {}
    for r in runs:
        if r.scenario_id not in scenarios_map:
            scenarios_map[r.scenario_id] = []
        scenarios_map[r.scenario_id].append(r)

    scenario_summaries = [
        StatisticalAggregator.aggregate_scenario(s_id, diff_map.get(s_id, {}), s_runs)
        for s_id, s_runs in scenarios_map.items()
    ]

    sensitivity = StatisticalAggregator.compute_sensitivity(scenario_summaries)

    summary = SimulationSummary(
        simulation_id=simulation_id,
        case_id=sim.get("case_id", "unknown"),
        total_runs=len(runs),
        scenarios=scenario_summaries,
        sensitivity=sensitivity
    )

    return {
        "simulation_id": simulation_id,
        "status": "completed",
        "total_runs": len(runs),
        "summary": summary.model_dump(),
        "runs": [r.model_dump() for r in runs]
    }


@router.get("/runs/{run_id}")
async def get_run_details(run_id: str):
    """
    Retrieves the complete procedural transcript of a single trial run.
    """
    run_data = await sim_db.get_run(run_id)
    if not run_data:
        raise HTTPException(status_code=404, detail=f"Run '{run_id}' not found.")
    return run_data


@router.post("/simulations/{simulation_id}/cancel")
async def cancel_simulation(simulation_id: str):
    """Cancels a running simulation suite."""
    sim_runner.cancel(simulation_id)
    await sim_db.update_simulation_status(simulation_id, "cancelled")
    return {"simulation_id": simulation_id, "status": "cancelled"}


@router.get("/statutes/search")
async def search_statutes(q: str = Query(..., min_length=2)):
    """Search statutory corpus (BNS, BNSS, BSA, CPC) for relevant sections."""
    retriever = StatutoryRetriever()
    results = retriever.search(q, top_k=5)
    return {"query": q, "results": results}
