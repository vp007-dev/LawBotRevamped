import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { 
  FolderLock, UploadCloud, FileText, ShieldCheck, Tag, Sparkles, 
  Search, Eye, Trash2, Network, Lock, BookOpen, CheckCircle, Clock, Plus, Filter, Download
} from 'lucide-react';
import OnboardingWizard from '../components/OnboardingWizard';
import VaultGraph from '../components/VaultGraph';
import { extractDocumentData } from '../services/ocrService';

const CATEGORIES = [
  { id: 'all', label: 'All Documents' },
  { id: 'tax', label: 'Tax & GST' },
  { id: 'identity', label: 'Identity & Registrations' },
  { id: 'license', label: 'Licenses & Permits' },
  { id: 'contract', label: 'Contracts & Agreements' },
  { id: 'policy', label: 'Company Policies & SIS' },
];

const INITIAL_DOCS = [
  {
    id: 'doc-1',
    title: 'GST Registration Certificate (Form REG-06)',
    category: 'tax',
    type: 'PDF',
    size: '1.2 MB',
    date: '2024-04-12',
    status: 'Verified',
    extractedData: {
      gstin: '27AAACG1234F1Z5',
      legalName: 'ACME LEGAL TECH PRIVATE LIMITED',
      tradeName: 'LawBot360',
      registrationDate: '12/04/2024',
      constitution: 'Private Limited Company',
      jurisdiction: 'State - Maharashtra, Ward 804'
    }
  },
  {
    id: 'doc-2',
    title: 'Company Permanent Account Number (PAN Card)',
    category: 'identity',
    type: 'PNG',
    size: '450 KB',
    date: '2024-03-28',
    status: 'Verified',
    extractedData: {
      panNumber: 'AAACG1234F',
      entityName: 'ACME LEGAL TECH PRIVATE LIMITED',
      incorporationDate: '28/03/2024'
    }
  },
  {
    id: 'doc-3',
    title: 'Standard Employment & IP Assignment Agreement',
    category: 'contract',
    type: 'DOCX',
    size: '890 KB',
    date: '2024-05-15',
    status: 'AI Audited',
    extractedData: {
      parties: 'Company vs Employee',
      governingLaw: 'Indian Law (Mumbai Jurisdiction)',
      noticePeriod: '60 Days',
      ipRetentionClause: 'Valid under Section 27 Indian Contract Act'
    }
  },
  {
    id: 'doc-4',
    title: 'Company SIS & Data Privacy Policy SOP 2024',
    category: 'policy',
    type: 'PDF',
    size: '2.4 MB',
    date: '2024-06-01',
    status: 'Active Policy',
    extractedData: {
      policyType: 'Standard Operating Standard (SIS)',
      complianceFramework: 'DPDP Act 2023 & IT Act 2000',
      lastReviewDate: '01/06/2024'
    }
  }
];

