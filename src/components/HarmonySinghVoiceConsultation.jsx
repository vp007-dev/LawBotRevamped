import React, { useState, useEffect, useRef } from 'react';
import { Scale, User, Phone, Mic, ShieldCheck, X, Activity } from 'lucide-react';
import ConsultationReport from './ConsultationReport';

const HarmonySinghVoiceConsultation = () => {
  const [status, setStatus] = useState('idle');
  const [showConsultationReport, setShowConsultationReport] = useState(false);
  const [audioTranscript, setAudioTranscript] = useState('');
  const recognitionRef = useRef(null);

  const startConsultation = () => {
    setStatus('connecting');
    startBackgroundRecording();
    setTimeout(() => {
      setStatus('connected');
    }, 2000);
  };

  const endConsultation = () => {
    stopBackgroundRecording();
    setShowConsultationReport(true);
    setStatus('idle');
  };

  const startBackgroundRecording = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setAudioTranscript(transcript);
      };
      
      recognitionRef.current.start();
    }
  };

  const stopBackgroundRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  // Render logic based on status
  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden transition-all duration-300">
      
      {/* IDLE STATE */}
      {status === 'idle' && (
        <div className="p-5">
          <div className="flex items-start gap-4">
            {/* Avatar Section */}
            <div className="relative shrink-0">
              <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200">
                <User className="w-6 h-6 text-slate-500" />
              </div>
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></div>
            </div>

            {/* Info Section */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">Harmony Singh</h3>
                  <p className="text-xs text-indigo-600 font-medium mt-1">AI Legal Consultant • Indian Law</p>
                </div>
                <div className="bg-slate-50 text-slate-500 text-[10px] font-semibold px-2 py-1 rounded border border-slate-200 uppercase tracking-wide">
                  Virtual
                </div>
              </div>

              <p className="text-sm text-slate-500 mt-2 leading-relaxed line-clamp-2">
                Specialized in Consumer Law, Property Rights, and Civil Matters. Available for instant voice guidance.
              </p>
              
              {/* Tags */}
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-50 text-slate-600 text-xs border border-slate-100">
                  <Scale className="w-3 h-3" /> Legal Advice
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-50 text-slate-600 text-xs border border-slate-100">
                  <ShieldCheck className="w-3 h-3" /> Private
                </span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <button
              onClick={startConsultation}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors duration-200"
            >
              <Phone className="w-4 h-4" />
              Start Voice Consultation
            </button>
          </div>
        </div>
      )}

      {/* CONNECTING STATE */}
      {status === 'connecting' && (
        <div className="p-8 flex flex-col items-center justify-center text-center min-h-[280px]">
          <div className="relative mb-4">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center z-10 relative">
               <Scale className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="absolute inset-0 border-2 border-indigo-600 rounded-full animate-ping opacity-20"></div>
            <div className="absolute inset-0 border-2 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <h3 className="text-sm font-bold text-slate-900">Establishing Connection...</h3>
          <p className="text-xs text-slate-500 mt-1">Securing communication line</p>
        </div>
      )}

      {/* CONNECTED STATE */}
      {status === 'connected' && (
        <div className="relative bg-slate-900 min-h-[280px] flex flex-col justify-between">
          
          {/* Header */}
          <div className="px-5 py-4 flex justify-between items-center border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
              <span className="text-xs font-medium text-slate-300">Live Session</span>
            </div>
            <span className="text-xs text-slate-500 font-mono">00:00</span>
          </div>

          {/* Main Visual */}
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4 relative ring-1 ring-slate-700">
               <User className="w-8 h-8 text-slate-400" />
               {/* Audio Wave Visualizer Simulation */}
               <div className="absolute -inset-1 rounded-full border border-indigo-500/30 animate-pulse"></div>
               <div className="absolute -inset-3 rounded-full border border-indigo-500/10 animate-pulse delay-75"></div>
            </div>
            
            <h3 className="text-white font-semibold text-base">Harmony Singh</h3>
            <div className="flex items-center gap-2 mt-2">
               <Activity className="w-3 h-3 text-indigo-400" />
               <p className="text-xs text-indigo-300">Listening...</p>
            </div>
          </div>

          {/* Footer / Controls */}
          <div className="p-4 bg-slate-800/50 backdrop-blur border-t border-slate-800 flex justify-center gap-4">
            <button className="p-3 rounded-full bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors">
               <Mic className="w-5 h-5" />
            </button>
            <button 
              onClick={endConsultation}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full text-sm font-semibold transition-colors flex items-center gap-2"
            >
              <Phone className="w-4 h-4 rotate-135" />
              End Call
            </button>
          </div>
        </div>
      )}
      
      {/* Consultation Report Modal */}
      <ConsultationReport
        isOpen={showConsultationReport}
        onClose={() => setShowConsultationReport(false)}
        conversationData={audioTranscript}
      />
    </div>
  );
};

export default HarmonySinghVoiceConsultation;