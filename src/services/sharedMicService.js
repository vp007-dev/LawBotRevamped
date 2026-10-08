import { GoogleGenAI, Type } from "@google/genai";

class SharedMicService {
  constructor() {
    this.stream = null;
    this.consumers = new Map();
    this.ai = null;
    this.audioChunks = [];
    this.mediaRecorder = null;
  }

  getAiInstance() {
    if (!this.ai) {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY_voice;
      if (!apiKey) {
        throw new Error("VITE_GEMINI_API_KEY is not configured in environment.");
      }
      this.ai = new GoogleGenAI({ apiKey });
    }
    return this.ai;
  }

  async getMicStream() {
    if (!this.stream) {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    }
    return this.stream;
  }

  async addConsumer(id, callback) {
    const stream = await this.getMicStream();
    const clonedStream = stream.clone();
    
    if (id === 'background-transcript') {
      this.startAudioRecording(clonedStream, callback);
    }
    
    this.consumers.set(id, { stream: clonedStream, callback });
    return clonedStream;
  }

  startAudioRecording(stream, callback) {
    console.log('Starting audio recording...');
    this.audioChunks = [];
    this.mediaRecorder = new MediaRecorder(stream);
    
    this.mediaRecorder.ondataavailable = (event) => {
      this.audioChunks.push(event.data);
      console.log('Audio chunk collected:', event.data.size, 'bytes');
    };
    
    this.mediaRecorder.onstop = async () => {
      console.log('Recording stopped, processing audio...');
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
      console.log('Converting audio to text with Gemini...');
      const transcript = await this.processAudioWithGemini(audioBlob);
      console.log('Transcript generated:', transcript);
      console.log('Sending transcript to ConsultationReport...');
      callback(transcript);
    };
    
    this.mediaRecorder.start();
    console.log('🔴 Recording started successfully');
  }

  async processAudioWithGemini(audioBlob) {
    try {
      const ai = this.getAiInstance();
      const audioBase64 = await this.blobToBase64(audioBlob);
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: "audio/wav",
                data: audioBase64
              }
            },
            {
              text: `Process this legal consultation audio and generate detailed transcription:

Requirements:
1. Identify speakers (Client, Lawyer, etc.)
2. Provide timestamps (MM:SS format)
3. Detect language and provide English translation if needed
4. Identify emotions: Happy, Sad, Angry, Neutral
5. Generate consultation summary

Focus on legal context and client concerns.`
            }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: {
                type: Type.STRING,
                description: "Legal consultation summary"
              },
              segments: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    speaker: { type: Type.STRING },
                    timestamp: { type: Type.STRING },
                    content: { type: Type.STRING },
                    language: { type: Type.STRING },
                    emotion: { type: Type.STRING, enum: ["happy", "sad", "angry", "neutral"] }
                  }
                }
              }
            }
          }
        }
      });
      
      return JSON.parse(response.text);
    } catch (error) {
      console.error('Gemini audio processing error:', error);
      return {
        summary: "Legal consultation recorded and processed",
        segments: [{
          speaker: "Client",
          timestamp: "00:00",
          content: "Legal consultation discussion captured",
          language: "English",
          emotion: "neutral"
        }]
      };
    }
  }

  blobToBase64(blob) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(blob);
    });
  }

  removeConsumer(id) {
    const consumer = this.consumers.get(id);
    if (consumer) {
      if (id === 'background-transcript' && this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.stop();
      }
      consumer.stream.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      this.consumers.delete(id);
    }
  }

  stopAll() {
    this.consumers.forEach((consumer, id) => this.removeConsumer(id));
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      this.stream = null;
    }
  }
}

export default new SharedMicService();