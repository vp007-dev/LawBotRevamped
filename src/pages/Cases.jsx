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
    in_progress: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: Activity, label: 'In Progress', bar: 'bg-blue-600' },
    submitted: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle, label: 'Submitted', bar: 'bg-emerald-600' },
    consultation: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: Users, label: 'Consultation', bar: 'bg-amber-500' },
    default: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: Scale, label: 'Unknown', bar: 'bg-gray-400' }
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

  const riskColors = { Low: 'text-green-700 bg-green-50 border-green-200', Medium: 'text-amber-700 bg-amber-50 border-amber-200', High: 'text-red-700 bg-red-50 border-red-200' };
  const strengthColors = { Strong: 'text-green-700 bg-green-100', Moderate: 'text-amber-700 bg-amber-100', Weak: 'text-red-700 bg-red-100' };
  const urgencyColors = { Immediate: 'bg-red-100 text-red-700', Soon: 'bg-amber-100 text-amber-700', Later: 'bg-blue-100 text-blue-700' };
  const authorityIcons = { Court: Gavel, Forum: Building, Authority: Building, Lawyer: User };

  return (
    <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-violet-700 to-indigo-700 p-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-5 h-5 text-violet-200" />
              <span className="text-violet-200 text-sm font-semibold uppercase tracking-widest">AI Case Analysis</span>
            </div>
            <h2 className="text-white text-xl font-bold max-w-xl leading-snug">{caseItem.title}</h2>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs bg-white/20 text-white px-2.5 py-1 rounded-full font-medium">{caseItem.category}</span>
              <span className="text-xs text-violet-200">Case #{caseItem.id} · {caseItem.status.replace('_', ' ')}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto bg-slate-50">

          {/* LOADING */}
          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center h-80 gap-6 p-8">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-violet-100 flex items-center justify-center">
                  <Scale className="w-8 h-8 text-violet-400" />
                </div>
                <div className="absolute inset-0 border-4 border-transparent border-t-violet-600 rounded-full animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-800 mb-1">Analysing your case with AI…</p>
                <p className="text-sm text-violet-600 animate-pulse transition-all">{loadingSteps[loadingStep]}</p>
              </div>
              <div className="flex gap-2">
                {loadingSteps.map((_, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full transition-all duration-300 ${i <= loadingStep ? 'bg-violet-600' : 'bg-gray-200'}`} />
                ))}
              </div>
            </div>
          )}

          {/* ERROR */}
          {status === 'error' && (
            <div className="flex flex-col items-center justify-center h-64 gap-4 p-8">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-900 mb-1">Analysis Failed</p>
                <p className="text-sm text-red-600 max-w-md">{errorMsg}</p>
              </div>
              <button
                onClick={() => { setStatus('idle'); }}
                className="px-5 py-2.5 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition-colors"
              >
                Retry Analysis
              </button>
            </div>
          )}

          {/* RESULTS */}
          {status === 'done' && analysis && (
            <div className="p-6 space-y-6">

              {/* Summary Banner */}
              <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100 rounded-2xl p-5 flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                  <Info className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-violet-500 uppercase tracking-widest mb-1">AI Summary</p>
                  <p className="text-gray-800 font-medium leading-relaxed">{analysis.summary}</p>
                  <p className="mt-2 text-sm italic text-indigo-700 border-l-2 border-indigo-300 pl-3">"{analysis.legalAdvice}"</p>
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-6">

                {/* LEFT COL */}
                <div className="lg:col-span-2 space-y-6">

                  {/* Next Actions */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 bg-gray-50">
                      <ClipboardList className="w-4 h-4 text-blue-600" />
                      <h3 className="font-bold text-gray-900">Recommended Next Actions</h3>
                    </div>
                    <div className="p-4 space-y-3">
                      {analysis.nextActions?.map((action, i) => (
                        <div key={i} className="flex gap-3 p-3 rounded-xl bg-gray-50 hover:bg-blue-50 transition-colors group">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {action.step}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <p className="font-semibold text-gray-900 text-sm">{action.action}</p>
                              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${urgencyColors[action.urgency] || 'bg-gray-100 text-gray-600'}`}>
                                {action.urgency}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">{action.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Documents to Collect */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 bg-gray-50">
                      <FileText className="w-4 h-4 text-purple-600" />
                      <h3 className="font-bold text-gray-900">Documents to Bring / Collect</h3>
                    </div>
                    <div className="p-4 space-y-3">
                      {analysis.documentsToCollect?.map((doc, i) => (
                        <div key={i} className="p-3 border border-purple-100 bg-purple-50/40 rounded-xl">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0">
                              <Check className="w-3 h-3" />
                            </div>
                            <p className="font-semibold text-sm text-gray-900">{doc.name}</p>
                          </div>
                          <p className="text-xs text-gray-500 ml-7 mb-0.5">{doc.purpose}</p>
                          <p className="text-xs text-purple-700 ml-7 font-medium">📍 {doc.howToGet}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Who to Approach */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 bg-gray-50">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      <h3 className="font-bold text-gray-900">Who to Approach & Where</h3>
                    </div>
                    <div className="p-4 space-y-3">
                      {analysis.whoToApproach?.map((auth, i) => {
                        const IconComp = authorityIcons[auth.type] || Building;
                        return (
                          <div key={i} className="flex gap-3 p-3 border border-emerald-100 bg-emerald-50/40 rounded-xl">
                            <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                              <IconComp className="w-4 h-4 text-emerald-700" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-gray-900">{auth.authority}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{auth.reason}</p>
                              {auth.address && (
                                <p className="text-xs text-emerald-700 font-medium mt-1">📍 {auth.address}</p>
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
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 bg-gray-50">
                      <TrendingUp className="w-4 h-4 text-gray-700" />
                      <h3 className="font-bold text-gray-900">Assessment</h3>
                    </div>
                    <div className="p-4 space-y-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Case Strength</p>
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${strengthColors[analysis.legalAssessment?.caseStrength] || 'bg-gray-100 text-gray-700'}`}>
                          <Shield className="w-3.5 h-3.5" />
                          {analysis.legalAssessment?.caseStrength}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">{analysis.legalAssessment?.caseStrengthReason}</p>
                      </div>
                      <hr className="border-gray-100" />
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Risk Level</p>
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border ${riskColors[analysis.riskAssessment?.level] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {analysis.riskAssessment?.level} Risk
                        </div>
                        <ul className="mt-2 space-y-1">
                          {analysis.riskAssessment?.factors?.map((f, i) => (
                            <li key={i} className="text-xs text-gray-500 flex gap-1.5 items-start">
                              <span className="text-gray-300 mt-0.5">•</span>{f}
                            </li>
                          ))}
                        </ul>
                        {analysis.riskAssessment?.mitigation && (
                          <p className="text-xs text-blue-700 mt-2 bg-blue-50 p-2 rounded-lg">{analysis.riskAssessment.mitigation}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Applicable Laws */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 bg-gray-50">
                      <BookOpen className="w-4 h-4 text-indigo-600" />
                      <h3 className="font-bold text-gray-900">Applicable Laws</h3>
                    </div>
                    <div className="p-4 space-y-3">
                      {analysis.legalAssessment?.applicableLaws?.map((law, i) => (
                        <div key={i} className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                          <p className="font-semibold text-xs text-indigo-900">{law.act}</p>
                          <p className="text-[11px] font-bold text-indigo-600 mt-0.5">§ {law.sections}</p>
                          <p className="text-xs text-gray-600 mt-1">{law.relevance}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Timelines */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 bg-gray-50">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <h3 className="font-bold text-gray-900">Expected Timelines</h3>
                    </div>
                    <div className="p-4 space-y-3">
                      {analysis.timelines?.map((t, i) => (
                        <div key={i} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                            {i < (analysis.timelines.length - 1) && <div className="w-0.5 bg-amber-100 flex-1 mt-1" />}
                          </div>
                          <div className="pb-3">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-semibold text-gray-900">{t.milestone}</p>
                              <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">{t.duration}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>
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
          <div className="border-t border-gray-100 px-6 py-4 bg-white flex items-center justify-between">
            <p className="text-xs text-gray-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-violet-400" />
              Powered by Gemini AI · For guidance only, not a substitute for legal counsel
            </p>
            <div className="flex gap-3">
              <button onClick={onClose} className="px-5 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm">
                Close
              </button>
              <button
                onClick={() => { setStatus('idle'); setAnalysis(null); }}
                className="px-5 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition-colors text-sm flex items-center gap-2"
              >
                <Zap className="w-4 h-4" /> Re-Analyse
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
    <div className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
      {/* Decorative top accent */}
      <div className={`absolute top-0 left-0 w-full h-1 ${style.bar}`} />

      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 pr-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600">
              {caseItem.category}
            </span>
            <span className="text-xs text-gray-400">• ID #{caseItem.id}</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 leading-snug group-hover:text-blue-700 transition-colors">
            {caseItem.title}
          </h3>
        </div>
        <div className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${style.bg} ${style.text} border ${style.border}`}>
          <StatusIcon className="w-3.5 h-3.5" />
          {style.label}
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-6 line-clamp-2 min-h-[40px]">
        {caseItem.description}
      </p>

      {/* Progress Section */}
      <div className="mb-6 bg-gray-50 rounded-xl p-3 border border-gray-100">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-medium text-gray-600">Case Progress</span>
          <span className="font-bold text-gray-900">{caseItem.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out ${style.bar}`}
            style={{ width: `${caseItem.progress}%` }}
          />
        </div>
      </div>

      {/* Action Meta */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Target className="w-3 h-3" /> Next Action
          </span>
          <span className="text-sm font-medium text-gray-900 truncate" title={caseItem.nextAction}>
            {caseItem.nextAction}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Due Date
          </span>
          <span className="text-sm font-medium text-gray-900">
            {caseItem.dueDate}
          </span>
        </div>
      </div>

      {/* Buttons Row */}
      <div className="flex gap-2">
        <button
          onClick={() => onViewDetails(caseItem)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 hover:border-blue-300 hover:text-blue-600 transition-all text-sm"
        >
          View Details
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
        <button
          onClick={() => onAnalyze(caseItem)}
          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg font-medium hover:from-violet-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-violet-200 transition-all text-sm"
        >
          <Zap className="w-4 h-4" />
          Analyze
        </button>
      </div>
    </div>
  );
};

// ─── Case Details Modal (preserved) ───────────────────────────────────────

const CaseDetailsModal = ({ caseItem, isOpen, onClose }) => {
  if (!isOpen || !caseItem) return null;

  const details = caseDetails[caseItem.id];

  const getTimelineStyles = (status) => {
    switch (status) {
      case 'completed': return { dot: 'bg-green-500 ring-green-100', line: 'bg-green-500', text: 'text-green-700 bg-green-50 border-green-200' };
      case 'pending': return { dot: 'bg-amber-500 ring-amber-100', line: 'bg-gray-200', text: 'text-amber-700 bg-amber-50 border-amber-200' };
      default: return { dot: 'bg-gray-300 ring-gray-100', line: 'bg-gray-200', text: 'text-blue-700 bg-blue-50 border-blue-200' };
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-6 sm:p-8 border-b border-gray-100 flex items-start justify-between bg-gray-50/50">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">#{caseItem.id}</span>
              <span className="text-sm font-medium text-gray-500">{caseItem.category}</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{caseItem.title}</h2>
            <p className="text-gray-600">{caseItem.description}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-white">
          <div className="grid lg:grid-cols-3 gap-8">

            {/* Left Column: Timeline */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <Activity className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-gray-900">Case Journey</h3>
              </div>

              <div className="relative pl-4 space-y-8">
                <div className="absolute left-[23px] top-2 bottom-2 w-0.5 bg-gray-100" />

                {details.timeline.map((item, index) => {
                  const styles = getTimelineStyles(item.status);
                  return (
                    <div key={index} className="relative flex gap-6 group">
                      <div className={`relative z-10 flex-shrink-0 w-5 h-5 rounded-full ${styles.dot} ring-4 mt-1.5 transition-all group-hover:scale-110`} />
                      <div className="flex-1 bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">{item.event}</h4>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${styles.text}`}>
                            {item.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
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

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                <span className="text-sm font-medium text-green-800 opacity-80">Estimated Case Value</span>
                <p className="text-3xl font-bold text-green-700 mt-1">{details.amount}</p>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" /> Parties Involved
                </h4>
                <div className="space-y-4">
                  {Object.entries(details.parties).map(([role, name]) => (
                    <div key={role} className="flex flex-col">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{role}</span>
                      <div className="flex items-center gap-2 text-sm text-gray-800 font-medium">
                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                          <User className="w-3 h-3" />
                        </div>
                        {name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-500" /> Evidence & Docs
                </h4>
                <div className="space-y-2">
                  {details.documents.map((doc, index) => (
                    <div key={index} className="flex items-center p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-md mr-3 group-hover:bg-blue-100 transition-colors">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="text-sm text-gray-600 group-hover:text-gray-900 font-medium">{doc}</span>
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
    <div className="flex h-screen bg-slate-50 font-sans">
      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-600">
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Case Manager</h1>
              <p className="text-sm text-slate-500">Track and manage your legal cases</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">

            {/* Hero / Dashboard Summary */}
            <div className="grid md:grid-cols-3 gap-6 mb-10">
              <div className="md:col-span-2 bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Scale className="w-48 h-48" />
                </div>
                <div className="relative z-10">
                  <h1 className="text-3xl font-bold mb-2">My Legal Cases</h1>
                  <p className="text-blue-100 text-lg mb-6 max-w-lg">
                    Manage your ongoing litigations, track hearings, and access documents all in one secure place.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowNewCaseModal(true)}
                      className="px-5 py-2.5 bg-white text-blue-900 rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-lg flex items-center gap-2"
                    >
                      <Plus className="w-5 h-5" /> File New Case
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-2 text-gray-500">
                  <Activity className="w-5 h-5" />
                  <span className="text-sm font-medium uppercase tracking-wide">Active Cases</span>
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-2">{mockCases.length}</div>
                <div className="text-sm text-green-600 flex items-center gap-1 bg-green-50 w-fit px-2 py-1 rounded-md">
                  <Clock className="w-3 h-3" />
                  <span>All up to date</span>
                </div>
              </div>
            </div>

            {/* Filters & Controls */}
            <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between">
              <div className="relative w-full md:w-96 group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search by case title or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-all"
                />
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative w-full md:w-auto">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="w-full md:w-48 flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-gray-300 focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                  >
                    <span>{selectedStatusLabel}</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showDropdown && (
                    <div className="absolute top-full right-0 mt-2 w-full md:w-56 bg-white border border-gray-100 rounded-xl shadow-xl z-20 py-1 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                      {statusOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleStatusSelect(option.value)}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${statusFilter === option.value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                            }`}
                        >
                          {option.label}
                          {statusFilter === option.value && <CheckCircle className="w-4 h-4" />}
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
              <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No cases found</h3>
                <p className="text-gray-500 mb-6 max-w-sm mx-auto">We could not find any cases matching your search criteria. Try adjusting filters.</p>
                <button
                  onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                  className="text-blue-600 font-medium hover:underline"
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
              <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-900">Start New Case</h2>
                    <button onClick={() => setShowNewCaseModal(false)} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-6 space-y-5">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Phone Number</label>
                      <input
                        type="tel"
                        placeholder="+91 98765 43210"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Case Title</label>
                      <input
                        type="text"
                        placeholder="E.g., Property Dispute"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Category</label>
                      <div className="relative">
                        <select className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none bg-white transition-all">
                          <option>Consumer Law</option>
                          <option>Property Law</option>
                          <option>Criminal Law</option>
                          <option>Family Law</option>
                          <option>Government / RTI</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Description</label>
                      <textarea
                        placeholder="Briefly describe the issue..."
                        rows="3"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none transition-all"
                      />
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <p className="text-sm text-blue-800 leading-relaxed">
                        A specialized lawyer will review this preliminary info and contact you within 24 hours.
                      </p>
                    </div>
                  </div>

                  <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                    <button
                      onClick={() => setShowNewCaseModal(false)}
                      className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-white hover:shadow-sm transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        alert('Case created! Our lawyer will contact you within 24 hours.');
                        setShowNewCaseModal(false);
                      }}
                      className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-blue-500/30 transition-all"
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