const Vault = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [docs, setDocs] = useState(() => {
    const saved = localStorage.getItem('lawbot-vault-docs');
    return saved ? JSON.parse(saved) : INITIAL_DOCS;
  });
  const [activeTab, setActiveTab] = useState('docs'); // 'docs' | 'policies' | 'graph'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showWizard, setShowWizard] = useState(false);
  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('lawbot-user-profile');
    return saved ? JSON.parse(saved) : null;
  });

  const [showDigiLocker, setShowDigiLocker] = useState(false);
  const [dlStep, setDlStep] = useState(1);
  const [dlPhone, setDlPhone] = useState('');
  const [dlOtp, setDlOtp] = useState('');

  const handleDigiLockerImport = () => {
    const mockDigiDocs = [
      {
        id: `dl-${Date.now()}-gst`,
        title: 'GST registration Certificate (Form REG-06) - DigiLocker Verified',
        category: 'tax',
        type: 'PDF',
        size: '1.4 MB',
        date: new Date().toISOString().split('T')[0],
        status: 'DigiLocker Verified',
        extractedData: {
          gstin: '27AAACG1234F1Z5',
          legalName: 'ACME LEGAL TECH PRIVATE LIMITED',
          tradeName: 'LawBot360',
          registrationDate: '12/04/2024',
          constitution: 'Private Limited Company',
          verifiedSource: 'DigiLocker Secure API Portal'
        }
      },
      {
        id: `dl-${Date.now()}-pan`,
        title: 'Company PAN Card - DigiLocker Verified',
        category: 'identity',
        type: 'PDF',
        size: '410 KB',
        date: new Date().toISOString().split('T')[0],
        status: 'DigiLocker Verified',
        extractedData: {
          panNumber: 'AAACG1234F',
          entityName: 'ACME LEGAL TECH PRIVATE LIMITED',
          incorporationDate: '28/03/2024',
          verifiedSource: 'DigiLocker Secure API Portal'
        }
      }
    ];
    setDocs(prev => [...mockDigiDocs, ...prev]);
  };

  useEffect(() => {
    localStorage.setItem('lawbot-vault-docs', JSON.stringify(docs));
  }, [docs]);

  const filteredDocs = docs.filter(doc => {
    const matchesCat = selectedCategory === 'all' || doc.category === selectedCategory;
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const tempId = `doc-${Date.now()}`;
    const newDoc = {
      id: tempId,
      title: file.name,
      category: 'tax',
      type: file.name.split('.').pop().toUpperCase(),
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      date: new Date().toISOString().split('T')[0],
      status: 'Processing...',
      extractedData: {
        ocrStatus: 'Extracting data using Gemini Multimodal OCR...',
        fileName: file.name,
        extractedTimestamp: new Date().toLocaleString()
      }
    };

    setDocs(prev => [newDoc, ...prev]);

    try {
      const extractedData = await extractDocumentData(file);
      
      setDocs(prevDocs => 
        prevDocs.map(doc => 
          doc.id === tempId 
            ? {
                ...doc,
                status: 'Extracted via Gemini',
                category: (extractedData.documentCategory && CATEGORIES.some(c => c.id === extractedData.documentCategory.toLowerCase())) 
                          ? extractedData.documentCategory.toLowerCase() 
                          : 'tax',
                extractedData: {
                  ...doc.extractedData,
                  ...extractedData,
                  ocrStatus: 'Auto-extracted by Gemini Multimodal OCR'
                }
              }
            : doc
        )
      );
    } catch (error) {
      setDocs(prevDocs => 
        prevDocs.map(doc => 
          doc.id === tempId ? { ...doc, status: 'Failed OCR', extractedData: { error: 'Extraction failed' } } : doc
        )
      );
    }
  };

  return (
    <div className="flex h-screen bg-[#0c0e14] text-[#f1f5f9] overflow-hidden font-sans">
      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Header */}
        <header className="h-16 bg-[#141721]/90 backdrop-blur-md border-b border-white/[0.08] px-6 flex items-center justify-between shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#161922] border border-purple-500/30 rounded-xl flex items-center justify-center text-purple-400 shadow-sm">
              <FolderLock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white">User Knowledge Vault & SIS Store</h1>
              <p className="text-xs text-slate-400">Encrypted business document repository & Knowledge Graph</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!userProfile ? (
              <button
                onClick={() => setShowWizard(true)}
                className="flex items-center gap-2 px-3.5 h-9 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-900/20 active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Complete Business Profile</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#161922] border border-purple-500/30 rounded-xl text-xs font-bold text-purple-300">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>{userProfile.entityName || userProfile.businessType?.toUpperCase()}</span>
              </div>
            )}

            <button
              onClick={() => {
                setDlStep(1);
                setShowDigiLocker(true);
              }}
              className="flex items-center gap-2 px-3.5 h-9 bg-[#161922] hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/20 text-slate-300 rounded-xl text-xs font-semibold transition-all active:scale-95"
            >
              <FolderLock className="w-3.5 h-3.5 text-purple-400" />
              <span>Import from DigiLocker</span>
            </button>

            <label className="flex items-center gap-2 px-3.5 h-9 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md shadow-purple-900/20 active:scale-95">
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload Document</span>
              <input type="file" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
          {/* Tab Switcher */}
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
            <div className="flex items-center gap-1.5 bg-[#11131a] border border-white/[0.08] p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('docs')}
                className={`flex items-center gap-2 px-3.5 h-8 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'docs' ? 'bg-[#161922] text-purple-300 border border-purple-500/30 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Documents & Vault ({docs.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('policies')}
                className={`flex items-center gap-2 px-3.5 h-8 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'policies' ? 'bg-[#161922] text-purple-300 border border-purple-500/30 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Company Policies & SIS</span>
              </button>
              <button
                onClick={() => setActiveTab('graph')}
                className={`flex items-center gap-2 px-3.5 h-8 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'graph' ? 'bg-[#161922] text-purple-300 border border-purple-500/30 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Network className="w-3.5 h-3.5" />
                <span>Knowledge Graph</span>
              </button>
            </div>

            {/* Search Bar */}
            {activeTab === 'docs' && (
              <div className="relative w-64">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search vault..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-4 text-xs bg-[#161922] border border-white/[0.08] text-white placeholder:text-slate-500 rounded-xl focus:border-purple-500 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* TAB 1: Documents Grid */}
          {activeTab === 'docs' && (
            <div className="space-y-6">
              {/* Category Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3.5 h-8 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-900/20'
                        : 'bg-[#161922] border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Documents Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-[#161922] border border-white/[0.08] hover:border-purple-500/40 rounded-2xl p-5 shadow-lg shadow-black/20 transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="p-3 bg-[#11131a] border border-white/[0.06] rounded-xl text-purple-400 shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold">
                          {doc.status}
                        </span>
                      </div>

                      <h3 className="font-bold text-sm text-white mt-4 line-clamp-2 group-hover:text-purple-300 transition-colors">{doc.title}</h3>
                      <div className="flex items-center gap-2 text-slate-400 text-xs mt-2">
                        <span>{doc.type}</span>
                        <span>•</span>
                        <span>{doc.size}</span>
                        <span>•</span>
                        <span>{doc.date}</span>
                      </div>
                    </div>

                    {/* Extracted Metadata Preview Pill */}
                    {doc.extractedData && (
                      <div className="mt-4 p-3 bg-[#11131a] border border-white/[0.06] rounded-xl space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-purple-400" />
                          <span>Gemini Extracted Data</span>
                        </p>
                        <p className="text-xs text-slate-300 font-mono truncate">
                          {doc.extractedData.gstin || doc.extractedData.panNumber || doc.extractedData.governingLaw || 'OCR Processed'}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.06]">
                      <button
                        onClick={() => setSelectedDoc(doc)}
                        className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View OCR Data</span>
                      </button>

                      <button
                        onClick={() => setDocs(docs.filter(d => d.id !== doc.id))}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* DigiLocker Promotion Card */}
              <div className="bg-[#161922] border border-purple-500/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 shadow-xl shadow-black/20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-xl flex items-center justify-center font-extrabold text-base shrink-0">
                    DL
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <span>Official Government DigiLocker Integration</span>
                      <span className="bg-purple-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase">Connected</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-xl">
                      Link your corporate Aadhaar credentials to instantly pull verified Company Incorporation forms, GSTR summaries, PAN cards, and shop establishment documents directly from the government portal.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setDlStep(1);
                    setShowDigiLocker(true);
                  }}
                  className="px-4 py-2 border border-purple-500/40 hover:bg-purple-500/10 text-purple-300 font-semibold text-xs rounded-xl whitespace-nowrap transition-all"
                >
                  Verify Portal Connection
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Company Policies & SIS */}
          {activeTab === 'policies' && (
            <div className="space-y-6">
              <div className="p-6 bg-[#161922] border border-purple-500/30 rounded-2xl text-white flex items-center justify-between shadow-xl shadow-black/20">
                <div>
                  <h3 className="text-base font-bold text-white">Company Standard Operating Standards (SIS) Bank</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xl">
                    Upload internal HR manuals, data privacy policies, and compliance SOPs. The AI agent indexes these to answer policy queries.
                  </p>
                </div>
                <button className="px-4 h-9 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-900/20 transition-all">
                  + Add New Policy Doc
                </button>
              </div>

              <div className="bg-[#161922] border border-white/[0.08] rounded-2xl p-6 space-y-4 shadow-xl shadow-black/20">
                <h4 className="font-bold text-sm text-white">Active Company SOPs & Policies</h4>

                <div className="divide-y divide-white/[0.06]">
                  {docs.filter(d => d.category === 'policy' || d.category === 'contract').map((pol) => (
                    <div key={pol.id} className="py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-5 h-5 text-purple-400" />
                        <div>
                          <p className="font-bold text-xs text-white">{pol.title}</p>
                          <p className="text-[11px] text-slate-400">Indexed for AI Querying • Last modified {pol.date}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-purple-500/10 text-purple-300 text-xs font-bold rounded-full border border-purple-500/20">
                        AI Accessible
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Interactive Knowledge Graph */}
          {activeTab === 'graph' && (
            <div className="bg-[#161922] border border-white/[0.08] rounded-2xl p-6 space-y-6 shadow-xl shadow-black/20">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-white">User & Business Vault Graph</h3>
                  <p className="text-xs text-slate-400">Connected nodes representing your legal ecosystem: Entity → Licenses → Deadlines → Schemes</p>
                </div>
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold">
                  ● Graph Synced
                </span>
              </div>

              <VaultGraph />
            </div>
          )}
        </main>
      </div>

      {/* OCR Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#161922] border border-white/[0.08] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl shadow-black/80 text-white">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="font-bold text-sm text-white">Gemini Extracted Data: {selectedDoc.title}</h3>
              <button onClick={() => setSelectedDoc(null)} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
            </div>

            <div className="bg-[#11131a] border border-white/[0.06] rounded-xl p-4 space-y-2 text-xs font-mono max-h-80 overflow-y-auto">
              {Object.entries(selectedDoc.extractedData || {}).map(([key, val]) => (
                <div key={key} className="flex justify-between border-b border-white/[0.04] pb-1">
                  <span className="text-slate-400 capitalize">{key}:</span>
                  <span className="font-semibold text-purple-300">{val}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setSelectedDoc(null)}
              className="w-full h-10 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-xs shadow-md shadow-purple-900/20 transition-all"
            >
              Close Metadata Viewer
            </button>
          </div>
        </div>
      )}

      {/* Onboarding Wizard Modal */}
      {showWizard && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <OnboardingWizard onComplete={(profile) => {
            setUserProfile(profile);
            setShowWizard(false);
          }} />
        </div>
      )}

      {/* DigiLocker Simulation Modal */}
      {showDigiLocker && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#161922] border border-white/[0.08] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl shadow-black/80 text-white">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-extrabold text-xs">DL</div>
                <h3 className="font-bold text-sm text-white">Link Government DigiLocker</h3>
              </div>
              <button onClick={() => setShowDigiLocker(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            {dlStep === 1 && (
              <div className="space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Sign in via Aadhaar or Registered Mobile to fetch your official corporate tax registrations, PAN, and incorporation details.
                </p>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Aadhaar / Mobile Number</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 98765 43210"
                    value={dlPhone}
                    onChange={(e) => setDlPhone(e.target.value)}
                    className="w-full h-11 px-3 bg-[#11131a] border border-white/[0.1] rounded-xl text-xs font-bold text-white placeholder:text-slate-500 focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => setDlStep(2)}
                  disabled={!dlPhone}
                  className="w-full h-11 bg-purple-600 hover:bg-purple-500 disabled:bg-white/[0.05] disabled:text-slate-600 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-900/20 transition-all"
                >
                  Request secure OTP
                </button>
              </div>
            )}

            {dlStep === 2 && (
              <div className="space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Enter the 6-digit OTP sent to the mobile number registered with your Aadhaar link.
                </p>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Verification Code</label>
                  <input
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={dlOtp}
                    onChange={(e) => setDlOtp(e.target.value)}
                    className="w-full h-11 px-3 bg-[#11131a] border border-white/[0.1] rounded-xl text-center text-xs font-bold tracking-widest text-white placeholder:text-slate-500 focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => {
                    setDlStep(3);
                    handleDigiLockerImport();
                  }}
                  disabled={dlOtp.length < 4}
                  className="w-full h-11 bg-purple-600 hover:bg-purple-500 disabled:bg-white/[0.05] disabled:text-slate-600 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-900/20 transition-all"
                >
                  Authenticate & Sync Documents
                </button>
              </div>
            )}

            {dlStep === 3 && (
              <div className="text-center py-6 space-y-4">
                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-6 h-6 animate-bounce" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Vault Documents Synced</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Your official GST Certificate and Company PAN card have been imported securely from DigiLocker.
                  </p>
                </div>
                <button
                  onClick={() => setShowDigiLocker(false)}
                  className="w-full h-11 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-900/20 transition-all"
                >
                  Return to Vault
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Vault;
