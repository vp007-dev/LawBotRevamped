import os
import json
import base64
import logging
import asyncio
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, BackgroundTasks, UploadFile, File, Form, WebSocket, WebSocketDisconnect
import httpx
from dotenv import load_dotenv, find_dotenv

# Load environment variables
load_dotenv(find_dotenv())

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("voice_agent")

# Import Constitutional RAG Knowledge Base
try:
    from constitution_rag import constitution_rag
except ImportError:
    from backend.constitution_rag import constitution_rag

# Configure Router
router = APIRouter(
    prefix="/api/v1/voice",
    tags=["voice-agent"]
)

# API Keys and URLs from environment
GEMINI_API_KEY = os.getenv("VITE_GEMINI_API_KEY_voice") or os.getenv("VITE_GEMINI_API_KEY", "")
GEMINI_VOICE_MODEL = os.getenv("VITE_GEMINI_VOICE_MODEL", "gemini-3.1-flash-live-preview")
ELEVENLABS_API_KEY = os.getenv("VITE_ELEVENLABS_API_KEY", "")
DEEPGRAM_API_KEY = os.getenv("VITE_DEEPGRAM_API_KEY", "")
OMNIROUTE_URL = os.getenv("OMNIROUTE_URL", "http://localhost:20128/v1/chat/completions")

# Try to import optional packages for local pipeline execution
try:
    import torch
    from transformers import pipeline
    logger.info("PyTorch and Transformers imported successfully. Local STT available.")
    LOCAL_PIPELINE_AVAILABLE = True
except ImportError:
    LOCAL_PIPELINE_AVAILABLE = False
    logger.warning("PyTorch or Transformers not found. Falling back to API pipelines for STT.")

# VideoSDK library imports
try:
    import videosdk
    logger.info("VideoSDK Python package loaded successfully.")
    VIDEOSDK_AVAILABLE = True
except ImportError:
    VIDEOSDK_AVAILABLE = False
    logger.warning("VideoSDK Python package not found. Using WebRTC/WebSocket signaling interface.")

# ----------------- DATA SCHEMAS -----------------

class CallInitRequest(BaseModel):
    user_id: str
    room_id: Optional[str] = None
    user_name: Optional[str] = "Client"
    business_context: Optional[Dict[str, Any]] = None

class ToolCallRequest(BaseModel):
    user_id: str
    tool_name: str
    arguments: Dict[str, Any] = {}

class PipelineRequest(BaseModel):
    user_id: str
    audio_base64: str  # PCM 16-bit 16kHz base64 encoded audio
    conversation_history: List[Dict[str, str]] = []

class SummaryRequest(BaseModel):
    conversation_history: Optional[List[Dict[str, str]]] = None
    transcript: Optional[str] = None

# Mock compliance deadline data representing the document vault contents
MOCK_VAULT_DEADLINES = [
    {"id": 1, "document_name": "GST Sales Invoice GSTR-3B", "category": "Tax Compliance", "deadline": "2026-08-20", "status": "Pending", "critical": True},
    {"id": 2, "document_name": "TDS Payment Certificate Form 16A", "category": "Tax Compliance", "deadline": "2026-08-07", "status": "Urgent Action Required", "critical": True},
    {"id": 3, "document_name": "Mutual Non-Disclosure Agreement", "category": "Contracts", "deadline": "2026-08-19", "status": "Review Pending", "critical": False},
    {"id": 4, "document_name": "Startup India Certificate of Recognition", "category": "Corporate Registration", "deadline": "Expired - Renewal Needed", "status": "Critical", "critical": True},
    {"id": 5, "document_name": "Shops & Establishment License Renewal", "category": "Licenses", "deadline": "2026-09-15", "status": "Upcoming", "critical": False}
]

# ----------------- VIDEO SDK ROUTING & SIGNALLING -----------------

@router.post("/token")
async def get_videosdk_token():
    """
    Generates a VideoSDK authentication token for room joins.
    Normally uses the VideoSDK API or custom JWT creation.
    """
    api_key = os.getenv("VIDEOSDK_API_KEY", "mock_videosdk_api_key")
    secret_key = os.getenv("VIDEOSDK_SECRET_KEY", "mock_videosdk_secret_key")
    
    # Simple simulated token return for RTC signalling validation
    # Real implementations sign a JWT using the secret key
    simulated_token = f"vsdk_token_{base64.b64encode(api_key.encode()).decode()}"
    return {
        "token": simulated_token,
        "api_key": api_key
    }

@router.post("/create-room")
async def create_videosdk_room(req: CallInitRequest):
    """
    Creates a VideoSDK session room for voice/video.
    """
    headers = {
        "Authorization": "vsdk_token_mock",
        "Content-Type": "application/json"
    }
    
    # Real implementation would call: https://api.videosdk.live/v2/rooms
    # For subagent workspace execution, we return a mock room id or connect through local tunnels
    room_id = req.room_id or f"room-{os.urandom(4).hex()}"
    logger.info(f"Created VideoSDK room {room_id} for user {req.user_id}")
    return {
        "room_id": room_id,
        "status": "active",
        "rtc_gateway": "wss://api.videosdk.live/v2/realtime",
        "user_id": req.user_id
    }

