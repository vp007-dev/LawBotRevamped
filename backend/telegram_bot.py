from fastapi import APIRouter, Request, BackgroundTasks
import os
import httpx
from typing import Optional

router = APIRouter()

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_API_URL = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}"

LAWBOT_SYSTEM_PROMPT = """
You are LawAgent360, a specialized legal AI assistant for India.
You provide compliance rules, government schemes, and legal insights.
Answer clearly, concisely, and professionally.
"""

async def send_telegram_message(chat_id: int, text: str):
    if not TELEGRAM_BOT_TOKEN:
        print(f"Would send to Telegram {chat_id}: {text}")
        return
    url = f"{TELEGRAM_API_URL}/sendMessage"
    payload = {"chat_id": chat_id, "text": text}
    async with httpx.AsyncClient() as client:
        await client.post(url, json=payload)

async def get_llm_response(prompt: str) -> str:
    omni_route_url = os.getenv("OMNIROUTE_URL", "http://localhost:20128/v1/chat/completions")
    payload = {
        "model": "gemini-1.5-flash", # Or Groq
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

async def handle_telegram_update(update: dict):
    if "message" not in update:
        return

    message = update["message"]
    chat_id = message["chat"]["id"]

    if "text" in message:
        text = message["text"].strip()
        if text.startswith("/"):
            command = text.split(" ")[0].lower()
            if command == "/start":
                reply = "Welcome to LawBot360! I am your AI legal assistant. Type /help to see available commands."
            elif command == "/help":
                reply = "Commands:\n/start - Start the bot\n/ask <query> - Ask a legal question\n/vault - Access your documents\n/deadline - Check compliance deadlines\n/scheme - Find government schemes\n/help - Show this help message"
            elif command == "/ask":
                query = text[len("/ask"):].strip()
                if query:
                    reply = await get_llm_response(query)
                else:
                    reply = "Please provide a query. Example: /ask What are the tax compliance rules for a startup?"
            elif command == "/vault":
                reply = "Your vault is currently empty. Please upload documents securely."
            elif command == "/deadline":
                reply = "Upcoming deadlines:\n- GST Return (GSTR-3B): 20th of the month\n- TDS Payment: 7th of the month"
            elif command == "/scheme":
                reply = "Available schemes for you:\n- Startup India Seed Fund\n- MSME CGTMSE"
            else:
                reply = "Unknown command. Type /help to see available commands."
        else:
            # Normal text query
            reply = await get_llm_response(text)
        await send_telegram_message(chat_id, reply)

    elif "voice" in message:
        # TODO: Implement download .ogg audio -> transcribe
        reply = "Voice note received! Transcription & AI response feature coming soon."
        await send_telegram_message(chat_id, reply)

    elif "document" in message:
        # TODO: Implement document PDF upload parsing
        reply = "Document received! Secure vault storage and analysis coming soon."
        await send_telegram_message(chat_id, reply)

@router.post("/telegram")
async def telegram_webhook(request: Request, background_tasks: BackgroundTasks):
    """Telegram Bot Webhook Receiver"""
    data = await request.json()
    print("Received Telegram Webhook Payload:", data)
    background_tasks.add_task(handle_telegram_update, data)
    return {"status": "ok"}
