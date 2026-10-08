import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Scale, MessageSquare, FileText, Users, TrendingUp, Clock, 
  CheckCircle, AlertCircle, Calendar, Download, Eye, Edit2, 
  Trash2, Phone, Mail, MapPin, Search, Filter, ChevronRight, 
  Plus, Bell, Settings, Menu, X, Home, LayoutDashboard, Sparkles, 
  Shield, Award, Target, Activity, BarChart3, BookOpen, Gavel, 
  IndianRupee, FileSearch, Network, ExternalLink, Copy, Check, 
  Share2, Zap, Building2, CheckCircle2, ArrowRight, PhoneCall, Headphones
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/lawbot360-logo-updated.svg';
import Sidebar from '../components/Sidebar';
import LocationLawyerFinder from '../components/LocationLawyerFinder';
import EcosystemGraph from '../components/EcosystemGraph';
import ComplianceScoreWidget from '../components/ComplianceScoreWidget';
import RiskRadarWidget from '../components/RiskRadarWidget';
import ActiveWorkflowsWidget from '../components/ActiveWorkflowsWidget';
import { useAuth } from '../context/AuthContext';
import { constitutionKnowledgeService } from '../services/constitutionKnowledgeService';

/**
 * LawBot 360 - Executive Command Center & Hackathon Pitch Dashboard
 * Features: Simple, uncluttered, logically structured, and 100% functional.
 */

// Default realistic documents for instant live showcase
const DEFAULT_DOCUMENTS = [
  {
    id: 'doc-101',
    title: 'RTI Application - Municipal Road Tender Records',
    type: 'rti',
    category: 'Right to Information',
    content: `RIGHT TO INFORMATION APPLICATION\n\nTo,\nThe Public Information Officer (PIO)\nMunicipal Corporation\n\nSubject: Information under Section 6(1) of RTI Act, 2005\n\nRespected Sir/Madam,\nUnder Section 6(1) of the Right to Information Act, 2005, I hereby request the following information:\n1. Certified copies of tender sanction & BOQ for road repair work in Ward 14.\n2. Total budget allocated, disbursed, and contractor performance certificates.\n3. Inspection reports by the municipal quality audit wing for FY 2025-26.\n\nDate: 04-10-2026\nApplicant: Yash Agarwal\nStatus: Acknowledged by PIO`,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    status: 'completed'
  },
  {
    id: 'doc-102',
    title: 'Consumer Forum Notice - Defective Mobile & E-Commerce',
    type: 'consumer_complaint',
    category: 'Consumer Protection',
    content: `LEGAL NOTICE UNDER CONSUMER PROTECTION ACT, 2019\n\nTo,\nCustomer Grievance Redressal Officer\nTechMart E-Commerce India Pvt Ltd\n\nSubject: Deficiency in service and defective device (Invoice #TM-99214)\n\nTake notice that the smartphone delivered on 15-09-2026 became non-functional within 48 hours of delivery. Despite three verified visits to the authorized service center, replacement or refund was denied in clear violation of Rule 5 of the Consumer Protection (E-Commerce) Rules, 2020.\n\nYou are hereby called upon to refund the purchase amount of ₹42,500 along with ₹10,000 towards mental agony and legal expenses within 15 days of receipt of this notice, failing which formal complaint will be filed before District Consumer Disputes Redressal Commission.\n\nDate: 06-10-2026`,
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    status: 'completed'
  },
  {
    id: 'doc-103',
    title: 'Mutual Non-Disclosure & IP Protection Agreement',
    type: 'contract',
    category: 'Commercial Contracts',
    content: `MUTUAL NON-DISCLOSURE AGREEMENT (NDA)\n\nThis Agreement is entered into on 01-10-2026 between:\nParty A: Acme Legal Tech Private Limited (Maharashtra)\nParty B: Alpha Financial Advisors LLP (Delhi NCR)\n\n1. Purpose: Evaluation of joint commercialization of AI constitutional analytics.\n2. Confidentiality: Neither party shall disclose source code, prompt topologies, or customer datasets without prior written consent.\n3. Term: 2 years from effective date.\n4. Dispute Resolution: Arbitration in New Delhi under the Arbitration and Conciliation Act, 1996.\n\nSigned by Authorized Signatories.`,
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    status: 'completed'
  }
];

