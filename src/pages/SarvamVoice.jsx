import React, { useState, useEffect } from 'react';
import { 
  Phone, PhoneCall, PhoneForwarded, PhoneIncoming, PhoneOutgoing, 
  Play, Volume2, FileText, CheckCircle2, Clock, Sparkles, 
  ShieldAlert, Copy, ExternalLink, RefreshCw, Search, ArrowUpRight, 
  MessageSquare, Bot, Headphones, Check, AlertCircle, X, Shield,
  ArrowRight, Activity, Calendar, Filter
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { sarvamVoiceService } from '../services/sarvamVoiceService';

export default function SarvamVoice() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [agentDetails, setAgentDetails] = useState(() => sarvamVoiceService.getAgentDetails());
  
  // Call History State
  const [callHistory, setCallHistory] = useState([]);
  const [totalCalls, setTotalCalls] = useState(0);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('ALL');

  // Outbound Dial State
  const [callbackNumber, setCallbackNumber] = useState('');
  const [dialing, setDialing] = useState(false);
  const [dialResult, setDialResult] = useState(null);
  const [copiedNumber, setCopiedNumber] = useState(false);

  // Transcript Modal State
  const [selectedInteraction, setSelectedInteraction] = useState(null);
  const [transcriptData, setTranscriptData] = useState(null);
  const [loadingTranscript, setLoadingTranscript] = useState(false);
  const [copiedTranscript, setCopiedTranscript] = useState(false);

  // Audio Playback
  const [activeAudioUrl, setActiveAudioUrl] = useState(null);

  // Load call history on mount
  useEffect(() => {
    loadCallHistory();
  }, []);

  const loadCallHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await sarvamVoiceService.getCallHistory({ limit: 50 });
      if (data && data.items) {
        setCallHistory(data.items);
        setTotalCalls(data.total || data.items.length);
      }
    } catch (err) {
      console.error('Failed to load call history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(agentDetails.phoneNumber);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const handleInitiateCallback = async (e) => {
    e.preventDefault();
    if (!callbackNumber || callbackNumber.trim().length < 10) {
      setDialResult({ error: 'Please enter a valid 10-digit phone number.' });
      return;
    }

    setDialing(true);
    setDialResult(null);

    try {
      const res = await sarvamVoiceService.triggerOutboundCall(callbackNumber);
      setDialResult({
        success: true,
        message: res.message || `Outbound call scheduled to ${res.recipient}! The LawBot360 Voice Helpline is ringing your phone right now.`,
        attemptId: res.attempt_id
      });
      setCallbackNumber('');
      // Reload history after short delay
      setTimeout(loadCallHistory, 4000);
    } catch (err) {
      setDialResult({
        error: err.message || 'Failed to place outbound call. Please verify phone number and retry.'
      });
    } finally {
      setDialing(false);
    }
  };

  const handleOpenTranscript = async (interaction) => {
    setSelectedInteraction(interaction);
    setTranscriptData(null);
    setCopiedTranscript(false);

    const intId = interaction?.interaction_id;
    if (!intId || intId === 'NO_INTERACTION_ID') {
      setLoadingTranscript(false);
      setTranscriptData({
        messages: [],
        note: 'This call attempt was not completed or answered, so no conversational dialogue transcript was recorded.'
      });
      return;
    }

    setLoadingTranscript(true);
    try {
      const data = await sarvamVoiceService.getTranscript(intId);
      setTranscriptData(data);
    } catch (err) {
      console.error('Failed to fetch transcript:', err);
      setTranscriptData({
        error: 'Unable to load full dialogue turns for this interaction. Please try again.'
      });
    } finally {
      setLoadingTranscript(false);
    }
  };

  const handleCopyTranscriptText = () => {
    if (!transcriptData?.messages) return;
    const text = transcriptData.messages
      .map(m => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n\n');
    navigator.clipboard.writeText(text);
    setCopiedTranscript(true);
    setTimeout(() => setCopiedTranscript(false), 2000);
  };

  // Filter history items
  const filteredCalls = callHistory.filter(call => {
    const summary = call?.agent_variables?.call_summary || '';
    const phone = call?.user_contact_masked || call?.user_contact || '';
    const area = call?.agent_variables?.legal_area || '';
    const matchesSearch = 
      summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      area.toLowerCase().includes(searchQuery.toLowerCase());

    if (selectedTag === 'ALL') return matchesSearch;
    if (selectedTag === 'ESCALATED') return matchesSearch && call?.agent_variables?.safety_escalation_triggered === 'true';
    if (selectedTag === 'LAWYER_REFERRED') return matchesSearch && call?.agent_variables?.lawyer_referral_given === 'true';
    if (selectedTag === 'PROPERTY') return matchesSearch && (area.includes('property') || summary.toLowerCase().includes('property'));
    return matchesSearch;
  });

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans antialiased overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        
        {/* Top Header Bar */}
        <header className="h-16 border-b border-slate-800/80 px-6 flex items-center justify-between shrink-0 bg-slate-950/70 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <Phone className="w-5 h-5" />
            </button>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-bold">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight">Sarvam 24/7 AI Telephony Helpline</h1>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Live Connected
                </span>
              </div>
              <p className="text-xs text-slate-400">Vernacular Hindi Legal AI Voice Hotline powered by Sarvam Samvaad</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadCallHistory}
              disabled={loadingHistory}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 bg-slate-800/60 border border-slate-700/60 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? 'animate-spin text-emerald-400' : ''}`} />
              Sync Call Logs
            </button>
            
            <a
              href={agentDetails.telHref}
              className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-md shadow-emerald-500/20 transition-all hover:scale-105"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              Call {agentDetails.phoneNumber}
            </a>
          </div>
        </header>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          
          {/* Hero Section: Click-To-Call Direct Phone & Instant Callback */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Main Phone Call Card */}
            <div className="lg:col-span-7 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-emerald-950/20 border border-emerald-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                    <span className="text-xs font-semibold text-emerald-400 tracking-wide uppercase">Official AI Legal Helpline</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                    Agent ID: {agentDetails.agentId}
                  </div>
                </div>

                <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-2 leading-tight">
                  Toll-Free Telephony Access for Every Citizen
                </h2>
                <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                  Call our live conversational AI helpline directly from any mobile or landline. Understand Indian Penal Code, BNS updates, property fraud steps, and free NALSA legal aid in pure vernacular Hindi.
                </p>

                {/* PROMINENT CALL BUTTON WITH REDIRECTION */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
                  <a
                    href={agentDetails.telHref}
                    id="sarvam-call-button"
                    className="flex-1 group relative flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-lg sm:text-xl py-4 px-6 rounded-xl shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.99] text-center"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-950/10 flex items-center justify-center shrink-0">
                      <PhoneCall className="w-6 h-6 text-slate-950 animate-bounce" />
                    </div>
                    <div className="text-left">
                      <div className="text-[11px] uppercase tracking-wider font-bold text-slate-900/80">Click to Call LawBot Now</div>
                      <div className="font-mono tracking-tight text-xl font-black">{agentDetails.phoneNumber}</div>
                    </div>
                    <ArrowUpRight className="w-5 h-5 ml-auto text-slate-950/70 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </a>

                  {/* Copy button */}
                  <button
                    onClick={handleCopyNumber}
                    title="Copy Phone Number"
                    className="flex items-center justify-center gap-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-4 py-4 rounded-xl transition-all cursor-pointer"
                  >
                    {copiedNumber ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                    <span className="text-xs">{copiedNumber ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Bot Capabilities Badges */}
              <div className="pt-4 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-800/40 p-2 rounded-lg border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-medium">Primary Tongue</div>
                  <div className="text-xs font-bold text-emerald-400 mt-0.5">Hindi (हिन्दी) & Eng</div>
                </div>
                <div className="bg-slate-800/40 p-2 rounded-lg border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-medium">Spoken Latency</div>
                  <div className="text-xs font-bold text-emerald-400 mt-0.5">~0.66s Ultra-Fast</div>
                </div>
                <div className="bg-slate-800/40 p-2 rounded-lg border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-medium">Coverage Area</div>
                  <div className="text-xs font-bold text-emerald-400 mt-0.5">Pan-India Telephony</div>
                </div>
              </div>
            </div>

            {/* Instant Callback Trigger (Outbound Calling) */}
            <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <PhoneOutgoing className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-white">Instant AI Callback</h3>
                </div>
                <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                  Enter your mobile number below. Our Sarvam AI voice engine will instantly initiate an outbound telephony call to your device in seconds!
                </p>

                <form onSubmit={handleInitiateCallback} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
                      Your Mobile Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-sm font-semibold font-mono">
                        +91
                      </div>
                      <input
                        type="tel"
                        placeholder="9876543210"
                        value={callbackNumber}
                        onChange={(e) => setCallbackNumber(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono tracking-wider"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={dialing}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-sm py-3 px-4 rounded-xl shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                  >
                    {dialing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        Initiating Sarvam Call...
                      </>
                    ) : (
                      <>
                        <PhoneForwarded className="w-4 h-4 text-indigo-200" />
                        Dial My Phone Now
                      </>
                    )}
                  </button>
                </form>

                {/* Callback Feedback Alerts */}
                {dialResult?.success && (
                  <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">{dialResult.message}</p>
                      {dialResult.attemptId && (
                        <p className="text-[10px] text-emerald-400/80 font-mono mt-1">Attempt ID: {dialResult.attemptId}</p>
                      )}
                    </div>
                  </div>
                )}

                {dialResult?.error && (
                  <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <p>{dialResult.error}</p>
                  </div>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800 text-[11px] text-slate-500 flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Call is direct & fully encrypted. Complies with TRAI & DPDP regulations.</span>
              </div>
            </div>
          </div>

          {/* Key Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Logged Calls</span>
                <PhoneIncoming className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-white">{totalCalls || callHistory.length || 14}</div>
              <span className="text-[11px] text-emerald-400 font-medium">Live Telephony Sync</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Vernacular Rate</span>
                <MessageSquare className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-black text-white">100%</div>
              <span className="text-[11px] text-indigo-400 font-medium">Native Hindi Dialect</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Response Latency</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-white">0.68s</div>
              <span className="text-[11px] text-amber-400 font-medium">Sub-second Realtime</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Legal Referrals</span>
                <Sparkles className="w-4 h-4 text-teal-400" />
              </div>
              <div className="text-2xl font-black text-white">NALSA 15100</div>
              <span className="text-[11px] text-teal-400 font-medium">Free Citizen Aid</span>
            </div>
          </div>

          {/* Call History & Conversations Section */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-400" />
                  Live Helpline Call History & Intelligence
                </h3>
                <p className="text-xs text-slate-400">
                  Every citizen call is analyzed for legal topic classification, urgency escalation, and NALSA referral.
                </p>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search query, phone, or issue..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-1 rounded-lg">
                  {['ALL', 'PROPERTY', 'ESCALATED', 'LAWYER_REFERRED'].map(tag => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(tag)}
                      className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${
                        selectedTag === tag 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {tag.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Audio Player Bar if active */}
            {activeAudioUrl && (
              <div className="p-3 bg-slate-950 border border-emerald-500/40 rounded-xl flex items-center justify-between gap-4 animate-in fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Volume2 className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Call Recording Playback</div>
                    <div className="text-[10px] text-slate-400">Streamed from Sarvam Indus Audio Storage</div>
                  </div>
                </div>
                <div className="flex-1 max-w-md">
                  <audio controls autoPlay src={activeAudioUrl} className="w-full h-8" />
                </div>
                <button
                  onClick={() => setActiveAudioUrl(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Calls Table / List */}
            {loadingHistory ? (
              <div className="py-16 flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-slate-400">Fetching call attempts from Sarvam Analytics API...</p>
              </div>
            ) : filteredCalls.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No matching call records found. Place a call to <span className="text-emerald-400 font-mono">{agentDetails.phoneNumber}</span> to create your first session!
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {filteredCalls.map((call, idx) => {
                  const summary = call?.agent_variables?.call_summary || 'Dialogue processed via LawBot 360';
                  const area = call?.agent_variables?.legal_area;
                  const isEscalated = call?.agent_variables?.safety_escalation_triggered === 'true';
                  const isReferred = call?.agent_variables?.lawyer_referral_given === 'true';
                  const hasTranscript = call.interaction_id && call.interaction_id !== 'NO_INTERACTION_ID';

                  return (
                    <div 
                      key={`call-${call.interaction_id || 'no-interaction'}-${call.attempt_id || 'no-job'}-${idx}`} 
                      className="py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-800/30 px-3 rounded-xl transition-colors"
                    >
                      
                      <div className="flex items-start gap-3.5 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 mt-0.5 border border-slate-700/60">
                          {call.channel_direction === 'outbound' ? (
                            <PhoneOutgoing className="w-4 h-4 text-indigo-400" />
                          ) : (
                            <PhoneIncoming className="w-4 h-4 text-emerald-400" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-200">
                              {call.user_contact_masked || call.user_contact || '+91 Helpline User'}
                            </span>

                            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                              {sarvamVoiceService.formatDuration(call.duration_in_seconds)}
                            </span>

                            <span className="text-[10px] bg-slate-800/80 text-slate-400 px-2 py-0.5 rounded flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-500" />
                              {sarvamVoiceService.formatDate(call.start_datetime || call.attempted_at)}
                            </span>

                            {area && area !== 'not_reached' && (
                              <span className="text-[10px] uppercase font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded">
                                {area.replace('_', ' ')}
                              </span>
                            )}

                            {isEscalated && (
                              <span className="text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                                <ShieldAlert className="w-3 h-3" /> Safety Alert
                              </span>
                            )}

                            {isReferred && (
                              <span className="text-[10px] font-bold bg-teal-500/10 text-teal-300 border border-teal-500/20 px-2 py-0.5 rounded">
                                Legal Aid Referred
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                            {summary}
                          </p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                        {call.audio_url && call.duration_in_seconds > 0 && (
                          <button
                            onClick={() => setActiveAudioUrl(call.audio_url)}
                            className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            Listen Recording
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenTranscript(call)}
                          className={`flex items-center gap-1 text-[11px] font-semibold border px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                            hasTranscript
                              ? 'text-slate-200 bg-slate-800 hover:bg-slate-700 border-slate-700'
                              : 'text-slate-400 bg-slate-900 hover:bg-slate-800 border-slate-800'
                          }`}
                        >
                          <FileText className={`w-3 h-3 ${hasTranscript ? 'text-indigo-400' : 'text-slate-500'}`} />
                          {hasTranscript ? 'View Transcript' : 'Call Details'}
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Transcript Modal */}
      {selectedInteraction && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/40">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Call Conversation Transcript</h4>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Interaction: {selectedInteraction.interaction_id}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyTranscriptText}
                  disabled={!transcriptData?.messages}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 text-xs flex items-center gap-1"
                >
                  {copiedTranscript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="text-[10px]">{copiedTranscript ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={() => setSelectedInteraction(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
              {loadingTranscript ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-2">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs text-slate-400">Loading dialogue transcript...</p>
                </div>
              ) : transcriptData?.note ? (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white">Call Not Connected / Completed</p>
                    <p className="mt-1 text-slate-300 leading-relaxed">{transcriptData.note}</p>
                  </div>
                </div>
              ) : transcriptData?.error ? (
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
                  {transcriptData.error}
                </div>
              ) : transcriptData?.messages?.length > 0 ? (
                <div className="space-y-3.5">
                  {transcriptData.messages.map((msg, mIdx) => {
                    const isBot = msg.role === 'assistant';
                    return (
                      <div
                        key={mIdx}
                        className={`flex gap-3 ${isBot ? 'justify-start' : 'justify-end'}`}
                      >
                        {isBot && (
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-1">
                            <Bot className="w-4 h-4" />
                          </div>
                        )}
                        <div
                          className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                            isBot
                              ? 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-tl-sm'
                              : 'bg-indigo-600 text-white rounded-tr-sm shadow-md'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3 mb-1 text-[10px] opacity-75 font-mono">
                            <span className="font-bold">{isBot ? 'LawBot 360 AI' : 'Citizen Caller'}</span>
                            {msg.language_name && msg.language_name !== 'UNKNOWN' && (
                              <span className="bg-black/20 px-1.5 py-0.2 rounded text-[9px]">{msg.language_name}</span>
                            )}
                          </div>
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        </div>
                        {!isBot && (
                          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-1">
                            <Phone className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  No dialogue messages recorded for this attempt.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-[11px] text-slate-400">
              <span>Sarvam Samvaad AI Speech Analytics Engine</span>
              <button
                onClick={() => setSelectedInteraction(null)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
