from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os

from telegram_bot import router as telegram_router
from whatsapp_bot import router as whatsapp_router
from voice_agent import router as voice_router
from workflows import router as workflows_router
from aws_bedrock import router as aws_router
from sarvam_voice import router as sarvam_router

app = FastAPI(
    title="LawAgent360 Backend API",
    description="Python FastAPI backend powering VideoSDK agent, Telegram/WhatsApp webhooks, and Agentic Workflows for LawBot360",
    version="1.0.0"
)

# Enable CORS for local React Vite app and Firebase Hosting
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserProfile(BaseModel):
    user_id: str
    business_type: str
    entity_name: Optional[str] = None
    industry: Optional[str] = None
    state: Optional[str] = None
    turnover: Optional[str] = None
    employee_count: Optional[int] = 0

class AnalysisRequest(BaseModel):
    user_id: str
    query: str
    business_context: Optional[Dict[str, Any]] = None

OMNIROUTE_URL = os.getenv("OMNIROUTE_URL", "http://localhost:20128/v1/chat/completions")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "LawAgent360 Backend API",
        "version": "1.0.0",
        "omni_route_gateway": OMNIROUTE_URL,
        "endpoints": ["/health", "/api/v1/business-examination", "/api/v1/omniroute-status", "/webhooks/telegram", "/webhooks/whatsapp"]
    }

@app.get("/api/v1/omniroute-status")
async def check_omniroute_status():
    """Checks if local OmniRoute AI Gateway service is running on port 20128"""
    import httpx
    try:
        async with httpx.AsyncClient(timeout=2.0, trust_env=False) as client:
            res = await client.get("http://localhost:20128")
            return {"omniroute_online": True, "status_code": res.status_code}
    except Exception as e:
        return {"omniroute_online": False, "note": "Run `npm i -g omniroute && omniroute` to start gateway", "error": str(e)}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

INDIAN_KANOON_API_KEY = os.getenv("INDIAN_KANOON_API_KEY", os.getenv("VITE_INDIAN_KANOON_API_KEY", "9d5c21ccb9b28f34586178b635e226e575766649"))

@app.post("/api/v1/kanoon/search")
async def kanoon_search(request: Request):
    """Proxy search to Indian Kanoon official API"""
    import httpx
    body = await request.form()
    form_input = body.get("formInput", "")
    pagenum = body.get("pagenum", "0")
    
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            res = await client.post(
                "https://api.indiankanoon.org/search/",
                headers={"Authorization": f"Token {INDIAN_KANOON_API_KEY}"},
                data={"formInput": form_input, "pagenum": pagenum}
            )
            return res.json()
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Indian Kanoon API error: {str(e)}")

@app.post("/api/v1/kanoon/doc/{doc_id}")
async def kanoon_doc(doc_id: str):
    """Proxy document lookup to Indian Kanoon official API"""
    import httpx
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            res = await client.post(
                f"https://api.indiankanoon.org/doc/{doc_id}/",
                headers={"Authorization": f"Token {INDIAN_KANOON_API_KEY}"}
            )
            return res.json()
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Indian Kanoon API error: {str(e)}")

@app.post("/api/v1/business-examination")
async def examine_business_requirements(profile: UserProfile):
    """
    Examines business type requirements via prompt chaining and returns 
    structured compliance rules & eligible government schemes.
    """
    # Placeholder structured return for Phase 1 verification
    return {
        "user_id": profile.user_id,
        "business_type": profile.business_type,
        "compliance_rules_count": 12,
        "schemes_matched": 4,
        "action_required": [
            f"Fulfill {profile.business_type} statutory filings",
            "Upload PAN & GST certificate to Vault"
        ]
    }

app.include_router(telegram_router, prefix="/webhooks")
app.include_router(whatsapp_router, prefix="/webhooks")
app.include_router(voice_router)
app.include_router(workflows_router)
app.include_router(aws_router)
app.include_router(sarvam_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