// Top verified advocates
const TOP_LAWYERS = [
  { id: 1, name: 'Adv. Rajesh Kumar', specialization: 'Consumer & Corporate Disputes', court: 'Supreme Court & Delhi High Court', phone: '+91 98765 43210', experience: '14 Years', consultations: 42, rating: 4.9 },
  { id: 2, name: 'Adv. Priya Sharma', specialization: 'Constitutional & Fundamental Rights', court: 'Bombay High Court', phone: '+91 98765 43211', experience: '11 Years', consultations: 38, rating: 4.8 },
  { id: 3, name: 'Adv. Vikramaditya Sen', specialization: 'Commercial Contracts & Arbitration', court: 'Karnataka High Court', phone: '+91 98765 43212', experience: '16 Years', consultations: 55, rating: 5.0 }
];

// Live Regulatory Bulletins
const REGULATORY_BULLETINS = [
  {
    id: 1,
    authority: 'CBIC / Ministry of Finance',
    title: 'E-Invoicing Threshold lowered to ₹5 Cr for B2B & E-Commerce',
    date: '04 Aug 2026',
    category: 'GST & Indirect Tax',
    impact: 'High Impact',
    summary: 'All registered businesses with aggregate turnover exceeding ₹5 Cr must issue electronic invoices with valid IRN.'
  },
  {
    id: 2,
    authority: 'Income Tax Department (CBDT)',
    title: 'Section 43B(h) MSME 45-Day Payment Rule Enforcement',
    date: '02 Aug 2026',
    category: 'Direct Tax',
    impact: 'Mandatory',
    summary: 'Outstanding vendor dues to registered Udyam MSMEs beyond 45 days disallowed as business expenditure.'
  },
  {
    id: 3,
    authority: 'Ministry of Labour / EPFO',
    title: 'Universal Account Number (UAN) Mandatory Aadhaar Seeding',
    date: '28 Jul 2026',
    category: 'Labour & Employment',
    impact: 'Compliance',
    summary: 'Monthly ECR portal submission requires 100% Aadhaar-verified employee accounts to prevent statutory penalties.'
  }
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Navigation & Modal states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLocationFinder, setShowLocationFinder] = useState(false);
  const [selectedLawyer, setSelectedLawyer] = useState(null);
  const [previewDocument, setPreviewDocument] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('ecosystem'); // 'ecosystem' | 'workflows' | 'documents' | 'regulatory'

  // Global Omni-Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef(null);

  // Business profile state
  const [currentProfile, setCurrentProfile] = useState(() => {
    const saved = localStorage.getItem('lawbot-user-profile');
    return saved ? JSON.parse(saved) : {
      entityName: 'Acme Legal Tech Pvt Ltd',
      businessType: 'pvt_ltd',
      industry: 'Information Technology & Software',
      state: 'Maharashtra',
      turnover: '50L - 2Cr',
      employeeCount: 12,
      registrations: { gst: true, pan: true, msme: true, shopAct: true }
    };
  });

  // Saved documents state with persistent fallback
  const [documents, setDocuments] = useState(() => {
    const saved = localStorage.getItem('lawbot-documents');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.length > 0 ? parsed : DEFAULT_DOCUMENTS;
      } catch {
        return DEFAULT_DOCUMENTS;
      }
    }
    return DEFAULT_DOCUMENTS;
  });

  // Notifications state
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'RTI Response Received', desc: 'Application #RTI-2026-001 has been acknowledged by Municipal PIO.', time: '2 hours ago', unread: true, link: '/dashboard/documents', color: 'blue' },
    { id: 2, title: 'Advocate Connection Accepted', desc: 'Adv. Rajesh Kumar accepted your consultation request.', time: '5 hours ago', unread: true, link: '/dashboard/lawyers', color: 'emerald' },
    { id: 3, title: 'Statutory Hearing Notice', desc: 'Consumer Forum Hearing listed for 11-08-2026 (Case #442).', time: '1 day ago', unread: true, link: '/dashboard/cases', color: 'amber' }
  ]);

  // Sync documents to localStorage if initialized
  useEffect(() => {
    if (!localStorage.getItem('lawbot-documents')) {
      localStorage.setItem('lawbot-documents', JSON.stringify(DEFAULT_DOCUMENTS));
    }
  }, []);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Quick stats
  const unreadCount = useMemo(() => notifications.filter(n => n.unread).length, [notifications]);

  // All Constitutional Articles for live search
  const allArticles = useMemo(() => constitutionKnowledgeService.getAllArticles(), []);

  // Search results calculation
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase().trim();

    // 1. Matching Features
    const features = [
      { title: 'Obsidian Graph RAG (Constitution of India)', category: 'Core Feature', action: () => window.dispatchEvent(new CustomEvent('open-obsidian-graph', { detail: { artNo: '21' } })) },
      { title: 'Sarvam 24/7 AI Telephony Helpline (+91 7965480318)', category: 'Voice Telephony', action: () => navigate('/dashboard/sarvam-voice') },
      { title: 'AI Legal Advisory & Multilingual Voice', category: 'Core Feature', action: () => navigate('/dashboard/chat') },
      { title: 'Contract & Clause Risk Analyzer', category: 'Core Feature', action: () => navigate('/dashboard/contracts') },
      { title: 'Statutory Compliance Calendar', category: 'Core Feature', action: () => navigate('/dashboard/calendar') },
      { title: 'Verified Indian Advocates Directory', category: 'Core Feature', action: () => navigate('/dashboard/lawyers') },
      { title: 'Government Schemes & Subsidies', category: 'Core Feature', action: () => navigate('/dashboard/schemes') },
      { title: 'Document Vault & Tamper Verification', category: 'Core Feature', action: () => navigate('/dashboard/vault') },
      { title: 'Regulatory Updates & Gazette Bulletins', category: 'Core Feature', action: () => navigate('/dashboard/regulatory-updates') }
    ].filter(f => f.title.toLowerCase().includes(q));

    // 2. Matching Constitution Articles
    const articles = allArticles.filter(art => 
      art.ArtNo.toLowerCase() === q ||
      art.ArtNo.toLowerCase() === q.replace('article', '').trim() ||
      art.Name.toLowerCase().includes(q) ||
      (art.keywords && art.keywords.some(k => k.toLowerCase().includes(q)))
    ).slice(0, 4).map(art => ({
      title: `Article ${art.ArtNo}: ${art.Name}`,
      category: `Part ${art.PartNo} • Constitution of India`,
      action: () => window.dispatchEvent(new CustomEvent('open-obsidian-graph', { detail: { artNo: art.ArtNo } }))
    }));

    // 3. Matching Saved Documents
    const matchedDocs = documents.filter(doc => 
      doc.title.toLowerCase().includes(q) ||
      doc.category?.toLowerCase().includes(q)
    ).slice(0, 3).map(doc => ({
      title: doc.title,
      category: `Document • ${doc.category || doc.type}`,
      action: () => setPreviewDocument(doc)
    }));

    return { features, articles, documents: matchedDocs };
  }, [searchQuery, allArticles, documents, navigate]);

  // Mark all notifications as read
  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  // Trigger real file download
  const handleDownloadDocument = (doc) => {
    const textContent = doc.content || `${doc.title}\nDate: ${new Date(doc.createdAt).toLocaleDateString()}\nCategory: ${doc.category || doc.type}\nStatus: Verified Document\n\nGenerated by LawBot360`;
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${doc.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Copy text to clipboard
  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // User initials
  const getInitials = (name) => {
    if (!name) return "LB";
    const parts = name.split(" ");
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans selection:bg-amber-100 selection:text-amber-900">
      
      {/* Global Responsive Sidebar */}
      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Top Header Bar */}
        <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between shrink-0 shadow-xs">
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="lg:hidden p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors"
              title="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
                <Scale className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-900 leading-tight">Executive Dashboard</h1>
                <p className="text-[11px] text-slate-500 font-medium hidden sm:block">Legal OS for Indian Businesses & Citizens</p>
              </div>
            </div>
          </div>

          {/* Center: Live Omni-Search */}
          <div ref={searchContainerRef} className="relative flex-1 max-w-md mx-4 hidden md:block">
            <div className="flex items-center bg-slate-100/80 hover:bg-slate-100 rounded-full px-3.5 py-1.5 border border-slate-200/80 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
              <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
              <input 
                type="text" 
                placeholder="Search articles (Art 21), contracts, cases, or features..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                className="bg-transparent border-none outline-none text-xs w-full text-slate-800 placeholder:text-slate-400"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600 p-0.5">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Omni-Search Live Dropdown */}
            {isSearchFocused && searchResults && (
              <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150 max-h-96 overflow-y-auto">
                {/* Feature Matches */}
                {searchResults.features.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">Platform Tools</p>
                    {searchResults.features.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          item.action();
                          setIsSearchFocused(false);
                          setSearchQuery('');
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 text-xs font-semibold text-slate-800 hover:text-indigo-600 flex items-center justify-between transition-colors"
                      >
                        <span>{item.title}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Constitutional Article Matches */}
                {searchResults.articles.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider px-2 mb-1 flex items-center gap-1">
                      <Network className="w-3 h-3" /> Constitution Knowledge Graph
                    </p>
                    {searchResults.articles.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          item.action();
                          setIsSearchFocused(false);
                          setSearchQuery('');
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-amber-50 text-xs font-medium text-slate-800 hover:text-amber-800 flex items-center justify-between transition-colors"
                      >
                        <span className="truncate">{item.title}</span>
                        <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold shrink-0 ml-2">Open Graph</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Document Matches */}
                {searchResults.documents.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">Saved Documents</p>
                    {searchResults.documents.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          item.action();
                          setIsSearchFocused(false);
                          setSearchQuery('');
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 text-xs font-medium text-slate-800 flex items-center justify-between transition-colors"
                      >
                        <span className="truncate">{item.title}</span>
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    ))}
                  </div>
                )}

                {searchResults.features.length === 0 && searchResults.articles.length === 0 && searchResults.documents.length === 0 && (
                  <div className="text-center py-4 text-xs text-slate-500">
                    No results found for "{searchQuery}". Try "Article 21", "contract", or "lawyer".
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Quick Launch Obsidian Graph Button */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-obsidian-graph', { detail: { artNo: '21' } }))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-800 border border-amber-300 hover:bg-amber-500/20 text-xs font-bold transition-all hover:scale-105 active:scale-95 shadow-xs"
              title="Launch Obsidian Constitution Graph"
            >
              <Network className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
              <span className="hidden sm:inline">Graph RAG</span>
              <span className="bg-amber-500 text-slate-950 text-[9px] px-1.5 py-0.2 rounded-full font-black">448</span>
            </button>

            {/* Notifications Toggle */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white animate-ping" />
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden">
                    <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">Notifications</h3>
                        {unreadCount > 0 && (
                          <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                            {unreadCount} New
                          </span>
                        )}
                      </div>
                      <button 
                        onClick={handleMarkAllRead}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        Mark all as read
                      </button>
                    </div>

                    <div className="p-2 space-y-1 max-h-80 overflow-y-auto">
                      {notifications.map((notif) => (
                        <div 
                          key={notif.id}
                          onClick={() => {
                            setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, unread: false } : n));
                            navigate(notif.link);
                            setShowNotifications(false);
                          }}
                          className={`p-3 rounded-xl transition-all cursor-pointer flex items-start gap-3 ${
                            notif.unread ? 'bg-slate-50/80 hover:bg-slate-100 font-semibold' : 'hover:bg-slate-50 opacity-80'
                          }`}
                        >
                          <span className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${
                            notif.color === 'blue' ? 'bg-blue-500' : notif.color === 'emerald' ? 'bg-emerald-500' : 'bg-amber-500'
                          }`} />
                          <div className="flex-1">
                            <p className="text-xs text-slate-900 leading-tight">{notif.title}</p>
                            <p className="text-[11px] text-slate-500 font-normal mt-0.5">{notif.desc}</p>
                            <span className="text-[9px] text-slate-400 mt-1 block">{notif.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User Profile Pill */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-bold flex items-center justify-center text-xs shadow-sm ring-2 ring-white">
                {getInitials(user?.displayName || currentProfile.entityName)}
              </div>
              <div className="hidden xl:block text-left">
                <p className="text-xs font-bold text-slate-800 leading-none truncate max-w-[120px]">{user?.displayName || currentProfile.entityName}</p>
                <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{currentProfile.state}</p>
              </div>
            </div>

          </div>
        </header>

        {/* Scrollable Main Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scroll-smooth custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* 1. HACKATHON PITCH HERO STRIP */}
            <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800">
              {/* Background glows */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>LawBot360 AI Legal Operating System</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                    Intelligent Legal Command Center
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    AI-powered constitutional knowledge, statutory compliance tracking, contract risk auditing, and automated legal operations for India.
                  </p>
                  
                  {/* Active Business Profile Chip */}
                  <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 font-bold flex items-center gap-1.5 text-slate-200">
                      <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                      {currentProfile.entityName}
                    </span>
                    <span className="bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-500/30 font-bold flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      GST & MSME Verified
                    </span>
                    <span className="bg-white/5 text-slate-400 px-2.5 py-1 rounded-lg border border-white/5 text-[11px]">
                      State: {currentProfile.state}
                    </span>
                  </div>
                </div>

                {/* Pitch Live Metrics Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 shrink-0">
                  <div className="bg-white/5 backdrop-blur-md border border-white/10 p-3 rounded-2xl text-center">
                    <p className="text-xl sm:text-2xl font-black text-amber-400">448</p>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Articles Grounded</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-md border border-white/10 p-3 rounded-2xl text-center">
                    <p className="text-xl sm:text-2xl font-black text-emerald-400">122</p>
                    <p className="text-[10px] uppercase font-bold text-slate-400">SC Precedents</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-md border border-white/10 p-3 rounded-2xl text-center">
                    <p className="text-xl sm:text-2xl font-black text-indigo-400">28</p>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Languages & Voice</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-md border border-white/10 p-3 rounded-2xl text-center">
                    <p className="text-xl sm:text-2xl font-black text-sky-400">Kanoon</p>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Live API Citations</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-md border border-white/10 p-3 rounded-2xl text-center">
                    <p className="text-xl sm:text-2xl font-black text-violet-400">85%</p>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Compliance Health</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-md border border-white/10 p-3 rounded-2xl text-center">
                    <p className="text-xl sm:text-2xl font-black text-rose-400">Zero</p>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Hallucinations</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 1.5 DEDICATED 24/7 AI TELEPHONY HELPLINE BANNER */}
            <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border border-emerald-500/30 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                      Sarvam Samvaad Live Telephony Agent Connected
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white flex items-center gap-2">
                    <span>24/7 Citizen Legal Voice Helpline</span>
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      +91 7965480318
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Dial directly from any phone for instant Hindi conversational legal guidance on IPC/BNS, Property disputes, FIR procedures, and NALSA free legal aid.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href="tel:+917965480318"
                    id="dashboard-call-bot-btn"
                    className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm px-5 py-3 rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all text-center"
                  >
                    <PhoneCall className="w-4 h-4 animate-bounce" />
                    <span>📞 Call Bot (+91 7965480318)</span>
                  </a>

                  <button
                    onClick={() => navigate('/dashboard/sarvam-voice')}
                    className="flex items-center gap-2 bg-slate-800/90 hover:bg-slate-700 text-white font-bold text-xs px-4 py-3 rounded-xl border border-slate-700 hover:border-slate-600 transition-all cursor-pointer"
                  >
                    <Headphones className="w-4 h-4 text-emerald-400" />
                    <span>View Call History & Transcripts</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* 2. CORE PILLARS — 6 INTERACTIVE PRODUCT LAUNCHERS */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" /> Platform Superpowers
                  </h3>
                  <p className="text-xs text-slate-500">Every feature is directly actionable with 1-click launch</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* 1. Obsidian Graph RAG Launcher */}
                <div 
                  onClick={() => window.dispatchEvent(new CustomEvent('open-obsidian-graph', { detail: { artNo: '21' } }))}
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 hover:border-amber-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative overflow-hidden"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all duration-300 shadow-sm">
                      <Network className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                      448 Articles • Graph RAG
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1 group-hover:text-amber-700 transition-colors">
                    Constitutional Knowledge Graph
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                    Interactive Obsidian force-directed network mapping Articles 1–395, landmark Supreme Court cases & Indian Kanoon citations.
                  </p>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-600">
                    <span>Launch Knowledge Cosmos</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* 2. AI Advisory & Multilingual Voice */}
                <div 
                  onClick={() => navigate('/dashboard/chat')}
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 hover:border-indigo-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative overflow-hidden"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      28 Languages • Voice
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1 group-hover:text-indigo-700 transition-colors">
                    AI Legal Advisory & Voice Call
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                    Instant conversational counsel with verified statutory sections, zero hallucinations, voice interaction, and multi-turn legal synthesis.
                  </p>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600">
                    <span>Start Consultation</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* 3. Contract & Risk Clause Analyzer */}
                <div 
                  onClick={() => navigate('/dashboard/contracts')}
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 hover:border-emerald-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative overflow-hidden"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-sm">
                      <FileSearch className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      PDF Audit • Red Flags
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1 group-hover:text-emerald-700 transition-colors">
                    Contract & Risk Clause Analyzer
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                    Upload leases, agreements, and NDAs. Auto-extract uncapped liabilities, non-competes, and termination traps with risk ratings.
                  </p>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-600">
                    <span>Audit New Agreement</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* 4. Statutory Compliance Calendar */}
                <div 
                  onClick={() => navigate('/dashboard/calendar')}
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 hover:border-rose-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative overflow-hidden"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 group-hover:scale-110 group-hover:bg-rose-600 group-hover:text-white transition-all duration-300 shadow-sm">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                      ROC • GST • TDS Deadlines
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1 group-hover:text-rose-700 transition-colors">
                    Statutory Compliance Calendar
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                    Automated calendar tailored to your business structure (Pvt Ltd/LLP). Live statutory penalty counters and filing alerts.
                  </p>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-rose-600">
                    <span>Check Deadlines</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* 5. Verified Advocates Directory */}
                <div 
                  onClick={() => setShowLocationFinder(true)}
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 hover:border-blue-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative overflow-hidden"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm">
                      <Users className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      1,200+ Verified Advocates
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1 group-hover:text-blue-700 transition-colors">
                    Verified Advocate Network
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                    GPS-enabled legal counsel matching across Supreme Court, High Courts, and District Forums by jurisdiction and practice area.
                  </p>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600">
                    <span>Find Local Counsel</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* 6. Government Schemes & Subsidies */}
                <div 
                  onClick={() => navigate('/dashboard/schemes')}
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 hover:border-purple-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative overflow-hidden"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300 shadow-sm">
                      <Award className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                      MSME • Startup Grants
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1 group-hover:text-purple-700 transition-colors">
                    Government Schemes & Subsidies
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                    Automated eligibility engine for state capital subsidies, MSME collateral-free loans, and Startup India seed funds.
                  </p>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-purple-600">
                    <span>Explore Subsidies</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

              </div>
            </div>

            {/* 3. LOGICAL TWO-COLUMN WORKSPACE (Interactive Operations vs Executive Health) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column (65% width / 8 cols) - Interactive Operations Workspace */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Segmented Workspace Container */}
                <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/80">
                  
                  {/* Tab Navigation Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Legal Operations Workspace</h3>
                      <p className="text-xs text-slate-500">Explore interactive system topologies, progressive milestones & documents</p>
                    </div>

                    {/* Clean Tab Switcher */}
                    <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 self-start sm:self-auto overflow-x-auto max-w-full">
                      <button
                        onClick={() => setActiveTab('ecosystem')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                          activeTab === 'ecosystem'
                            ? 'bg-white text-indigo-600 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Network className="w-3.5 h-3.5" />
                        <span>Ecosystem Map</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('workflows')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                          activeTab === 'workflows'
                            ? 'bg-white text-indigo-600 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Activity className="w-3.5 h-3.5" />
                        <span>Workflows</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('documents')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                          activeTab === 'documents'
                            ? 'bg-white text-indigo-600 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Documents ({documents.length})</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('regulatory')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                          activeTab === 'regulatory'
                            ? 'bg-white text-indigo-600 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Gazette</span>
                      </button>
                    </div>
                  </div>

                  {/* Tab Body 1: Interactive Legal Ecosystem Graph */}
                  {activeTab === 'ecosystem' && (
                    <div className="pt-4 animate-in fade-in duration-200">
                      <div className="mb-3 flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span>Interactive node visualization connecting business licenses, active vault documents & statutory obligations.</span>
                        <span className="font-bold text-indigo-600 shrink-0 ml-2">Click nodes to inspect</span>
                      </div>
                      <div className="rounded-2xl overflow-hidden border border-slate-100">
                        <EcosystemGraph />
                      </div>
                    </div>
                  )}

                  {/* Tab Body 2: Active Progressive Workflows */}
                  {activeTab === 'workflows' && (
                    <div className="pt-4 animate-in fade-in duration-200">
                      <ActiveWorkflowsWidget />
                    </div>
                  )}

                  {/* Tab Body 3: Document Vault & Notices */}
                  {activeTab === 'documents' && (
                    <div className="pt-4 animate-in fade-in duration-200 space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-slate-500">Legal documents generated and stored securely with hash verification</p>
                        <button
                          onClick={() => navigate('/dashboard/documents')}
                          className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                        >
                          <Plus className="w-3.5 h-3.5" /> Generate Document
                        </button>
                      </div>

                      <div className="space-y-2.5">
                        {documents.map((doc) => (
                          <div 
                            key={doc.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-slate-50/70 hover:bg-slate-50 rounded-2xl border border-slate-200/60 hover:border-slate-300 transition-all gap-3"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div>
                                <h4 className="font-bold text-xs text-slate-900 leading-tight">{doc.title}</h4>
                                <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] text-slate-500">
                                  <span className="font-medium">{new Date(doc.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                  <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                  <span className="bg-slate-200/70 text-slate-700 px-1.5 py-0.2 rounded font-semibold">{doc.category || doc.type}</span>
                                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded font-bold">Verified</span>
                                </div>
                              </div>
                            </div>

                            {/* Working Action Buttons */}
                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                              <button
                                onClick={() => setPreviewDocument(doc)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-300 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                                title="View Document Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Preview</span>
                              </button>

                              <button
                                onClick={() => handleDownloadDocument(doc)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                                title="Download Document"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Download</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 text-right">
                        <Link to="/dashboard/documents" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center gap-1">
                          Open Full Document Vault <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Tab Body 4: Live Regulatory Bulletins */}
                  {activeTab === 'regulatory' && (
                    <div className="pt-4 animate-in fade-in duration-200 space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-slate-500">Official notifications from Gazette of India, CBIC, and Ministry of Corporate Affairs</p>
                        <Link to="/dashboard/regulatory-updates" className="text-xs font-bold text-indigo-600 hover:underline">
                          See All Circulars
                        </Link>
                      </div>

                      <div className="space-y-3">
                        {REGULATORY_BULLETINS.map((item) => (
                          <div key={item.id} className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/70 hover:border-indigo-200 transition-all">
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                                {item.authority}
                              </span>
                              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                {item.impact}
                              </span>
                            </div>
                            <h4 className="font-bold text-xs text-slate-900 leading-snug">{item.title}</h4>
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.summary}</p>
                            <div className="mt-2.5 pt-2 border-t border-slate-200/50 flex items-center justify-between text-[11px] text-slate-500">
                              <span>Published: {item.date}</span>
                              <Link to="/dashboard/regulatory-updates" className="font-bold text-indigo-600 hover:underline flex items-center gap-1">
                                Action Plan <ArrowRight className="w-3 h-3" />
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* Right Column (35% width / 4 cols) - Executive Health & Advocate Network */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* 1. Compliance Score Widget */}
                <ComplianceScoreWidget />

                {/* 2. Statutory Risk Radar Timeline */}
                <RiskRadarWidget />

                {/* 3. Top Verified Advocates Network */}
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-500" />
                      Top Verified Advocates
                    </h3>
                    <button 
                      onClick={() => setShowLocationFinder(true)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      Find Nearby
                    </button>
                  </div>

                  <div className="space-y-3">
                    {TOP_LAWYERS.map((lawyer) => (
                      <div 
                        key={lawyer.id}
                        onClick={() => setSelectedLawyer(lawyer)}
                        className="p-3 bg-slate-50 hover:bg-indigo-50/50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all cursor-pointer group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                              {lawyer.name.split(' ')[1] ? lawyer.name.split(' ')[1][0] : 'L'}
                            </div>
                            <div>
                              <h4 className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">{lawyer.name}</h4>
                              <p className="text-[10px] text-slate-500 font-medium mt-0.5">{lawyer.specialization}</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            ★ {lawyer.rating}
                          </span>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-slate-200/50 flex items-center justify-between text-[10px] text-slate-500">
                          <span>{lawyer.court}</span>
                          <span className="font-bold text-indigo-600 group-hover:underline">Contact & Consult</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setShowLocationFinder(true)}
                    className="w-full mt-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Locate Advocates by City</span>
                  </button>
                </div>

              </div>

            </div>

          </div>
        </main>
      </div>

      {/* MODAL 1: Document Preview & Download Modal */}
      {previewDocument && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 leading-tight">{previewDocument.title}</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Category: {previewDocument.category || previewDocument.type}</p>
                </div>
              </div>
              <button 
                onClick={() => setPreviewDocument(null)} 
                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 p-5 overflow-y-auto font-mono text-xs text-slate-800 leading-relaxed bg-[#fcfcfd] select-text">
              <pre className="whitespace-pre-wrap font-sans bg-white p-4 rounded-xl border border-slate-200/80 shadow-inner">
                {previewDocument.content || 'Document content ready for formal filing.'}
              </pre>
            </div>

            {/* Modal Footer with Working Actions */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
              <button
                onClick={() => handleCopyText(previewDocument.content || previewDocument.title)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors"
              >
                {copySuccess ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copySuccess ? 'Copied to Clipboard!' : 'Copy Text'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewDocument(null)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Close
                </button>
                <button
                  onClick={() => handleDownloadDocument(previewDocument)}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Document (.txt)</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: Advocate Details Modal */}
      {selectedLawyer && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-bold flex items-center justify-center text-lg shadow-md">
                  {selectedLawyer.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">{selectedLawyer.name}</h3>
                  <p className="text-xs text-indigo-600 font-semibold">{selectedLawyer.specialization}</p>
                </div>
              </div>
              <button onClick={() => setSelectedLawyer(null)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Court Jurisdiction:</span>
                <span className="font-bold text-slate-800">{selectedLawyer.court}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Bar Experience:</span>
                <span className="font-bold text-slate-800">{selectedLawyer.experience}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Direct Phone:</span>
                <span className="font-bold text-indigo-600">{selectedLawyer.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Completed Sessions:</span>
                <span className="font-bold text-emerald-600">{selectedLawyer.consultations} Cases Handled</span>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <a
                href={`tel:${selectedLawyer.phone}`}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs text-center flex items-center justify-center gap-1.5 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" /> Call Now
              </a>
              <button
                onClick={() => {
                  setSelectedLawyer(null);
                  navigate('/dashboard/chat');
                }}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs text-center flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-indigo-100"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Consult via AI
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Location-based Lawyer Finder */}
      <LocationLawyerFinder 
        isOpen={showLocationFinder} 
        onClose={() => setShowLocationFinder(false)} 
      />

    </div>
  );
}