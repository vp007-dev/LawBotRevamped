# backend/aws_bedrock.py
import os
import json
import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx

logger = logging.getLogger("aws_bedrock")

router = APIRouter(
    prefix="/api/v1/aws",
    tags=["AWS Bedrock Engine"]
)

class AwsChatRequest(BaseModel):
    model: Optional[str] = "anthropic.claude-3-5-sonnet-20241022-v2:0"
    system: Optional[str] = "You are an expert Indian advocate legal counsel."
    messages: List[Dict[str, str]]
    temperature: Optional[float] = 0.3
    max_tokens: Optional[int] = 4096

@router.get("/status")
def get_aws_status():
    api_key = os.getenv("VITE_AWS_API_KEY") or os.getenv("AWS_API_KEY", "")
    access_key = os.getenv("VITE_AWS_ACCESS_KEY_ID") or os.getenv("AWS_ACCESS_KEY_ID", "")
    region = os.getenv("VITE_AWS_REGION") or os.getenv("AWS_DEFAULT_REGION", "us-east-1")
    default_model = os.getenv("VITE_AWS_MODEL", "anthropic.claude-3-5-sonnet-20241022-v2:0")

    return {
        "configured": bool(api_key or access_key),
        "region": region,
        "default_model": default_model,
        "auth_mode": "api_key" if api_key else ("iam_credentials" if access_key else "unconfigured")
    }

@router.post("/chat")
async def invoke_aws_chat(req: AwsChatRequest):
    """
    Invokes AWS Bedrock Foundation Models (Claude 3.5 Sonnet, Nova Pro, Llama 3.3 70B, Haiku)
    using the unified AWS API key or credentials.
    """
    api_key = os.getenv("VITE_AWS_API_KEY") or os.getenv("AWS_API_KEY", "")
    access_key = os.getenv("VITE_AWS_ACCESS_KEY_ID") or os.getenv("AWS_ACCESS_KEY_ID", "")
    secret_key = os.getenv("VITE_AWS_SECRET_ACCESS_KEY") or os.getenv("AWS_SECRET_ACCESS_KEY", "")
    region = os.getenv("VITE_AWS_REGION") or os.getenv("AWS_DEFAULT_REGION", "us-east-1")
    custom_endpoint = os.getenv("VITE_AWS_ENDPOINT") or os.getenv("AWS_BEDROCK_ENDPOINT", "")

    # Format messages for Bedrock Converse API format
    formatted_messages = []
    for msg in req.messages:
        role = "user" if msg.get("role") in ["user", "human"] else "assistant"
        formatted_messages.append({
            "role": role,
            "content": [{"text": msg.get("content", "")}]
        })

    # 1. If custom endpoint or AWS API Gateway / Bedrock Proxy endpoint is set
    if custom_endpoint:
        headers = {"Content-Type": "application/json"}
        if api_key:
            headers["x-api-key"] = api_key
            headers["Authorization"] = f"Bearer {api_key}"
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                res = await client.post(
                    custom_endpoint,
                    headers=headers,
                    json={
                        "model": req.model,
                        "system": req.system,
                        "messages": req.messages,
                        "temperature": req.temperature,
                        "max_tokens": req.max_tokens
                    }
                )
                if res.status_code == 200:
                    data = res.json()
                    content = data.get("content") or data.get("response") or data.get("choices", [{}])[0].get("message", {}).get("content", "")
                    return {"success": True, "content": content, "model": req.model, "provider": "AWS Bedrock"}
            except Exception as e:
                logger.warning(f"Custom AWS endpoint error: {e}")

    # 2. Try boto3 Bedrock Runtime if boto3 is installed and credentials exist
    try:
        import boto3
        session_kwargs = {"region_name": region}
        if access_key and secret_key:
            session_kwargs["aws_access_key_id"] = access_key
            session_kwargs["aws_secret_access_key"] = secret_key
        
        bedrock_runtime = boto3.client("bedrock-runtime", **session_kwargs)
        
        # Use Bedrock Converse API (Universal standard for Bedrock models)
        system_prompts = [{"text": req.system}] if req.system else []
        response = bedrock_runtime.converse(
            modelId=req.model,
            messages=formatted_messages,
            system=system_prompts,
            inferenceConfig={
                "temperature": req.temperature,
                "maxTokens": req.max_tokens
            }
        )
        
        output_text = response["output"]["message"]["content"][0]["text"]
        return {
            "success": True,
            "content": output_text,
            "model": req.model,
            "provider": "AWS Bedrock"
        }
    except ImportError:
        logger.info("boto3 not installed, checking direct REST or fallback.")
    except Exception as e:
        logger.warning(f"boto3 Bedrock invocation error: {e}")

    # 3. Direct SigV4 or Bedrock REST endpoint if API key is provided
    if api_key:
        bedrock_url = f"https://bedrock-runtime.{region}.amazonaws.com/model/{req.model}/converse"
        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                res = await client.post(
                    bedrock_url,
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "messages": formatted_messages,
                        "system": [{"text": req.system}] if req.system else [],
                        "inferenceConfig": {"temperature": req.temperature, "maxTokens": req.max_tokens}
                    }
                )
                if res.status_code == 200:
                    data = res.json()
                    content = data["output"]["message"]["content"][0]["text"]
                    return {"success": True, "content": content, "model": req.model, "provider": "AWS Bedrock"}
            except Exception as e:
                logger.warning(f"Bedrock REST error: {e}")

    # If AWS is waiting for the user's key to be entered in .env
    raise HTTPException(
        status_code=400,
        detail="AWS API key or IAM credentials not yet configured in .env. Please set VITE_AWS_API_KEY or VITE_AWS_ACCESS_KEY_ID in .env."
    )
