import React, { useState } from 'react';
import {
  Scale, Gavel, Calendar, Target, Activity, CheckCircle,
  Users, Plus, Search, Clock, X, FileText, User,
  ChevronDown, ArrowRight, Shield, AlertCircle, Menu,
  Zap, BookOpen, Briefcase, TrendingUp, MapPin, AlertTriangle,
  Loader2, Check, ChevronRight, Building, ClipboardList, Info
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import logo from '../assets/lawbot360-logo-updated.svg';
import lawBot360AI from '../services/aiService';

const mockCases = [
  {
    id: 1,
    title: 'Consumer Complaint - Defective Mobile',
    status: 'in_progress',
    progress: 60,
    nextAction: 'File in Consumer Court',
    dueDate: '2024-11-05',
    category: 'Consumer Law',
    createdDate: '2024-10-15',
    description: 'Mobile phone stopped working after 2 months of purchase'
  },
  {
    id: 2,
    title: 'RTI Application - Municipal Records',
    status: 'submitted',
    progress: 30,
    nextAction: 'Wait for Response',
    dueDate: '2024-11-15',
    category: 'Government',
    createdDate: '2024-10-20',
    description: 'Requesting property tax records from municipal corporation'
  },
  {
    id: 3,
    title: 'Tenant Rights - Eviction Notice',
    status: 'consultation',
    progress: 20,
    nextAction: 'Consult Lawyer',
    dueDate: '2024-11-02',
    category: 'Property Law',
    createdDate: '2024-10-25',
    description: 'Landlord issued illegal eviction notice without proper procedure'
  }
];

const caseDetails = {
  1: {
    timeline: [
      { date: '2024-10-15', event: 'Case Filed', status: 'completed', description: 'Consumer complaint filed against mobile manufacturer' },
      { date: '2024-10-20', event: 'Company Response', status: 'completed', description: 'Company acknowledged the complaint' },
      { date: '2024-10-25', event: 'Evidence Collection', status: 'completed', description: 'Purchase receipt and warranty documents submitted' },
      { date: '2024-11-05', event: 'Consumer Court Filing', status: 'pending', description: 'File formal complaint in District Consumer Forum' },
      { date: '2024-11-20', event: 'Court Hearing', status: 'upcoming', description: 'First hearing scheduled' }
    ],
    documents: ['Purchase Receipt', 'Warranty Card', 'Complaint Letter', 'Company Response'],
    parties: { complainant: 'John Doe', respondent: 'XYZ Mobile Company', lawyer: 'Adv. Rajesh Kumar' },
    amount: '₹25,000'
  },
  2: {
    timeline: [
      { date: '2024-10-20', event: 'RTI Application Filed', status: 'completed', description: 'Application submitted to Municipal Corporation' },
      { date: '2024-10-22', event: 'Acknowledgment Received', status: 'completed', description: 'Application acknowledged with reference number' },
      { date: '2024-11-15', event: 'Response Due', status: 'pending', description: 'Department must respond within 30 days' },
      { date: '2024-11-25', event: 'Follow-up', status: 'upcoming', description: 'Follow-up if no response received' }
    ],
    documents: ['RTI Application', 'Acknowledgment Receipt', 'Fee Payment Receipt'],
    parties: { applicant: 'Jane Smith', department: 'Municipal Corporation', pio: 'Mr. A.K. Sharma (PIO)' },
    amount: '₹10'
  },
  3: {
    timeline: [
      { date: '2024-10-25', event: 'Eviction Notice Received', status: 'completed', description: 'Landlord served illegal eviction notice' },
      { date: '2024-10-28', event: 'Legal Consultation', status: 'completed', description: 'Consulted with property law expert' },
      { date: '2024-11-02', event: 'Lawyer Meeting', status: 'pending', description: 'Detailed consultation with Adv. Priya Sharma' },
      { date: '2024-11-10', event: 'Legal Notice', status: 'upcoming', description: 'Send legal notice to landlord' }
    ],
    documents: ['Rent Agreement', 'Eviction Notice', 'Rent Receipts', 'Legal Opinion'],
    parties: { tenant: 'Mike Johnson', landlord: 'ABC Properties Ltd.', lawyer: 'Adv. Priya Sharma' },
    amount: '₹15,000'
  }
};

// ─── Helpers ───────────────────────────────────────────────────────────────

const getStatusStyles = (status) => {
  const styles = {
    in_progress: { bg: 'bg-purple-500/10', text: 'text-purple-300', border: 'border-purple-500/30', icon: Activity, label: 'In Progress', bar: 'bg-purple-500' },
    submitted: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', icon: CheckCircle, label: 'Submitted', bar: 'bg-emerald-500' },
    consultation: { bg: 'bg-amber-500/10', text: 'text-amber-300', border: 'border-amber-500/30', icon: Users, label: 'Consultation', bar: 'bg-amber-500' },
    default: { bg: 'bg-white/[0.05]', text: 'text-slate-400', border: 'border-white/[0.08]', icon: Scale, label: 'Unknown', bar: 'bg-slate-600' }
  };
  return styles[status] || styles.default;
};

// ─── AI Analysis Function ──────────────────────────────────────────────────

async function analyzeCaseWithAI(caseItem) {
  const details = caseDetails[caseItem.id];

  const prompt = `You are a senior Indian legal expert at LawBot360. Perform a FULL, DEEP legal analysis of the following case. Your response MUST be valid JSON exactly matching the structure below.

CASE DATA:
- Title: ${caseItem.title}
- Category: ${caseItem.category}
- Status: ${caseItem.status}
- Progress: ${caseItem.progress}%
- Description: ${caseItem.description}
- Next Action: ${caseItem.nextAction}
- Due Date: ${caseItem.dueDate}
- Created Date: ${caseItem.createdDate}
- Estimated Value: ${details.amount}
- Parties: ${JSON.stringify(details.parties)}
- Existing Documents: ${details.documents.join(', ')}
- Timeline Events: ${details.timeline.map(t => `${t.event} (${t.status}) - ${t.description}`).join(' | ')}

Return ONLY valid JSON in this exact format (no markdown, no code blocks, just JSON):
{
  "summary": "2-3 sentence plain English summary of this case",
  "legalAssessment": {
    "applicableLaws": [
      { "act": "Name of the Act", "sections": "Relevant section numbers", "relevance": "How it applies" }
    ],
    "caseStrength": "Strong|Moderate|Weak",
    "caseStrengthReason": "Why the case is strong/moderate/weak"
  },
  "nextActions": [
    { "step": 1, "action": "Action title", "detail": "Detailed description of what to do", "urgency": "Immediate|Soon|Later" }
  ],
  "documentsToCollect": [
    { "name": "Document name", "purpose": "Why you need it", "howToGet": "Where/how to obtain it" }
  ],
  "whoToApproach": [
    { "authority": "Name of court/forum/authority", "address": "General address or description", "type": "Court|Forum|Authority|Lawyer", "reason": "Why approach them" }
  ],
  "riskAssessment": {
    "level": "Low|Medium|High",
    "factors": ["Risk factor 1", "Risk factor 2"],
    "mitigation": "How to reduce risks"
  },
  "timelines": [
    { "milestone": "Milestone name", "duration": "e.g. 30 days", "description": "What happens" }
  ],
  "legalAdvice": "One strong strategic advice sentence from a senior lawyer perspective"
}`;

  const res = await lawBot360AI.sendMessage(prompt, {
    skipHistory: true,
    systemPrompt: "You are an automated legal case evaluator. Output strictly JSON matching the required schema."
  });

  const rawText = res.response || res;
  if (!rawText) throw new Error('Empty response from AI engine.');

  const jsonText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
  return JSON.parse(jsonText);
}

// ─── Case Analysis Modal ───────────────────────────────────────────────────

const CaseAnalysisModal = ({ caseItem, isOpen, onClose }) => {
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [analysis, setAnalysis] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const loadingSteps = [
    'Reading case details…',
    'Identifying applicable laws…',
    'Mapping required documents…',
    'Calculating risk factors…',
    'Building action plan…',
    'Finalising analysis…'
  ];
  const [loadingStep, setLoadingStep] = useState(0);

  React.useEffect(() => {
    if (!isOpen || !caseItem) return;
    setStatus('loading');
    setAnalysis(null);
    setErrorMsg('');
    setLoadingStep(0);

    // Cycle loading text
    let step = 0;
    const interval = setInterval(() => {
      step = (step + 1) % loadingSteps.length;
      setLoadingStep(step);
    }, 900);

    analyzeCaseWithAI(caseItem)
      .then(result => {
        clearInterval(interval);
        setAnalysis(result);
        setStatus('done');
      })
      .catch(err => {
        clearInterval(interval);
        setErrorMsg(err.message);
        setStatus('error');
      });

    return () => clearInterval(interval);
  }, [isOpen, caseItem]);

  if (!isOpen || !caseItem) return null;

  const riskColors = { Low: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', Medium: 'text-amber-400 bg-amber-500/10 border-amber-500/30', High: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
  const strengthColors = { Strong: 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30', Moderate: 'text-amber-400 bg-amber-500/10 border border-amber-500/30', Weak: 'text-rose-400 bg-rose-500/10 border border-rose-500/30' };
  const urgencyColors = { Immediate: 'bg-rose-500/10 text-rose-300 border border-rose-500/30', Soon: 'bg-amber-500/10 text-amber-300 border border-amber-500/30', Later: 'bg-purple-500/10 text-purple-300 border border-purple-500/30' };
  const authorityIcons = { Court: Gavel, Forum: Building, Authority: Building, Lawyer: User };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#141721] rounded-2xl border border-white/[0.08] shadow-2xl shadow-black/80 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-[#f1f5f9]">

        {/* ── Header ── */}
        <div className="bg-[#161922] p-6 border-b border-white/[0.08] flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-purple-400" />
              <span className="text-purple-400 text-xs font-semibold uppercase tracking-widest">AI Case Analysis</span>
            </div>
            <h2 className="text-white text-xl font-bold max-w-xl leading-snug">{caseItem.title}</h2>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs bg-[#11131a] border border-white/[0.08] text-slate-300 px-2.5 py-0.5 rounded-full font-medium">{caseItem.category}</span>
              <span className="text-xs text-slate-400">Case #{caseItem.id} · {caseItem.status.replace('_', ' ')}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/[0.06] text-slate-400 hover:text-white rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto bg-[#0c0e14]">

          {/* LOADING */}
          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center h-80 gap-6 p-8">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-white/10 flex items-center justify-center">
                  <Scale className="w-8 h-8 text-purple-400" />
                </div>
                <div className="absolute inset-0 border-4 border-transparent border-t-purple-500 rounded-full animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-white mb-1">Analysing your case with AI…</p>
                <p className="text-xs text-purple-400 animate-pulse transition-all">{loadingSteps[loadingStep]}</p>
              </div>
              <div className="flex gap-2">
                {loadingSteps.map((_, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full transition-all duration-300 ${i <= loadingStep ? 'bg-purple-500' : 'bg-white/10'}`} />
                ))}
              </div>
            </div>
          )}

          {/* ERROR */}
          {status === 'error' && (
            <div className="flex flex-col items-center justify-center h-64 gap-4 p-8">
              <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-rose-400" />
              </div>
              <div className="text-center">
                <p className="text-base font-semibold text-white mb-1">Analysis Failed</p>
                <p className="text-xs text-rose-300 max-w-md">{errorMsg}</p>
              </div>
              <button
                onClick={() => { setStatus('idle'); }}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-purple-900/20 transition-all"
              >
                Retry Analysis
              </button>
            </div>
          )}

          {/* RESULTS */}
          {status === 'done' && analysis && (
            <div className="p-6 space-y-6">

              {/* Summary Banner */}
              <div className="bg-[#161922] border border-purple-500/30 rounded-2xl p-5 flex gap-4 shadow-xl shadow-black/20">
                <div className="flex-shrink-0 w-10 h-10 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center">
                  <Info className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-1">AI Summary</p>
                  <p className="text-slate-200 text-sm leading-relaxed">{analysis.summary}</p>
                  <p className="mt-2 text-xs italic text-purple-300 border-l-2 border-purple-500/40 pl-3">"{analysis.legalAdvice}"</p>
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-6">

                {/* LEFT COL */}
                <div className="lg:col-span-2 space-y-6">

                  {/* Next Actions */}
                  <div className="bg-[#161922] rounded-2xl border border-white/[0.08] shadow-lg shadow-black/20 overflow-hidden">
                    <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/[0.06] bg-[#11131a]">
                      <ClipboardList className="w-4 h-4 text-purple-400" />
                      <h3 className="font-bold text-sm text-white">Recommended Next Actions</h3>
                    </div>
                    <div className="p-4 space-y-3">
                      {analysis.nextActions?.map((action, i) => (
                        <div key={i} className="flex gap-3 p-3 rounded-xl bg-[#11131a] border border-white/[0.04] hover:border-purple-500/30 transition-colors group">
                          <div className="flex-shrink-0 w-7 h-7 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md shadow-purple-900/20">
                            {action.step}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <p className="font-semibold text-white text-xs">{action.action}</p>
                              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${urgencyColors[action.urgency] || 'bg-white/10 text-slate-400'}`}>
                                {action.urgency}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400">{action.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Documents to Collect */}
                  <div className="bg-[#161922] rounded-2xl border border-white/[0.08] shadow-lg shadow-black/20 overflow-hidden">
                    <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/[0.06] bg-[#11131a]">
                      <FileText className="w-4 h-4 text-purple-400" />
                      <h3 className="font-bold text-sm text-white">Documents to Bring / Collect</h3>
                    </div>
                    <div className="p-4 space-y-3">
                      {analysis.documentsToCollect?.map((doc, i) => (
                        <div key={i} className="p-3 border border-white/[0.06] bg-[#11131a] rounded-xl">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-5 h-5 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center flex-shrink-0">
                              <Check className="w-3 h-3" />
                            </div>
                            <p className="font-semibold text-xs text-white">{doc.name}</p>
                          </div>
                          <p className="text-xs text-slate-400 ml-7 mb-0.5">{doc.purpose}</p>
                          <p className="text-xs text-purple-400 ml-7 font-medium">📍 {doc.howToGet}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Who to Approach */}
                  <div className="bg-[#161922] rounded-2xl border border-white/[0.08] shadow-lg shadow-black/20 overflow-hidden">
                    <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/[0.06] bg-[#11131a]">
                      <MapPin className="w-4 h-4 text-emerald-400" />
                      <h3 className="font-bold text-sm text-white">Who to Approach & Where</h3>
                    </div>
                    <div className="p-4 space-y-3">
                      {analysis.whoToApproach?.map((auth, i) => {
                        const IconComp = authorityIcons[auth.type] || Building;
                        return (
                          <div key={i} className="flex gap-3 p-3 border border-white/[0.06] bg-[#11131a] rounded-xl">
                            <div className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                              <IconComp className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div>
                              <p className="font-semibold text-xs text-white">{auth.authority}</p>
                              <p className="text-xs text-slate-400 mt-0.5">{auth.reason}</p>
                              {auth.address && (
                                <p className="text-xs text-emerald-400 font-medium mt-1">📍 {auth.address}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* RIGHT COL */}
                <div className="space-y-5">

                  {/* Case Strength + Risk */}
                  <div className="bg-[#161922] rounded-2xl border border-white/[0.08] shadow-lg shadow-black/20 overflow-hidden">
                    <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/[0.06] bg-[#11131a]">
                      <TrendingUp className="w-4 h-4 text-purple-400" />
                      <h3 className="font-bold text-sm text-white">Assessment</h3>
                    </div>
                    <div className="p-4 space-y-4">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Case Strength</p>
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${strengthColors[analysis.legalAssessment?.caseStrength] || 'bg-white/10 text-slate-300'}`}>
                          <Shield className="w-3.5 h-3.5" />
                          {analysis.legalAssessment?.caseStrength}
                        </div>
                        <p className="text-xs text-slate-400 mt-2 leading-relaxed">{analysis.legalAssessment?.caseStrengthReason}</p>
                      </div>
                      <hr className="border-white/[0.06]" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Risk Level</p>
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${riskColors[analysis.riskAssessment?.level] || 'bg-white/10 text-slate-400'}`}>
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {analysis.riskAssessment?.level} Risk
                        </div>
                        <ul className="mt-2 space-y-1">
                          {analysis.riskAssessment?.factors?.map((f, i) => (
                            <li key={i} className="text-xs text-slate-400 flex gap-1.5 items-start">
                              <span className="text-purple-400 mt-0.5">•</span>{f}
                            </li>
                          ))}
                        </ul>
                        {analysis.riskAssessment?.mitigation && (
                          <p className="text-xs text-purple-300 mt-2 bg-[#11131a] border border-white/[0.06] p-2.5 rounded-xl">{analysis.riskAssessment.mitigation}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Applicable Laws */}
                  <div className="bg-[#161922] rounded-2xl border border-white/[0.08] shadow-lg shadow-black/20 overflow-hidden">
                    <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/[0.06] bg-[#11131a]">
                      <BookOpen className="w-4 h-4 text-purple-400" />
                      <h3 className="font-bold text-sm text-white">Applicable Laws</h3>
                    </div>
                    <div className="p-4 space-y-3">
                      {analysis.legalAssessment?.applicableLaws?.map((law, i) => (
                        <div key={i} className="p-3 bg-[#11131a] border border-white/[0.06] rounded-xl">
                          <p className="font-semibold text-xs text-white">{law.act}</p>
                          <p className="text-[11px] font-bold text-purple-400 mt-0.5">§ {law.sections}</p>
                          <p className="text-xs text-slate-400 mt-1">{law.relevance}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Timelines */}
                  <div className="bg-[#161922] rounded-2xl border border-white/[0.08] shadow-lg shadow-black/20 overflow-hidden">
                    <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/[0.06] bg-[#11131a]">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <h3 className="font-bold text-sm text-white">Expected Timelines</h3>
                    </div>
                    <div className="p-4 space-y-3">
                      {analysis.timelines?.map((t, i) => (
                        <div key={i} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                            {i < (analysis.timelines.length - 1) && <div className="w-0.5 bg-white/[0.08] flex-1 mt-1" />}
                          </div>
                          <div className="pb-3">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-semibold text-white">{t.milestone}</p>
                              <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-1.5 py-0.5 rounded font-bold">{t.duration}</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">{t.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        {status === 'done' && (
          <div className="border-t border-white/[0.08] px-6 py-4 bg-[#141721] flex items-center justify-between">
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              Powered by Gemini AI · For guidance only, not a substitute for legal counsel
            </p>
            <div className="flex gap-3">
              <button onClick={onClose} className="px-5 py-2 border border-white/[0.08] text-slate-300 hover:text-white rounded-xl font-medium hover:bg-white/[0.06] transition-colors text-xs">
                Close
              </button>
              <button
                onClick={() => { setStatus('idle'); setAnalysis(null); }}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-medium transition-colors text-xs flex items-center gap-2 shadow-md shadow-purple-900/20"
              >
                <Zap className="w-3.5 h-3.5" /> Re-Analyse
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Case Card ─────────────────────────────────────────────────────────────

const CaseCard = ({ caseItem, onViewDetails, onAnalyze }) => {
  const style = getStatusStyles(caseItem.status);
  const StatusIcon = style.icon;

  return (
    <div className="group bg-[#161922] rounded-2xl p-6 border border-white/[0.08] shadow-xl shadow-black/20 hover:border-purple-500/40 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col justify-between">
      {/* Decorative top accent */}
      <div className={`absolute top-0 left-0 w-full h-1 ${style.bar}`} />

      <div>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#11131a] text-slate-400 border border-white/[0.06]">
                {caseItem.category}
              </span>
              <span className="text-xs text-slate-500">• ID #{caseItem.id}</span>
            </div>
            <h3 className="text-base font-bold text-white leading-snug group-hover:text-purple-300 transition-colors">
              {caseItem.title}
            </h3>
          </div>
          <div className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text} border ${style.border}`}>
            <StatusIcon className="w-3.5 h-3.5" />
            {style.label}
          </div>
        </div>

        <p className="text-xs text-slate-400 mb-6 line-clamp-2 min-h-[36px] leading-relaxed">
          {caseItem.description}
        </p>

        {/* Progress Section */}
        <div className="mb-6 bg-[#11131a] rounded-xl p-3 border border-white/[0.06]">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-medium text-slate-400">Case Progress</span>
            <span className="font-bold text-white">{caseItem.progress}%</span>
          </div>
          <div className="w-full bg-white/[0.06] rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${style.bar}`}
              style={{ width: `${caseItem.progress}%` }}
            />
          </div>
        </div>

        {/* Action Meta */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Target className="w-3 h-3 text-purple-400" /> Next Action
            </span>
            <span className="text-xs font-medium text-slate-200 truncate" title={caseItem.nextAction}>
              {caseItem.nextAction}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-purple-400" /> Due Date
            </span>
            <span className="text-xs font-medium text-slate-200">
              {caseItem.dueDate}
            </span>
          </div>
        </div>
      </div>

      {/* Buttons Row */}
      <div className="flex gap-2">
        <button
          onClick={() => onViewDetails(caseItem)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#11131a] border border-white/[0.08] text-slate-300 rounded-xl font-semibold hover:border-white/20 hover:text-white transition-all text-xs"
        >
          View Details
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
        </button>
        <button
          onClick={() => onAnalyze(caseItem)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold shadow-md shadow-purple-900/20 transition-all text-xs active:scale-95"
        >
          <Zap className="w-3.5 h-3.5" />
          Analyze
        </button>
      </div>
    </div>
  );
};

// ─── Case Details Modal ───────────────────────────────────────

const CaseDetailsModal = ({ caseItem, isOpen, onClose }) => {
  if (!isOpen || !caseItem) return null;

  const details = caseDetails[caseItem.id];

  const getTimelineStyles = (status) => {
    switch (status) {
      case 'completed': return { dot: 'bg-emerald-500 ring-emerald-500/20', line: 'bg-emerald-500/30', text: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
      case 'pending': return { dot: 'bg-amber-500 ring-amber-500/20', line: 'bg-white/[0.08]', text: 'text-amber-300 bg-amber-500/10 border-amber-500/30' };
      default: return { dot: 'bg-slate-600 ring-white/10', line: 'bg-white/[0.08]', text: 'text-slate-400 bg-white/[0.05] border-white/[0.08]' };
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-[#141721] rounded-2xl border border-white/[0.08] shadow-2xl shadow-black/80 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-[#f1f5f9]">
        {/* Modal Header */}
        <div className="p-6 sm:p-8 border-b border-white/[0.08] flex items-start justify-between bg-[#161922]">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-purple-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">#{caseItem.id}</span>
              <span className="text-xs font-medium text-slate-400">{caseItem.category}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">{caseItem.title}</h2>
            <p className="text-xs sm:text-sm text-slate-400">{caseItem.description}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-[#0c0e14]">
          <div className="grid lg:grid-cols-3 gap-8">

            {/* Left Column: Timeline */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <Activity className="w-4 h-4 text-purple-400" />
                <h3 className="text-base font-bold text-white">Case Journey</h3>
              </div>

              <div className="relative pl-4 space-y-6">
                <div className="absolute left-[23px] top-2 bottom-2 w-0.5 bg-white/[0.08]" />

                {details.timeline.map((item, index) => {
                  const styles = getTimelineStyles(item.status);
                  return (
                    <div key={index} className="relative flex gap-6 group">
                      <div className={`relative z-10 flex-shrink-0 w-4 h-4 rounded-full ${styles.dot} ring-4 mt-1.5 transition-all group-hover:scale-110`} />
                      <div className="flex-1 bg-[#161922] border border-white/[0.08] rounded-xl p-4 shadow-sm hover:border-purple-500/30 transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-white text-sm">{item.event}</h4>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${styles.text}`}>
                            {item.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mb-2 leading-relaxed">{item.description}</p>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          {item.date}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Meta Info */}
            <div className="space-y-6">

              <div className="bg-[#161922] rounded-xl p-6 border border-emerald-500/20 shadow-lg shadow-black/20">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Estimated Case Value</span>
                <p className="text-2xl font-bold text-white mt-1">{details.amount}</p>
              </div>

              <div className="bg-[#161922] rounded-xl p-6 border border-white/[0.08] shadow-lg shadow-black/20">
                <h4 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-400" /> Parties Involved
                </h4>
                <div className="space-y-4">
                  {Object.entries(details.parties).map(([role, name]) => (
                    <div key={role} className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{role}</span>
                      <div className="flex items-center gap-2 text-xs text-slate-200 font-medium">
                        <div className="w-6 h-6 rounded-full bg-[#11131a] border border-white/[0.06] flex items-center justify-center text-slate-400">
                          <User className="w-3 h-3" />
                        </div>
                        {name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#161922] rounded-xl p-6 border border-white/[0.08] shadow-lg shadow-black/20">
                <h4 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-400" /> Evidence & Docs
                </h4>
                <div className="space-y-2">
                  {details.documents.map((doc, index) => (
                    <div key={index} className="flex items-center p-2 rounded-xl bg-[#11131a] hover:bg-white/[0.04] border border-white/[0.04] transition-colors cursor-pointer group">
                      <div className="p-1.5 bg-purple-500/10 text-purple-400 rounded-lg mr-2.5">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs text-slate-300 group-hover:text-white font-medium">{doc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function Cases() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCase, setSelectedCase] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNewCaseModal, setShowNewCaseModal] = useState(false);
  const [analyzeCase, setAnalyzeCase] = useState(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);

  const statusOptions = [
    { value: 'all', label: 'All Cases' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'consultation', label: 'Consultation' }
  ];

  const handleStatusSelect = (value) => {
    setStatusFilter(value);
    setShowDropdown(false);
  };

  const selectedStatusLabel = statusOptions.find(option => option.value === statusFilter)?.label || 'All Cases';

  const handleViewDetails = (caseItem) => {
    setSelectedCase(caseItem);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCase(null);
  };

  const handleAnalyze = (caseItem) => {
    setAnalyzeCase(caseItem);
    setShowAnalysisModal(true);
  };

  const closeAnalysisModal = () => {
    setShowAnalysisModal(false);
    setAnalyzeCase(null);
  };

  const filteredCases = mockCases.filter(caseItem => {
    const matchesSearch = caseItem.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || caseItem.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex h-screen bg-[#0c0e14] text-[#f1f5f9] font-sans">
      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="bg-[#141721]/90 backdrop-blur-md border-b border-white/[0.08] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 hover:bg-white/[0.06] rounded-xl text-slate-400 hover:text-white transition-colors">
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Case Manager</h1>
              <p className="text-xs text-slate-400 font-medium">Track, litigate, and manage your ongoing cases</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">

            {/* Hero / Dashboard Summary */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="md:col-span-2 bg-[#161922] border border-purple-500/30 rounded-2xl p-6 md:p-8 text-white shadow-xl shadow-black/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Scale className="w-48 h-48 text-purple-400" />
                </div>
                <div className="relative z-10">
                  <h1 className="text-2xl sm:text-3xl font-extrabold mb-2 tracking-tight">My Legal Cases</h1>
                  <p className="text-slate-400 text-sm md:text-base mb-6 max-w-lg leading-relaxed">
                    Manage your ongoing litigations, track upcoming court hearings, and access verified documents in one secure workspace.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowNewCaseModal(true)}
                      className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-purple-900/30 flex items-center gap-2 text-xs active:scale-95"
                    >
                      <Plus className="w-4 h-4" /> File New Case
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-[#161922] rounded-2xl p-6 border border-white/[0.08] shadow-lg shadow-black/20 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-2 text-slate-400">
                  <Activity className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Active Cases</span>
                </div>
                <div className="text-3xl font-black text-white mb-2">{mockCases.length}</div>
                <div className="text-xs text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 w-fit px-2.5 py-1 rounded-full font-medium">
                  <Clock className="w-3 h-3" />
                  <span>All up to date</span>
                </div>
              </div>
            </div>

            {/* Filters & Controls */}
            <div className="flex flex-col md:flex-row gap-4 mb-6 items-center justify-between">
              <div className="relative w-full md:w-96 group">
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
                <input
                  type="text"
                  placeholder="Search by case title or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#161922] border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all"
                />
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative w-full md:w-auto">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="w-full md:w-48 flex items-center justify-between px-4 py-2.5 bg-[#161922] border border-white/[0.08] rounded-xl text-xs font-semibold text-slate-300 hover:border-white/20 shadow-sm"
                  >
                    <span>{selectedStatusLabel}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showDropdown && (
                    <div className="absolute top-full right-0 mt-2 w-full md:w-56 bg-[#141721] border border-white/[0.08] rounded-xl shadow-2xl z-20 py-1 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                      {statusOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleStatusSelect(option.value)}
                          className={`w-full text-left px-4 py-2.5 text-xs hover:bg-white/[0.04] transition-colors flex items-center justify-between ${statusFilter === option.value ? 'bg-purple-500/10 text-purple-300 font-semibold' : 'text-slate-300'
                            }`}
                        >
                          {option.label}
                          {statusFilter === option.value && <CheckCircle className="w-3.5 h-3.5 text-purple-400" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Cases Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCases.map(caseItem => (
                <CaseCard
                  key={caseItem.id}
                  caseItem={caseItem}
                  onViewDetails={handleViewDetails}
                  onAnalyze={handleAnalyze}
                />
              ))}
            </div>

            {/* Empty State */}
            {filteredCases.length === 0 && (
              <div className="text-center py-20 bg-[#161922] rounded-2xl border border-dashed border-white/[0.08]">
                <div className="bg-[#11131a] w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/[0.06]">
                  <Search className="w-6 h-6 text-slate-500" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">No cases found</h3>
                <p className="text-slate-400 text-xs mb-4 max-w-sm mx-auto">We could not find any cases matching your search criteria. Try adjusting filters.</p>
                <button
                  onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                  className="text-purple-400 font-semibold text-xs hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            )}

            {/* Case Details Modal */}
            <CaseDetailsModal
              caseItem={selectedCase}
              isOpen={showModal}
              onClose={closeModal}
            />

            {/* AI Case Analysis Modal */}
            <CaseAnalysisModal
              caseItem={analyzeCase}
              isOpen={showAnalysisModal}
              onClose={closeAnalysisModal}
            />

            {/* New Case Modal */}
            {showNewCaseModal && (
              <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
                <div className="bg-[#161922] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/80 max-w-md w-full animate-in zoom-in-95 duration-200 overflow-hidden text-white">
                  <div className="p-6 border-b border-white/[0.08] flex items-center justify-between bg-[#141721]">
                    <h2 className="text-lg font-bold text-white">Start New Case</h2>
                    <button onClick={() => setShowNewCaseModal(false)} className="p-1.5 hover:bg-white/[0.06] rounded-xl text-slate-400 hover:text-white transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Phone Number</label>
                      <input
                        type="tel"
                        placeholder="+91 98765 43210"
                        className="w-full px-4 py-2.5 bg-[#11131a] border border-white/[0.1] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Case Title</label>
                      <input
                        type="text"
                        placeholder="E.g., Property Dispute"
                        className="w-full px-4 py-2.5 bg-[#11131a] border border-white/[0.1] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Category</label>
                      <div className="relative">
                        <select className="w-full px-4 py-2.5 bg-[#11131a] border border-white/[0.1] rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 appearance-none transition-all">
                          <option className="bg-[#161922]">Consumer Law</option>
                          <option className="bg-[#161922]">Property Law</option>
                          <option className="bg-[#161922]">Criminal Law</option>
                          <option className="bg-[#161922]">Family Law</option>
                          <option className="bg-[#161922]">Government / RTI</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
                      <textarea
                        placeholder="Briefly describe the issue..."
                        rows="3"
                        className="w-full px-4 py-2.5 bg-[#11131a] border border-white/[0.1] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none transition-all"
                      />
                    </div>

                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3.5 flex gap-3">
                      <AlertCircle className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-purple-200 leading-relaxed">
                        A specialized advocate will review this preliminary info and contact you within 24 hours.
                      </p>
                    </div>
                  </div>

                  <div className="p-6 border-t border-white/[0.08] bg-[#141721] flex gap-3">
                    <button
                      onClick={() => setShowNewCaseModal(false)}
                      className="flex-1 px-4 py-2.5 border border-white/[0.08] text-slate-300 font-semibold rounded-xl hover:bg-white/[0.06] text-xs transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        alert('Case created! Our lawyer will contact you within 24 hours.');
                        setShowNewCaseModal(false);
                      }}
                      className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-900/30 text-xs transition-all"
                    >
                      Submit Request
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
