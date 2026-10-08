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
    try {
      const analysis = await contractAnalysisService.analyzeContract(file);
      loadAnalyses();
      setSelectedAnalysis(analysis);
      setShowModal(true);
    } catch (error) {
      alert('Analysis failed: ' + error.message);
    } finally {
      setIsAnalyzing(false);
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
        return 'text-red-700 bg-red-50 border-red-300';
      case 'Medium':
        return 'text-amber-700 bg-amber-50 border-amber-300';
      default:
        return 'text-emerald-700 bg-emerald-50 border-emerald-300';
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
        return 'bg-red-100 text-red-900 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-900 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-900 border-yellow-300';
      default:
        return 'bg-blue-100 text-blue-900 border-blue-300';
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
              <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                {item.icon}
                {item.label}
              </span>
              <span className="text-lg font-bold text-slate-900">{item.value}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
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
        color: 'bg-gradient-to-r from-red-500 to-red-600',
        icon: <AlertTriangle className="w-5 h-5 text-red-600" />
      },
      {
        label: 'Hidden Risks',
        value: structuredData.hiddenRisks.length,
        color: 'bg-gradient-to-r from-orange-500 to-orange-600',
        icon: <Eye className="w-5 h-5 text-orange-600" />
      },
      {
        label: 'Key Clauses',
        value: structuredData.keyClauses.length,
        color: 'bg-gradient-to-r from-blue-500 to-blue-600',
        icon: <FileText className="w-5 h-5 text-blue-600" />
      }
    ];

    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] flex flex-col overflow-hidden">
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-6 border-b border-slate-200 flex items-start justify-between sticky top-0 z-10">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getRiskColor(analysis.riskLevel)}`}>
                  {getRiskIcon(analysis.riskLevel)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 leading-tight">{analysis.fileName}</h2>
                  <p className="text-sm text-slate-600 mt-1">Contract Analysis Report</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-4">
                <span className={`px-4 py-2 rounded-lg text-sm font-bold border-2 shadow-sm flex items-center gap-2 ${getRiskColor(analysis.riskLevel)}`}>
                  {getRiskIcon(analysis.riskLevel)}
                  <span className="uppercase tracking-wide">{analysis.riskLevel} RISK</span>
                </span>

                <span className="px-4 py-2 bg-white border-2 border-slate-200 rounded-lg text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  Score: {analysis.riskScore || 'N/A'}/100
                </span>

                {/* Audio Button */}
                <button
                  onClick={() => speakText(structuredData.executiveSummary || analysis.plainLanguageAnalysis)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-semibold shadow-sm"
                  title="Listen to Summary"
                >
                  <Volume2 className="w-4 h-4" />
                  Listen
                </button>
              </div>
            </div>

            <button onClick={onClose} className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white border-b border-slate-200 px-6 overflow-x-auto">
            <div className="flex gap-1 min-w-max">
              {[
                { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-5 h-5" /> },
                { id: 'clauses', label: 'Key Terms', icon: <FileText className="w-5 h-5" /> },
                { id: 'risks', label: 'Hidden Risks', icon: <AlertTriangle className="w-5 h-5" /> },
                { id: 'unfair', label: 'Problem Areas', icon: <XCircle className="w-5 h-5" /> },
                { id: 'recommendations', label: 'Actions', icon: <CheckCircle className="w-5 h-5" /> },
                { id: 'questions', label: 'Ask Questions', icon: <MessageCircle className="w-5 h-5" /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-4 font-semibold text-sm flex items-center gap-2 border-b-3 transition-all ${activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
            <div className="max-w-6xl mx-auto space-y-6">

              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Executive Summary */}
                  {structuredData.executiveSummary && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
                      <div className="flex items-center gap-3 mb-4">
                        <Info className="w-6 h-6 text-blue-600" />
                        <h3 className="text-xl font-bold text-slate-900">Summary in Plain English</h3>
                      </div>
                      <p className="text-lg text-slate-700 leading-relaxed">
                        {structuredData.executiveSummary}
                      </p>
                    </div>
                  )}

                  {/* Visual Charts */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Risk Category Chart */}
                    {riskCategoryData.some(d => d.value > 0) && (
                      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                          <BarChart3 className="w-5 h-5 text-blue-600" />
                          Issues Found
                        </h3>
                        <SimpleBarChart data={riskCategoryData} />
                      </div>
                    )}

                    {/* Compliance Scores */}
                    {Object.keys(structuredData.complianceScores).length > 0 && (
                      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                          <Scale className="w-5 h-5 text-green-600" />
                          Legal Compliance
                        </h3>
                        <div className="space-y-4">
                          {Object.entries(structuredData.complianceScores).map(([category, score]) => (
                            <div key={category}>
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-semibold text-slate-700">{category}</span>
                                <span className="text-lg font-bold text-slate-900">{score}%</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-3">
                                <div
                                  className={`h-3 rounded-full transition-all duration-1000 ${score >= 70 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                                    score >= 40 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                                      'bg-gradient-to-r from-red-500 to-red-600'
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
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <FileText className="w-6 h-6 text-blue-600" />
                      Main Contract Terms
                    </h3>
                    <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full font-semibold">
                      {structuredData.keyClauses.length} clauses
                    </span>
                  </div>
                  {structuredData.keyClauses.length === 0 ? (
                    <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
                      <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500 text-lg">No clauses identified in this analysis</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {structuredData.keyClauses.map((clause, index) => (
                        <div key={index} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getRiskColor(clause.riskLevel)}`}>
                                {getRiskIcon(clause.riskLevel)}
                              </div>
                              <h4 className="text-lg font-bold text-slate-900">{clause.name}</h4>
                            </div>
                            <span className={`px-3 py-1 rounded-lg text-xs font-bold border flex items-center gap-1 ${getRiskColor(clause.riskLevel)}`}>
                              {clause.riskLevel}
                            </span>
                          </div>
                          <p className="text-slate-700 mb-3 leading-relaxed">{clause.summary}</p>
                          {clause.details && (
                            <details className="mt-3 text-sm text-slate-600">
                              <summary className="cursor-pointer font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-2">
                                <ArrowRight className="w-4 h-4" />
                                Read Full Details
                              </summary>
                              <p className="mt-3 pl-4 border-l-4 border-blue-200 leading-relaxed">{clause.details}</p>
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
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <Eye className="w-6 h-6 text-orange-600" />
                      Hidden Risks & Red Flags
                    </h3>
                    <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full font-semibold">
                      {structuredData.hiddenRisks.length} risks
                    </span>
                  </div>
                  {structuredData.hiddenRisks.length === 0 ? (
                    <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
                      <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                      <p className="text-slate-700 text-lg font-semibold">No hidden risks detected</p>
                      <p className="text-slate-500 text-sm mt-2">This is a good sign!</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {structuredData.hiddenRisks.map((risk, index) => (
                        <div key={index} className={`rounded-xl border-2 p-6 ${getSeverityColor(risk.severity)}`}>
                          <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-white/50 border-2 border-current`}>
                              <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="text-lg font-bold flex-1">{risk.risk}</h4>
                                <span className="px-3 py-1 rounded-lg text-xs font-bold bg-white/50 border border-current uppercase">
                                  {risk.severity}
                                </span>
                              </div>
                              <p className="mb-3 leading-relaxed text-sm">
                                <strong className="font-semibold">Potential Impact:</strong> {risk.impact}
                              </p>
                              <div className="bg-white/40 rounded-lg p-4 border border-current">
                                <p className="font-semibold mb-2 flex items-center gap-2 text-sm">
                                  <CheckCircle className="w-4 h-4" />
                                  Recommended Action:
                                </p>
                                <p className="leading-relaxed text-sm">{risk.recommendation}</p>
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
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <XCircle className="w-6 h-6 text-red-600" />
                      Problematic or Illegal Terms
                    </h3>
                    <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full font-semibold">
                      {structuredData.unfairTerms.length} issues
                    </span>
                  </div>
                  {structuredData.unfairTerms.length === 0 ? (
                    <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
                      <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                      <p className="text-slate-700 text-lg font-semibold">No unfair terms detected</p>
                      <p className="text-slate-500 text-sm mt-2">This contract appears fair and balanced</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {structuredData.unfairTerms.map((term, index) => (
                        <div key={index} className="bg-red-50 rounded-xl border-2 border-red-200 p-6">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center border-2 border-red-300">
                              <AlertCircle className="w-6 h-6 text-red-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-lg font-bold text-red-900 mb-3">{term.term}</h4>

                              <div className="space-y-3">
                                <div className="bg-white rounded-lg p-4 border border-red-200">
                                  <p className="font-semibold text-red-900 mb-1 text-sm flex items-center gap-2">
                                    <Scale className="w-4 h-4" />
                                    Legal Issue:
                                  </p>
                                  <p className="text-red-800">{term.legalIssue}</p>
                                </div>

                                {term.applicableLaw && (
                                  <div className="bg-white rounded-lg p-4 border border-red-200">
                                    <p className="font-semibold text-red-900 mb-1 text-sm flex items-center gap-2">
                                      <BookOpen className="w-4 h-4" />
                                      Applicable Law:
                                    </p>
                                    <p className="text-red-800">{term.applicableLaw}</p>
                                  </div>
                                )}

                                {term.alternative && (
                                  <div className="bg-green-50 rounded-lg p-4 border-2 border-green-300">
                                    <p className="font-semibold text-green-900 mb-2 text-sm flex items-center gap-2">
                                      <CheckCircle className="w-4 h-4" />
                                      Better Alternative:
                                    </p>
                                    <p className="text-green-800 leading-relaxed">{term.alternative}</p>
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
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      Recommended Actions
                    </h3>
                    <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full font-semibold">
                      {structuredData.recommendations.length} steps
                    </span>
                  </div>
                  {structuredData.recommendations.length === 0 ? (
                    <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
                      <Info className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500 text-lg">No specific recommendations</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {structuredData.recommendations.map((recommendation, index) => (
                        <div key={index} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center border-2 border-green-300">
                              <span className="text-green-700 font-bold text-lg">{index + 1}</span>
                            </div>
                            <p className="text-base text-slate-700 leading-relaxed flex-1 pt-1">{recommendation}</p>
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
                      <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <MessageCircle className="w-6 h-6 text-blue-600" />
                        Ask Questions About This Contract
                      </h3>
                      <p className="text-sm text-slate-600 mt-1">Get instant answers about any clause or term</p>
                    </div>
                  </div>

                  {/* Chat Messages Container */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                    {/* Messages Area */}
                    <div className="h-96 overflow-y-auto p-6">
                      {chatMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                            <MessageCircle className="w-8 h-8 text-blue-600" />
                          </div>
                          <h4 className="font-semibold text-slate-900 mb-2">Ask Anything</h4>
                          <p className="text-slate-500 text-sm max-w-md">
                            Ask me questions about this contract. For example:
                          </p>
                          <div className="mt-4 space-y-2 text-left">
                            <div className="text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">
                              • "What are the main risks in this contract?"
                            </div>
                            <div className="text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">
                              • "Explain the termination clause in simple terms"
                            </div>
                            <div className="text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">
                              • "Is this contract fair to both parties?"
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {chatMessages.map((message, index) => (
                            <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[80%] rounded-xl p-4 ${message.role === 'user'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-100 text-slate-800 border border-slate-200'
                                }`}>
                                {message.role === 'assistant' && (
                                  <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-500">
                                    <Scale className="w-3 h-3" />
                                    LawBot AI
                                  </div>
                                )}
                                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                              </div>
                            </div>
                          ))}
                          {isLoadingChat && (
                            <div className="flex justify-start">
                              <div className="bg-slate-100 rounded-xl p-4 border border-slate-200">
                                <div className="flex items-center gap-2">
                                  <Loader className="w-4 h-4 animate-spin text-blue-600" />
                                  <span className="text-sm text-slate-600">Analyzing...</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Input Area */}
                    <div className="border-t border-slate-200 p-4 bg-slate-50">
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Type your question here..."
                          className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                          disabled={isLoadingChat}
                        />
                        <button
                          onClick={handleSendMessage}
                          disabled={!inputMessage.trim() || isLoadingChat}
                          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-semibold shadow-sm"
                        >
                          <Send className="w-4 h-4" />
                          Send
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">Press Enter to send, Shift+Enter for new line</p>
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
    <div className="flex h-screen bg-slate-50 font-sans">
      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-600">
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Contract Analysis</h1>
              <p className="text-sm text-slate-500">AI-powered contract review</p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            {/* Hero Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">Document Analysis</h1>
                <p className="text-lg text-slate-600 max-w-2xl">
                  Upload legal contracts to instantly identify risks, translate legalese into plain English, and detect deviations from standard clauses.
                </p>
              </div>
              <div className="flex gap-3">
                 <div className="flex items-center gap-2 text-xs font-semibold bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-slate-500 shadow-sm">
                    <Shield className="w-3 h-3 text-emerald-500" /> AES-256 Encrypted
                 </div>
                 <div className="flex items-center gap-2 text-xs font-semibold bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-slate-500 shadow-sm">
                    <FileText className="w-3 h-3 text-blue-500" /> OCR Support
                 </div>
              </div>
            </div>

            {/* Upload Section - "The Drop Zone" */}
            <div className="mb-12">
              <div
                className={`relative group rounded-2xl border-2 border-dashed transition-all duration-300 ease-out overflow-hidden
                  ${dragActive 
                    ? 'border-blue-500 bg-blue-50/50 scale-[1.01] shadow-xl shadow-blue-500/10' 
                    : 'border-slate-300 bg-white hover:border-blue-400 hover:shadow-lg hover:shadow-slate-200/50'
                  }
                  ${isAnalyzing ? 'pointer-events-none border-blue-200 bg-slate-50' : 'cursor-pointer'}
                `}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10"></div>

                <div className="p-12 min-h-[320px] flex flex-col items-center justify-center text-center">
              {isAnalyzing ? (
                <div className="flex flex-col items-center animate-in fade-in duration-500">
                  <div className="relative w-20 h-20 mb-6">
                    <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                    <Shield className="absolute inset-0 m-auto w-8 h-8 text-blue-600 animate-pulse" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Analyzing Your Contract...</h3>
                  <p className="text-slate-500 max-w-sm text-lg">Please wait while we check for risks</p>
                </div>
              ) : (
                <>
                  <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-6 shadow-xl shadow-blue-500/30 transition-transform duration-300 ${dragActive ? 'scale-110 rotate-3' : 'group-hover:scale-105'}`}>
                    <Upload className="w-12 h-12 text-white" />
                  </div>

                  <h3 className="text-3xl font-bold text-slate-900 mb-3">
                    {dragActive ? 'Drop your document here' : 'Upload Contract Document'}
                  </h3>

                  <p className="text-slate-500 mb-8 max-w-md mx-auto leading-relaxed text-lg">
                    Supports PDF, Word, Images, and Text files
                    <br /><span className="text-sm text-slate-400 mt-2 block">Maximum file size: 10MB</span>
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
                    className="px-10 py-4 bg-blue-600 text-white rounded-xl font-bold shadow-xl hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-3 cursor-pointer text-lg"
                  >
                    <Upload className="w-6 h-6" />
                    Choose File
                  </label>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Recent Analysis List */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Recent Analysis</h2>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {analyses.length === 0 ? (
              <div className="text-center py-20 px-6">
                <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-slate-900 font-semibold text-xl mb-2">No analyses yet</h3>
                <p className="text-slate-500">Upload a contract above to get started</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {analyses.map((analysis) => (
                  <div key={analysis.id} className="p-6 hover:bg-slate-50 transition-colors group">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">

                      {/* File Info */}
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${getRiskColor(analysis.riskLevel)}`}>
                          {getRiskIcon(analysis.riskLevel)}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-2 text-lg">
                            {analysis.fileName}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-slate-600">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {new Date(analysis.analyzedAt).toLocaleDateString()}
                            </span>
                            <span className={`px-3 py-1 rounded-lg font-bold text-xs border ${getRiskColor(analysis.riskLevel)}`}>
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
                          className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
                        >
                          <Eye className="w-5 h-5" /> View Details
                        </button>
                        <button
                          onClick={() => deleteAnalysis(analysis.id)}
                          className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
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