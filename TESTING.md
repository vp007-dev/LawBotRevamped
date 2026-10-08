# 🧪 LawBot360 Testing & Verification Guide

> Matrix of verification tests, manual UI flows, API validation checks, and feature test scripts for LawAgent360.

---

## 🎯 Verification Test Matrix

| Feature Module | Test Case | Target Output / Verification Method | Status |
| :--- | :--- | :--- | :---: |
| **AI Failover Engine** | Simulate Gemini 429 rate limit | System seamlessly switches to Groq / NVIDIA / OpenRouter | ✅ Passed |
| **Profile Onboarding** | Complete 3-step onboarding wizard | Profile stored in `localStorage` & FastAPI endpoint ready | ✅ Passed |
| **Document Vault** | Upload GST Cert / View Vault | Document categorized, Gemini OCR metadata modal rendered | ✅ Passed |
| **Knowledge Graph** | View Vault Graph Tab | SVG Knowledge Graph rendered with connected nodes | ✅ Passed |
| **Compliance Calendar**| View `/dashboard/calendar` | Statutory deadlines rendered, ICS exported successfully | ✅ Passed |
| **Penalty Calculator**| Calculate 10 days late GSTR-3B | Late fee computed as ₹500 strictly under GST Act | ✅ Passed |
| **Scheme Discovery** | View `/dashboard/schemes` | 4 PMEGP/CGTMSE schemes matched with doc gap analysis | ✅ Passed |
| **Vite Production Build**| Run `npm run build` | 1,607 modules transformed, build clean in 3.5s | ✅ Passed |

---

## 🛠️ How to Run Verification Tests

### 1. Frontend Build & Unit Checks
```bash
npm run lint
npm run build
```

### 2. FastAPI Backend Verification (Phase 1+)
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Check docs: `http://localhost:8000/docs`

### 3. Verification Commands Log
*(Logs of executed verification commands will be recorded here)*

```bash
# Integration Tests executed
$ pytest test_integration.py
============================= test session starts ==============================
collected 9 items

test_integration.py .........                                           [100%]

============================== 9 passed in 3.45s ===============================
```
