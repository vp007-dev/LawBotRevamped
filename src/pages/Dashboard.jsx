import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Scale, MessageSquare, FileText, Users, TrendingUp, Clock, 
  CheckCircle, AlertCircle, Calendar, Download, Eye, Edit2, 
  Trash2, Phone, Mail, MapPin, Search, Filter, ChevronRight, 
  Plus, Bell, Settings, Menu, X, Home, LayoutDashboard, Sparkles, 
  Shield, Award, Target, Activity, BarChart3, Gavel, 
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
  const [activeTab, setActiveTab] = useState('ecosystem'); // 'ecosystem' | 'workflows' | 'documents'

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
      { title: 'Verified Indian Advocates Directory', category: 'Core Feature', action: () => navigate('/dashboard/lawyers') },
      { title: 'Document Vault & Tamper Verification', category: 'Core Feature', action: () => navigate('/dashboard/vault') }
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
    <div className="flex h-screen bg-[#0c0e14] text-[#f1f5f9] font-sans selection:bg-purple-900/60 selection:text-purple-200">
      
      {/* Global Responsive Sidebar */}
      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Top Header Bar */}
        <header className="h-16 bg-[#0c0e14]/90 backdrop-blur-xl border-b border-white/[0.08] sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between shrink-0">
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="lg:hidden p-2 hover:bg-white/[0.06] rounded-xl text-zinc-400 hover:text-white transition-colors"
              title="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.25)]">
                <Scale className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-zinc-500">LawBot360</span>
                <span className="text-zinc-600">/</span>
                <span className="text-zinc-400">Dashboard</span>
                <span className="text-zinc-600">/</span>
                <span className="text-white font-medium truncate max-w-[140px] sm:max-w-none">{currentProfile.entityName}</span>
              </div>
            </div>
          </div>

          {/* Center: Live Omni-Search */}
          <div ref={searchContainerRef} className="relative flex-1 max-w-md mx-6 hidden md:block">
            <div className="flex items-center bg-[#161922] hover:bg-[#1b202c] rounded-full px-4 py-2 border border-white/[0.08] focus-within:border-purple-500/60 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all">
              <Search className="w-4 h-4 text-zinc-400 mr-2.5 shrink-0" />
              <input 
                type="text" 
                placeholder="Search articles (Art 21), contracts, cases, or features..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                className="bg-transparent border-none outline-none text-xs w-full text-white placeholder:text-zinc-500"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-zinc-400 hover:text-white p-0.5">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Omni-Search Live Dropdown */}
            {isSearchFocused && searchResults && (
              <div className="absolute top-full mt-2 left-0 right-0 bg-[#161922] rounded-2xl shadow-2xl border border-white/[0.12] p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150 max-h-96 overflow-y-auto">
                {/* Feature Matches */}
                {searchResults.features.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-2 mb-1">Platform Tools</p>
                    {searchResults.features.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          item.action();
                          setIsSearchFocused(false);
                          setSearchQuery('');
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/[0.05] text-xs font-semibold text-zinc-200 hover:text-purple-300 flex items-center justify-between transition-colors"
                      >
                        <span>{item.title}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Constitutional Article Matches */}
                {searchResults.articles.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider px-2 mb-1 flex items-center gap-1">
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
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-purple-500/10 text-xs font-medium text-zinc-300 hover:text-purple-200 flex items-center justify-between transition-colors"
                      >
                        <span className="truncate">{item.title}</span>
                        <span className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded font-bold shrink-0 ml-2">Open Graph</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Document Matches */}
                {searchResults.documents.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-2 mb-1">Saved Documents</p>
                    {searchResults.documents.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          item.action();
                          setIsSearchFocused(false);
                          setSearchQuery('');
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/[0.05] text-xs font-medium text-zinc-300 hover:text-white flex items-center justify-between transition-colors"
                      >
                        <span className="truncate">{item.title}</span>
                        <Eye className="w-3.5 h-3.5 text-zinc-500" />
                      </button>
                    ))}
                  </div>
                )}

                {searchResults.features.length === 0 && searchResults.articles.length === 0 && searchResults.documents.length === 0 && (
                  <div className="text-center py-4 text-xs text-zinc-500">
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/25 hover:bg-violet-500/20 text-xs font-semibold transition-all shadow-sm"
              title="Launch Obsidian Constitution Graph"
            >
              <Network className="w-3.5 h-3.5 text-violet-400" />
              <span className="hidden sm:inline">Graph RAG</span>
              <span className="bg-violet-600 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold">448</span>
            </button>

            {/* Notifications Toggle */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 hover:bg-white/[0.06] rounded-full text-zinc-400 hover:text-white transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#161922] rounded-2xl shadow-2xl border border-white/[0.12] z-50 animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden">
                    <div className="p-3.5 border-b border-white/[0.08] flex items-center justify-between bg-[#12151e]">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-300">Notifications</h3>
                        {unreadCount > 0 && (
                          <span className="badge-purple">
                            {unreadCount} New
                          </span>
                        )}
                      </div>
                      <button 
                        onClick={handleMarkAllRead}
                        className="text-[11px] font-medium text-violet-400 hover:text-violet-300 hover:underline"
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
                            notif.unread ? 'bg-violet-500/10 hover:bg-violet-500/15 font-semibold text-white' : 'hover:bg-white/[0.03] opacity-80 text-zinc-300'
                          }`}
                        >
                          <span className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${
                            notif.color === 'blue' ? 'bg-sky-400' : notif.color === 'emerald' ? 'bg-emerald-400' : 'bg-violet-400'
                          }`} />
                          <div className="flex-1">
                            <p className="text-xs text-white leading-tight">{notif.title}</p>
                            <p className="text-[11px] text-zinc-400 font-normal mt-0.5">{notif.desc}</p>
                            <span className="text-[9px] text-zinc-500 mt-1 block">{notif.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User Profile Pill */}
            <div className="flex items-center gap-2.5 pl-2.5 border-l border-white/[0.08]">
              <div className="w-8 h-8 rounded-full bg-violet-500/15 border border-violet-500/25 text-violet-300 font-bold flex items-center justify-center text-xs shadow-sm">
                {getInitials(user?.displayName || currentProfile.entityName)}
              </div>
              <div className="hidden xl:block text-left">
                <p className="text-xs font-semibold text-white leading-none truncate max-w-[120px]">{user?.displayName || currentProfile.entityName}</p>
                <p className="text-[10px] text-zinc-400 leading-tight mt-0.5">{currentProfile.state}</p>
              </div>
            </div>

          </div>
        </header>

        {/* Scrollable Main Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scroll-smooth custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* 1. HACKATHON PITCH HERO STRIP */}
            <div className="relative overflow-hidden bg-[#161922] rounded-2xl p-6 sm:p-7 text-white border border-white/[0.08] shadow-sm">
              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2.5 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-medium text-zinc-500 tracking-wider uppercase">PRJ-360-LEGAL</span>
                    <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
                    <span className="badge-purple">
                      <Sparkles className="w-3 h-3 text-violet-300" />
                      Constitutional Legal OS
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                    Intelligent Legal Command Center
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                    AI-powered constitutional knowledge, statutory compliance tracking, contract risk auditing, and automated legal operations for Indian enterprises & citizens.
                  </p>
                  
                  {/* Entity Metadata Row styled like Orax Key-Value pairs */}
                  <div className="pt-1.5 flex flex-wrap items-center gap-2 text-xs">
                    <div className="bg-[#11131a] px-3 py-1.5 rounded-xl border border-white/[0.06] font-medium flex items-center gap-2 text-zinc-300">
                      <Building2 className="w-3.5 h-3.5 text-violet-400" />
                      <span>{currentProfile.entityName}</span>
                    </div>
                    <span className="badge-low">
                      State: {currentProfile.state}
                    </span>
                    <span className="badge-medium">
                      GST & MSME Verified
                    </span>
                  </div>
                </div>

                {/* Pitch Live Metrics Badges - Clean Flat Panels */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 shrink-0">
                  <div className="bg-[#11131a] border border-white/[0.06] p-3 rounded-xl text-center">
                    <p className="text-xl sm:text-2xl font-bold text-violet-400">448</p>
                    <p className="text-[10px] uppercase font-medium text-zinc-400 mt-0.5">Articles Grounded</p>
                  </div>
                  <div className="bg-[#11131a] border border-white/[0.06] p-3 rounded-xl text-center">
                    <p className="text-xl sm:text-2xl font-bold text-sky-400">122</p>
                    <p className="text-[10px] uppercase font-medium text-zinc-400 mt-0.5">SC Precedents</p>
                  </div>
                  <div className="bg-[#11131a] border border-white/[0.06] p-3 rounded-xl text-center">
                    <p className="text-xl sm:text-2xl font-bold text-violet-300">28</p>
                    <p className="text-[10px] uppercase font-medium text-zinc-400 mt-0.5">Languages & Voice</p>
                  </div>
                  <div className="bg-[#11131a] border border-white/[0.06] p-3 rounded-xl text-center">
                    <p className="text-xl sm:text-2xl font-bold text-emerald-400">Kanoon</p>
                    <p className="text-[10px] uppercase font-medium text-zinc-400 mt-0.5">Live Citations</p>
                  </div>
                  <div className="bg-[#11131a] border border-white/[0.06] p-3 rounded-xl text-center">
                    <p className="text-xl sm:text-2xl font-bold text-amber-400">85%</p>
                    <p className="text-[10px] uppercase font-medium text-zinc-400 mt-0.5">Health Score</p>
                  </div>
                  <div className="bg-[#11131a] border border-white/[0.06] p-3 rounded-xl text-center">
                    <p className="text-xl sm:text-2xl font-bold text-violet-400">Zero</p>
                    <p className="text-[10px] uppercase font-medium text-zinc-400 mt-0.5">Hallucinations</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 1.5 DEDICATED 24/7 AI TELEPHONY HELPLINE BANNER */}
            <div className="bg-[#141721] border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-sm relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-400">
                      Sarvam Samvaad Live Telephony Agent Connected
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>24/7 Citizen Legal Voice Helpline</span>
                    <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      +91 7965480318
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Dial directly from any phone for instant Hindi conversational legal guidance on IPC/BNS, Property disputes, FIR procedures, and NALSA free legal aid.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <a
                    href="tel:+917965480318"
                    id="dashboard-call-bot-btn"
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-4 py-2.5 rounded-xl border border-emerald-500/30 transition-all text-center"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call Bot (+91 7965480318)</span>
                  </a>

                  <button
                    onClick={() => navigate('/dashboard/sarvam-voice')}
                    className="flex items-center gap-2 bg-[#161922] hover:bg-[#1b202c] text-slate-300 hover:text-white font-medium text-xs px-4 py-2.5 rounded-xl border border-white/[0.08] transition-all cursor-pointer"
                  >
                    <Headphones className="w-3.5 h-3.5 text-emerald-400" />
                    <span>View Call History</span>
                    <ArrowRight className="w-3 h-3 text-zinc-500" />
                  </button>
                </div>
              </div>
            </div>

            {/* 2. CORE PILLARS — 6 INTERACTIVE PRODUCT LAUNCHERS */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-violet-400" /> Platform Superpowers
                  </h3>
                  <p className="text-xs text-zinc-400">Actionable SaaS legal intelligence suites with 1-click launch</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* 1. Obsidian Graph RAG Launcher */}
                <div 
                  onClick={() => window.dispatchEvent(new CustomEvent('open-obsidian-graph', { detail: { artNo: '21' } }))}
                  className="bg-[#161922] rounded-2xl p-5 border border-white/[0.08] hover:border-violet-500/30 hover:bg-[#1b202c] transition-all duration-200 cursor-pointer group relative overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/25 flex items-center justify-center text-violet-400 group-hover:scale-105 transition-all">
                        <Network className="w-5 h-5" />
                      </div>
                      <span className="badge-purple">
                        448 Articles
                      </span>
                    </div>
                    <h4 className="font-bold text-white text-sm mb-1 group-hover:text-violet-300 transition-colors">
                      Constitutional Knowledge Graph
                    </h4>
                    <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                      Force-directed 3D network mapping Articles 1–395, landmark Supreme Court cases & Indian Kanoon citations.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-semibold text-violet-400 group-hover:text-violet-300">
                    <span>Launch Knowledge Graph</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* 2. AI Advisory & Multilingual Voice */}
                <div 
                  onClick={() => navigate('/dashboard/chat')}
                  className="bg-[#161922] rounded-2xl p-5 border border-white/[0.08] hover:border-violet-500/30 hover:bg-[#1b202c] transition-all duration-200 cursor-pointer group relative overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/25 flex items-center justify-center text-violet-400 group-hover:scale-105 transition-all">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <span className="badge-medium">
                        28 Languages
                      </span>
                    </div>
                    <h4 className="font-bold text-white text-sm mb-1 group-hover:text-violet-300 transition-colors">
                      AI Legal Advisory & Voice Call
                    </h4>
                    <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                      Conversational counsel with verified statutory sections, zero hallucinations, and multilingual voice interaction.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-semibold text-violet-400 group-hover:text-violet-300">
                    <span>Start Consultation</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* 3. Contract & Risk Clause Analyzer */}
                <div 
                  onClick={() => navigate('/dashboard/contracts')}
                  className="bg-[#161922] rounded-2xl p-5 border border-white/[0.08] hover:border-violet-500/30 hover:bg-[#1b202c] transition-all duration-200 cursor-pointer group relative overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/25 flex items-center justify-center text-violet-400 group-hover:scale-105 transition-all">
                        <FileSearch className="w-5 h-5" />
                      </div>
                      <span className="badge-high">
                        PDF Audit
                      </span>
                    </div>
                    <h4 className="font-bold text-white text-sm mb-1 group-hover:text-violet-300 transition-colors">
                      Contract & Risk Clause Analyzer
                    </h4>
                    <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                      Audit leases, commercial agreements & NDAs. Auto-extract uncapped liabilities and termination traps.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-semibold text-violet-400 group-hover:text-violet-300">
                    <span>Audit New Agreement</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* 4. Verified Advocates Directory */}
                <div 
                  onClick={() => setShowLocationFinder(true)}
                  className="bg-[#161922] rounded-2xl p-5 border border-white/[0.08] hover:border-violet-500/30 hover:bg-[#1b202c] transition-all duration-200 cursor-pointer group relative overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/25 flex items-center justify-center text-violet-400 group-hover:scale-105 transition-all">
                        <Users className="w-5 h-5" />
                      </div>
                      <span className="badge-low">
                        1,200+ Verified
                      </span>
                    </div>
                    <h4 className="font-bold text-white text-sm mb-1 group-hover:text-violet-300 transition-colors">
                      Verified Advocate Network
                    </h4>
                    <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                      GPS-enabled legal counsel matching across Supreme Court, High Courts, and District Tribunals.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-semibold text-violet-400 group-hover:text-violet-300">
                    <span>Find Local Counsel</span>
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
                <div className="bg-[#161922] rounded-3xl p-5 sm:p-6 border border-white/[0.08]">
                  
                  {/* Tab Navigation Header styled like reference board tabs */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
                    <div>
                      <h3 className="text-base font-bold text-white">Legal Operations Workspace</h3>
                      <p className="text-xs text-zinc-400">Interactive system topologies, compliance graph & verified documents</p>
                    </div>

                    {/* Orax Nav Tabs */}
                    <div className="flex items-center gap-1 self-start sm:self-auto overflow-x-auto max-w-full">
                      <button
                        onClick={() => setActiveTab('ecosystem')}
                        className={`orax-nav-tab ${activeTab === 'ecosystem' ? 'active' : ''}`}
                      >
                        <Network className="w-4 h-4 text-violet-400" />
                        <span>Ecosystem Map</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('documents')}
                        className={`orax-nav-tab ${activeTab === 'documents' ? 'active' : ''}`}
                      >
                        <FileText className="w-4 h-4 text-violet-400" />
                        <span>Documents ({documents.length})</span>
                      </button>
                    </div>
                  </div>

                  {/* Tab Body 1: Interactive Legal Ecosystem Graph */}
                  {activeTab === 'ecosystem' && (
                    <div className="pt-4 animate-in fade-in duration-200">
                      <div className="mb-3 flex items-center justify-between text-xs text-zinc-400 bg-[#11131a] p-3 rounded-xl border border-white/[0.06]">
                        <span>Interactive node visualization connecting business licenses, active vault documents & statutory obligations.</span>
                        <span className="font-medium text-violet-400 shrink-0 ml-2">Click nodes to inspect</span>
                      </div>
                      <div className="rounded-2xl overflow-hidden border border-white/[0.06]">
                        <EcosystemGraph />
                      </div>
                    </div>
                  )}

                  {/* Tab Body 2: Document Vault & Notices */}
                  {activeTab === 'documents' && (
                    <div className="pt-4 animate-in fade-in duration-200 space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-zinc-400">Legal documents generated and stored securely with SHA-256 hash verification</p>
                        <button
                          onClick={() => navigate('/dashboard/documents')}
                          className="flex items-center gap-1 text-xs font-semibold text-violet-400 hover:text-violet-300"
                        >
                          <Plus className="w-3.5 h-3.5" /> Generate Document
                        </button>
                      </div>

                      <div className="space-y-2.5">
                        {documents.map((doc) => (
                          <div 
                            key={doc.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-[#11131a] hover:bg-[#141721] rounded-2xl border border-white/[0.06] hover:border-white/[0.12] transition-all gap-3"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/25 flex items-center justify-center text-violet-400 shrink-0 mt-0.5">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-xs text-white leading-tight">{doc.title}</h4>
                                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px] text-zinc-400">
                                  <span>{new Date(doc.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                  <span className="w-1 h-1 rounded-full bg-zinc-600"></span>
                                  <span className="badge-low">{doc.category || doc.type}</span>
                                  <span className="badge-medium">Verified</span>
                                </div>
                              </div>
                            </div>

                            {/* Working Action Buttons */}
                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                              <button
                                onClick={() => setPreviewDocument(doc)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#161922] border border-white/10 text-zinc-300 hover:text-white hover:border-violet-500/30 text-xs font-medium transition-all cursor-pointer"
                                title="View Document Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Preview</span>
                              </button>

                              <button
                                onClick={() => handleDownloadDocument(doc)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-[0_0_12px_rgba(168,85,247,0.3)] transition-all cursor-pointer"
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
                        <Link to="/dashboard/documents" className="text-xs font-semibold text-purple-400 hover:text-purple-300 hover:underline inline-flex items-center gap-1">
                          Open Full Document Vault <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
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
                <div className="bg-[#161922] rounded-3xl p-5 sm:p-6 border border-white/[0.08]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <Award className="w-4 h-4 text-purple-400" />
                      Top Verified Advocates
                    </h3>
                    <button 
                      onClick={() => setShowLocationFinder(true)}
                      className="text-xs font-semibold text-purple-400 hover:text-purple-300"
                    >
                      Find Nearby
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {TOP_LAWYERS.map((lawyer) => (
                      <div 
                        key={lawyer.id}
                        onClick={() => setSelectedLawyer(lawyer)}
                        className="p-3 bg-[#11131a] hover:bg-[#141721] rounded-2xl border border-white/[0.06] hover:border-purple-500/30 transition-all cursor-pointer group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 font-bold flex items-center justify-center text-xs">
                              {lawyer.name.split(' ')[1] ? lawyer.name.split(' ')[1][0] : 'L'}
                            </div>
                            <div>
                              <h4 className="font-semibold text-xs text-white group-hover:text-purple-300 transition-colors leading-tight">{lawyer.name}</h4>
                              <p className="text-[10px] text-zinc-400 font-medium mt-0.5">{lawyer.specialization}</p>
                            </div>
                          </div>
                          <span className="badge-high">
                            ★ {lawyer.rating}
                          </span>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-white/[0.05] flex items-center justify-between text-[10px] text-zinc-400">
                          <span>{lawyer.court}</span>
                          <span className="font-semibold text-purple-400 group-hover:underline">Contact & Consult</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setShowLocationFinder(true)}
                    className="w-full mt-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)] cursor-pointer flex items-center justify-center gap-2"
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
        <div className="fixed inset-0 z-50 bg-[#0c0e14]/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#161922] rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-white/[0.12] overflow-hidden text-white">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between bg-[#11131a]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white leading-tight">{previewDocument.title}</h3>
                  <p className="text-[10px] text-zinc-400 font-medium">Category: {previewDocument.category || previewDocument.type}</p>
                </div>
              </div>
              <button 
                onClick={() => setPreviewDocument(null)} 
                className="p-1.5 hover:bg-white/[0.06] rounded-lg text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 p-5 overflow-y-auto font-mono text-xs text-zinc-300 leading-relaxed bg-[#0c0e14] select-text">
              <pre className="whitespace-pre-wrap font-sans bg-[#11131a] p-4 rounded-2xl border border-white/[0.06]">
                {previewDocument.content || 'Document content ready for formal filing.'}
              </pre>
            </div>

            {/* Modal Footer with Working Actions */}
            <div className="p-4 border-t border-white/[0.08] flex items-center justify-between bg-[#11131a]">
              <button
                onClick={() => handleCopyText(previewDocument.content || previewDocument.title)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-[#161922] hover:bg-[#1f2433] text-xs font-semibold text-zinc-200 transition-colors"
              >
                {copySuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copySuccess ? 'Copied to Clipboard!' : 'Copy Text'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewDocument(null)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Close
                </button>
                <button
                  onClick={() => handleDownloadDocument(previewDocument)}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-colors"
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
        <div className="fixed inset-0 z-50 bg-[#0c0e14]/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#161922] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-white/[0.12] space-y-4 text-white">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-300 font-bold flex items-center justify-center text-lg shadow-[0_0_15px_rgba(168,85,247,0.25)]">
                  {selectedLawyer.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">{selectedLawyer.name}</h3>
                  <p className="text-xs text-purple-400 font-semibold">{selectedLawyer.specialization}</p>
                </div>
              </div>
              <button onClick={() => setSelectedLawyer(null)} className="p-1 hover:bg-white/[0.06] rounded-lg text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#11131a] p-3.5 rounded-2xl border border-white/[0.06] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-400 font-medium">Court Jurisdiction:</span>
                <span className="font-semibold text-white">{selectedLawyer.court}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400 font-medium">Bar Experience:</span>
                <span className="font-semibold text-white">{selectedLawyer.experience}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400 font-medium">Direct Phone:</span>
                <span className="font-semibold text-purple-400">{selectedLawyer.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400 font-medium">Completed Sessions:</span>
                <span className="badge-medium">{selectedLawyer.consultations} Cases Handled</span>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <a
                href={`tel:${selectedLawyer.phone}`}
                className="flex-1 py-2.5 bg-[#11131a] hover:bg-[#161a25] border border-white/10 text-white font-semibold rounded-xl text-xs text-center flex items-center justify-center gap-1.5 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" /> Call Now
              </a>
              <button
                onClick={() => {
                  setSelectedLawyer(null);
                  navigate('/dashboard/chat');
                }}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl text-xs text-center flex items-center justify-center gap-1.5 transition-colors shadow-[0_0_15px_rgba(168,85,247,0.3)]"
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