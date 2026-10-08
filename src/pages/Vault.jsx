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
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-center text-indigo-700">
              <FolderLock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">User Knowledge Vault & SIS Store</h1>
              <p className="text-xs text-slate-500">Encrypted business document repository & Knowledge Graph</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!userProfile ? (
              <button
                onClick={() => setShowWizard(true)}
                className="flex items-center gap-2 px-4 h-9 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100"
              >
                <Sparkles className="w-4 h-4" />
                <span>Complete Business Profile</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-700">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>{userProfile.entityName || userProfile.businessType?.toUpperCase()}</span>
              </div>
            )}

            <button
              onClick={() => {
                setDlStep(1);
                setShowDigiLocker(true);
              }}
              className="flex items-center gap-2 px-4 h-9 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-100"
            >
              <FolderLock className="w-4 h-4" />
              <span>Import from DigiLocker</span>
            </button>

            <label className="flex items-center gap-2 px-4 h-9 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md">
              <UploadCloud className="w-4 h-4" />
              <span>Upload Document</span>
              <input type="file" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
          {/* Tab Switcher */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2 bg-slate-200/60 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('docs')}
                className={`flex items-center gap-2 px-4 h-9 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'docs' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Documents & Vault ({docs.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('policies')}
                className={`flex items-center gap-2 px-4 h-9 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'policies' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Company Policies & SIS</span>
              </button>
              <button
                onClick={() => setActiveTab('graph')}
                className={`flex items-center gap-2 px-4 h-9 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'graph' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Network className="w-4 h-4" />
                <span>Knowledge Graph</span>
              </button>
            </div>

            {/* Search Bar */}
            {activeTab === 'docs' && (
              <div className="relative w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search vault..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-4 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none"
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
                    className={`px-3.5 h-8 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
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
                    className="bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 shrink-0">
                          <FileText className="w-6 h-6" />
                        </div>
                        <span className="px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-md text-[10px] font-bold">
                          {doc.status}
                        </span>
                      </div>

                      <h3 className="font-bold text-sm text-slate-900 mt-4 line-clamp-2">{doc.title}</h3>
                      <div className="flex items-center gap-3 text-slate-400 text-xs mt-2">
                        <span>{doc.type}</span>
                        <span>•</span>
                        <span>{doc.size}</span>
                        <span>•</span>
                        <span>{doc.date}</span>
                      </div>
                    </div>

                    {/* Extracted Metadata Preview Pill */}
                    {doc.extractedData && (
                      <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-indigo-600" />
                          <span>Gemini Extracted Data</span>
                        </p>
                        <p className="text-xs text-slate-700 font-mono truncate">
                          {doc.extractedData.gstin || doc.extractedData.panNumber || doc.extractedData.governingLaw || 'OCR Processed'}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => setSelectedDoc(doc)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View OCR Data</span>
                      </button>

                      <button
                        onClick={() => setDocs(docs.filter(d => d.id !== doc.id))}
                        className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* DigiLocker Promotion Card */}
              <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border border-blue-100 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-extrabold text-lg shrink-0">
                    DL
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                      <span>Official Government DigiLocker Integration</span>
                      <span className="bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase">Coming Soon</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-xl">
                      Link your corporate Aadhaar credentials to instantly pull verified Company Incorporation forms, GSTR summaries, PAN cards, and shop establishment documents directly from the government portal.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setDlStep(1);
                    setShowDigiLocker(true);
                  }}
                  className="px-4 py-2 border border-blue-300 hover:bg-blue-100/50 text-blue-700 font-bold text-xs rounded-xl whitespace-nowrap"
                >
                  Verify Portal Connection
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Company Policies & SIS */}
          {activeTab === 'policies' && (
            <div className="space-y-6">
              <div className="p-6 bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl text-white flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">Company Standard Operating Standards (SIS) Bank</h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Upload internal HR manuals, data privacy policies, and compliance SOPs. The AI agent indexes these to answer policy queries.
                  </p>
                </div>
                <button className="px-4 h-10 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg">
                  + Add New Policy Doc
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                <h4 className="font-bold text-sm text-slate-900">Active Company SOPs & Policies</h4>

                <div className="divide-y divide-slate-100">
                  {docs.filter(d => d.category === 'policy' || d.category === 'contract').map((pol) => (
                    <div key={pol.id} className="py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-5 h-5 text-indigo-600" />
                        <div>
                          <p className="font-bold text-xs text-slate-900">{pol.title}</p>
                          <p className="text-[11px] text-slate-500">Indexed for AI Querying • Last modified {pol.date}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-100">
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
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900">User & Business Vault Graph</h3>
                  <p className="text-xs text-slate-500">Connected nodes representing your legal ecosystem: Entity $\rightarrow$ Licenses $\rightarrow$ Deadlines $\rightarrow$ Schemes</p>
                </div>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold">
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">Gemini Extracted Data: {selectedDoc.title}</h3>
              <button onClick={() => setSelectedDoc(null)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">✕</button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs font-mono">
              {Object.entries(selectedDoc.extractedData || {}).map(([key, val]) => (
                <div key={key} className="flex justify-between border-b border-slate-200/60 pb-1">
                  <span className="text-slate-500 capitalize">{key}:</span>
                  <span className="font-bold text-slate-900">{val}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setSelectedDoc(null)}
              className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs"
            >
              Close Metadata Viewer
            </button>
          </div>
        </div>
      )}

      {/* Onboarding Wizard Modal */}
      {showWizard && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <OnboardingWizard onComplete={(profile) => {
            setUserProfile(profile);
            setShowWizard(false);
          }} />
        </div>
      )}

      {/* DigiLocker Simulation Modal */}
      {showDigiLocker && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-extrabold text-sm">DL</div>
                <h3 className="font-bold text-sm text-slate-900">Link Government DigiLocker</h3>
              </div>
              <button onClick={() => setShowDigiLocker(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            {dlStep === 1 && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500">
                  Sign in via Aadhaar or Registered Mobile to fetch your official corporate tax registrations, PAN, and incorporation details.
                </p>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Aadhaar / Mobile Number</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 98765 43210"
                    value={dlPhone}
                    onChange={(e) => setDlPhone(e.target.value)}
                    className="w-full h-11 px-3 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => setDlStep(2)}
                  disabled={!dlPhone}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs rounded-xl"
                >
                  Request secure OTP
                </button>
              </div>
            )}

            {dlStep === 2 && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500">
                  Enter the 6-digit OTP sent to the mobile number registered with your Aadhaar link.
                </p>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Verification Code</label>
                  <input
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={dlOtp}
                    onChange={(e) => setDlOtp(e.target.value)}
                    className="w-full h-11 px-3 border border-slate-200 rounded-xl text-center text-xs font-bold tracking-widest focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => {
                    setDlStep(3);
                    handleDigiLockerImport();
                  }}
                  disabled={dlOtp.length < 4}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl"
                >
                  Authenticate & Sync Documents
                </button>
              </div>
            )}

            {dlStep === 3 && (
              <div className="text-center py-6 space-y-4">
                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto border border-green-200">
                  <CheckCircle className="w-6 h-6 animate-bounce" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Vault Documents Synced</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Your official GST Certificate and Company PAN card have been imported securely from DigiLocker.
                  </p>
                </div>
                <button
                  onClick={() => setShowDigiLocker(false)}
                  className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl"
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