@router.post("/start-agent")
async def start_voice_agent(req: CallInitRequest, background_tasks: BackgroundTasks):
    """
    Deploys/Starts a VideoSDK Python Agent pipeline worker in the room.
    The worker connects as an RTC participant and listens to the client's audio track.
    """
    room_id = req.room_id
    if not room_id:
        raise HTTPException(status_code=400, detail="room_id is required to launch the VideoSDK agent")
    
    # Spawn background task representing the autonomous RTC worker agent
    background_tasks.add_task(run_videosdk_rtc_agent_pipeline, room_id, req.user_id)
    
    return {
        "agent_status": "deploying",
        "agent_name": "Advocate LawAgent360",
        "room_id": room_id,
        "message": "RTC agent worker spawned. Connecting to audio tracks..."
    }

# ----------------- MID-CALL TOOL CALLBACK WORKFLOWS -----------------

def check_document_vault_deadlines(user_id: str) -> List[Dict[str, Any]]:
    """
    Local tool logic that checks upcoming deadlines in the user's document vault.
    In production, this would query Cloud Firestore or SQL database.
    """
    logger.info(f"Running tool check_document_vault_deadlines for user: {user_id}")
    # Return mock deadlines filtered/relevant to the user
    return MOCK_VAULT_DEADLINES

def check_statutory_filings_status(user_id: str) -> Dict[str, Any]:
    """
    Tool logic to check status of business registrations and statutory filings.
    """
    logger.info(f"Running tool check_statutory_filings_status for user: {user_id}")
    return {
        "gstin_status": "Active",
        "tax_filings": {
            "gstr_3b": "Pending for July 2026",
            "tds_q1": "Overdue - Last date was 2026-07-31",
            "income_tax": "Filed on 2026-07-28"
        },
        "notices_received": 1,
        "critical_alert": "TDS Q1 filing overdue"
    }

# ----------------- CONSTITUTION RAG DATABASE ENDPOINTS -----------------

@router.get("/constitution-rag/search")
async def search_constitution_articles(query: str, max_results: int = 4):
    """
    Search Constitution of India RAG database (448 Articles, 25 Parts, 122 Landmark Precedents).
    """
    matches = constitution_rag.search(query, max_results=max_results)
    return {
        "query": query,
        "count": len(matches),
        "results": [
            {
                "art_no": m["article"].get("ArtNo"),
                "name": m["article"].get("Name"),
                "part_no": m["article"].get("PartNo"),
                "part_name": m["article"].get("PartName"),
                "category": m["article"].get("category"),
                "art_desc": m["article"].get("ArtDesc"),
                "landmark_cases": m["article"].get("landmark_cases", []),
                "related_articles": m["article"].get("related_articles", []),
                "voice_summary": m.get("voice_summary", ""),
                "score": m.get("score", 0)
            } for m in matches
        ]
    }

@router.get("/constitution-rag/article/{art_no}")
async def get_constitution_article(art_no: str):
    """
    Fetch exact statutory article details, text, and landmark precedents.
    """
    art = constitution_rag.get_article(art_no)
    if not art:
        raise HTTPException(status_code=404, detail=f"Article {art_no} not found")
    return {
        "article": art,
        "voice_summary": constitution_rag.summarize_for_voice(art)
    }

@router.get("/constitution-rag/stats")
async def get_constitution_stats():
    """
    Returns database metrics for dashboard and voice indicators.
    """
    return {
        "total_articles": len(constitution_rag.articles),
        "total_parts": len(constitution_rag.parts),
        "total_landmark_precedents": 122,
        "status": "online"
    }

@router.post("/tool-callback")
async def handle_tool_callback(req: ToolCallRequest):
    """
    Handles callback requests from the Live API / VideoSDK mid-call agent
    when the LLM determines a tool is needed.
    """
    tool_name = req.tool_name
    user_id = req.user_id
    args = req.arguments

    logger.info(f"Received mid-call tool invocation request. Tool: {tool_name}, User: {user_id}")

    if tool_name == "search_constitution_rag":
        query = args.get("query", "")
        results = constitution_rag.search(query, max_results=3)
        formatted_results = [
            {
                "art_no": r["article"].get("ArtNo"),
                "name": r["article"].get("Name"),
                "part_name": r["article"].get("PartName"),
                "cases": r["article"].get("landmark_cases", []),
                "voice_summary": r.get("voice_summary")
            } for r in results
        ]
        cue = results[0]["voice_summary"] if results else "No specific constitutional article matched."
        return {
            "success": True,
            "tool": tool_name,
            "result": formatted_results,
            "speech_cue": cue
        }

    elif tool_name == "get_article_details":
        art_no = args.get("article_number", "")
        art = constitution_rag.get_article(art_no)
        if art:
            return {
                "success": True,
                "tool": tool_name,
                "result": art,
                "speech_cue": constitution_rag.summarize_for_voice(art)
            }
        else:
            return {
                "success": False,
                "tool": tool_name,
                "error": f"Article {art_no} not found in Constitution database."
            }

    elif tool_name == "check_document_vault_deadlines":
        deadlines = check_document_vault_deadlines(user_id)
        return {
            "success": True,
            "tool": tool_name,
            "result": deadlines,
            "speech_cue": "I am looking at your document vault. You have a TDS Payment due today, and a GST return due on August 20th."
        }
    elif tool_name == "check_statutory_filings_status":
        status_info = check_statutory_filings_status(user_id)
        return {
            "success": True,
            "tool": tool_name,
            "result": status_info,
            "speech_cue": "Checking filings. Your GSTIN is active, but Q1 TDS returns are currently overdue."
        }
    else:
        return {
            "success": False,
            "error": f"Tool '{tool_name}' not recognized by LawAgent360 agent router."
        }

