import React, { useState, useEffect } from 'react';
import { 
  FileText, Download, Scale, AlertCircle, Clock, X, CheckSquare, Square,
  BookOpen, ShieldAlert, CheckCircle2, ChevronRight, Copy, Check 
} from 'lucide-react';

const ConsultationReport = ({ isOpen, onClose, conversationData }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary', 'issues', 'checklist', 'citations'
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [expandedIssue, setExpandedIssue] = useState(null);

  useEffect(() => {
    if (isOpen && conversationData) {
      generateReportFromAudio();
    }
  }, [isOpen, conversationData]);

  const generateReportFromAudio = async () => {
    if (!conversationData) return;
    
    console.log('📄 ConsultationReport: Analyzing transcript:', conversationData);
    setIsGenerating(true);
    setError(null);
    setCompletedSteps(new Set());
    setExpandedIssue(null);
    
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY_voice;
    const modelName = 'gemini-3.1-flash-lite';

    if (!apiKey) {
      setError('Gemini API Key is missing. Please configure VITE_GEMINI_API_KEY in your .env file.');
      setIsGenerating(false);
      return;
    }

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Analyze the following legal consultation dialogue between a client and their advocate:

${conversationData}

Generate a comprehensive, professional, and detailed legal brief report.
You MUST respond strictly in valid JSON format. Do not wrap the JSON in markdown code blocks. 
JSON Structure:
{
  "summary": "A detailed, professional executive summary of the consultation (2-3 paragraphs)...",
  "riskScore": 7, // Scale of 1 to 10 based on legal vulnerability, severity, and urgency
  "legalPositioning": {
    "strengths": ["list item 1 detailing a case strength...", "list item 2..."],
    "weaknesses": ["list item 1 detailing a case weakness or risk...", "list item 2..."]
  },
  "keyIssues": [
    {
      "issue": "Title of the legal issue...",
      "description": "Comprehensive explanation of this issue, the relevant facts, and why it is critical...",
      "severity": "High|Medium|Low"
    }
  ],
  "suggestedNextSteps": [
    {
      "step": "Actionable, clear legal step to take...",
      "priority": "High|Medium|Low",
      "timeframe": "e.g., Immediately / Within 48 hours / Next court date"
    }
  ],
  "legalReferences": [
    {
      "act": "Name of the Act (e.g., Bharatiya Nyaya Sanhita, 2023)...",
      "section": "Section number(s) (e.g., Section 305)...",
      "relevance": "Specific relevance and explanation of how this section applies to their exact case facts..."
    }
  ]
}`
            }]
          }]
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        const reportText = data.candidates[0].content.parts[0].text;
        const jsonMatch = reportText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsedReport = JSON.parse(jsonMatch[0]);
          console.log('✅ ConsultationReport: Brief generated:', parsedReport);
          setReport(parsedReport);
        } else {
          throw new Error('Invalid JSON shape returned from Gemini');
        }
      } else {
        throw new Error('Empty response from generative model');
      }
    } catch (err) {
      console.error('❌ ConsultationReport: Brief generation failed:', err);
      setError(`Brief Generation Failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleCheckstep = (index) => {
    const next = new Set(completedSteps);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setCompletedSteps(next);
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const downloadReport = () => {
    if (!report) return;
    const blob = new Blob([
      JSON.stringify({ 
        title: 'Advocate-Client Case Brief', 
        timestamp: new Date().toISOString(), 
        ...report 
      }, null, 2)
    ], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Legal-Brief-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getRiskColor = (score) => {
    if (score >= 8) return { text: 'text-rose-600', bg: 'bg-rose-50 border-rose-200', fill: 'bg-rose-500' };
    if (score >= 5) return { text: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', fill: 'bg-amber-500' };
    return { text: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', fill: 'bg-emerald-500' };
  };

  const getSeverityBadge = (severity) => {
    switch (severity.toLowerCase()) {
      case 'high': return 'bg-red-50 text-red-700 border-red-200';
      case 'medium': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 print:p-0">
      <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-8 py-5 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-100 rounded-xl text-slate-800 border border-slate-200">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-serif text-slate-900 leading-tight">
                Case Brief & Action Plan
              </h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                Privileged & Confidential • Client Consultation Brief
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        {!isGenerating && report && (
          <div className="flex border-b border-slate-100 px-6 bg-slate-50/50 shrink-0 overflow-x-auto gap-2 py-1">
            <button
              onClick={() => setActiveTab('summary')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap rounded-t-lg ${
                activeTab === 'summary' 
                  ? 'border-slate-900 text-slate-900 bg-white' 
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" /> Briefing Summary
            </button>
            <button
              onClick={() => setActiveTab('issues')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap rounded-t-lg ${
                activeTab === 'issues' 
                  ? 'border-slate-900 text-slate-900 bg-white' 
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <ShieldAlert className="w-4 h-4" /> Case Issues & Risks
            </button>
            <button
              onClick={() => setActiveTab('checklist')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap rounded-t-lg ${
                activeTab === 'checklist' 
                  ? 'border-slate-900 text-slate-900 bg-white' 
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <CheckSquare className="w-4 h-4" /> Interactive Checklist
            </button>
            <button
              onClick={() => setActiveTab('citations')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap rounded-t-lg ${
                activeTab === 'citations' 
                  ? 'border-slate-900 text-slate-900 bg-white' 
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4" /> Statutory Citations
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6 md:p-8">
          
          {/* Loading State */}
          {isGenerating && (
            <div className="h-full flex flex-col items-center justify-center py-20">
              <div className="relative mb-6">
                <div className="w-16 h-16 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                   <Scale className="w-6 h-6 text-slate-400" />
                </div>
              </div>
              <h3 className="text-slate-900 font-bold text-lg">Analyzing Consultation...</h3>
              <p className="text-slate-500 text-sm mt-1">Generating custom legal brief and action plan</p>
              
              {/* Animated progress blocks */}
              <div className="flex gap-1.5 mt-5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-900 animate-bounce delay-75"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-slate-900 animate-bounce delay-150"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-slate-900 animate-bounce delay-200"></span>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center max-w-md mx-auto">
              <AlertCircle className="w-10 h-10 text-red-600 mx-auto mb-3 animate-bounce" />
              <h3 className="text-red-950 font-bold text-lg">Briefing Failed</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
              <button 
                onClick={generateReportFromAudio} 
                className="mt-5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-all shadow-sm"
              >
                Retry Analysis
              </button>
            </div>
          )}

          {/* Tab Pages */}
          {!isGenerating && report && (
            <div className="max-w-3xl mx-auto space-y-6">
              
              {/* TAB 1: BRIEFING SUMMARY */}
              {activeTab === 'summary' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-200">
                  
                  {/* Summary & Risk Score Panel */}
                  <div className="grid md:grid-cols-12 gap-6 items-start">
                    
                    {/* Summary text */}
                    <div className="md:col-span-8 bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-900"></div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" /> Executive Summary
                      </h3>
                      <p className="text-slate-800 leading-relaxed text-sm font-serif whitespace-pre-line">
                        {report.summary}
                      </p>
                    </div>

                    {/* Risk Gauge */}
                    <div className="md:col-span-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
                        Case Risk Assessment
                      </h4>
                      <div className="relative w-28 h-28 flex items-center justify-center">
                        {/* Circular Progress Gauge */}
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle 
                            cx="50" cy="50" r="40" 
                            className="stroke-slate-100 fill-transparent" 
                            strokeWidth="8"
                          />
                          <circle 
                            cx="50" cy="50" r="40" 
                            className={`fill-transparent transition-all duration-1000 ${
                              report.riskScore >= 8 ? 'stroke-rose-500' : report.riskScore >= 5 ? 'stroke-amber-500' : 'stroke-emerald-500'
                            }`}
                            strokeWidth="8"
                            strokeDasharray={2 * Math.PI * 40}
                            strokeDashoffset={2 * Math.PI * 40 * (1 - report.riskScore / 10)}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                          <span className="text-3xl font-bold text-slate-800 tracking-tighter">{report.riskScore}</span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase">scale 1-10</span>
                        </div>
                      </div>
                      
                      <div className={`mt-4 w-full px-3 py-1 rounded-full text-xs font-bold border text-center ${getRiskColor(report.riskScore).bg} ${getRiskColor(report.riskScore).text}`}>
                        {report.riskScore >= 8 ? 'CRITICAL RISK' : report.riskScore >= 5 ? 'MODERATE RISK' : 'STABLE POSTURE'}
                      </div>
                    </div>
                  </div>

                  {/* Strengths and Weaknesses */}
                  {report.legalPositioning && (
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Strengths */}
                      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-4">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Case Strengths / Advantages
                        </h4>
                        <ul className="space-y-2.5">
                          {report.legalPositioning.strengths?.map((str, idx) => (
                            <li key={idx} className="text-slate-600 text-xs flex gap-2 leading-relaxed">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                              <span>{str}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      {/* Weaknesses */}
                      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-4">
                          <AlertCircle className="w-4 h-4 text-amber-500" /> Vulnerabilities / Critical Risks
                        </h4>
                        <ul className="space-y-2.5">
                          {report.legalPositioning.weaknesses?.map((wk, idx) => (
                            <li key={idx} className="text-slate-600 text-xs flex gap-2 leading-relaxed">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0"></span>
                              <span>{wk}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* TAB 2: CASE ISSUES & RISKS */}
              {activeTab === 'issues' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">
                    Case Issues Log ({report.keyIssues?.length || 0})
                  </h3>
                  <div className="grid gap-3">
                    {report.keyIssues?.map((issue, idx) => {
                      const isExpanded = expandedIssue === idx;
                      return (
                        <div 
                          key={idx} 
                          onClick={() => setExpandedIssue(isExpanded ? null : idx)}
                          className={`bg-white rounded-xl border p-5 shadow-sm transition-all cursor-pointer hover:border-slate-300 ${
                            isExpanded ? 'ring-2 ring-slate-900 border-transparent' : 'border-slate-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                {issue.issue}
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${getSeverityBadge(issue.severity)}`}>
                                  {issue.severity}
                                </span>
                              </h4>
                              <p className={`text-slate-600 text-xs mt-2 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                                {issue.description}
                              </p>
                            </div>
                            <ChevronRight className={`w-4 h-4 text-slate-400 shrink-0 mt-0.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                          </div>
                          
                          {isExpanded && (
                            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center bg-slate-50/50 -mx-5 -mb-5 p-4 rounded-b-xl shrink-0">
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                Click card to collapse details
                              </span>
                              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                                Action Recommended
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: INTERACTIVE CHECKLIST */}
              {activeTab === 'checklist' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                      Action Checklist
                    </h3>
                    <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2.5 py-1 rounded-full">
                      {completedSteps.size} of {report.suggestedNextSteps?.length || 0} Complete
                    </span>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    {report.suggestedNextSteps?.map((step, idx) => {
                      const isDone = completedSteps.has(idx);
                      return (
                        <div 
                          key={idx} 
                          onClick={() => toggleCheckstep(idx)}
                          className={`flex items-start gap-4 p-5 border-b border-slate-50 last:border-0 hover:bg-slate-50/80 transition-colors cursor-pointer select-none ${
                            isDone ? 'bg-slate-50/45' : ''
                          }`}
                        >
                          <button className="mt-0.5 shrink-0 text-slate-400 hover:text-slate-800 transition-colors">
                            {isDone 
                              ? <CheckSquare className="w-5 h-5 text-slate-900 fill-slate-900/10" /> 
                              : <Square className="w-5 h-5" />
                            }
                          </button>
                          
                          <div className="flex-1">
                            <p className={`text-sm font-medium transition-colors ${
                              isDone ? 'text-slate-400 line-through' : 'text-slate-900'
                            }`}>
                              {step.step}
                            </p>
                            
                            <div className="flex items-center gap-4 mt-2 text-[10px]">
                              <span className="flex items-center gap-1 text-slate-400 font-medium">
                                <Clock className="w-3 h-3" /> {step.timeframe}
                              </span>
                              <span className={`font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                                step.priority.toLowerCase() === 'high' 
                                  ? 'text-red-600 bg-red-50 border-red-100' 
                                  : 'text-slate-500 bg-slate-100 border-slate-200'
                              }`}>
                                {step.priority} Priority
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 4: STATUTORY CITATIONS */}
              {activeTab === 'citations' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">
                    Statutory Citations & Context
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {report.legalReferences?.map((ref, idx) => (
                      <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative group hover:border-slate-300 transition-colors flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <h4 className="font-serif font-bold text-slate-900 text-sm pr-6 leading-tight">
                              {ref.act}
                            </h4>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(`Act: ${ref.act}, Section: ${ref.section}`, idx);
                              }}
                              className="absolute top-4 right-4 p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-800 rounded-lg border border-slate-200 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                              title="Copy Citation"
                            >
                              {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          <span className="text-[10px] font-bold font-mono text-slate-500 mt-2 bg-slate-100 inline-block px-2 py-0.5 rounded border border-slate-200 uppercase tracking-wider">
                            Section {ref.section}
                          </span>
                          <p className="text-xs text-slate-600 mt-3 leading-relaxed border-l-2 border-slate-200 pl-2.5 italic">
                            "{ref.relevance}"
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              <div className="pt-6 border-t border-slate-200 flex gap-3 opacity-70">
                <ShieldAlert className="w-8 h-8 text-slate-400 shrink-0" />
                <p className="text-[10px] text-slate-400 leading-relaxed text-justify">
                  <strong>Disclaimer:</strong> This automated brief is generated from client consultation logs. It is intended for initial strategic mapping and does not constitute formal legal representation. Verify all statutory citations with counsel.
                </p>
              </div>

            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!isGenerating && report && (
          <div className="px-8 py-4 bg-white border-t border-slate-200 flex justify-end gap-3 shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
            >
              Close Briefing
            </button>
            <button
              onClick={downloadReport}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-all shadow-sm flex items-center gap-2 active:scale-95 hover:translate-y-[-1px]"
            >
              <Download className="w-4 h-4" /> Download Brief JSON
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsultationReport;