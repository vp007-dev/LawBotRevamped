"""
Sarvam AI (Samvaad) Telephony Voice Agent Integration Module for LawBot 360
Connects to Sarvam's conversational telephony voice platform.
Allows:
1. Direct inbound telephony calling via +91 7965480318
2. Triggering Instant Outbound callbacks to any Indian phone number
3. Fetching live call history, audio recordings, and analytics
4. Fetching turn-by-turn conversational transcripts in Hindi and English
"""

import os
import urllib.parse
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, Query, Path
from pydantic import BaseModel, Field
import httpx

router = APIRouter(prefix="/api/v1/sarvam", tags=["sarvam_voice"])

# Load configuration with defaults
SARVAM_API_KEY = os.getenv("SARVAM_API_KEY", os.getenv("VITE_SARVAM_API_KEY", "sk_samvaad_kapzzkw0_F5LrmEtNfdCtYaC6qGKa25lT"))
SARVAM_ORG_ID = os.getenv("SARVAM_ORG_ID", os.getenv("VITE_SARVAM_ORG_ID", "019f7b9b-ee04-74fe-baad-a7c49b277dc6"))
SARVAM_WORKSPACE_ID = os.getenv("SARVAM_WORKSPACE_ID", os.getenv("VITE_SARVAM_WORKSPACE_ID", "019f7b9b-ee07-72d5-98dd-0c526491a991"))
SARVAM_AGENT_ID = os.getenv("SARVAM_AGENT_ID", os.getenv("VITE_SARVAM_AGENT_ID", "Conversatio-8448e378-ecec"))
SARVAM_CONNECTION_ID = os.getenv("SARVAM_CONNECTION_ID", os.getenv("VITE_SARVAM_CONNECTION_ID", "7cadae80-64-bdfd0995-1607"))
SARVAM_PHONE_NUMBER = os.getenv("SARVAM_PHONE_NUMBER", os.getenv("VITE_SARVAM_PHONE_NUMBER", "+91 7965480318"))

BASE_URL = "https://apps.sarvam.ai"

class OutboundCallRequest(BaseModel):
    phone_number: str = Field(..., description="Recipient phone number with or without +91 prefix")
    notes: Optional[str] = Field(None, description="Optional legal issue description")

def normalize_phone_number(phone: str) -> str:
    cleaned = "".join(ch for ch in phone if ch.isdigit() or ch == "+")
    if cleaned.startswith("+91"):
        return cleaned
    if cleaned.startswith("91") and len(cleaned) == 12:
        return f"+{cleaned}"
    if len(cleaned) == 10:
        return f"+91{cleaned}"
    return cleaned

@router.get("/config")
async def get_sarvam_config():
    """Returns safe connection configuration and metadata for Sarvam Telephony Agent"""
    return {
        "status": "connected",
        "bot_name": "LawBot 360 AI Legal Helpline",
        "phone_number": SARVAM_PHONE_NUMBER,
        "org_id": SARVAM_ORG_ID,
        "workspace_id": SARVAM_WORKSPACE_ID,
        "agent_id": SARVAM_AGENT_ID,
        "connection_id": SARVAM_CONNECTION_ID,
        "supported_languages": ["Hindi", "Hinglish", "English"],
        "telephony_type": "Two-Way Voice (Full Duplex)",
        "redirection_uri": f"tel:{SARVAM_PHONE_NUMBER.replace(' ', '')}"
    }

