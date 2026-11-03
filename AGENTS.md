# Indian Court Simulation Engine: Hard Rules for Agents

## 1. Environment Loop Determinism
The environment loop is **deterministic and has no LLM inside it**. Only agents (Party A Lawyer, Party B Lawyer, Judge) call LLMs. The courtroom state machine transitions, action filtering, admissibility checks, and turn cycles are pure Python code.

## 2. Strict Reproducibility
Every run is **reproducible**: same params + same seed = same environment behaviour and seeded pseudo-random choices (first speaker, RNG delays). Always log model name, temperature, and prompt version in the trace.

## 3. Grounded Citations & Verifier Rejection
Agents only cite:
- Valid Evidence IDs present in the case parameter record (e.g. `EX-1`, `EX-2`, `PW-1`)
- Retrieved law chunks from the statutory corpus (e.g. `LAW-BNS-103`, `LAW-BSA-63`, `LAW-BNSS-480`)
A deterministic verifier rejects any citation outside this closed set.

## 4. Anonymity & Neutrality of the Bench
The judge agent sees **Party A / Party B only**.
- Never the user's identity
- Never preferred outcome
- Never which side is "the user"
First-speaker order is randomized per run and logged.

## 5. Full Transparency & Auditability
Every parameter edit, scenario variation, and simulation run is **logged and visible** in the UI. No single run is ever presented as a definitive verdict. Output is always an empirical statistical distribution over $N$ runs with Wilson 95% confidence intervals.

## 6. Mandatory User Review Gate
Extracted case data from documents or narrative intake is **never simulated without user review and confirmation**. The user has complete control to inspect and tune all parameters before launching sweeps.

## 7. Security & Secrets Management
No secrets, tokens, or private credentials in code. All API keys (AWS Bedrock, OpenRouter, etc.) and tunables (`MAX_CONCURRENCY`, model tiers, limits) come strictly from `.env`.
