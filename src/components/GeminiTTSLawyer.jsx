import React, { useState, useRef, useEffect } from 'react';
import { Phone, Mic, MicOff, Volume2, VolumeX, User, Clock, Star, Shield, Activity } from 'lucide-react';

const GeminiTTSLawyer = () => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [currentResponse, setCurrentResponse] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioChunks, setAudioChunks] = useState([]);
  
  const audioRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isCallActive) {
      intervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
      setCallDuration(0);
    }
    return () => clearInterval(intervalRef.current);
  }, [isCallActive]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const processAudioWithGemini = async (audioBlob) => {
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY_voice;
      const ai = new GoogleGenAI({ apiKey });

      const reader = new FileReader();
      const base64Audio = await new Promise((resolve) => {
        reader.onloadend = () => {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(audioBlob);
      });

      const transcriptionResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: audioBlob.type,
                  data: base64Audio
                }
              },
              {
                text: "Transcribe this audio. If it's Hindi or another Indian language, provide both original and English translation."
              }
            ]
          }
        ]
      });

      const transcription = transcriptionResponse.response.text();
      console.log('Transcription:', transcription);

      const legalResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `You are Adv. Harmony Singh, a professional Indian lawyer. Client said: "${transcription}". Provide legal guidance in under 100 words.`
      });

      const responseText = legalResponse.response.text();
      setCurrentResponse(responseText);
      await generateTTSResponse(responseText);

    } catch (error) {
      console.error('Error processing audio:', error);
      const fallbackResponse = 'I had trouble processing your audio. The service may be temporarily unavailable. Please try again or contact support.';
      setCurrentResponse(fallbackResponse);
      speakText(fallbackResponse);
    }
  };

  const generateTTSResponse = async (text) => {
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY_voice;
      const ai = new GoogleGenAI({ apiKey });

      const ttsResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say professionally: ${text}` }] }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Orus' }
            }
          }
        }
      });

      const audioData = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (audioData) {
        playAudio(audioData);
      } else {
        speakText(text);
      }
    } catch (error) {
      speakText(text);
    }
  };

  const playAudio = (base64Audio) => {
    if (isMuted) return;
    
    const audioBlob = new Blob([Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0))], { type: 'audio/wav' });
    const audioUrl = URL.createObjectURL(audioBlob);
    
    if (audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.play().catch(console.error);
    }
  };

  const speakText = (text) => {
    if (isMuted || !('speechSynthesis' in window)) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8;
    utterance.pitch = 0.9;
    utterance.volume = 0.9;
    
    const voices = speechSynthesis.getVoices();
    const professionalVoice = voices.find(voice => 
      (voice.lang.includes('en-IN') || voice.lang.includes('en-US')) &&
      (voice.name.includes('Male') || voice.name.includes('David') || voice.name.includes('Alex'))
    ) || voices.find(voice => voice.lang.includes('en') && !voice.name.includes('Female'));
    
    if (professionalVoice) {
      utterance.voice = professionalVoice;
    }
    
    speechSynthesis.speak(utterance);
  };

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      const chunks = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        await processAudioWithGemini(audioBlob);
        setIsRecording(false);
        setIsListening(false);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setIsListening(true);
      
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }, 10000);
      
    } catch (error) {
      console.error('Microphone error:', error);
      setCurrentResponse('Please allow microphone access.');
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const startCall = async () => {
    setIsCallActive(true);
    const welcomeMessage = 'Hello! I am Adv. Harmony Singh. Please click the microphone and speak your legal question in any language - Hindi, English, or any Indian language.';
    setCurrentResponse(welcomeMessage);
    speakText(welcomeMessage);
  };

  const endCall = () => {
    setIsCallActive(false);
    setIsListening(false);
    setIsRecording(false);
    setCurrentResponse('');
    
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl transition-all duration-500 ${
      isCallActive 
        ? 'bg-slate-900 border-2 border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.3)]' 
        : 'bg-white border border-slate-200 shadow-xl hover:shadow-2xl'
    }`}>
      {/* Background Decor for Active State */}
      {isCallActive && (
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
      )}

      <div className="p-8 relative z-10">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
              isCallActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              {isCallActive ? <Activity className="w-7 h-7 animate-pulse" /> : <User className="w-7 h-7" />}
            </div>
            <div>
              <h3 className={`text-xl font-bold ${isCallActive ? 'text-white' : 'text-slate-900'}`}>
                Adv. Harmony Singh
              </h3>
              <p className={`text-sm ${isCallActive ? 'text-blue-200' : 'text-slate-500'}`}>
                {isCallActive ? 'Session Active • Recording' : 'AI-Powered Legal Consultation'}
              </p>
            </div>
          </div>
          
          {!isCallActive && (
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1 text-amber-500 bg-amber-50 px-2 py-1 rounded-full border border-amber-100">
                <Star className="w-3 h-3 fill-current" />
                <span className="text-xs font-bold">4.9</span>
              </div>
              <span className="text-xs text-slate-400 mt-1">1k+ calls</span>
            </div>
          )}
        </div>

        {/* Feature Tags - Only show when inactive */}
        {!isCallActive && (
          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-2 rounded-lg">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Available 24/7</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-2 rounded-lg">
              <Shield className="w-4 h-4 text-blue-600" />
              <span>Privileged Encryption</span>
            </div>
          </div>
        )}

        {/* Recording Interface - Show when call is active */}
        {isCallActive && (
          <div className="bg-slate-800/50 rounded-xl p-6 mb-6 border border-slate-700">
            <div className="flex items-center justify-center gap-6 mb-4">
              <button
                onClick={isRecording ? stopAudioRecording : startAudioRecording}
                className={`p-4 rounded-full transition-all ${
                  isRecording 
                    ? 'bg-red-500 text-white animate-pulse shadow-red-500/25 shadow-lg' 
                    : 'bg-blue-500 text-white hover:bg-blue-600 shadow-blue-500/25 shadow-lg'
                }`}
              >
                <Mic className="w-6 h-6" />
              </button>
              <button
                onClick={toggleMute}
                className={`p-3 rounded-lg ${
                  isMuted ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                }`}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>
            
            <div className="text-center mb-4">
              <div className={`text-sm font-medium ${
                isRecording ? 'text-red-400' : 'text-blue-300'
              }`}>
                {isRecording ? 'Recording... (10s max)' : 'Click microphone to speak'}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Supports Hindi, English & all Indian languages
              </div>
            </div>

            {/* Current Response */}
            {currentResponse && (
              <div className="bg-slate-700/50 rounded-lg p-4 text-sm text-slate-200">
                <div className="font-medium text-blue-300 mb-2">Lawyer Response:</div>
                {currentResponse}
              </div>
            )}
          </div>
        )}

        {/* Main Interaction Area */}
        <div className="space-y-4">
          <button
            onClick={isCallActive ? endCall : startCall}
            className={`group w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform active:scale-95 ${
              isCallActive
                ? 'bg-red-500/10 text-red-400 border border-red-500/50 hover:bg-red-500 hover:text-white'
                : 'bg-gradient-to-r from-blue-700 to-indigo-800 text-white shadow-lg hover:shadow-blue-500/25 hover:translate-y-[-2px]'
            }`}
          >
            {isCallActive ? (
              <>
                <Phone className="w-5 h-5 rotate-135" />
                End Consultation
              </>
            ) : (
              <>
                <Mic className="w-5 h-5 group-hover:animate-bounce" />
                Start Voice Consultation
              </>
            )}
          </button>

          {/* Connection Status Text */}
          <div className={`text-center text-xs font-medium transition-colors ${
            isCallActive ? 'text-blue-300' : 'text-slate-400'
          }`}>
            {isCallActive 
              ? 'Click microphone and speak your legal question in any language.' 
              : 'Click to start a real-time voice consultation with AI lawyer'}
          </div>
        </div>
      </div>
      
      {/* Hidden audio element for TTS playback */}
      <audio ref={audioRef} style={{ display: 'none' }} />
    </div>
  );
};

export default GeminiTTSLawyer;