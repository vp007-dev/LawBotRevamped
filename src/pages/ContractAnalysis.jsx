import React, { useState, useEffect } from 'react';
import { Upload, FileText, AlertTriangle, Shield, Eye, Trash2, Clock, CheckCircle, XCircle, Loader, X, FileSearch, ArrowRight, Activity, MessageCircle, Send, Scale, BookOpen, Menu, Volume2, BarChart3, Info, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import contractAnalysisService from '../services/contractAnalysisService';
import aiService from '../services/aiService';
import logo from '../assets/lawbot360-logo-updated.svg';

const ContractAnalysis = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [analyses, setAnalyses] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [analysisStatus, setAnalysisStatus] = useState('');

  // Text-to-speech for accessibility
  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-IN';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    loadAnalyses();
  }, []);

  const loadAnalyses = () => {
    const savedAnalyses = contractAnalysisService.getAnalyses();
    setAnalyses(savedAnalyses);
  };

  const handleFileUpload = async (files) => {
    const file = files[0];
    if (!file) return;

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/tiff',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      alert('Please upload PDF, Word, Image, or Text files only.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisStatus('Reading document...');
    try {
      const analysis = await contractAnalysisService.analyzeContract(file, (status) => {
        setAnalysisStatus(status);
      });
      loadAnalyses();
      setSelectedAnalysis(analysis);
      setShowModal(true);
    } catch (error) {
      alert('Analysis failed: ' + error.message);
    } finally {
      setIsAnalyzing(false);
      setAnalysisStatus('');
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'High':
      case 'Critical':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      case 'Medium':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      default:
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    }
  };

  const getRiskIcon = (riskLevel) => {
    switch (riskLevel) {
      case 'High':
      case 'Critical':
        return <XCircle className="w-5 h-5" />;
      case 'Medium':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <CheckCircle className="w-5 h-5" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'bg-rose-500/10 text-rose-300 border-rose-500/30';
      case 'high':
        return 'bg-orange-500/10 text-orange-300 border-orange-500/30';
      case 'medium':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      default:
        return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
    }
  };

  const deleteAnalysis = (analysisId) => {
    if (confirm('Are you sure you want to delete this analysis?')) {
      contractAnalysisService.deleteAnalysis(analysisId);
      loadAnalyses();
    }
  };

  // Simple Bar Chart Component
  const SimpleBarChart = ({ data }) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);

    return (
      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                {item.icon}
                {item.label}
              </span>
              <span className="text-lg font-bold text-white">{item.value}</span>
            </div>
            <div className="w-full bg-[#11131a] border border-white/[0.06] rounded-full h-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${item.color}`}
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Enhanced Modal with Professional Design
  const AnalysisModal = ({ analysis, isOpen, onClose }) => {
    const [chatMessages, setChatMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoadingChat, setIsLoadingChat] = useState(false);

    if (!isOpen || !analysis) return null;

    const structuredData = analysis.structuredData || {
      executiveSummary: '',
      keyClauses: [],
      hiddenRisks: [],
      unfairTerms: [],
      complianceScores: {},
      recommendations: []
    };

    // Handle chat message sending
    const handleSendMessage = async () => {
      if (!inputMessage.trim() || isLoadingChat) return;

      const userMessage = { role: 'user', content: inputMessage };
      setChatMessages(prev => [...prev, userMessage]);
      setInputMessage('');
      setIsLoadingChat(true);

      try {
        // Include analysis context for AI
        const fullContext = `
CONTRACT ANALYSIS REPORT:

File: ${analysis.fileName}
Risk Level: ${analysis.riskLevel}
Risk Score: ${analysis.riskScore}/100

FULL ANALYSIS:
${analysis.analysis}

EXECUTIVE SUMMARY:
${structuredData.executiveSummary || 'Not available'}

User Question: "${inputMessage}"

Answer based on the contract analysis above. Be specific and reference details from the analysis.`;

        const result = await aiService.sendMessage(fullContext, 'contract');

        const aiMessage = {
          role: 'assistant',
          content: result.success ? result.response : 'Sorry, I encountered an error. Please try again.'
        };
        setChatMessages(prev => [...prev, aiMessage]);
      } catch (error) {
        const errorMessage = { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' };
        setChatMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoadingChat(false);
      }
    };

    const handleKeyPress = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    };

    // Prepare chart data
    const riskCategoryData = [
      {
        label: 'Problematic Terms',
        value: structuredData.unfairTerms.length,
        color: 'bg-rose-500',
        icon: <AlertTriangle className="w-5 h-5 text-rose-400" />
      },
      {
        label: 'Hidden Risks',
        value: structuredData.hiddenRisks.length,
        color: 'bg-amber-500',
        icon: <Eye className="w-5 h-5 text-amber-400" />
      },
      {
        label: 'Key Clauses',
        value: structuredData.keyClauses.length,
        color: 'bg-violet-500',
        icon: <FileText className="w-5 h-5 text-violet-400" />
      }
    ];

    return (
      <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-[#141721] rounded-2xl border border-white/[0.08] shadow-2xl shadow-black/80 max-w-7xl w-full max-h-[90vh] flex flex-col overflow-hidden text-[#f1f5f9]">
          {/* Modal Header */}
          <div className="bg-[#161922] p-6 border-b border-white/[0.08] flex items-start justify-between sticky top-0 z-10">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getRiskColor(analysis.riskLevel)}`}>
                  {getRiskIcon(analysis.riskLevel)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white leading-tight">{analysis.fileName}</h2>
                  <p className="text-xs uppercase tracking-wider text-slate-400 mt-1 font-medium">Contract Analysis Report</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-4">
                <span className={`px-4 py-2 rounded-xl text-xs font-bold border shadow-xs flex items-center gap-2 ${getRiskColor(analysis.riskLevel)}`}>
                  {getRiskIcon(analysis.riskLevel)}
                  <span className="uppercase tracking-wider">{analysis.riskLevel} RISK</span>
                </span>

                <span className="px-4 py-2 bg-[#11131a] border border-white/[0.08] rounded-xl text-xs font-bold text-slate-300 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-400" />
                  Score: {analysis.riskScore || 'N/A'}/100
                </span>

                {/* Audio Button */}
                <button
                  onClick={() => speakText(structuredData.executiveSummary || analysis.plainLanguageAnalysis)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-all flex items-center gap-2 font-semibold text-xs shadow-md shadow-purple-900/20 active:scale-95"
                  title="Listen to Summary"
                >
                  <Volume2 className="w-4 h-4" />
                  Listen
                </button>
              </div>
            </div>

            <button onClick={onClose} className="p-2 hover:bg-white/[0.06] rounded-xl text-slate-400 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="bg-[#141721] border-b border-white/[0.08] px-6 overflow-x-auto">
            <div className="flex gap-1 min-w-max">
              {[
                { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
                { id: 'clauses', label: 'Key Terms', icon: <FileText className="w-4 h-4" /> },
                { id: 'risks', label: 'Hidden Risks', icon: <AlertTriangle className="w-4 h-4" /> },
                { id: 'unfair', label: 'Problem Areas', icon: <XCircle className="w-4 h-4" /> },
                { id: 'recommendations', label: 'Actions', icon: <CheckCircle className="w-4 h-4" /> },
                { id: 'questions', label: 'Ask Questions', icon: <MessageCircle className="w-4 h-4" /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3.5 font-semibold text-xs flex items-center gap-2 border-b-2 transition-all ${activeTab === tab.id
                    ? 'border-purple-500 text-purple-400 bg-purple-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                    }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#0c0e14]">
            <div className="max-w-6xl mx-auto space-y-6">

              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Executive Summary */}
                  {structuredData.executiveSummary && (
                    <div className="bg-[#161922] rounded-2xl border border-white/[0.08] shadow-lg shadow-black/30 p-6 md:p-8">
                      <div className="flex items-center gap-3 mb-4">
                        <Info className="w-5 h-5 text-purple-400" />
                        <h3 className="text-lg font-bold text-white">Summary in Plain English</h3>
                      </div>
                      <p className="text-slate-300 leading-relaxed text-sm md:text-base">
                        {structuredData.executiveSummary}
                      </p>
                    </div>
                  )}

                  {/* Visual Charts */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Risk Category Chart */}
                    {riskCategoryData.some(d => d.value > 0) && (
                      <div className="bg-[#161922] rounded-2xl border border-white/[0.08] shadow-lg shadow-black/30 p-6">
                        <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-purple-400" />
                          Issues Found
                        </h3>
                        <SimpleBarChart data={riskCategoryData} />
                      </div>
                    )}

                    {/* Compliance Scores */}
                    {Object.keys(structuredData.complianceScores).length > 0 && (
                      <div className="bg-[#161922] rounded-2xl border border-white/[0.08] shadow-lg shadow-black/30 p-6">
                        <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
                          <Scale className="w-4 h-4 text-emerald-400" />
                          Legal Compliance
                        </h3>
                        <div className="space-y-4">
                          {Object.entries(structuredData.complianceScores).map(([category, score]) => (
                            <div key={category}>
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-semibold text-slate-300">{category}</span>
                                <span className="text-base font-bold text-white">{score}%</span>
                              </div>
                              <div className="w-full bg-[#11131a] border border-white/[0.06] rounded-full h-3">
                                <div
                                  className={`h-3 rounded-full transition-all duration-1000 ${score >= 70 ? 'bg-emerald-500' :
                                    score >= 40 ? 'bg-amber-500' :
                                      'bg-rose-500'
                                    }`}
                                  style={{ width: `${score}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Key Clauses Tab */}
              {activeTab === 'clauses' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <FileText className="w-5 h-5 text-purple-400" />
                      Main Contract Terms
                    </h3>
                    <span className="text-xs text-purple-300 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full font-semibold">
                      {structuredData.keyClauses.length} clauses
                    </span>
                  </div>
                  {structuredData.keyClauses.length === 0 ? (
                    <div className="bg-[#161922] rounded-2xl p-12 text-center border border-white/[0.08]">
                      <FileText className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                      <p className="text-slate-400 text-base">No clauses identified in this analysis</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {structuredData.keyClauses.map((clause, index) => (
                        <div key={index} className="bg-[#161922] rounded-2xl border border-white/[0.08] p-6 hover:border-purple-500/40 transition-all">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${getRiskColor(clause.riskLevel)}`}>
                                {getRiskIcon(clause.riskLevel)}
                              </div>
                              <h4 className="text-base font-bold text-white">{clause.name}</h4>
                            </div>
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1 ${getRiskColor(clause.riskLevel)}`}>
                              {clause.riskLevel}
                            </span>
                          </div>
                          <p className="text-slate-300 text-sm mb-3 leading-relaxed">{clause.summary}</p>
                          {clause.details && (
                            <details className="mt-3 text-xs text-slate-400">
                              <summary className="cursor-pointer font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-2">
                                <ArrowRight className="w-3.5 h-3.5" />
                                Read Full Details
                              </summary>
                              <p className="mt-3 pl-4 border-l-2 border-purple-500/30 leading-relaxed text-slate-300">{clause.details}</p>
                            </details>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Hidden Risks Tab */}
              {activeTab === 'risks' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Eye className="w-5 h-5 text-orange-400" />
                      Hidden Risks & Red Flags
                    </h3>
                    <span className="text-xs text-orange-300 bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-full font-semibold">
                      {structuredData.hiddenRisks.length} risks
                    </span>
                  </div>
                  {structuredData.hiddenRisks.length === 0 ? (
                    <div className="bg-[#161922] rounded-2xl p-12 text-center border border-white/[0.08]">
                      <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                      <p className="text-white text-base font-semibold">No hidden risks detected</p>
                      <p className="text-slate-400 text-sm mt-1">This is a clean sign!</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {structuredData.hiddenRisks.map((risk, index) => (
                        <div key={index} className={`rounded-2xl border p-6 bg-[#161922] ${getSeverityColor(risk.severity)}`}>
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/[0.04] border border-current">
                              <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="text-base font-bold flex-1 text-white">{risk.risk}</h4>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-current uppercase">
                                  {risk.severity}
                                </span>
                              </div>
                              <p className="mb-3 leading-relaxed text-xs md:text-sm text-slate-300">
                                <strong className="font-semibold text-white">Potential Impact:</strong> {risk.impact}
                              </p>
                              <div className="bg-[#11131a] rounded-xl p-4 border border-white/[0.06]">
                                <p className="font-semibold mb-1 flex items-center gap-2 text-xs text-emerald-400">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  Recommended Action:
                                </p>
                                <p className="leading-relaxed text-xs text-slate-300">{risk.recommendation}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Unfair/Illegal Terms Tab */}
              {activeTab === 'unfair' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-rose-400" />
                      Problematic or Illegal Terms
                    </h3>
                    <span className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full font-semibold">
                      {structuredData.unfairTerms.length} issues
                    </span>
                  </div>
                  {structuredData.unfairTerms.length === 0 ? (
                    <div className="bg-[#161922] rounded-2xl p-12 text-center border border-white/[0.08]">
                      <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                      <p className="text-white text-base font-semibold">No unfair terms detected</p>
                      <p className="text-slate-400 text-sm mt-1">This contract appears balanced</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {structuredData.unfairTerms.map((term, index) => (
                        <div key={index} className="bg-[#1a1419] rounded-2xl border border-rose-500/30 p-6">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center border border-rose-500/30">
                              <AlertCircle className="w-5 h-5 text-rose-400" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-base font-bold text-white mb-3">{term.term}</h4>

                              <div className="space-y-3">
                                <div className="bg-[#141721] rounded-xl p-4 border border-white/[0.06]">
                                  <p className="font-semibold text-rose-300 mb-1 text-xs flex items-center gap-2">
                                    <Scale className="w-3.5 h-3.5" />
                                    Legal Issue:
                                  </p>
                                  <p className="text-slate-300 text-xs">{term.legalIssue}</p>
                                </div>

                                {term.applicableLaw && (
                                  <div className="bg-[#141721] rounded-xl p-4 border border-white/[0.06]">
                                    <p className="font-semibold text-slate-300 mb-1 text-xs flex items-center gap-2">
                                      <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                                      Applicable Law:
                                    </p>
                                    <p className="text-slate-400 text-xs">{term.applicableLaw}</p>
                                  </div>
                                )}

                                {term.alternative && (
                                  <div className="bg-[#111915] rounded-xl p-4 border border-emerald-500/20">
                                    <p className="font-semibold text-emerald-400 mb-1 text-xs flex items-center gap-2">
                                      <CheckCircle className="w-3.5 h-3.5" />
                                      Better Alternative:
                                    </p>
                                    <p className="text-slate-300 text-xs leading-relaxed">{term.alternative}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Recommendations Tab */}
              {activeTab === 'recommendations' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                      Recommended Actions
                    </h3>
                    <span className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full font-semibold">
                      {structuredData.recommendations.length} steps
                    </span>
                  </div>
                  {structuredData.recommendations.length === 0 ? (
                    <div className="bg-[#161922] rounded-2xl p-12 text-center border border-white/[0.08]">
                      <Info className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                      <p className="text-slate-400 text-base">No specific recommendations</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {structuredData.recommendations.map((recommendation, index) => (
                        <div key={index} className="bg-[#161922] rounded-2xl border border-white/[0.08] p-6 hover:border-purple-500/40 transition-all">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-purple-500/10 rounded-full flex items-center justify-center border border-purple-500/30">
                              <span className="text-purple-300 font-bold text-xs">{index + 1}</span>
                            </div>
                            <p className="text-sm text-slate-300 leading-relaxed flex-1 pt-1">{recommendation}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Ask Questions Tab */}
              {activeTab === 'questions' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-purple-400" />
                        Ask Questions About This Contract
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">Get instant answers about any clause or term</p>
                    </div>
                  </div>

                  {/* Chat Messages Container */}
                  <div className="bg-[#161922] rounded-2xl border border-white/[0.08] shadow-lg shadow-black/30 overflow-hidden">
                    {/* Messages Area */}
                    <div className="h-96 overflow-y-auto p-6">
                      {chatMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                          <div className="w-14 h-14 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-center mb-4 text-purple-400">
                            <MessageCircle className="w-7 h-7" />
                          </div>
                          <h4 className="font-semibold text-white mb-1">Ask Anything</h4>
                          <p className="text-slate-400 text-xs max-w-md">
                            Ask me questions about this contract. For example:
                          </p>
                          <div className="mt-4 space-y-2 text-left w-full max-w-md">
                            <div className="text-xs text-slate-300 bg-[#11131a] border border-white/[0.06] px-3 py-2 rounded-xl">
                              • "What are the main risks in this contract?"
                            </div>
                            <div className="text-xs text-slate-300 bg-[#11131a] border border-white/[0.06] px-3 py-2 rounded-xl">
                              • "Explain the termination clause in simple terms"
                            </div>
                            <div className="text-xs text-slate-300 bg-[#11131a] border border-white/[0.06] px-3 py-2 rounded-xl">
                              • "Is this contract fair to both parties?"
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {chatMessages.map((message, index) => (
                            <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[80%] rounded-2xl p-4 ${message.role === 'user'
                                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20'
                                  : 'bg-[#11131a] text-slate-200 border border-white/[0.08]'
                                }`}>
                                {message.role === 'assistant' && (
                                  <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-purple-400">
                                    <Scale className="w-3.5 h-3.5" />
                                    LawBot AI
                                  </div>
                                )}
                                <p className="text-xs md:text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                              </div>
                            </div>
                          ))}
                          {isLoadingChat && (
                            <div className="flex justify-start">
                              <div className="bg-[#11131a] rounded-2xl p-4 border border-white/[0.08]">
                                <div className="flex items-center gap-2">
                                  <Loader className="w-4 h-4 animate-spin text-purple-400" />
                                  <span className="text-xs text-slate-400">Analyzing...</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Input Area */}
                    <div className="border-t border-white/[0.08] p-4 bg-[#141721]">
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Type your question here..."
                          className="flex-1 px-4 py-2.5 border border-white/[0.1] rounded-xl focus:outline-none focus:border-purple-500 text-xs md:text-sm bg-[#11131a] text-white placeholder:text-slate-500"
                          disabled={isLoadingChat}
                        />
                        <button
                          onClick={handleSendMessage}
                          disabled={!inputMessage.trim() || isLoadingChat}
                          className="px-5 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 font-semibold text-xs shadow-md shadow-purple-900/20"
                        >
                          <Send className="w-4 h-4" />
                          Send
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-2">Press Enter to send, Shift+Enter for new line</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Main Render
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
              <h1 className="text-2xl font-bold text-white tracking-tight">Contract Analysis</h1>
              <p className="text-xs text-slate-400 font-medium">AI-powered contract & agreement review</p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Hero Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
              <div>
                <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Document Analysis</h1>
                <p className="text-sm md:text-base text-slate-400 max-w-2xl leading-relaxed">
                  Upload legal contracts to instantly identify risks, translate legalese into plain English, and detect deviations from standard clauses.
                </p>
              </div>
              <div className="flex gap-3">
                 <div className="flex items-center gap-2 text-xs font-semibold bg-[#161922] border border-white/[0.08] px-3.5 py-1.5 rounded-full text-slate-300 shadow-sm">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" /> AES-256 Encrypted
                 </div>
                 <div className="flex items-center gap-2 text-xs font-semibold bg-[#161922] border border-white/[0.08] px-3.5 py-1.5 rounded-full text-slate-300 shadow-sm">
                    <FileText className="w-3.5 h-3.5 text-purple-400" /> OCR Support
                 </div>
              </div>
            </div>

            {/* Upload Section - "The Drop Zone" */}
            <div className="mb-10">
              <div
                className={`relative group rounded-2xl border-2 border-dashed transition-all duration-300 ease-out overflow-hidden
                  ${dragActive 
                    ? 'border-purple-500 bg-purple-950/20 scale-[1.01] shadow-2xl shadow-purple-900/30' 
                    : 'border-white/[0.1] bg-[#161922] hover:border-purple-500/50 hover:bg-[#1a1d27] shadow-xl shadow-black/20'
                  }
                  ${isAnalyzing ? 'pointer-events-none border-purple-500/30 bg-[#161922]' : 'cursor-pointer'}
                `}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
              >
                <div className="p-10 md:p-14 min-h-[300px] flex flex-col items-center justify-center text-center">
                  {isAnalyzing ? (
                    <div className="flex flex-col items-center animate-in fade-in duration-500">
                      <div className="relative w-20 h-20 mb-6">
                        <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-purple-500 rounded-full border-t-transparent animate-spin"></div>
                        <Shield className="absolute inset-0 m-auto w-8 h-8 text-purple-400 animate-pulse" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">Analyzing Your Contract...</h3>
                      <p className="text-purple-400 font-semibold max-w-sm text-sm">{analysisStatus || 'Checking for legal risks & obligations...'}</p>
                    </div>
                  ) : (
                    <>
                      <div className={`w-20 h-20 rounded-2xl bg-violet-500/10 border border-violet-500/25 flex items-center justify-center mb-6 shadow-sm transition-transform duration-300 ${dragActive ? 'scale-110 rotate-3' : 'group-hover:scale-105'}`}>
                        <Upload className="w-10 h-10 text-violet-400" />
                      </div>

                      <h3 className="text-2xl font-bold text-white mb-2">
                        {dragActive ? 'Drop your document here' : 'Upload Contract Document'}
                      </h3>

                      <p className="text-slate-400 mb-6 max-w-md mx-auto leading-relaxed text-sm">
                        Supports PDF, Word, Images, and Text files
                        <br /><span className="text-xs text-slate-500 mt-1.5 block">Maximum file size: 10MB</span>
                      </p>

                      <input
                        type="file"
                        onChange={(e) => handleFileUpload(e.target.files)}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.tiff,.txt"
                        className="hidden"
                        id="contract-upload"
                      />
                      <label
                        htmlFor="contract-upload"
                        className="px-8 py-3 bg-purple-600 text-white rounded-xl font-bold shadow-lg shadow-purple-900/30 hover:bg-purple-500 transition-all active:scale-95 flex items-center gap-2 cursor-pointer text-sm"
                      >
                        <Upload className="w-4 h-4" />
                        Choose File
                      </label>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Analysis List */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Recent Analysis</h2>
              </div>

              <div className="bg-[#161922] rounded-2xl border border-white/[0.08] shadow-xl shadow-black/20 overflow-hidden">
                {analyses.length === 0 ? (
                  <div className="text-center py-16 px-6">
                    <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <h3 className="text-white font-semibold text-lg mb-1">No analyses yet</h3>
                    <p className="text-slate-400 text-sm">Upload a contract above to get started</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/[0.06]">
                    {analyses.map((analysis) => (
                      <div key={analysis.id} className="p-6 hover:bg-white/[0.02] transition-colors group">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">

                          {/* File Info */}
                          <div className="flex items-start gap-4 flex-1">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getRiskColor(analysis.riskLevel)}`}>
                              {getRiskIcon(analysis.riskLevel)}
                            </div>
                            <div>
                              <h3 className="font-bold text-white group-hover:text-purple-300 transition-colors mb-1 text-base">
                                {analysis.fileName}
                              </h3>
                              <div className="flex items-center gap-4 text-xs text-slate-400">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  {new Date(analysis.analyzedAt).toLocaleDateString()}
                                </span>
                                <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${getRiskColor(analysis.riskLevel)}`}>
                                  {analysis.riskLevel} Risk
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => {
                                setSelectedAnalysis(analysis);
                                setShowModal(true);
                              }}
                              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-purple-900/20 transition-all flex items-center gap-2 active:scale-95"
                            >
                              <Eye className="w-4 h-4" /> View Details
                            </button>
                            <button
                              onClick={() => deleteAnalysis(analysis.id)}
                              className="p-2.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Analysis Modal */}
            <AnalysisModal 
              analysis={selectedAnalysis}
              isOpen={showModal}
              onClose={() => setShowModal(false)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractAnalysis;