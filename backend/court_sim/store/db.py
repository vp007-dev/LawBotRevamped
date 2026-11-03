from __future__ import annotations
import os
import json
import logging
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager
import aiosqlite
from court_sim.schemas import CaseParams, RunResult

logger = logging.getLogger("court_sim.db")

DB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data")
os.makedirs(DB_DIR, exist_ok=True)
DB_PATH = os.path.join(DB_DIR, "court_sim.db")

class CourtSimDB:
    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path

    @asynccontextmanager
    async def get_connection(self):
        conn = await aiosqlite.connect(self.db_path)
        conn.row_factory = aiosqlite.Row
        await conn.execute("PRAGMA journal_mode=WAL;")
        await conn.execute("PRAGMA synchronous=NORMAL;")
        try:
            yield conn
        finally:
            await conn.close()

    async def init_db(self):
        async with self.get_connection() as conn:
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS cases (
                    case_id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    case_type TEXT NOT NULL,
                    data_json TEXT NOT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS simulations (
                    simulation_id TEXT PRIMARY KEY,
                    case_id TEXT NOT NULL,
                    status TEXT NOT NULL,
                    total_runs INTEGER NOT NULL,
                    completed_runs INTEGER DEFAULT 0,
                    sweeps_json TEXT,
                    summary_json TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    completed_at TIMESTAMP
                );
            """)
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS run_results (
                    run_id TEXT PRIMARY KEY,
                    simulation_id TEXT NOT NULL,
                    scenario_id TEXT NOT NULL,
                    seed INTEGER NOT NULL,
                    first_speaker TEXT NOT NULL,
                    verdict TEXT NOT NULL,
                    judge_agreement REAL NOT NULL,
                    result_json TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(simulation_id) REFERENCES simulations(simulation_id)
                );
            """)
            await conn.commit()

            # Ensure summary_json column exists if database already existed
            try:
                await conn.execute("ALTER TABLE simulations ADD COLUMN summary_json TEXT;")
                await conn.commit()
            except Exception:
                pass

            logger.info("CourtSim DB initialized at %s", self.db_path)

    async def save_case(self, case: CaseParams) -> None:
        async with self.get_connection() as conn:
            await conn.execute("""
                INSERT INTO cases (case_id, title, case_type, data_json, updated_at)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(case_id) DO UPDATE SET
                    title=excluded.title,
                    case_type=excluded.case_type,
                    data_json=excluded.data_json,
                    updated_at=CURRENT_TIMESTAMP;
            """, (case.case_id, case.title, case.case_type, case.model_dump_json()))
            await conn.commit()

    async def get_case(self, case_id: str) -> Optional[CaseParams]:
        async with self.get_connection() as conn:
            async with conn.execute("SELECT data_json FROM cases WHERE case_id = ?", (case_id,)) as cursor:
                row = await cursor.fetchone()
                if row:
                    return CaseParams.model_validate_json(row["data_json"])
                return None

    async def list_cases(self) -> List[Dict[str, Any]]:
        async with self.get_connection() as conn:
            async with conn.execute("SELECT case_id, title, case_type, updated_at FROM cases ORDER BY updated_at DESC") as cursor:
                rows = await cursor.fetchall()
                return [dict(r) for r in rows]

    async def create_simulation(self, simulation_id: str, case_id: str, total_runs: int, sweeps: dict) -> None:
        async with self.get_connection() as conn:
            await conn.execute("""
                INSERT INTO simulations (simulation_id, case_id, status, total_runs, sweeps_json)
                VALUES (?, ?, 'running', ?, ?)
            """, (simulation_id, case_id, total_runs, json.dumps(sweeps)))
            await conn.commit()

    async def save_run_result(self, result: RunResult, simulation_id: str) -> None:
        async with self.get_connection() as conn:
            await conn.execute("""
                INSERT INTO run_results (run_id, simulation_id, scenario_id, seed, first_speaker, verdict, judge_agreement, result_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                result.run_id,
                simulation_id,
                result.scenario_id,
                result.seed,
                result.first_speaker,
                result.verdict,
                result.judge_agreement,
                result.model_dump_json()
            ))
            await conn.execute("""
                UPDATE simulations 
                SET completed_runs = completed_runs + 1
                WHERE simulation_id = ?
            """, (simulation_id,))
            await conn.commit()

    async def get_simulation_runs(self, simulation_id: str) -> List[RunResult]:
        async with self.get_connection() as conn:
            async with conn.execute(
                "SELECT result_json FROM run_results WHERE simulation_id = ? ORDER BY created_at ASC",
                (simulation_id,)
            ) as cursor:
                rows = await cursor.fetchall()
                return [RunResult.model_validate_json(r["result_json"]) for r in rows]

    async def get_run(self, run_id: str) -> Optional[Dict[str, Any]]:
        async with self.get_connection() as conn:
            async with conn.execute("SELECT result_json FROM run_results WHERE run_id = ?", (run_id,)) as cursor:
                row = await cursor.fetchone()
                if row:
                    return json.loads(row["result_json"])
                return None

    async def save_simulation_summary(self, simulation_id: str, status: str, summary: dict) -> None:
        async with self.get_connection() as conn:
            await conn.execute("""
                UPDATE simulations 
                SET status = ?, summary_json = ?, completed_at = CURRENT_TIMESTAMP
                WHERE simulation_id = ?
            """, (status, json.dumps(summary), simulation_id))
            await conn.commit()

    async def update_simulation_status(self, simulation_id: str, status: str) -> None:
        async with self.get_connection() as conn:
            await conn.execute("""
                UPDATE simulations 
                SET status = ?, completed_at = CURRENT_TIMESTAMP
                WHERE simulation_id = ?
            """, (status, simulation_id))
            await conn.commit()

    async def get_simulation(self, simulation_id: str) -> Optional[Dict[str, Any]]:
        async with self.get_connection() as conn:
            async with conn.execute(
                "SELECT simulation_id, case_id, status, total_runs, completed_runs, sweeps_json, summary_json FROM simulations WHERE simulation_id = ?",
                (simulation_id,)
            ) as cursor:
                row = await cursor.fetchone()
                if row:
                    res = dict(row)
                    res["sweeps"] = json.loads(row["sweeps_json"] or "{}")
                    res["summary"] = json.loads(row["summary_json"] or "{}") if row["summary_json"] else None
                    return res
                return None

db = CourtSimDB()
