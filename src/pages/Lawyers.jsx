import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, Mic, Clock, Star, Users, Phone, Shield, CheckCircle, Activity, ChevronRight, Menu, User, Sparkles } from 'lucide-react';
import ElevenLabsWidget from '../components/ElevenLabsWidget';
import GeminiTTSLawyer from '../components/GeminiTTSLawyer';
import GeminiLiveLawyer from '../components/GeminiLiveLawyer';
import HarmonySinghVoiceConsultation from '../components/HarmonySinghVoiceConsultation';
import ConsultationReport from '../components/ConsultationReport';
import sharedMicService from '../services/sharedMicService';
import Sidebar from '../components/Sidebar';
import GenderDrawer from '../components/GenderDrawer';

const AILawyerCard = ({ onConsultationToggle }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showGenderDrawer, setShowGenderDrawer] = useState(false);
  const [showConsultationReport, setShowConsultationReport] = useState(false);
  const [audioTranscript, setAudioTranscript] = useState('');
  const [selectedGender, setSelectedGender] = useState(() => {
    return localStorage.getItem('lawbot-gender') || 'male';
  });
  const widgetRef = useRef(null);
  const recognitionRef = useRef(null);

  const handleGenderChange = (gender) => {
    setSelectedGender(gender);
    localStorage.setItem('lawbot-gender', gender);
    setShowGenderDrawer(false);
    
    // If connected, restart with new gender
    if (isConnected) {
      stopVoiceAgent();
      setTimeout(() => startVoiceAgent(), 500);
    }
  };

  const startVoiceAgent = async () => {
    if (isConnected) {
      sharedMicService.removeConsumer('background-transcript');
      setShowConsultationReport(true);
      stopVoiceAgent();
      return;
    }

    try {
      setIsConnected(true);
      onConsultationToggle?.(true);
      
      // Add background transcription consumer
      await sharedMicService.addConsumer('background-transcript', (transcript) => {
        setAudioTranscript(transcript);
      });
      
      loadElevenLabsWidget();
    } catch (error) {
      console.error('Failed to start voice agent:', error);
      setIsConnected(false);
      onConsultationToggle?.(false);
    }
  };

  const loadElevenLabsWidget = () => {
    if (!document.querySelector('script[src*="convai-widget-embed"]')) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
      script.async = true;
      script.type = 'text/javascript';
      document.head.appendChild(script);
      
      script.onload = () => {
        setTimeout(() => createWidget(), 1000);
      };
    } else {
      createWidget();
    }
  };

  const createWidget = () => {
    if (widgetRef.current) {
      widgetRef.current.innerHTML = '';
      
      const agentId = selectedGender === 'female' 
        ? import.meta.env.VITE_FEMALE_AGENT_ID 
        : import.meta.env.VITE_ELEVENLABS_AGENT_ID;
      
      const widget = document.createElement('elevenlabs-convai');
      widget.setAttribute('agent-id', agentId);
      widget.style.cssText = `
        width: 100%;
        height: 400px;
        border: none;
        border-radius: 12px;
        display: block;
      `;
      
      widgetRef.current.appendChild(widget);
      setIsListening(true);
    }
  };

  const stopVoiceAgent = () => {
    setIsConnected(false);
    setIsListening(false);
    onConsultationToggle?.(false);
    sharedMicService.removeConsumer('background-transcript');
    if (widgetRef.current) {
      widgetRef.current.innerHTML = '';
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl transition-all duration-500 ${
      isConnected 
        ? 'bg-[#141721] border-2 border-purple-500 shadow-[0_0_35px_rgba(168,85,247,0.25)]' 
        : 'bg-[#161922] border border-white/[0.08] shadow-xl hover:border-purple-500/40'
    }`}>
      {/* Background Decor for Active State */}
      {isConnected && (
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-15 animate-pulse"></div>
      )}

      <div className="p-7 relative z-10">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className={`w-13 h-13 rounded-2xl flex items-center justify-center transition-colors border ${
              isConnected 
                ? 'bg-purple-600 text-white border-purple-400 shadow-lg shadow-purple-600/30' 
                : 'bg-[#141721] text-purple-400 border-white/[0.08]'
            }`}>
              {isConnected ? <Activity className="w-6 h-6 animate-pulse" /> : <Bot className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  AI Legal Associate
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  Real-Time
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isConnected ? 'Session Active • Direct Mic Stream' : 'Powered by Legal LLM & Gemini Engine'}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {selectedGender === 'female' ? 'Female Counsel' : 'Male Counsel'} Active
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Gender Selection Button */}
            <button
              onClick={() => setShowGenderDrawer(true)}
              className="p-2 rounded-xl bg-[#141721] text-slate-400 hover:text-white border border-white/[0.08] hover:border-purple-500/30 transition-all text-xs flex items-center gap-1.5"
              title="Choose Voice Persona"
            >
              <User className="w-3.5 h-3.5 text-purple-400" />
              <span className="capitalize text-[11px]">{selectedGender}</span>
            </button>
          </div>
        </div>

        {/* Feature Tags - Only show when inactive to reduce clutter during call */}
        {!isConnected && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="flex items-center gap-2.5 text-xs text-slate-300 bg-[#141721] p-3 rounded-xl border border-white/[0.06]">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              <span>Available 24/7/365</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-300 bg-[#141721] p-3 rounded-xl border border-white/[0.06]">
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              <span>Privileged Encryption</span>
            </div>
          </div>
        )}

        {/* Main Interaction Area */}
        <div className="space-y-3">
          <button
            onClick={startVoiceAgent}
            className={`group w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-medium text-sm transition-all duration-200 transform active:scale-95 shadow-sm ${
              isConnected
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 hover:bg-rose-600 hover:text-white shadow-rose-900/20'
                : 'bg-violet-600 hover:bg-violet-500 text-white shadow-sm hover:-translate-y-0.5'
            }`}
          >
            {isConnected ? (
              <>
                <Phone className="w-4 h-4 rotate-135" />
                End Consultation & Generate Report
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 group-hover:scale-110 transition-transform" />
                Start Voice Consultation
              </>
            )}
          </button>

          {/* Connection Status Text */}
          <div className="text-center text-xs font-medium text-slate-500">
            {isConnected 
              ? 'Voice connection established. Speak naturally in English, Hindi, or regional languages.' 
              : 'Tap to start a real-time conversational legal consultation.'}
          </div>
        </div>
      </div>

      {/* Widget Container - Smooth Expand */}
      <div 
        className={`transition-[max-height, opacity] duration-700 ease-in-out overflow-hidden ${
          isConnected ? 'max-h-[500px] opacity-100 border-t border-white/[0.08]' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-[#0c0e14] p-4">
           <div ref={widgetRef} />
           <div className="hidden"><ElevenLabsWidget /></div>
        </div>
      </div>
      
      {/* Gender Selection Drawer */}
      <GenderDrawer
        isOpen={showGenderDrawer}
        onClose={() => setShowGenderDrawer(false)}
        selectedGender={selectedGender}
        onGenderChange={handleGenderChange}
      />
      
      {/* Consultation Report Modal */}
      <ConsultationReport
        isOpen={showConsultationReport}
        onClose={() => setShowConsultationReport(false)}
        conversationData={audioTranscript}
      />
    </div>
  );
};

export default function Lawyers() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isConsultationActive, setIsConsultationActive] = useState(false);
  
  return (
    <div className="flex h-screen bg-[#0c0e14] text-[#f1f5f9] font-sans selection:bg-purple-500/30 selection:text-white">
      {!isConsultationActive && <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />}
      
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header Bar */}
        <div className="bg-[#0c0e14]/90 backdrop-blur-md border-b border-white/[0.08] px-6 py-4 flex items-center justify-between z-20">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 hover:bg-white/[0.04] rounded-lg text-slate-400">
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-0.5">
                <span>Legal Network</span>
                <span>/</span>
                <span className="text-purple-400">Advocate Directory</span>
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Find Legal Counsel
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Bar Council Verified
            </span>
          </div>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scroll-smooth">
          <div className="min-h-screen bg-[#0c0e14]">
            
            {/* Hero Subheader */}
            <div className="border-b border-white/[0.08] bg-[#141721]/50 px-6 py-8">
              <div className="max-w-6xl mx-auto">
                <div className="max-w-2xl">
                  <h2 className="text-2xl font-bold text-white tracking-tight mb-2">
                    Verified Legal Representation
                  </h2>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Deploy our 24/7 AI Legal Associate for immediate guidance, or connect directly with senior advocates from the High Court and Supreme Court bar.
                  </p>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="max-w-6xl mx-auto px-6 py-8">
              <div className="grid lg:grid-cols-12 gap-8">
                
                {/* Left Column: AI Assistants (5 cols) */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Instant AI Associates
                      </h3>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold">
                      Zero Wait Time
                    </span>
                  </div>
                  
                  {/* The enhanced AI Card */}
                  <AILawyerCard onConsultationToggle={setIsConsultationActive} />

                  {/* Gemini Live Lawyer */}
                  <div className="rounded-2xl border border-white/[0.08] overflow-hidden bg-[#161922]">
                    <GeminiLiveLawyer />
                  </div>

                  {/* Harmony Singh - Gemini AI Voice Consultation */}
                  <div className="rounded-2xl border border-white/[0.08] overflow-hidden bg-[#161922]">
                    <HarmonySinghVoiceConsultation />
                  </div>

                  {/* Why AI First callout */}
                  <div className="bg-[#141721] border border-purple-500/20 rounded-2xl p-5 flex gap-4">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0 text-purple-400">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-xs uppercase tracking-wide">Why use AI Associate First?</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Instant statutory analysis, zero hourly billing for triage, and automated case brief compilation ready for human senior counsel.
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Right Column: Verified Attorneys (7 cols) */}
                <div className="lg:col-span-7">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Verified Bar Advocates
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">Top-rated legal practitioners ready for consultation</p>
                    </div>
                    <button className="text-purple-400 text-xs font-semibold hover:text-purple-300 flex items-center gap-1 transition-colors">
                      View all 48 advocates <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid gap-4">
                    {/* Lawyer 1 */}
                    <div className="group bg-[#161922] rounded-2xl border border-white/[0.08] p-6 hover:border-purple-500/40 hover:bg-[#1a1e2b] transition-all">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/25 flex items-center justify-center flex-shrink-0">
                           <span className="text-lg font-bold text-violet-300">RK</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <h4 className="text-base font-bold text-white group-hover:text-purple-400 transition-colors">
                                Adv. Rajesh Kumar
                              </h4>
                              <p className="text-xs text-slate-400 font-medium">Senior Counsel • Consumer & Corporate Law</p>
                            </div>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Available Now
                            </span>
                          </div>
                          
                          <div className="mt-3 flex items-center gap-5 text-xs text-slate-400">
                            <div className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-purple-400" />
                              <span>15+ Years Bar Exp.</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                              <span>4.8 (120 reviews)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-5 pt-4 border-t border-white/[0.06] flex justify-end gap-3">
                         <button className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-white/[0.04] rounded-xl transition-colors border border-transparent hover:border-white/[0.08]">
                           View Full Profile
                         </button>
                         <button className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium rounded-xl transition-all shadow-sm flex items-center gap-2">
                           <Phone className="w-3.5 h-3.5" /> Book Consultation
                         </button>
                      </div>
                    </div>

                    {/* Lawyer 2 */}
                    <div className="group bg-[#161922] rounded-2xl border border-white/[0.08] p-6 hover:border-purple-500/40 hover:bg-[#1a1e2b] transition-all">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center flex-shrink-0">
                           <span className="text-lg font-bold text-cyan-300">PS</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <h4 className="text-base font-bold text-white group-hover:text-purple-400 transition-colors">
                                Adv. Priya Sharma
                              </h4>
                              <p className="text-xs text-slate-400 font-medium">Associate • Property & RERA Specialist</p>
                            </div>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              In Court
                            </span>
                          </div>
                          
                          <div className="mt-3 flex items-center gap-5 text-xs text-slate-400">
                            <div className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-purple-400" />
                              <span>8+ Years Bar Exp.</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                              <span>4.9 (85 reviews)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-5 pt-4 border-t border-white/[0.06] flex justify-end gap-3">
                         <button className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-white/[0.04] rounded-xl transition-colors border border-transparent hover:border-white/[0.08]">
                           View Full Profile
                         </button>
                         <button className="px-4 py-2 bg-[#141721] hover:bg-white/[0.06] text-white text-xs font-semibold rounded-xl transition-all border border-white/[0.08] flex items-center gap-2">
                           <Phone className="w-3.5 h-3.5 text-purple-400" /> Schedule Callback
                         </button>
                      </div>
                    </div>
                    
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}