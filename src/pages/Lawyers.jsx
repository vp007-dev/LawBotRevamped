import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, Mic, Clock, Star, Users, Phone, Shield, CheckCircle, Activity, ChevronRight, Menu, User } from 'lucide-react';
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
        ? 'bg-slate-900 border-2 border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.3)]' 
        : 'bg-white border border-slate-200 shadow-xl hover:shadow-2xl'
    }`}>
      {/* Background Decor for Active State */}
      {isConnected && (
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
      )}

      <div className="p-8 relative z-10">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
              isConnected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              {isConnected ? <Activity className="w-7 h-7 animate-pulse" /> : <Bot className="w-7 h-7" />}
            </div>
            <div>
              <h3 className={`text-xl font-bold ${isConnected ? 'text-white' : 'text-slate-900'}`}>
                AI Associate
              </h3>
              <p className={`text-sm ${isConnected ? 'text-blue-200' : 'text-slate-500'}`}>
                {isConnected ? 'Session Active • Recording' : 'Powered by Advanced Legal LLM'}
              </p>
              <p className={`text-xs ${isConnected ? 'text-blue-300' : 'text-slate-400'}`}>
                {selectedGender === 'female' ? 'Female' : 'Male'} Assistant
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Gender Selection Button */}
            <button
              onClick={() => setShowGenderDrawer(true)}
              className={`p-2 rounded-lg transition-colors ${
                selectedGender === 'female' 
                  ? 'bg-purple-100 text-purple-600 hover:bg-purple-200' 
                  : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
              }`}
              title="Choose Assistant Gender"
            >
              <User className="w-4 h-4" />
            </button>
            
            
          </div>
        </div>

        {/* Feature Tags - Only show when inactive to reduce clutter during call */}
        {!isConnected && (
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

        {/* Main Interaction Area */}
        <div className="space-y-4">
          <button
            onClick={startVoiceAgent}
            className={`group w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform active:scale-95 ${
              isConnected
                ? 'bg-red-500/10 text-red-400 border border-red-500/50 hover:bg-red-500 hover:text-white'
                : 'bg-gradient-to-r from-blue-700 to-indigo-800 text-white shadow-lg hover:shadow-blue-500/25 hover:translate-y-[-2px]'
            }`}
          >
            {isConnected ? (
              <>
                <Phone className="w-5 h-5 rotate-135" />
                End Consultation
              </>
            ) : (
              <>
                <Mic className="w-5 h-5 group-hover:animate-bounce" />
                Start Free Consultation
              </>
            )}
          </button>

          {/* Connection Status Text */}
          <div className={`text-center text-xs font-medium transition-colors ${
            isConnected ? 'text-blue-300' : 'text-slate-400'
          }`}>
            {isConnected 
              ? 'Voice connection established. Speak naturally.' 
              : 'Tap to start a real-time voice conversation.'}
          </div>
        </div>
      </div>

      {/* Widget Container - Smooth Expand */}
      <div 
        className={`transition-[max-height, opacity] duration-700 ease-in-out overflow-hidden ${
          isConnected ? 'max-h-[500px] opacity-100 border-t border-slate-700' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-slate-900 p-4">
           {/* Passing the widget component exactly as requested */}
           {/* Note: In a real scenario, you might want to render ElevenLabsWidget here directly if it wraps the logic, 
               but based on your code, the ref logic is inside this component. 
               However, your original code rendered <ElevenLabsWidget /> separately. 
               To stick to your exact logic, I am rendering the ref container here. */}
           <div ref={widgetRef} />
           
           {/* If ElevenLabsWidget is a separate component needed for other reasons, keep it here */}
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
    <div className="flex h-screen bg-slate-50 font-sans">
      {!isConsultationActive && <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />}
      
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-600">
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Find Lawyers</h1>
              <p className="text-sm text-slate-500">Connect with legal professionals</p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Hero Section */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
              Find Legal Counsel
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              Choose between our instant AI legal associate for immediate guidance, or connect with our network of verified human attorneys for complex representation.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-12 gap-10">
          
          {/* Left Column: AI Assistant (Prominent - 5 columns) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider">
                New
              </span>
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                Instant Assistance
              </h2>
            </div>
            
            {/* The enhanced AI Card */}
            <AILawyerCard onConsultationToggle={setIsConsultationActive} />



            {/* Gemini Live Lawyer */}
            <div className="mt-6">
              <GeminiLiveLawyer />
            </div>

            {/* Harmony Singh - Gemini AI Voice Consultation */}
            <div className="mt-6">
              <HarmonySinghVoiceConsultation />
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex gap-4">
              <div className="bg-white p-2 rounded-full shadow-sm h-fit">
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Why use AI first?</h4>
                <p className="text-sm text-slate-600 mt-1">
                  Get immediate answers to common legal questions, draft basic summaries, and prepare for your human consultation.
                </p>
              </div>
            </div>
          </div>
          
          {/* Right Column: Human Lawyers (7 columns) */}
          <div className="lg:col-span-7">
            <div className="flex items-center justify-between mb-8">
               <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                Verified Attorneys
              </h2>
              <button className="text-blue-600 text-sm font-semibold hover:underline flex items-center gap-1">
                View all <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid gap-4">
              {/* Lawyer 1 */}
              <div className="group bg-white rounded-xl border border-slate-200 p-5 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-start gap-5">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                     <span className="text-2xl font-serif text-slate-400 font-bold">RK</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors">Adv. Rajesh Kumar</h4>
                        <p className="text-sm text-slate-500 font-medium">Senior Counsel • Consumer Law</p>
                      </div>
                      <span className="bg-green-50 text-green-700 text-xs font-bold px-2 py-1 rounded">Available</span>
                    </div>
                    
                    <div className="mt-4 flex items-center gap-6 text-sm text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span>15 Years Exp.</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Star className="w-4 h-4 text-amber-400" />
                        <span>4.8 (120 reviews)</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end gap-3">
                   <button className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900">View Profile</button>
                   <button className="px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors shadow-sm flex items-center gap-2">
                     <Phone className="w-3 h-3" /> Book Consultation
                   </button>
                </div>
              </div>

              {/* Lawyer 2 */}
              <div className="group bg-white rounded-xl border border-slate-200 p-5 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-start gap-5">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                     <span className="text-2xl font-serif text-slate-400 font-bold">PS</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors">Adv. Priya Sharma</h4>
                        <p className="text-sm text-slate-500 font-medium">Associate • Property Law</p>
                      </div>
                      <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded">Busy</span>
                    </div>
                    
                    <div className="mt-4 flex items-center gap-6 text-sm text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span>8 Years Exp.</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Star className="w-4 h-4 text-amber-400" />
                        <span>4.9 (85 reviews)</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end gap-3">
                   <button className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900">View Profile</button>
                   <button className="px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors shadow-sm flex items-center gap-2">
                     <Phone className="w-3 h-3" /> Book Consultation
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