@router.get("/attempts")
async def get_call_attempts(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    start_datetime: Optional[str] = Query("2024-01-01T00:00:00Z"),
    end_datetime: Optional[str] = Query("2026-12-31T23:59:59Z")
):
    """
    Fetches real call history & attempt analytics from Sarvam Samvaad.
    Includes duration, caller mask, audio URL, and summarized legal issue.
    """
    url = f"{BASE_URL}/api/analytics/v1/{SARVAM_ORG_ID}/{SARVAM_WORKSPACE_ID}/{SARVAM_AGENT_ID}/attempts"
    headers = {
        "X-API-Key": SARVAM_API_KEY
    }
    params = {
        "start_datetime": start_datetime,
        "end_datetime": end_datetime,
        "limit": limit,
        "offset": offset
    }

    async with httpx.AsyncClient(timeout=20.0) as client:
        try:
            res = await client.get(url, headers=headers, params=params)
            if res.status_code != 200:
                raise HTTPException(
                    status_code=res.status_code,
                    detail=f"Sarvam API returned status {res.status_code}: {res.text}"
                )
            data = res.json()
            return data
        except httpx.RequestError as exc:
            raise HTTPException(status_code=502, detail=f"Failed to communicate with Sarvam API: {str(exc)}")

@router.get("/transcripts/{interaction_id:path}")
async def get_transcript(interaction_id: str):
    """
    Fetches turn-by-turn dialogue transcript for a specific call interaction.
    """
    encoded_interaction = urllib.parse.quote(interaction_id, safe="")
    url = f"{BASE_URL}/api/analytics/v1/{SARVAM_ORG_ID}/{SARVAM_WORKSPACE_ID}/{SARVAM_AGENT_ID}/transcripts/{encoded_interaction}"
    headers = {
        "X-API-Key": SARVAM_API_KEY
    }

    async with httpx.AsyncClient(timeout=20.0) as client:
        try:
            res = await client.get(url, headers=headers)
            if res.status_code != 200:
                raise HTTPException(
                    status_code=res.status_code,
                    detail=f"Sarvam transcript error: {res.text}"
                )
            return res.json()
        except httpx.RequestError as exc:
            raise HTTPException(status_code=502, detail=f"Failed to connect to Sarvam: {str(exc)}")

@router.post("/outbound")
async def trigger_outbound_call(payload: OutboundCallRequest):
    """
    Triggers an instant outbound call from LawBot 360 (+91 7965480318) to the specified phone number.
    The user's phone will ring and connect directly to the conversational legal AI bot.
    """
    clean_agent_phone = "".join(ch for ch in SARVAM_PHONE_NUMBER if ch.isdigit() or ch == "+")
    normalized_user_phone = normalize_phone_number(payload.phone_number)

    if len(normalized_user_phone) < 10:
        raise HTTPException(status_code=400, detail="Invalid phone number format. Please provide a valid 10-digit number.")

    url = f"{BASE_URL}/api/outbounds/v1/orgs/{SARVAM_ORG_ID}/workspaces/{SARVAM_WORKSPACE_ID}/outbounds"
    headers = {
        "X-API-Key": SARVAM_API_KEY,
        "Content-Type": "application/json"
    }

    call_payload = {
        "app_config": {
            "app_id": SARVAM_AGENT_ID,
            "app_version": 1,
            "connection_config": {
                "connection_id": SARVAM_CONNECTION_ID,
                "agent_phone_number": clean_agent_phone
            }
        },
        "user_config": {
            "user_phone_number": normalized_user_phone
        }
    }

    async with httpx.AsyncClient(timeout=20.0) as client:
        try:
            res = await client.post(url, headers=headers, json=call_payload)
            if res.status_code not in (200, 201):
                raise HTTPException(
                    status_code=res.status_code,
                    detail=f"Sarvam outbound call failed: {res.text}"
                )
            result = res.json()
            return {
                "status": "success",
                "message": f"Calling {normalized_user_phone} from {SARVAM_PHONE_NUMBER}... Your phone will ring in a few seconds!",
                "attempt_id": result.get("attempt_id"),
                "caller_id": SARVAM_PHONE_NUMBER,
                "recipient": normalized_user_phone
            }
        except httpx.RequestError as exc:
            raise HTTPException(status_code=502, detail=f"Outbound telephony request failed: {str(exc)}")
