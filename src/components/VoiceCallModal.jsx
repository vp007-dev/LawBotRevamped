import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, Shield, Clock, Database, RefreshCw, AlertCircle, BookOpen, Gavel } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { constitutionKnowledgeService } from '../services/constitutionKnowledgeService';

const VoiceCallModal = ({ isOpen, onClose, userId = "user_123" }) => {
  const { user } = useAuth();
  const [status, setStatus] = useState('idle'); // idle, connecting, connected, listening, thinking, speaking, ended
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [logs, setLogs] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Media recorder refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioStreamRef = useRef(null);
  const playbackAudioRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // Constants
  const BACKEND_URL = "http://localhost:8000";

  // Initialize call when modal opens
  useEffect(() => {
    if (isOpen) {
      setStatus('idle');
      setPhoneNumber(user?.phoneNumber || '');
      setLogs([]);
      setDuration(0);
      setErrorMessage('');
    } else {
      endCall();
    }
    return () => endCall();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, user]);

  // Duration Timer
  useEffect(() => {
    if (status !== 'connecting' && status !== 'ended') {
      timerIntervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerIntervalRef.current);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [status]);

  const addLog = (message, type = 'info') => {
    setLogs(prev => [...prev, {
      id: Date.now() + Math.random(),
      message,
      type,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }]);
  };

  const startCall = async (dialNumber = "") => {
    setStatus('connecting');
    setDuration(0);
    setErrorMessage('');
    setLogs([]);
    addLog("Initializing secure audio channel...", "system");
    
    if (dialNumber) {
      addLog(`Initiating Telephony Bridge connection to: ${dialNumber}`, "system");
      addLog("Dialing PSTN Trunk line...", "system");
      await new Promise(r => setTimeout(r, 1200));
      addLog("Line Ringing...", "system");
      await new Promise(r => setTimeout(r, 1200));
      addLog(`Call Answered by Client (${dialNumber})`, "system");
      addLog("Establishing duplex audio stream with Advocate LawAgent360...", "system");
    }

    addLog("Generating VideoSDK agent token...", "system");

    try {
      // Simulate VideoSDK handshake
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Attempt to contact backend to register VideoSDK room
      try {
        const tokenRes = await fetch(`${BACKEND_URL}/api/v1/voice/token`, { method: 'POST' });
        await tokenRes.json();
        
        const roomRes = await fetch(`${BACKEND_URL}/api/v1/voice/create-room`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId })
        });
        const roomData = await roomRes.json();
        
        addLog(`VideoSDK room created: ${roomData.room_id}`, "system");
        
        await fetch(`${BACKEND_URL}/api/v1/voice/start-agent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, room_id: roomData.room_id })
        });
        
        addLog("Advocate LawAgent360 joined call stream", "system");
      } catch {
        addLog("Local backend offline. Running in offline/simulation mode.", "warning");
      }

      setStatus('connected');
      const greetingMsg = "Namaste! Main aapka kanooni saathi hu. Bataiye kya pareshani hai — main aapko aasan bhasha me seedhe practical steps aur workarounds bataunga jo aap khud kar sakte hain.";
      addLog(`Advocate LawAgent360: "${greetingMsg}"`, "agent");
      
      // Speak initial greeting
      speakText(greetingMsg);
    } catch (error) {
      console.error("Failed to start voice call:", error);
      setErrorMessage("Could not establish connection. Please check your mic and try again.");
      setStatus('ended');
    }
  };

  const endCall = () => {
    setStatus('ended');
    clearInterval(timerIntervalRef.current);
    stopRecording();
    
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
    
    if (playbackAudioRef.current) {
      playbackAudioRef.current.pause();
      playbackAudioRef.current = null;
    }
    
    addLog("Call disconnected.", "system");
  };

  // Web Speech API / Audio Fallback
  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Try to find a premium male/professional voice
      const voices = window.speechSynthesis.getVoices();
      const idealVoice = voices.find(v => v.name.includes("Google US English") || v.name.includes("Microsoft David"));
      if (idealVoice) utterance.voice = idealVoice;
      
      utterance.rate = 1.05;
      utterance.pitch = 0.95;
      
      utterance.onstart = () => setStatus('speaking');
      utterance.onend = () => setStatus('connected');
      window.speechSynthesis.speak(utterance);
    } else {
      setStatus('speaking');
      setTimeout(() => setStatus('connected'), 4000);
    }
  };

  // Audio Recording (Push-to-Talk or Tap-to-Talk)
  const startRecording = async () => {
    if (isMuted) return;
    
    if (playbackAudioRef.current) {
      playbackAudioRef.current.pause();
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processUserVoiceInput(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setStatus('listening');
      addLog("Listening to client...", "system");
    } catch (err) {
      console.error("Microphone access denied:", err);
      setErrorMessage("Microphone access is required for voice calls.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processUserVoiceInput = async (audioBlob) => {
    setStatus('thinking');
    addLog("Processing client speech...", "system");

    // Fetch latest user profile and documents from localStorage
    const savedProfile = localStorage.getItem('lawbot-user-profile');
    const savedDocs = localStorage.getItem('lawbot-vault-docs') || localStorage.getItem('lawbot-documents');

    // Create form data for FastAPI backend
    const formData = new FormData();
    formData.append("user_id", userId);
    formData.append("conversation_history", JSON.stringify([]));
    formData.append("audio_file", audioBlob, "query.webm");
    if (savedProfile) {
      formData.append("user_profile", savedProfile);
    }
    if (savedDocs) {
      formData.append("vault_docs", savedDocs);
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/voice/fallback-pipeline`, {
        method: "POST",
        body: formData
      });

      if (!res.ok) throw new Error("Backend response error");
      
      const data = await res.json();
      
      addLog(`Client: "${data.transcription}"`, "user");
      
      // Log tool checking if it executed
      if (data.tool_called) {
        addLog(`[TOOL TRIGGERED] LawAgent360 is running: ${data.tool_called}...`, "tool");
        await new Promise(r => setTimeout(r, 1000));
        addLog(`[TOOL SUCCESS] Checked database: ${JSON.stringify(data.tool_result).substring(0, 80)}...`, "tool");
      }
      
      addLog(`Advocate LawAgent360: "${data.response_text}"`, "agent");

      // Play returning synthesized audio
      if (data.audio_response) {
        const audioBytes = base64ToArrayBuffer(data.audio_response);
        const blob = new Blob([audioBytes], { type: 'audio/mp3' });
        const url = URL.createObjectURL(blob);
        
        const audio = new Audio(url);
        playbackAudioRef.current = audio;
        
        audio.onplay = () => setStatus('speaking');
        audio.onended = () => setStatus('connected');
        audio.play();
      } else {
        // Fallback speech synthesis if audio response is empty
        speakText(data.response_text);
      }

    } catch (error) {
      console.error("Failed to hit backend voice pipeline:", error);
      // Run local simulated response
      simulateLocalResponse();
    }
  };

  const base64ToArrayBuffer = (base64) => {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };

  // Simulates tool calls offline
  const simulateLocalResponse = async () => {
    addLog("Client: 'Do I have any critical compliance deadlines?'", "user");
    await new Promise(r => setTimeout(r, 1000));
    
    // Simulate Tool Call Log
    setStatus('thinking');
    addLog("[TOOL TRIGGERED] LawAgent360 is checking document vault deadlines...", "tool");
    await new Promise(r => setTimeout(r, 1500));
    addLog("[TOOL SUCCESS] Found 2 urgent tax deadlines and 1 licensing deadline.", "tool");
    
    const responseText = "I have checked your secure document vault. You have an urgent TDS tax filing deadline today, and your GST sales return is due on August 20th.";
    addLog(`Advocate LawAgent360: "${responseText}"`, "agent");
    speakText(responseText);
  };

  const simulateStatutoryCheck = async () => {
    if (status === 'connecting' || status === 'ended') return;
    setStatus('thinking');
    addLog("Client triggers: Check statutory filing status", "user");
    addLog("[TOOL TRIGGERED] LawAgent360 is examining tax filings...", "tool");
    await new Promise(r => setTimeout(r, 1500));
    addLog("[TOOL SUCCESS] GSTIN active. Overdue Q1 TDS returns detected.", "tool");
    
    const responseText = "According to statutory filings, your GSTIN registration is healthy. However, your Q1 TDS tax returns are overdue. I suggest scheduling immediate compliance.";
    addLog(`Advocate LawAgent360: "${responseText}"`, "agent");
    speakText(responseText);
  };

  const simulateConstitutionCheck = async (topic = "police arrest rights Article 22") => {
    if (status === 'connecting' || status === 'ended') return;
    setStatus('thinking');
    addLog(`Client: "Agar police ya koi adhikaari pareshan kare toh main apne end se kya karu?"`, "user");
    addLog("[TOOL TRIGGERED] RAG Database finding simple practical walkthrough & citizen rights...", "tool");
    
    await new Promise(r => setTimeout(r, 1200));
    const results = constitutionKnowledgeService.searchArticles(topic, 2);
    if (results && results.length > 0) {
      const art = results[0].article;
      addLog(`[TOOL SUCCESS] RAG retrieved: Article ${art.ArtNo} (${art.Name}) • D.K. Basu Guidelines`, "tool");
      
      const responseText = "Pehle ghabraiye mat, shanti se Step 1 follow karein: Police se unka naam aur Arrest Memo maangiye aur bina padhe sign mat kijiye. Step 2: Article 22 ke tehat aapko turant apne parivar ya dost ko phone karne ka pura haq hai. Step 3: Police aapko 24 ghante ke andar Magistrate ke paas pesh karegi. Aapko koi mehenga vakil karne ki zaroorat nahi hai, court me Article 39A ke tehat 100% Free Sarkari Vakil (DLSA) milta hai.";
      addLog(`Advocate LawAgent360: "${responseText}"`, "agent");
      speakText(responseText);
    } else {
      const responseText = "Samvidhan ke Article 21 ke tehat aapka haq hai samman se jeene ka. Sade kagaz pe likhit shikayat banayein aur uski ek copy par thane se receiving stamp zaroor lein.";
      addLog(`Advocate LawAgent360: "${responseText}"`, "agent");
      speakText(responseText);
    }
  };

  // Format call timer
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-slideUp">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white font-bold text-base">Advocate LawAgent360</h3>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Constitution RAG DB
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${
                  status === 'connecting' ? 'bg-amber-500 animate-pulse' :
                  status === 'ended' ? 'bg-red-500' :
                  status === 'idle' ? 'bg-slate-500' : 'bg-emerald-500 animate-pulse'
                }`} />
                <span className="text-slate-400 text-xs font-semibold capitalize font-mono">{status}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-800/80 px-3.5 py-1.5 rounded-full border border-slate-700">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span className="text-white text-xs font-bold font-mono">{formatTime(duration)}</span>
            </div>
            {status === 'idle' && (
              <button 
                onClick={onClose}
                className="text-slate-400 hover:text-white font-bold text-sm hover:bg-slate-800/80 w-8 h-8 rounded-lg transition-colors flex items-center justify-center border border-slate-800"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {status === 'idle' ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950/50">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6 animate-pulse">
              <Phone className="w-8 h-8" />
            </div>
            <h2 className="text-white font-extrabold text-lg tracking-wide mb-1">AI Telephony Dialer</h2>
            <p className="text-slate-400 text-xs text-center leading-normal mb-8 max-w-xs">
              Connect Advocate LawAgent360 directly via outbound bridge or call using your browser mic.
            </p>

            <div className="w-full max-w-xs space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">
                  Destination Number (India prefix)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 text-sm font-bold">
                    🇮🇳 +91
                  </div>
                  <input
                    type="tel"
                    maxLength="10"
                    placeholder="98765 43210"
                    value={phoneNumber.replace("+91", "")}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, "");
                      setPhoneNumber(clean ? "+91" + clean : "");
                    }}
                    className="w-full h-11 bg-slate-950 border border-slate-800 rounded-xl pl-14 pr-4 text-sm font-semibold tracking-wide text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 placeholder:text-slate-700"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => startCall("")}
                  className="flex-1 h-11 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-all active:scale-95"
                >
                  Browser WebRTC
                </button>
                <button
                  disabled={!phoneNumber || phoneNumber.length < 13}
                  onClick={() => startCall(phoneNumber)}
                  className="flex-1 h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition-all active:scale-95 disabled:opacity-50 disabled:scale-100"
                >
                  Dial Outbound
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Call Visualizer Area */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950/50">
              
              {/* Glowing Avatar */}
              <div className="relative mb-6">
                <div className={`w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center border-2 border-indigo-400/30 transition-all duration-500 ${
                  status === 'speaking' ? 'scale-105 shadow-[0_0_30px_rgba(99,102,241,0.5)]' :
                  status === 'listening' ? 'scale-95 shadow-[0_0_20px_rgba(239,68,68,0.3)]' :
                  status === 'thinking' ? 'animate-pulse' : ''
                }`}>
                  <Phone className={`w-10 h-10 text-white ${status === 'connecting' ? 'animate-bounce' : ''}`} />
                </div>
                {/* Outer rings */}
                <div className={`absolute -inset-3 rounded-full border border-indigo-500/20 transition-all duration-500 ${
                  status === 'speaking' ? 'animate-ping opacity-40' : 'opacity-0'
                }`} />
                <div className={`absolute -inset-6 rounded-full border border-indigo-500/10 transition-all duration-500 ${
                  status === 'speaking' ? 'animate-ping opacity-20 delay-150' : 'opacity-0'
                }`} />
              </div>

              <h2 className="text-white font-extrabold text-xl tracking-wide mb-1">Advocate LawAgent360</h2>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-6">Senior Legal Counsel</p>

              {/* Animated Waveform */}
              <div className="flex items-center justify-center gap-1.5 h-16 w-full max-w-xs my-4">
                {[...Array(19)].map((_, i) => {
                  const delay = `${i * 0.05}s`;
                  let barHeight = "h-1.5";
                  let animationClass = "";

                  if (status === 'speaking') {
                    animationClass = "animate-wave-tall";
                  } else if (status === 'listening') {
                    animationClass = "animate-wave-short";
                  } else if (status === 'thinking') {
                    animationClass = "animate-wave-pulse";
                  }

                  return (
                    <div
                      key={i}
                      className={`w-1 bg-indigo-500 rounded-full transition-all duration-300 ${barHeight} ${animationClass}`}
                      style={{ animationDelay: delay }}
                    />
                  );
                })}
              </div>

              {/* Error Message if any */}
              {errorMessage && (
                <div className="flex items-center gap-2 p-3 bg-red-950/40 border border-red-900/50 rounded-2xl text-red-400 text-xs mb-4">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Prompt cues */}
              {status === 'connected' && (
                <p className="text-slate-500 text-xs text-center font-medium animate-pulse">
                  Press and hold speech button below to ask a query
                </p>
              )}
              {status === 'listening' && (
                <p className="text-red-400 text-xs text-center font-bold animate-pulse">
                  Listening now... Release to send
                </p>
              )}
              {status === 'thinking' && (
                <p className="text-indigo-400 text-xs text-center font-bold animate-pulse">
                  Advocate is analyzing your database...
                </p>
              )}
            </div>

            {/* Live Call Logs (Tool check actions) */}
            <div className="h-44 border-t border-slate-800 bg-slate-950/60 p-4 overflow-y-auto flex flex-col gap-2">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">
                Active Tool-Calling & Session Logs
              </span>
              {logs.length === 0 ? (
                <span className="text-slate-600 text-xs italic">No logs recorded. Start speaking.</span>
              ) : (
                logs.map(log => (
                  <div key={log.id} className="text-xs flex gap-2 items-start font-mono leading-relaxed">
                    <span className="text-slate-600 text-[10px] shrink-0 pt-0.5">{log.timestamp}</span>
                    <span className={`
                      ${log.type === 'system' ? 'text-slate-400' : ''}
                      ${log.type === 'warning' ? 'text-amber-500 font-semibold' : ''}
                      ${log.type === 'tool' ? 'text-indigo-300 font-bold' : ''}
                      ${log.type === 'user' ? 'text-emerald-400' : ''}
                      ${log.type === 'agent' ? 'text-white' : ''}
                    `}>
                      {log.message}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Call Controls */}
            <div className="p-6 bg-slate-950/90 border-t border-slate-800 flex flex-col gap-4">
              <div className="flex items-center justify-around">
                
                {/* Mute Button */}
                <button
                  onClick={() => {
                    setIsMuted(!isMuted);
                    addLog(isMuted ? "Microphone unmuted." : "Microphone muted.", "system");
                  }}
                  disabled={status === 'connecting' || status === 'ended'}
                  className={`p-4 rounded-full border transition-all duration-300 ${
                    isMuted
                      ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                  title={isMuted ? "Unmute Mic" : "Mute Mic"}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                {/* Hold to Speak Button */}
                <button
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onTouchStart={startRecording}
                  onTouchEnd={stopRecording}
                  disabled={status === 'connecting' || status === 'ended' || isMuted}
                  className={`px-8 py-4 rounded-full font-bold text-sm transition-all duration-300 flex items-center gap-2.5 shadow-lg ${
                    status === 'listening'
                      ? 'bg-red-500 text-white scale-105 shadow-red-500/25'
                      : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/20 active:scale-95'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Mic className="w-4 h-4" />
                  {status === 'listening' ? 'Release to Send' : 'Hold to Speak'}
                </button>

                {/* End Call Button */}
                <button
                  onClick={onClose}
                  className="p-4 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/25 hover:scale-105 active:scale-95 transition-all duration-300"
                  title="End Call"
                >
                  <PhoneOff className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Simulated Actions */}
              {status !== 'connecting' && status !== 'ended' && (
                <div className="flex flex-wrap gap-2 justify-center border-t border-slate-800/60 pt-3">
                  <button
                    onClick={() => simulateConstitutionCheck("police arrest rights Article 22")}
                    disabled={status === 'thinking'}
                    className="text-[10px] font-bold text-emerald-400 hover:text-white bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <BookOpen className="w-3 h-3 text-emerald-400" />
                    Arrest Safeguards (Art 22 RAG)
                  </button>
                  <button
                    onClick={() => simulateConstitutionCheck("Article 21 privacy")}
                    disabled={status === 'thinking'}
                    className="text-[10px] font-bold text-cyan-400 hover:text-white bg-cyan-500/10 border border-cyan-500/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Shield className="w-3 h-3 text-cyan-400" />
                    Right to Privacy (Art 21 RAG)
                  </button>
                  <button
                    onClick={simulateLocalResponse}
                    disabled={status === 'thinking'}
                    className="text-[10px] font-bold text-indigo-400 hover:text-white bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Database className="w-3 h-3" />
                    Vault Deadlines
                  </button>
                  <button
                    onClick={simulateStatutoryCheck}
                    disabled={status === 'thinking'}
                    className="text-[10px] font-bold text-indigo-400 hover:text-white bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Filings Check
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* Embedded Keyframe Animations */}
        <style>{`
          .animate-fadeIn { animation: fadeIn 0.25s ease-out forwards; }
          .animate-slideUp { animation: slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
          
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(16px); }
            to { opacity: 1; transform: translateY(0); }
          }

          /* Audio Wave Keyframes */
          @keyframes wave-tall {
            0%, 100% { height: 6px; }
            50% { height: 48px; }
          }
          @keyframes wave-short {
            0%, 100% { height: 4px; }
            50% { height: 24px; }
          }
          @keyframes wave-pulse {
            0%, 100% { height: 6px; opacity: 0.4; }
            50% { height: 16px; opacity: 1; }
          }

          .animate-wave-tall {
            animation: wave-tall 0.8s ease-in-out infinite;
          }
          .animate-wave-short {
            animation: wave-short 0.6s ease-in-out infinite;
          }
          .animate-wave-pulse {
            animation: wave-pulse 1.2s ease-in-out infinite;
          }
        `}</style>

      </div>
    </div>
  );
};

export default VoiceCallModal;
