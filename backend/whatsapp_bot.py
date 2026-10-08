from fastapi import APIRouter, Request, BackgroundTasks, HTTPException, Query
from fastapi.responses import PlainTextResponse
import os
import httpx

router = APIRouter()

WHATSAPP_VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN", "lawbot360_verify_token")
WHATSAPP_ACCESS_TOKEN = os.getenv("WHATSAPP_ACCESS_TOKEN", "")
WHATSAPP_PHONE_NUMBER_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")

LAWBOT_SYSTEM_PROMPT = """
You are LawAgent360, a specialized legal AI assistant for India.
You provide compliance rules, government schemes, and legal insights.
Answer clearly, concisely, and professionally. Keep responses concise for WhatsApp.
"""

async def get_llm_response(prompt: str) -> str:
    omni_route_url = os.getenv("OMNIROUTE_URL", "http://localhost:20128/v1/chat/completions")
    payload = {
        "model": "gemini-1.5-flash",
        "messages": [
            {"role": "system", "content": LAWBOT_SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ]
    }
    try:
        async with httpx.AsyncClient() as client:
            res = await client.post(omni_route_url, json=payload, timeout=10.0)
            res.raise_for_status()
            data = res.json()
            return data["choices"][0]["message"]["content"]
    except Exception as e:
        return f"Sorry, I encountered an error while processing your request: {e}"

async def send_whatsapp_message(to: str, text: str):
    if not WHATSAPP_ACCESS_TOKEN or not WHATSAPP_PHONE_NUMBER_ID:
        print(f"Would send to WhatsApp {to}: {text}")
        return
    
    url = f"https://graph.facebook.com/v17.0/{WHATSAPP_PHONE_NUMBER_ID}/messages"
    headers = {
        "Authorization": f"Bearer {WHATSAPP_ACCESS_TOKEN}",
        "Content-Type": "application/json"
    }
    payload = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "text",
        "text": {"body": text}
    }
    async with httpx.AsyncClient() as client:
        await client.post(url, headers=headers, json=payload)

async def handle_whatsapp_message(message: dict):
    if message.get("type") == "text":
        text = message["text"]["body"]
        from_number = message["from"]
        
        reply = await get_llm_response(text)
        await send_whatsapp_message(from_number, reply)
    # Add support for audio/documents later if needed

@router.get("/whatsapp")
async def verify_whatsapp_webhook(
    mode: str = Query(None, alias="hub.mode"),
    token: str = Query(None, alias="hub.verify_token"),
    challenge: str = Query(None, alias="hub.challenge")
):
    """WhatsApp Cloud API Webhook Verification"""
    if mode and token:
        if mode == "subscribe" and token == WHATSAPP_VERIFY_TOKEN:
            return PlainTextResponse(challenge)
        raise HTTPException(status_code=403, detail="Verification token mismatch")
    raise HTTPException(status_code=400, detail="Missing verification parameters")

@router.post("/whatsapp")
async def whatsapp_webhook(request: Request, background_tasks: BackgroundTasks):
    """WhatsApp Cloud API Webhook Receiver"""
    data = await request.json()
    print("Received WhatsApp Webhook Payload:", data)
    
    if data.get("object") == "whatsapp_business_account":
        for entry in data.get("entry", []):
            for change in entry.get("changes", []):
                value = change.get("value", {})
                if "messages" in value:
                    for msg in value["messages"]:
                        background_tasks.add_task(handle_whatsapp_message, msg)
                        
    return {"status": "ok"}
