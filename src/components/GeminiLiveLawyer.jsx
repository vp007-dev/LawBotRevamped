import React, { useState, useEffect, useRef } from 'react';
import { 
  Scale, User, Phone, Mic, Activity, CheckCircle, AlertCircle,
  BookOpen, Sparkles, Shield, Database, ExternalLink, ChevronRight,
  Gavel, Layers, Flame, BookCheck, Info
} from 'lucide-react';
import ConsultationReport from './ConsultationReport';
import { constitutionKnowledgeService } from '../services/constitutionKnowledgeService';
import { indianKanoonService } from '../services/indianKanoonService';

const GeminiLiveLawyer = ({ variant = 'default' }) => {
  const [status, setStatus] = useState('idle'); // idle, connecting, connected
  const [errorText, setErrorText] = useState('');
  const [showConsultationReport, setShowConsultationReport] = useState(false);
  const [sessionTranscript, setSessionTranscript] = useState("");
  
  // Real-time RAG grounding states
  const [activeGrounding, setActiveGrounding] = useState(null); // { type, title, articles: [], cases: [] }
  const [recentCitations, setRecentCitations] = useState([]); // array of { artNo, name, cases }
  const [isRagScanning, setIsRagScanning] = useState(false);
  const [selectedArticleDetail, setSelectedArticleDetail] = useState(null);
  
  const wsRef = useRef(null);
  const audioContextRef = useRef(null);
  const streamRef = useRef(null);
  const processorRef = useRef(null);
  const audioQueueRef = useRef([]);
  const isPlayingRef = useRef(false);
  const nextPlayTimeRef = useRef(0);
  const activeSourcesRef = useRef([]);
  const transcriptRef = useRef("");
  const currentModelResponseRef = useRef("");
  
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY_voice || import.meta.env.VITE_GEMINI_API_KEY;
  const HOST = 'generativelanguage.googleapis.com';
  const WS_URL = `wss://${HOST}/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${API_KEY}`;
  const LIVE_MODEL = import.meta.env.VITE_GEMINI_LIVE_MODEL || 'models/gemini-3.1-flash-live-preview';
  const isTranslationModel = LIVE_MODEL.includes('translate');

  // Tool declarations passed to Gemini Multimodal Live API
  const constitutionFunctionDeclarations = [
    {
      name: "search_constitution_rag",
      description: "Search the official Constitution of India database across all 448 Articles, 25 Parts, and 122 Landmark Supreme Court cases. Use whenever user asks about legal rights, fundamental rights, duties, writs, arrest, detention, speech, equality, religious freedom, citizenship, emergency, or judicial powers.",
      parameters: {
        type: "OBJECT",
        properties: {
          query: {
            type: "STRING",
            description: "Constitutional concept, keywords, or situation to search (e.g. 'Article 21 privacy', 'police arrest rights', 'freedom of speech', 'writ petition')"
          }
        },
        required: ["query"]
      }
    },
    {
      name: "get_article_details",
      description: "Retrieve exact statutory description, landmark Supreme Court judgments, and linked articles for a specific Article number (e.g., '21', '14', '19', '32', '226', '300A', '21A', '0' for Preamble).",
      parameters: {
        type: "OBJECT",
        properties: {
          article_number: {
            type: "STRING",
            description: "The article number such as '21', '14', '19', '32', '226', '300A', '21A', '0'"
          }
        },
        required: ["article_number"]
      }
    },
    {
      name: "search_kanoon_precedents",
      description: "Query Indian Kanoon database for live Supreme Court and High Court judgment precedents, statutes, and citations.",
      parameters: {
        type: "OBJECT",
        properties: {
          query: {
            type: "STRING",
            description: "Case name, citation, or legal keywords to query in Indian Kanoon"
          }
        },
        required: ["query"]
      }
    }
  ];

  const systemPrompt = `You are LawBot360 Voice Assistant, a practical, street-smart legal companion for everyday people in India.
Your core mission is to empower common citizens, farmers, laborers, women, and illiterate or semi-literate individuals by giving them clear walkthroughs, workarounds, and practical steps they can do FROM THEIR OWN SIDE right now without feeling helpless or spending money on a lawyer.

CRITICAL RULES OF ENGAGEMENT:
1. NEVER START BY TELLING THE USER TO "GO TO A LAWYER" OR GIVING DISCLAIMERS:
   - STRICT BAN: Never say "Aapko vakil ke paas jana chahiye", "You should consult a lawyer", "Please consult an advocate", or "I cannot give legal advice".
   - The user is talking to you specifically to avoid hiring expensive lawyers and to know what THEY can do themselves.
   - Dive directly into the practical solution, what steps to take, and their rights under the law.

2. LANGUAGE MUST BE DEAD SIMPLE AND NATURAL (AAM AADMI KI BHASHA):
   - Many users may be illiterate or unfamiliar with legal jargon.
   - Speak in warm, conversational everyday language — natural Hindi, Hinglish, or plain simple English matching the user.
   - Avoid complex English or Latin legal jargon. Always use simple, clear words:
     * Say "Likhit shikayat ya report" instead of "formal complaint/petition".
     * Say "Sade kagaz pe arzi" (Application on plain paper) instead of "affidavit/pleading".
     * Say "Stay order ya kaam rukwana" instead of "interim injunction".
     * Say "Free sarkari vakil (DLSA)" instead of "statutory legal aid".
     * Say "Saboot aur kagaz" instead of "evidentiary documentation".
   - Speak like a caring, knowledgeable elder brother or legal guide standing right beside the user.

3. ALWAYS PROVIDE A 3-STEP WALKTHROUGH & WORKAROUNDS:
   Structure your spoken answer into 3 simple, actionable parts:
   - STEP 1 (Saboot aur Kagaz): Exactly what evidence to keep ready right now (e.g., photo, phone recording, bill, payment screenshot, witness name, diary note).
   - STEP 2 (Aapke hath me kya hai / Where to go): What they can do themselves — visiting the nearest Jan Seva Kendra (CSC), writing an application on plain paper, calling emergency helpline (112 for police, 1930 for cyber fraud, 1915 for consumer cheat), or filing an online e-FIR.
   - STEP 3 (Smart Workarounds agar koi pareshan kare):
     * If police refuse an FIR: Send a written complaint via Speed Post with Acknowledgement Due (AD) to the SP or DCP, or dial 112 to generate a police event record.
     * Always demand a stamped receipt copy ("Receiving stamp zaroor lo, bina receipt ke mat aao").
     * If they have no money for court: Explain how to get a 100% FREE government lawyer from the District Legal Services Authority (DLSA) under Article 39A without paying any fee.

4. GROUNDED IN CONSTITUTION OF INDIA (SHIELDS OF PROTECTION):
   - You have access to the 448 Articles of the Constitution of India and 122 Landmark Supreme Court Precedents via your tools:
     * search_constitution_rag(query)
     * get_article_details(article_number)
     * search_kanoon_precedents(query)
   - Explain rights simply as a shield for the citizen:
     * Article 21: Protection of life & dignity — police cannot beat, harass, or abuse you (Supreme Court's Maneka Gandhi & Puttaswamy rulings).
     * Article 22: Arrest safeguards — police must tell the reason, make an arrest memo, inform a family member, and present before a magistrate within 24 hours (D.K. Basu arrest rules).
     * Article 19: Right to speak up and ask questions peacefully.
     * Article 39A: Free sarkari vakil for anyone who cannot afford one.

5. SPOKEN BREVITY:
   - Keep answers concise and punchy for live voice conversation (3 to 5 clear sentences).
   - End with a warm, encouraging check: "Bataiye, kya yeh samajh aaya, ya arzi likhne ka aasan tarika bataun?"`;

  const addCitation = (item) => {
    setRecentCitations(prev => {
      const exists = prev.some(c => String(c.artNo).toUpperCase() === String(item.artNo).toUpperCase());
      if (exists) return prev;
      return [item, ...prev].slice(0, 6);
    });
  };

  // Start the voice consultation
  const startConsultation = async () => {
    try {
      if (!API_KEY) {
        throw new Error('VITE_GEMINI_API_KEY or VITE_GEMINI_API_KEY_voice is not configured in .env');
      }
      setStatus('connecting');
      setErrorText('');
      setActiveGrounding(null);
      setRecentCitations([]);
      
      // Reset transcription buffers
      transcriptRef.current = "";
      currentModelResponseRef.current = "";
      setSessionTranscript("");
      
      // Initialize WebSocket
      await connectWebSocket();
      
      // Initialize Recording
      await startAudioRecording();
      
      setStatus('connected');
    } catch (err) {
      console.error("Failed to start consultation:", err);
      setErrorText(err.message || 'Failed to connect. Please try again.');
      endConsultation();
    }
  };

  const connectWebSocket = () => {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        // Send complete setup message with Constitutional RAG function declarations
        if (isTranslationModel) {
          ws.send(JSON.stringify({
            setup: {
              model: LIVE_MODEL,
              generationConfig: {
                responseModalities: ["AUDIO"]
              },
              translationConfig: {
                targetLanguageCode: "hi",
                echoTargetLanguage: true
              },
              inputAudioTranscription: {},
              outputAudioTranscription: {}
            }
          }));
        } else {
          ws.send(JSON.stringify({
            setup: {
              model: LIVE_MODEL,
              generationConfig: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                  voiceConfig: {
                     prebuiltVoiceConfig: {
                        voiceName: "Aoede" // professional sounding voice
                     }
                  }
                }
              },
              systemInstruction: {
                parts: [{ text: systemPrompt }]
              },
              tools: [
                {
                  functionDeclarations: constitutionFunctionDeclarations
                }
              ],
              inputAudioTranscription: {},
              outputAudioTranscription: {}
            }
          }));
        }

        // Send an initial client content message to kickstart warmly in simple language
        ws.send(JSON.stringify({
          clientContent: {
            turns: [{
              role: "user",
              parts: [{ text: "Namaste! Greet me warmly in one short sentence in simple conversational everyday language (Hindi/Hinglish/English) and ask how you can help me with practical steps, paperwork, police issues, or legal rights today." }]
            }],
            turnComplete: true
          }
        }));
        resolve();
      };

      ws.onmessage = async (event) => {
        try {
          const message = typeof event.data === 'string' ? JSON.parse(event.data) : null;
          
          if (!message && event.data instanceof Blob) {
             const text = await event.data.text();
             const jsonMsg = JSON.parse(text);
             handleServerMessage(jsonMsg);
             return;
          }
          
          if (message) {
             handleServerMessage(message);
          }

        } catch (e) {
          console.error("Error processing websocket message", e);
        }
      };

      ws.onerror = (err) => {
        console.error("WebSocket Error:", err);
        reject(new Error("WebSocket Connection Failed"));
      };

      ws.onclose = (event) => {
        console.log("WebSocket connection closed", event.code, event.reason);
        if (status === 'connected') {
            endConsultation();
        }
      };
    });
  };

  const handleInterruption = () => {
    console.log("Interrupted by user speech. Stopping active audio sources.");
    activeSourcesRef.current.forEach(source => {
      try {
        source.stop();
      } catch (e) {}
    });
    activeSourcesRef.current = [];
    nextPlayTimeRef.current = 0;

    // Log the interrupted model speech
    if (currentModelResponseRef.current) {
      transcriptRef.current += `Advocate: ${currentModelResponseRef.current} [Interrupted]\n\n`;
      currentModelResponseRef.current = "";
    }
  };

  // Execute Tool Calls from Gemini Live WebSocket
  const handleToolCalls = async (calls) => {
    setIsRagScanning(true);
    const functionResponses = [];

    for (const call of calls) {
      const { id, name, args } = call;
      console.log(`[Gemini Live Tool Call] ${name}:`, args);
      let output = {};

      if (name === 'search_constitution_rag') {
        const results = constitutionKnowledgeService.searchArticles(args?.query || '', 3);
        output = {
          query: args?.query,
          count: results.length,
          articles: results.map(r => ({
            articleNumber: r.article.ArtNo,
            name: r.article.Name,
            part: `${r.article.PartNo} - ${r.article.PartName}`,
            category: r.article.category,
            statutoryText: r.article.ArtDesc ? r.article.ArtDesc.slice(0, 350) : '',
            landmarkCases: r.article.landmark_cases || [],
            relatedArticles: r.article.related_articles || []
          }))
        };

        // Update citations in state
        results.forEach(r => {
          addCitation({
            artNo: r.article.ArtNo,
            name: r.article.Name,
            category: r.article.category,
            cases: r.article.landmark_cases || []
          });
        });

        setActiveGrounding({
          type: 'tool',
          title: `RAG Grounding: "${args?.query}"`,
          articles: results.map(r => `Article ${r.article.ArtNo}: ${r.article.Name}`),
          cases: results.flatMap(r => r.article.landmark_cases || []).slice(0, 3)
        });
      } else if (name === 'get_article_details') {
        const art = constitutionKnowledgeService.getArticle(args?.article_number);
        if (art) {
          output = {
            found: true,
            articleNumber: art.ArtNo,
            name: art.Name,
            part: `${art.PartNo} - ${art.PartName}`,
            text: art.ArtDesc,
            landmarkCases: art.landmark_cases || [],
            relatedArticles: art.related_articles || []
          };
          addCitation({
            artNo: art.ArtNo,
            name: art.Name,
            category: art.category,
            cases: art.landmark_cases || []
          });
          setActiveGrounding({
            type: 'article',
            title: `Article ${art.ArtNo} Retrieved`,
            articles: [`Article ${art.ArtNo}: ${art.Name}`],
            cases: art.landmark_cases || []
          });
        } else {
          output = { found: false, message: `Article ${args?.article_number} not found in Constitution database.` };
        }
      } else if (name === 'search_kanoon_precedents') {
        try {
          const docs = await indianKanoonService.search(args?.query || '', 0);
          output = {
            query: args?.query,
            precedents: docs.slice(0, 3).map(d => ({
              title: d.title,
              headline: d.headline,
              citation: d.docsource,
              url: d.url
            }))
          };
        } catch (err) {
          output = { error: err.message };
        }
      }

      functionResponses.push({
        id: id,
        response: { output: output }
      });
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && functionResponses.length > 0) {
      wsRef.current.send(JSON.stringify({
        toolResponse: {
          functionResponses: functionResponses
        }
      }));
    }
    setTimeout(() => setIsRagScanning(false), 900);
  };

  const handleServerMessage = (message) => {
    // 1. Tool Call checking from Gemini Live
    if (message.toolCall && Array.isArray(message.toolCall.functionCalls)) {
      handleToolCalls(message.toolCall.functionCalls);
    }
    if (message.serverContent?.modelTurn?.parts) {
      const toolParts = message.serverContent.modelTurn.parts.filter(p => p.functionCall);
      if (toolParts.length > 0) {
        handleToolCalls(toolParts.map(p => p.functionCall));
      }
    }

    // Extract transcription content from either serverContent wrapper or root
    const inputTrans = message.serverContent?.inputTranscription || message.inputTranscription;
    const outputTrans = message.serverContent?.outputTranscription || message.outputTranscription;

    // 2. User speech transcript
    if (inputTrans) {
      const text = inputTrans.text;
      if (text) {
        if (currentModelResponseRef.current) {
          transcriptRef.current += `Advocate: ${currentModelResponseRef.current}\n\n`;
          currentModelResponseRef.current = "";
        }
        transcriptRef.current += `Client: ${text}\n`;
        console.log("Client transcription:", text);

        // Proactive RAG search on recognized user speech
        const matches = constitutionKnowledgeService.searchArticles(text, 2);
        if (matches && matches.length > 0) {
          matches.forEach(m => {
            addCitation({
              artNo: m.article.ArtNo,
              name: m.article.Name,
              category: m.article.category,
              cases: m.article.landmark_cases || []
            });
          });
          setActiveGrounding({
            type: 'proactive',
            title: `Constitutional Provisions Identified`,
            articles: matches.map(m => `Article ${m.article.ArtNo}: ${m.article.Name}`),
            cases: matches.flatMap(m => m.article.landmark_cases || []).slice(0, 2)
          });
        }
      }
    }

    // 3. Model speech transcript
    if (outputTrans) {
      const text = outputTrans.text;
      if (text) {
        currentModelResponseRef.current += text;
        console.log("Model transcription chunk:", text);
      }
    }

    // 4. Audio & Control events
    if (message.serverContent) {
      if (message.serverContent.interrupted) {
        handleInterruption();
        return;
      }
      if (message.serverContent.turnComplete) {
        if (currentModelResponseRef.current) {
          transcriptRef.current += `Advocate: ${currentModelResponseRef.current}\n\n`;
          currentModelResponseRef.current = "";
        }
      }
      if (message.serverContent.modelTurn) {
        const parts = message.serverContent.modelTurn.parts;
        for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
            // Audio data received
            const base64Audio = part.inlineData.data;
            playAudioFromBase64(base64Audio);
          }
        }
      }
    }
  };

  const playAudioFromBase64 = async (base64String) => {
    try {
      const binaryString = window.atob(base64String);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const sampleRate = 24000;
      let buffer = bytes.buffer;
      if (bytes.byteLength % 2 !== 0) {
        buffer = bytes.buffer.slice(0, bytes.byteLength - 1);
      }
      const int16Array = new Int16Array(buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }
      
      if (!audioContextRef.current) return;
      const audioBuffer = audioContextRef.current.createBuffer(1, float32Array.length, sampleRate);
      audioBuffer.getChannelData(0).set(float32Array);
      
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
      activeSourcesRef.current.push(source);
      source.onended = () => {
        activeSourcesRef.current = activeSourcesRef.current.filter(src => src !== source);
      };
      
      const currentTime = audioContextRef.current.currentTime;
      if (currentTime < nextPlayTimeRef.current) {
        source.start(nextPlayTimeRef.current);
        nextPlayTimeRef.current += audioBuffer.duration;
      } else {
        source.start(currentTime);
        nextPlayTimeRef.current = currentTime + audioBuffer.duration;
      }

    } catch (e) {
      console.error("Error decoding audio playback", e);
    }
  };

  const startAudioRecording = async () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
    audioContextRef.current = audioContext;
    
    const stream = await navigator.mediaDevices.getUserMedia({ audio: {
       channelCount: 1,
       sampleRate: 16000,
    } });
    streamRef.current = stream;

    const source = audioContext.createMediaStreamSource(stream);

    const workletCode = `
      class PCMProcessor extends AudioWorkletProcessor {
        process(inputs, outputs, parameters) {
          const input = inputs[0];
          if (input && input.length > 0) {
            const channelData = input[0];
            const pcm16 = new Int16Array(channelData.length);
            for (let i = 0; i < channelData.length; i++) {
              pcm16[i] = Math.max(-1, Math.min(1, channelData[i])) * 0x7FFF;
            }
            this.port.postMessage(pcm16.buffer, [pcm16.buffer]);
          }
          return true;
        }
      }
      registerProcessor('pcm-processor', PCMProcessor);
    `;
    
    const blob = new Blob([workletCode], { type: 'application/javascript' });
    const workletUrl = URL.createObjectURL(blob);
    await audioContext.audioWorklet.addModule(workletUrl);
    
    const workletNode = new AudioWorkletNode(audioContext, 'pcm-processor');
    processorRef.current = workletNode;

    workletNode.port.onmessage = (e) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        const pcm16Buffer = e.data;
        const uint8Array = new Uint8Array(pcm16Buffer);
        
        let binary = '';
        for (let i = 0; i < uint8Array.byteLength; i++) {
          binary += String.fromCharCode(uint8Array[i]);
        }
        const base64Data = window.btoa(binary);

        const realTimeInputChunk = {
          realtimeInput: {
            audio: {
              mimeType: "audio/pcm;rate=16000",
              data: base64Data
            }
          }
        };
        wsRef.current.send(JSON.stringify(realTimeInputChunk));
      }
    };

    source.connect(workletNode);
    workletNode.connect(audioContext.destination);
  };

  const endConsultation = () => {
    // Flush any pending transcript chunks
    if (currentModelResponseRef.current) {
      transcriptRef.current += `Advocate: ${currentModelResponseRef.current}\n\n`;
      currentModelResponseRef.current = "";
    }

    const finalTranscript = transcriptRef.current.trim();
    setSessionTranscript(finalTranscript || "No dialogue trace recorded during this session.");
    setShowConsultationReport(true);

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (processorRef.current && audioContextRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    activeSourcesRef.current.forEach(source => {
      try {
        source.stop();
      } catch (e) {}
    });
    activeSourcesRef.current = [];
    nextPlayTimeRef.current = 0;
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setStatus('idle');
  };

  return (
    <div className={`w-full bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden transition-all duration-300 ${variant === 'landing' ? 'landing-live-voice' : ''}`}>
      
      {/* IDLE STATE */}
      {status === 'idle' && (
        <div className="p-5">
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-md shadow-blue-500/20 text-white">
                <Scale className="w-7 h-7" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap justify-between items-start gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight flex items-center gap-2">
                    {isTranslationModel ? "Advocate Live Translator" : "Gemini Live Voice AI"}
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      RAG DB Grounded
                    </span>
                  </h3>
                  <p className="text-xs text-blue-600 font-medium mt-1">
                    448 Articles • 25 Parts • 122 Landmark SC Precedents
                  </p>
                </div>
                <div className="bg-slate-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-md border border-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <Database className="w-3 h-3 text-cyan-400" />
                  Gemini 3.1 Live Preview
                </div>
              </div>

              <p className="text-sm text-slate-600 mt-2.5 leading-relaxed">
                Connect your microphone for direct spoken consultation. The voice model continuously references the authoritative Constitution of India knowledge base and Indian Kanoon precedents in real-time, preventing hallucinations.
              </p>
              
              {/* Grounding Pillars Pill Tray */}
              <div className="mt-3.5 flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-700 font-medium">
                  <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                  Fundamental Rights (Art 12–35)
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-700 font-medium">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" />
                  Arrest Safeguards (Art 21 & 22)
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-700 font-medium">
                  <Gavel className="w-3.5 h-3.5 text-purple-600" />
                  Writ Remedies (Art 32 / 226)
                </span>
              </div>

              {errorText && (
                <div className="mt-3 flex items-center gap-2 p-2.5 rounded-lg bg-red-50 text-red-600 text-xs border border-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {errorText}
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Low-latency Full Duplex WebSocket Audio
            </div>
            <button
              onClick={startConsultation}
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-2.5 px-5 rounded-lg text-sm font-semibold transition-all shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 active:scale-95"
            >
              <Mic className="w-4 h-4" />
              {isTranslationModel ? "Start Live Interpreter" : "Start Voice Consultation"}
            </button>
          </div>
        </div>
      )}

      {/* CONNECTING STATE */}
      {status === 'connecting' && (
        <div className="p-8 flex flex-col items-center justify-center text-center min-h-[300px] bg-slate-50/50">
          <div className="relative mb-5">
            <div className="w-16 h-16 bg-blue-100/80 rounded-2xl flex items-center justify-center z-10 relative">
               <Scale className="w-8 h-8 text-blue-600 animate-pulse" />
            </div>
            <div className="absolute inset-0 border-2 border-blue-500 rounded-2xl animate-ping opacity-25"></div>
            <div className="absolute -inset-1 border-2 border-indigo-500 rounded-2xl border-t-transparent animate-spin"></div>
          </div>
          <h3 className="text-base font-bold text-slate-900">Connecting Gemini Live Voice Engine...</h3>
          <p className="text-xs text-slate-500 mt-1.5 max-w-sm">
            Binding bidirectional audio socket and indexing 448 Constitutional Articles for real-time tool grounding.
          </p>
          <div className="mt-4 flex items-center gap-2 text-[11px] font-mono text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            <Activity className="w-3 h-3 animate-spin" />
            BidiGenerateContent • PCM 16kHz Duplex
          </div>
        </div>
      )}

      {/* CONNECTED STATE */}
      {status === 'connected' && (
        <div className="relative bg-slate-950 text-white min-h-[360px] flex flex-col justify-between">
          
          {/* Top Bar Status */}
          <div className="px-5 py-3.5 flex flex-wrap justify-between items-center border-b border-slate-800 bg-slate-900/60 backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold text-emerald-400 font-mono tracking-wider">
                RAG DB CONNECTED • 448 ARTICLES
              </span>
            </div>

            {/* Dynamic RAG Scanner Indicator */}
            {isRagScanning && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-cyan-400 bg-cyan-950/80 px-2.5 py-0.5 rounded-full border border-cyan-700/50 animate-pulse">
                <Database className="w-3 h-3" />
                Querying Constitution DB...
              </div>
            )}

            <div className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded border border-slate-700">
              gemini-3.1-flash-live
            </div>
          </div>

          {/* Main Visualizer & Grounding Tray */}
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            
            {/* Center Pulsing Sphere */}
            <div className="relative mb-5">
              <div className="w-24 h-24 bg-gradient-to-tr from-blue-600/30 to-indigo-600/30 border border-blue-500/40 rounded-full flex items-center justify-center relative hover:scale-105 transition-transform">
                 <Scale className="w-10 h-10 text-blue-300 drop-shadow-[0_0_12px_rgba(59,130,246,0.6)]" />
                 <div className="absolute -inset-2 rounded-full border border-blue-500/30 animate-pulse"></div>
                 <div className="absolute -inset-5 rounded-full border border-indigo-500/20 animate-pulse delay-100"></div>
                 <div className="absolute -inset-8 rounded-full border border-cyan-500/10 animate-ping delay-200 duration-1000"></div>
              </div>
            </div>
            
            <h3 className="text-white font-bold text-lg tracking-wide flex items-center gap-2">
               Advocate LawBot360
               <span className="text-xs font-normal text-slate-400 font-mono">(Voice Counsel)</span>
            </h3>
            
            <div className="flex items-center gap-2 mt-2 bg-slate-900/90 px-3.5 py-1.5 rounded-full border border-slate-800">
               <Mic className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
               <p className="text-xs font-medium text-slate-300">
                 Listening & streaming live. Ask about any legal right, arrest, or constitutional article.
               </p>
            </div>

            {/* Active Grounding Notification Card */}
            {activeGrounding && (
              <div className="w-full max-w-lg mt-5 p-3.5 rounded-xl bg-slate-900/90 border border-blue-500/30 backdrop-blur-md shadow-lg shadow-blue-950/50">
                <div className="flex items-center justify-between text-xs font-semibold text-blue-400 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    {activeGrounding.title}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase">Verbatim Source</span>
                </div>
                
                <div className="space-y-1">
                  {activeGrounding.articles?.map((artStr, idx) => (
                    <div key={idx} className="text-xs text-slate-200 font-medium flex items-center gap-1.5">
                      <BookCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                      {artStr}
                    </div>
                  ))}
                </div>

                {activeGrounding.cases && activeGrounding.cases.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Gavel className="w-3 h-3 text-purple-400 shrink-0" />
                    <span className="text-slate-300 font-medium">Precedents:</span> {activeGrounding.cases.join(', ')}
                  </div>
                )}
              </div>
            )}

            {/* Live Citations Pill Tray */}
            {recentCitations.length > 0 && (
              <div className="w-full max-w-lg mt-3 flex flex-wrap items-center justify-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
                  Citations:
                </span>
                {recentCitations.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedArticleDetail(constitutionKnowledgeService.getArticle(c.artNo))}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-blue-300 hover:text-white border border-slate-700 hover:border-blue-500 text-[11px] font-mono transition-colors"
                  >
                    <BookOpen className="w-3 h-3 text-blue-400" />
                    Art {c.artNo}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Controls */}
          <div className="p-4 bg-slate-950/90 backdrop-blur-md border-t border-slate-800/80 flex items-center justify-between gap-4">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Speak freely in English, Hindi, or Hinglish
            </div>

            <button 
              onClick={endConsultation}
              className="group px-6 py-2.5 bg-red-500/10 hover:bg-red-500 border border-red-500/30 hover:border-red-500 text-red-500 hover:text-white rounded-full text-sm font-semibold transition-all flex items-center gap-2 shadow-lg shadow-red-500/5 hover:shadow-red-500/25 active:scale-95"
            >
              <Phone className="w-4 h-4 rotate-135 transition-transform group-hover:rotate-0" />
              End Call & View Report
            </button>
          </div>
        </div>
      )}
      
      {/* Article Detail Drawer Modal */}
      {selectedArticleDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-200 p-6">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  Article {selectedArticleDetail.ArtNo} • Part {selectedArticleDetail.PartNo}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-2">
                  {selectedArticleDetail.Name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{selectedArticleDetail.category}</p>
              </div>
              <button 
                onClick={() => setSelectedArticleDetail(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 text-sm text-slate-700 leading-relaxed font-serif bg-slate-50 p-4 rounded-xl border border-slate-200">
              {selectedArticleDetail.ArtDesc}
            </div>

            {selectedArticleDetail.landmark_cases && selectedArticleDetail.landmark_cases.length > 0 && (
              <div className="mt-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Gavel className="w-3.5 h-3.5 text-purple-600" />
                  Landmark Supreme Court Precedents
                </h4>
                <div className="space-y-1.5">
                  {selectedArticleDetail.landmark_cases.map((c, i) => (
                    <div key={i} className="text-xs text-slate-700 bg-purple-50/60 p-2 rounded-md border border-purple-100 font-medium">
                      • {c}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedArticleDetail(null)}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800"
              >
                Close Reference
              </button>
            </div>
          </div>
        </div>
      )}

      <ConsultationReport
        isOpen={showConsultationReport}
        onClose={() => setShowConsultationReport(false)}
        conversationData={sessionTranscript}
      />
    </div>
  );
};

export default GeminiLiveLawyer;
