import os
import argparse
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
import uvicorn
import logging

try:
    import torch
    from transformers import pipeline
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False

try:
    import pyttsx3
    PYTTSX3_AVAILABLE = True
except ImportError:
    PYTTSX3_AVAILABLE = False

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("hf_s2s_fallback")

app = FastAPI(title="Local HuggingFace Speech-to-Speech Fallback")

class LocalS2SAgent:
    def __init__(self):
        self.asr_pipeline = None
        self.tts_engine = None
        self.initialize_models()

    def initialize_models(self):
        if TRANSFORMERS_AVAILABLE:
            logger.info("Initializing local Whisper-tiny pipeline...")
            try:
                # Use tiny model for quick local fallback
                self.asr_pipeline = pipeline(
                    "automatic-speech-recognition", 
                    model="openai/whisper-tiny"
                )
                logger.info("Local Whisper pipeline ready.")
            except Exception as e:
                logger.error(f"Failed to load local Whisper pipeline: {e}")
        else:
            logger.warning("transformers not installed. ASR will use mock fallback.")

        if PYTTSX3_AVAILABLE:
            logger.info("Initializing pyttsx3 for local TTS synthesis...")
            try:
                self.tts_engine = pyttsx3.init()
            except Exception as e:
                logger.error(f"Failed to init pyttsx3: {e}")
        else:
            logger.warning("pyttsx3 not installed. TTS will use mock fallback.")

    def transcribe(self, audio_path: str) -> str:
        if self.asr_pipeline:
            logger.info(f"Transcribing {audio_path} using local Whisper...")
            result = self.asr_pipeline(audio_path)
            return result.get("text", "")
        return "Mock transcription: Tell me about my pending document filings."

    def generate_response(self, text: str) -> str:
        # A simple keyword-based response generator (offline LLM simulation)
        text_lower = text.lower()
        if "document" in text_lower or "filing" in text_lower or "deadline" in text_lower:
            return "I have checked your vault. You have a pending GST return filing due on August 20th."
        else:
            return "I am an offline fallback agent. How can I assist you with your legal documents today?"

    def synthesize_speech(self, text: str, output_path: str) -> str:
        if self.tts_engine:
            logger.info(f"Synthesizing speech to {output_path} using pyttsx3...")
            self.tts_engine.save_to_file(text, output_path)
            self.tts_engine.runAndWait()
            return output_path
        
        # Write dummy data if pyttsx3 is not available
        logger.info(f"Mock synthesizing speech to {output_path}...")
        with open(output_path, "wb") as f:
            f.write(b"MOCK_AUDIO_DATA_FOR_" + text.encode())
        return output_path

    def process(self, input_audio_path: str, output_audio_path: str) -> dict:
        transcription = self.transcribe(input_audio_path)
        logger.info(f"Transcription: {transcription}")
        
        response_text = self.generate_response(transcription)
        logger.info(f"Response: {response_text}")
        
        self.synthesize_speech(response_text, output_audio_path)
        
        return {
            "transcription": transcription,
            "response": response_text,
            "output_audio": output_audio_path
        }

agent = LocalS2SAgent()

@app.post("/api/v1/fallback/s2s")
async def local_speech_to_speech(
    audio_file: UploadFile = File(...)
):
    input_path = "temp_input.wav"
    output_path = "temp_output.wav"
    
    try:
        # Save input audio
        with open(input_path, "wb") as f:
            f.write(await audio_file.read())
            
        result = agent.process(input_path, output_path)
        
        return FileResponse(
            path=result["output_audio"],
            media_type="audio/wav",
            headers={
                "X-Transcription": result["transcription"],
                "X-Response-Text": result["response"]
            }
        )
    except Exception as e:
        logger.error(f"S2S processing failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Cleanup input file only (output file is needed for FileResponse, 
        # ideally we use BackgroundTasks to clean it up later)
        if os.path.exists(input_path):
            os.remove(input_path)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Local HF Speech-to-Speech Fallback")
    parser.add_argument("--cli", action="store_true", help="Run in CLI mode")
    parser.add_argument("--input", type=str, help="Input audio file (required for CLI)")
    parser.add_argument("--output", type=str, default="output.wav", help="Output audio file")
    
    args = parser.parse_args()
    
    if args.cli:
        if not args.input:
            print("Error: --input is required in CLI mode.")
            exit(1)
        print(f"Processing {args.input} -> {args.output}")
        res = agent.process(args.input, args.output)
        print(f"Done! Transcription: {res['transcription']}")
        print(f"Response: {res['response']}")
    else:
        logger.info("Starting local S2S API on port 8000...")
        uvicorn.run(app, host="0.0.0.0", port=8000)