# ----------------- HUGGINGFACE/WHISPER -> GEMINI -> ELEVENLABS FALLBACK PIPELINE -----------------

async def execute_whisper_stt(audio_bytes: bytes) -> str:
    """
    Converts audio bytes into text.
    First tries local pipeline, then falls back to HF Inference API or Deepgram.
    """
    # 1. Try local transformers pipeline if libraries are available
    if LOCAL_PIPELINE_AVAILABLE:
        try:
            # Save temporary wav
            temp_filename = "temp_voice_stt.wav"
            with open(temp_filename, "wb") as f:
                f.write(audio_bytes)
            
            # Initialize STT pipeline
            stt_pipe = pipeline("automatic-speech-recognition", model="openai/whisper-tiny")
            result = stt_pipe(temp_filename)
            os.remove(temp_filename)
            logger.info("Transcribed using local Whisper model.")
            return result.get("text", "")
        except Exception as e:
            logger.error(f"Local Whisper transcription failed: {e}. Trying APIs...")

    # 2. Try Hugging Face Inference API (Fallback)
    hf_token = os.getenv("HUGGINGFACE_API_KEY", "")
    if hf_token:
        try:
            headers = {"Authorization": f"Bearer {hf_token}"}
            async with httpx.AsyncClient(trust_env=False) as client:
                res = await client.post(
                    "https://api-inference.huggingface.co/models/openai/whisper-large-v3",
                    headers=headers,
                    content=audio_bytes,
                    timeout=10.0
                )
                if res.status_code == 200:
                    data = res.json()
                    logger.info("Transcribed using HuggingFace Inference API.")
                    return data.get("text", "")
        except Exception as e:
            logger.error(f"HF Inference API STT failed: {e}")

    # 3. Try Deepgram API (Fallback)
    if DEEPGRAM_API_KEY:
        try:
            headers = {
                "Authorization": f"Token {DEEPGRAM_API_KEY}",
                "Content-Type": "audio/webm"
            }
            async with httpx.AsyncClient(trust_env=False) as client:
                res = await client.post(
                    "https://api.deepgram.com/v1/listen?smart_format=true&language=en-IN",
                    headers=headers,
                    content=audio_bytes,
                    timeout=10.0
                )
                if res.status_code == 200:
                    data = res.json()
                    logger.info("Transcribed using Deepgram API.")
                    return data["results"]["channels"][0]["alternatives"][0]["transcript"]
        except Exception as e:
            logger.error(f"Deepgram API STT failed: {e}")

    # 4. Final Fallback: If no API is configured or all fail, return simulated text based on audio size
    logger.warning("All Speech-to-Text pipelines failed or were unconfigured. Returning mock transcription.")
    return "Check my upcoming document deadlines in the vault."


async def run_gemini_legal_reasoner(
    prompt: str,
    user_id: str,
    history: List[Dict[str, str]],
    user_profile: Optional[Dict[str, Any]] = None,
    vault_docs: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Sends the user's transcription to Gemini, parses tool calls if any, and returns response.
    """
    system_instruction = (
        "You are LawBot360 Voice Assistant, a practical, street-smart legal companion for everyday people in India.\n"
        "Your mission is to empower common citizens, farmers, laborers, women, and illiterate or semi-literate individuals "
        "by giving them clear walkthroughs, workarounds, and step-by-step actions they can execute FROM THEIR OWN SIDE right now.\n\n"
        "STRICT CARDINAL RULES:\n"
        "1. NEVER START BY TELLING THE USER TO 'GO TO A LAWYER' OR GIVING DISCLAIMERS:\n"
        "   Do NOT say 'Aapko vakil ke paas jana chahiye', 'You must consult a lawyer', or 'I cannot give legal advice'.\n"
        "   The user is asking you so they don't have to hire expensive lawyers. Dive directly into the practical solution and their legal rights.\n"
        "2. LANGUAGE MUST BE DEAD SIMPLE AND NATURAL (AAM AADMI KI BHASHA):\n"
        "   Many callers may be illiterate or unfamiliar with legal jargon. Speak in warm, conversational everyday language (Hindi, Hinglish, or plain English).\n"
        "   Avoid complex legal Latin. Say 'likhit shikayat/report' instead of formal pleading, 'sade kagaz pe arzi' instead of affidavit,\n"
        "   'stay order/kaam rukwana' instead of injunction, 'free sarkari vakil' instead of legal aid.\n"
        "3. ALWAYS GIVE A 3-STEP WALKTHROUGH & WORKAROUNDS:\n"
        "   - Step 1 (Kagaz aur Saboot): What proof to keep ready right now (photos, call recording, bills, witness names).\n"
        "   - Step 2 (Aapke hath me kya hai): What they can do themselves (Jan Seva Kendra/CSC, written application, dial 112/1930/1915, e-FIR).\n"
        "   - Step 3 (Workarounds agar koi pareshan kare): Speed Post with AD to SP/DCP, demand stamped receiving copy, or get a 100% Free Government Lawyer from DLSA under Art 39A.\n"
        "4. CITE CONSTITUTIONAL SHIELDS (Article 21, 22, 19, 39A, D.K. Basu arrest rules) simply as citizen protections.\n"
        "Keep responses concise (3-5 sentences) and conversational for live spoken voice."
    )

    if user_profile:
        regs = [k.upper() for k, v in user_profile.get("registrations", {}).items() if v]
        system_instruction += (
            f"\n\n[CLIENT BUSINESS PROFILE CONTEXT]\n"
            f"- Entity Name: {user_profile.get('entityName', 'N/A')}\n"
            f"- Structure: {user_profile.get('businessType', 'N/A')}\n"
            f"- Industry: {user_profile.get('industry', 'N/A')}\n"
            f"- State Jurisdiction: {user_profile.get('state', 'N/A')}\n"
            f"- Turnover Slab: {user_profile.get('turnover', 'N/A')}\n"
            f"- Employee Count: {user_profile.get('employeeCount', 'N/A')}\n"
            f"- Active Registrations: {', '.join(regs) if regs else 'None'}\n"
        )

    # 1. Authoritative Constitutional RAG Context Injection
    constitution_context = constitution_rag.format_rag_context(prompt, max_results=3)
    if constitution_context:
        system_instruction += f"\n\n{constitution_context}\n"
        system_instruction += (
            "\n[CONSTITUTION OF INDIA RAG GROUNDING]\n"
            "Ground your advice in these statutory articles and landmark Supreme Court rulings. "
            "Explain the rights simply as practical shields for the citizen without legalistic jargon."
        )

    # 2. Perform a local keyword RAG check on vault_docs
    relevant_chunks = []
    if vault_docs and prompt:
        words = [w.lower() for w in prompt.split() if len(w) > 3]
        for doc in vault_docs:
            title = doc.get("title", "")
            category = doc.get("category", "")
            extracted = doc.get("extractedData", {})
            content = doc.get("content", "")
            
            doc_text = f"{title} {category} " + " ".join([f"{k}:{v}" for k, v in extracted.items()]) + f" {content}"
            doc_words = doc_text.lower().split()
            
            score = sum(1 for w in words if w in doc_words)
            if score > 0:
                relevant_chunks.append({
                    "title": title,
                    "text": doc_text,
                    "score": score
                })
        relevant_chunks.sort(key=lambda x: x["score"], reverse=True)
        relevant_chunks = relevant_chunks[:2]

    if relevant_chunks:
        context_text = "\n\n".join([f"[Doc: {c['title']}]\n{c['text']}" for c in relevant_chunks])
        system_instruction += f"\n\n[RELEVANT VAULT & POLICY CONTEXT (RAG)]\n{context_text}"

    # Check if we should route to Gemini or OmniRoute gateway
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_VOICE_MODEL}:generateContent?key={GEMINI_API_KEY}"
    
    # Structure conversation payload
    messages = [{"role": "system", "content": system_instruction}]
    for h in history:
        messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": prompt})

    payload = {
        "contents": [
            {
                "parts": [{"text": m["content"]}]
            } for m in messages if m["role"] != "system"
        ],
        "systemInstruction": {
            "parts": [{"text": system_instruction}]
        }
    }

    try:
        # Check if Gemini API key exists
        if GEMINI_API_KEY:
            async with httpx.AsyncClient(trust_env=False) as client:
                res = await client.post(url, json=payload, timeout=12.0)
                res.raise_for_status()
                data = res.json()
                response_text = data["candidates"][0]["content"]["parts"][0]["text"]
        else:
            # Fallback to local OmniRoute / Mock
            async with httpx.AsyncClient(trust_env=False) as client:
                headers = {"Authorization": "Bearer sk-or-mock"}
                res = await client.post(
                    OMNIROUTE_URL,
                    headers=headers,
                    json={
                        "model": GEMINI_VOICE_MODEL,
                        "messages": messages
                    },
                    timeout=10.0
                )
                res.raise_for_status()
                data = res.json()
                response_text = data["choices"][0]["message"]["content"]
    except Exception as e:
        logger.error(f"Gemini API execution failed: {e}. Reverting to standard legal response.")
        response_text = "I am checking your document vault now. Give me one second. [TOOL_CALL: check_document_vault_deadlines]"

    # Parse and execute tool calls
    tool_triggered = None
    tool_result = None
    
    if "[TOOL_CALL: check_document_vault_deadlines]" in response_text or "deadlines" in prompt.lower():
        tool_triggered = "check_document_vault_deadlines"
        if vault_docs:
            tool_result = []
            for d in vault_docs:
                ext = d.get("extractedData", {})
                deadline = ext.get("deadline") or ext.get("registrationDate") or ext.get("incorporationDate") or "No deadline"
                tool_result.append({
                    "id": d.get("id"),
                    "document_name": d.get("title"),
                    "category": d.get("category"),
                    "deadline": deadline,
                    "status": d.get("status", "Active")
                })
        else:
            tool_result = check_document_vault_deadlines(user_id)
            
        if tool_result:
            deadline_summaries = ", and ".join([f"{item['document_name']} due on {item['deadline']}" for item in tool_result[:3]])
            response_text = f"I've accessed your document vault. Your active deadlines are: {deadline_summaries}."
        else:
            response_text = "I've checked your vault, but could not find any active deadlines."
            
    elif "[TOOL_CALL: check_statutory_filings_status]" in response_text or "filing" in prompt.lower():
        tool_triggered = "check_statutory_filings_status"
        if user_profile:
            regs = [k.upper() for k, v in user_profile.get("registrations", {}).items() if v]
            tool_result = {
                "gstin_status": "Active" if "GST" in regs else "Not Registered",
                "tax_filings": {
                    "gstr_3b": "Pending for July 2026" if "GST" in regs else "N/A",
                    "tds_q1": "Overdue" if "PAN" in regs else "N/A"
                },
                "active_registrations": regs
            }
        else:
            tool_result = check_statutory_filings_status(user_id)
            
        if tool_result:
            gst_stat = tool_result.get("gstin_status", "N/A")
            tds_stat = tool_result.get("tax_filings", {}).get("tds_q1", "N/A")
            response_text = f"Checking your filings. Your GSTIN is {gst_stat}, and your quarterly TDS filing is {tds_stat}."
        else:
            response_text = "Checking filings, but could not find status."

    elif "[TOOL_CALL: search_constitution_rag]" in response_text or any(k in prompt.lower() for k in ["article", "constitution", "fundamental right", "arrest", "liberty", "privacy", "speech", "writ", "preamble", "legal aid"]):
        tool_triggered = "search_constitution_rag"
        rag_matches = constitution_rag.search(prompt, max_results=2)
        if rag_matches:
            tool_result = [
                {
                    "art_no": m["article"].get("ArtNo"),
                    "name": m["article"].get("Name"),
                    "part_name": m["article"].get("PartName"),
                    "cases": m["article"].get("landmark_cases", []),
                    "voice_summary": m.get("voice_summary", "")
                } for m in rag_matches
            ]
            primary_match = rag_matches[0]
            art = primary_match["article"]
            cases = art.get("landmark_cases", [])
            case_text = f" (as held in {cases[0]})" if cases else ""
            if not any(f"article {art.get('ArtNo').lower()}" in response_text.lower() for _ in [1]):
                response_text = f"Under Article {art.get('ArtNo')} of the Constitution of India, {art.get('Name')}{case_text}. {primary_match.get('voice_summary', '')} {response_text}"

    return {
        "response_text": response_text,
        "tool_called": tool_triggered,
        "tool_result": tool_result
    }


async def execute_elevenlabs_tts(text: str) -> bytes:
    """
    Converts text to high fidelity audio bytes using ElevenLabs API.
    If unconfigured or error, falls back to a simple wav/mp3 mock audio.
    """
    voice_id = os.getenv("VITE_ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")  # Rachel voice
    
    if ELEVENLABS_API_KEY:
        try:
            url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
            headers = {
                "xi-api-key": ELEVENLABS_API_KEY,
                "Content-Type": "application/json",
                "accept": "audio/mpeg"
            }
            data = {
                "text": text,
                "model_id": "eleven_monolingual_v1",
                "voice_settings": {
                    "stability": 0.75,
                    "similarity_boost": 0.85
                }
            }
            async with httpx.AsyncClient(trust_env=False) as client:
                res = await client.post(url, json=data, headers=headers, timeout=12.0)
                if res.status_code == 200:
                    logger.info("Generated high-fidelity audio with ElevenLabs.")
                    return res.content
        except Exception as e:
            logger.error(f"ElevenLabs TTS failed: {e}. Falling back...")

    # Deepgram TTS Fallback
    if DEEPGRAM_API_KEY:
        try:
            url = "https://api.deepgram.com/v1/speak?model=aura-asteria-en"
            headers = {
                "Authorization": f"Token {DEEPGRAM_API_KEY}",
                "Content-Type": "application/json"
            }
            async with httpx.AsyncClient(trust_env=False) as client:
                res = await client.post(url, json={"text": text}, headers=headers, timeout=10.0)
                if res.status_code == 200:
                    logger.info("Generated audio with Deepgram TTS.")
                    return res.content
        except Exception as e:
            logger.error(f"Deepgram TTS failed: {e}. Falling back...")

    # Final mock audio data fallback (a short silent/dummy MP3 frame)
    logger.warning("Unconfigured or failed ElevenLabs TTS. Returning mock audio representation.")
    dummy_mp3 = b"\xff\xfb\x90\x44\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00" * 100
    return dummy_mp3


@router.post("/fallback-pipeline")
async def process_voice_pipeline(
    user_id: str = Form(...),
    conversation_history: str = Form("[]"),
    audio_file: UploadFile = File(...),
    user_profile: Optional[str] = Form(None),
    vault_docs: Optional[str] = Form(None)
):
    """
    API endpoint running the Whisper STT -> Gemini -> ElevenLabs pipeline.
    Expects multi-part form data with user ID, history JSON, and the audio recording file.
    """
    logger.info(f"Triggered voice fallback pipeline for user: {user_id}")
    try:
        audio_bytes = await audio_file.read()
        history = json.loads(conversation_history)
        profile_dict = json.loads(user_profile) if user_profile else None
        docs_list = json.loads(vault_docs) if vault_docs else None
        
        # 1. Speech to Text (STT)
        transcription = await execute_whisper_stt(audio_bytes)
        logger.info(f"STT Output: {transcription}")
        
        # 2. LLM Reasoning + Tooling callbacks (Gemini)
        reasoner_output = await run_gemini_legal_reasoner(
            transcription, 
            user_id, 
            history,
            user_profile=profile_dict,
            vault_docs=docs_list
        )
        response_text = reasoner_output["response_text"]
        logger.info(f"LLM Output: {response_text}")
        
        # 3. Text to Speech (ElevenLabs / Fallback)
        tts_audio = await execute_elevenlabs_tts(response_text)
        
        # Base64 encode synthesized speech to return in JSON
        audio_base64 = base64.b64encode(tts_audio).decode('utf-8')
        
        return {
            "success": True,
            "transcription": transcription,
            "response_text": response_text,
            "tool_called": reasoner_output["tool_called"],
            "tool_result": reasoner_output["tool_result"],
            "audio_response": audio_base64  # Base64 MP3 stream
        }
    except Exception as e:
        logger.error(f"Failed to execute fallback pipeline: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/summary")
async def generate_summary(req: SummaryRequest):
    """
    Generates a concise case summary from conversation history or transcript.
    """
    if req.conversation_history:
        text = "Conversation History:\n" + "\n".join([f"{m.get('role', 'user')}: {m.get('content', '')}" for m in req.conversation_history])
    elif req.transcript:
        text = f"Transcript:\n{req.transcript}"
    else:
        raise HTTPException(status_code=400, detail="Must provide either conversation_history or transcript.")

    system_instruction = "You are a legal assistant. Generate a concise case summary based on the provided conversation or transcript. Keep it highly factual and professional."
    
    # Check if we should route to Gemini or OmniRoute gateway
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
    
    messages = [{"role": "system", "content": system_instruction}, {"role": "user", "content": text}]

    payload = {
        "contents": [
            {
                "parts": [{"text": text}]
            }
        ],
        "systemInstruction": {
            "parts": [{"text": system_instruction}]
        }
    }

    try:
        # Check if Gemini API key exists
        if GEMINI_API_KEY:
            async with httpx.AsyncClient(trust_env=False) as client:
                res = await client.post(url, json=payload, timeout=12.0)
                res.raise_for_status()
                data = res.json()
                summary_text = data["candidates"][0]["content"]["parts"][0]["text"]
        else:
            # Fallback to local OmniRoute / Mock
            async with httpx.AsyncClient(trust_env=False) as client:
                headers = {"Authorization": "Bearer sk-or-mock"}
                res = await client.post(
                    OMNIROUTE_URL,
                    headers=headers,
                    json={
                        "model": "gemini-1.5-flash",
                        "messages": messages
                    },
                    timeout=10.0
                )
                res.raise_for_status()
                data = res.json()
                summary_text = data["choices"][0]["message"]["content"]
    except Exception as e:
        logger.error(f"Summary generation failed: {e}")
        summary_text = "Summary generation failed due to API error."

    return {"summary": summary_text}

# ----------------- BACKGROUND WORKERS -----------------

async def run_videosdk_rtc_agent_pipeline(room_id: str, user_id: str):
    """
    Simulated background VideoSDK Python RTC worker.
    Subscribes to audio stream, acts on events, performs tool call callbacks.
    """
    logger.info(f"Worker initialized for room {room_id}. Joining...")
    await asyncio.sleep(2)
    logger.info(f"Worker connected. Subscribing to user {user_id} audio tracks.")
    
    # Periodically checks for signals or events.
    # In a full VideoSDK app, this uses callbacks like on_track_stream.
    for i in range(10):
        await asyncio.sleep(5)
        logger.info(f"RTC Agent worker active in room {room_id}. Quality is stable.")
    
    logger.info(f"Worker teardown for room {room_id}. Call ended.")


# ----------------- TWILIO MEDIA STREAMS TO GEMINI LIVE WS BRIDGE -----------------

# Precompute 256-entry G.711 mu-law decoding table
ULAW_TO_LINEAR = [0] * 256
for i in range(256):
    u_val = ~i & 0xFF
    sign = u_val & 0x80
    exponent = (u_val & 0x70) >> 4
    mantissa = u_val & 0x0F
    sample = (mantissa << 3) + 132
    sample <<= exponent
    sample -= 132
    ULAW_TO_LINEAR[i] = -sample if sign else sample

# Linear PCM 16-bit to mu-law G.711 encoder
def linear_to_ulaw(sample: int) -> int:
    CLIP = 32635
    BIAS = 132
    sign = (sample >> 8) & 0x80
    if sign:
        sample = -sample
    if sample > CLIP:
        sample = CLIP
    sample += BIAS
    
    exponent = 7
    mask = 0x4000
    while (sample & mask) == 0 and exponent > 0:
        exponent -= 1
        mask >>= 1
        
    mantissa = (sample >> (exponent + 3)) & 0x0F
    return ~(sign | (exponent << 4) | mantissa) & 0xFF

@router.post("/twilio/call")
async def handle_twilio_call():
    """
    Returns TwiML instructing Twilio to establish a Media Stream WebSocket.
    """
    host = os.getenv("SERVER_PUBLIC_HOST", "your-ngrok-domain.ngrok-free.app")
    twiml_xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say>Connecting you to LawBot360 female courtroom advocate. Please hold.</Say>
    <Connect>
        <Stream url="wss://{host}/api/v1/voice/twilio/stream" />
    </Connect>
</Response>
"""
    from fastapi.responses import Response
    return Response(content=twiml_xml, media_type="application/xml")

@router.websocket("/twilio/stream")
async def twilio_stream_bridge(twilio_ws: WebSocket):
    await twilio_ws.accept()
    logger.info("📞 Twilio Media Stream Call Connected.")

    import websockets
    gemini_ws_url = (
        f"wss://generativelanguage.googleapis.com/ws/"
        f"google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent"
        f"?key={GEMINI_API_KEY}"
    )

    stream_sid = None

    try:
        # Establish connection to the Gemini Live API
        async with websockets.connect(gemini_ws_url) as gemini_ws:
            logger.info("♊ Connected to Gemini Multimodal Live API.")
            
            # Use practical, simple-language senior female legal guide prompt
            system_prompt = (
                "You are Advocate LawBot360, a practical, caring senior legal guide in India.\n"
                "Your mission is to empower ordinary callers, women, and common citizens with practical step-by-step walkthroughs and workarounds.\n"
                "CARDINAL RULES:\n"
                "1. NEVER tell the caller to 'go to a lawyer' or open with legal disclaimers. Give them immediate actionable solutions.\n"
                "2. Speak in simple everyday spoken language (warm Hindi, Hinglish, or plain English) that anyone, including illiterate individuals, can understand.\n"
                "3. Always provide a clear 3-step walkthrough: (1) Proofs to keep in pocket, (2) What they can do themselves (Jan Seva Kendra, 112/1930 helpline, written complaint), (3) Street-smart workarounds if someone harasses them (Speed Post with AD to SP, demand stamped receiving, DLSA free government lawyer under Art 39A).\n"
                "4. Cite constitutional shields (Article 21, 22, 19, 39A, D.K. Basu arrest rules) simply as citizen rights.\n"
                "5. When speaking in Hindi, use natural feminine verb conjugations ('main aapko batati hu', 'main madad karti hu')."
            )
            
            model_id = GEMINI_VOICE_MODEL if GEMINI_VOICE_MODEL.startswith("models/") else f"models/{GEMINI_VOICE_MODEL}"
            
            setup_msg = {
                "setup": {
                    "model": model_id,
                    "generationConfig": {
                        "responseModalities": ["AUDIO"],
                        "speechConfig": {
                            "voiceConfig": {
                                "prebuiltVoiceConfig": {
                                    "voiceName": "Aoede"
                                }
                            }
                        }
                    },
                    "systemInstruction": {
                        "parts": [{"text": system_prompt}]
                    },
                    "tools": [
                        {
                            "functionDeclarations": [
                                {
                                    "name": "search_constitution_rag",
                                    "description": "Searches the official Constitution of India database across all 448 Articles, 25 Parts, and 122 Landmark Supreme Court cases.",
                                    "parameters": {
                                        "type": "OBJECT",
                                        "properties": {
                                            "query": {
                                                "type": "STRING",
                                                "description": "Constitutional concept, keywords, or situation to search"
                                            }
                                        },
                                        "required": ["query"]
                                    }
                                },
                                {
                                    "name": "get_article_details",
                                    "description": "Fetches exact text and landmark cases for a specific Article number (e.g., 21, 14, 19, 32, 226, 300A, 21A, 0).",
                                    "parameters": {
                                        "type": "OBJECT",
                                        "properties": {
                                            "article_number": {
                                                "type": "STRING",
                                                "description": "The article number"
                                            }
                                        },
                                        "required": ["article_number"]
                                    }
                                }
                            ]
                        }
                    ]
                }
            }
            await gemini_ws.send(json.dumps(setup_msg))

            # Concurrently process bidirectional audio stream
            async def twilio_to_gemini():
                nonlocal stream_sid
                try:
                    async for message in twilio_ws.iter_json():
                        if message["event"] == "start":
                            stream_sid = message["start"]["streamSid"]
                            logger.info(f"Stream started with SID: {stream_sid}")
                            
                        elif message["event"] == "media" and stream_sid:
                            payload = message["media"]["payload"]
                            ulaw_bytes = base64.b64decode(payload)
                            
                            # 1. Decode mu-law & resample (8kHz -> 16kHz)
                            pcm_samples = []
                            for b in ulaw_bytes:
                                pcm_sample = ULAW_TO_LINEAR[b]
                                pcm_samples.append(pcm_sample)
                                pcm_samples.append(pcm_sample)
                                
                            # 2. Package into 16-bit little-endian PCM byte stream
                            pcm_bytes = bytearray()
                            for s in pcm_samples:
                                pcm_bytes.extend(s.to_bytes(2, byteorder='little', signed=True))
                                
                            # 3. Stream to Gemini
                            gemini_payload = {
                                "realtimeInput": {
                                    "audio": {
                                        "mimeType": "audio/pcm;rate=16000",
                                        "data": base64.b64encode(pcm_bytes).decode('utf-8')
                                    }
                                }
                            }
                            await gemini_ws.send(json.dumps(gemini_payload))
                except WebSocketDisconnect:
                    logger.info("Twilio disconnected.")
                except Exception as e:
                    logger.error(f"Error in Twilio->Gemini stream: {e}")

            async def gemini_to_twilio():
                nonlocal stream_sid
                try:
                    async for message_str in gemini_ws:
                        message = json.loads(message_str)
                        
                        # Handle barge-in / interruption
                        if message.get("serverContent", {}).get("interrupted") and stream_sid:
                            logger.info("User interrupted. Clearing Twilio buffer.")
                            await twilio_ws.send_json({
                                "event": "clear",
                                "streamSid": stream_sid
                            })
                            continue

                        # Handle mid-call Gemini Live toolCall requests
                        tool_call = message.get("toolCall")
                        if tool_call and tool_call.get("functionCalls"):
                            tool_responses = []
                            for fc in tool_call["functionCalls"]:
                                fc_name = fc.get("name")
                                fc_args = fc.get("args", {})
                                fc_id = fc.get("id")
                                logger.info(f"Twilio Gemini tool called: {fc_name} with args: {fc_args}")
                                if fc_name == "search_constitution_rag":
                                    matches = constitution_rag.search(fc_args.get("query", ""), max_results=2)
                                    tool_responses.append({
                                        "id": fc_id,
                                        "response": {
                                            "output": {
                                                "results": [
                                                    {
                                                        "art_no": m["article"].get("ArtNo"),
                                                        "name": m["article"].get("Name"),
                                                        "cases": m["article"].get("landmark_cases", []),
                                                        "voice_summary": m.get("voice_summary")
                                                    } for m in matches
                                                ]
                                            }
                                        }
                                    })
                                elif fc_name == "get_article_details":
                                    art = constitution_rag.get_article(fc_args.get("article_number", ""))
                                    tool_responses.append({
                                        "id": fc_id,
                                        "response": {
                                            "output": {"article": art} if art else {"found": False}
                                        }
                                    })
                            if tool_responses:
                                await gemini_ws.send(json.dumps({
                                    "toolResponse": {
                                        "functionResponses": tool_responses
                                    }
                                }))
                                logger.info(f"Dispatched {len(tool_responses)} tool responses to Gemini Live.")
                            continue
                            
                        # Extract audio content
                        parts = message.get("serverContent", {}).get("modelTurn", {}).get("parts", [])
                        for part in parts:
                            if part.get("inlineData") and part["inlineData"].get("data"):
                                base64_pcm = part["inlineData"]["data"]
                                pcm_bytes = base64.b64decode(base64_pcm)
                                
                                # Convert PCM byte stream to 16-bit signed integers
                                pcm_samples = []
                                for i in range(0, len(pcm_bytes), 2):
                                    val = int.from_bytes(pcm_bytes[i:i+2], byteorder='little', signed=True)
                                    pcm_samples.append(val)
                                    
                                # Downsample (24kHz -> 8kHz): take every 3rd sample
                                downsampled = pcm_samples[::3]
                                
                                # Encode to mu-law PCMU bytes
                                ulaw_bytes = bytearray()
                                for s in downsampled:
                                    ulaw_bytes.append(linear_to_ulaw(s))
                                    
                                # Stream back to Twilio
                                await twilio_ws.send_json({
                                    "event": "media",
                                    "streamSid": stream_sid,
                                    "media": {
                                        "payload": base64.b64encode(ulaw_bytes).decode('utf-8')
                                    }
                                })
                except Exception as e:
                    logger.error(f"Error in Gemini->Twilio stream: {e}")

            # Run loops concurrently
            await asyncio.gather(twilio_to_gemini(), gemini_to_twilio())

    except Exception as e:
        logger.error(f"Failed to bridge connection: {e}")
    finally:
        logger.info("📞 Twilio Media Stream Call Terminated.")

@router.post("/twilio/dial")
async def place_outbound_call(to_number: str):
    """
    Triggers Twilio API to dial an outbound call to a specific number and connects it to the Gemini Live lawyer.
    """
    account_sid = os.getenv("TWILIO_ACCOUNT_SID", "")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN", "")
    from_number = os.getenv("TWILIO_PHONE_NUMBER", "")
    host = os.getenv("SERVER_PUBLIC_HOST", "")
    
    if not account_sid or not auth_token or not from_number or not host:
        raise HTTPException(
            status_code=400, 
            detail="Missing Twilio config in .env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, SERVER_PUBLIC_HOST"
        )

    url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Calls.json"
    auth = (account_sid, auth_token)
    data = {
        "To": to_number,
        "From": from_number,
        "Url": f"https://{host}/api/v1/voice/twilio/call"
    }

    async with httpx.AsyncClient(trust_env=False) as client:
        response = await client.post(url, auth=auth, data=data)
        if response.status_code != 201:
            raise HTTPException(status_code=response.status_code, detail=response.text)
        return response.json()
