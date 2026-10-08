import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { 
  Newspaper, ShieldCheck, Filter, Search, Zap, Calendar, 
  ArrowRight, FileText, Download, CheckCircle, Scale, Building2,
  Clock, BookOpen, ChevronDown, ChevronUp, Share2, Mail
} from 'lucide-react';

const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'CBIC Mandates E-Invoicing for E-commerce Operators under Section 146(2)',
    authority: 'Central Board of Indirect Taxes and Customs (CBIC)',
    circularNo: 'Notification No. 12/2026-Central Tax',
    date: '2026-08-04',
    category: 'GST',
    impact: 'High',
    applicableEntities: ['pvt_ltd', 'llp', 'partnership', 'opc'],
    applicableIndustries: ['E-commerce & Retail', 'Information Technology & Software'],
    summary: 'CBIC lowers the e-invoicing threshold for e-commerce suppliers. All suppliers on digital platforms must issue electronic invoices if annual turnover exceeds ₹5 Crores.',
    consequences: 'Failure to issue e-invoices leads to a 100% penalty of the tax due or ₹10,000 per invoice (whichever is higher) and restricts ITC claim for buyers.',
    actionPlan: [
      'Audit e-commerce sales ledger for FY 25-26.',
      'Check if e-invoice API credentials are configuration in ERP.',
      'Configure auto-generation of IRN (Invoice Reference Number) for August transactions.'
    ],
    sourceUrl: 'https://cbic.gov.in',
    status: 'Action Required'
  },
  {
    id: 'notif-2',
    title: 'Section 43B(h) Clause Extended to MSME 45-Day Payment Dues Audit',
    authority: 'Income Tax Department (CBDT)',
    circularNo: 'CBDT Circular No. 08 of 2026',
    date: '2026-08-02',
    category: 'Income Tax',
    impact: 'High',
    applicableEntities: ['pvt_ltd', 'llp', 'partnership', 'opc', 'proprietorship'],
    applicableIndustries: ['Information Technology & Software', 'E-commerce & Retail', 'Manufacturing & Industrial', 'Healthcare & Pharma', 'Real Estate & Construction', 'Professional Services & Consulting', 'Financial Services & Fintech', 'Food & Beverages / Restaurant (FSSAI)'],
    summary: 'Payments to MSME vendors outstanding beyond 45 days (with agreement) or 15 days (without agreement) will be disallowed as tax deductions under Section 43B(h) and added directly to taxable income.',
    consequences: 'Delayed payments will increase your taxable corporate income, leading to higher tax liabilities (up to 30% additional tax on disallowed amounts).',
    actionPlan: [
      'Run vendor ledger aging report to find out outstanding balances.',
      'Identify vendors registered under Udyam MSME scheme.',
      'Disburse dues exceeding 45 days immediately to avoid fiscal disallowance.'
    ],
    sourceUrl: 'https://incometaxindia.gov.in',
    status: 'Action Required'
  },
  {
    id: 'notif-3',
    title: 'Ministry of Labour Mandates EPF Universal Account Number (UAN) Aadhaar Seeding',
    authority: 'EPFO / Ministry of Labour & Employment',
    circularNo: 'Circular No. Coord/UAN/Aadhaar/2026',
    date: '2026-07-28',
    category: 'Labour Law',
    impact: 'Medium',
    applicableEntities: ['pvt_ltd', 'llp', 'partnership'],
    applicableIndustries: ['Information Technology & Software', 'E-commerce & Retail', 'Manufacturing & Industrial', 'Healthcare & Pharma', 'Real Estate & Construction', 'Professional Services & Consulting', 'Financial Services & Fintech'],
    summary: 'Employer contribution submission will be blocked on the Shram Suvidha portal if the employee UAN is not linked and verified with Aadhaar.',
    consequences: 'Delayed EPF deposits trigger penalty interest up to 12% p.a. and damages under Section 14B of the EPF Act.',
    actionPlan: [
      'Check active payroll employee database for UAN Aadhaar seeding status.',
      'Notify pending employees (2 records found) to verify Aadhaar on unified portal.',
      'Resubmit ECR return before the 15th August deadline.'
    ],
    sourceUrl: 'https://epfindia.gov.in',
    status: 'Monitoring'
  },
  {
    id: 'notif-4',
    title: 'MCA Introduces Simplified Filing Form MGT-7A for Small Companies',
    authority: 'Ministry of Corporate Affairs (MCA)',
    circularNo: 'Companies Amendment Rules 2026',
    date: '2026-07-15',
    category: 'Corporate Law',
    impact: 'Low',
    applicableEntities: ['pvt_ltd', 'opc'],
    applicableIndustries: ['Information Technology & Software', 'E-commerce & Retail', 'Manufacturing & Industrial', 'Healthcare & Pharma', 'Real Estate & Construction', 'Professional Services & Consulting', 'Financial Services & Fintech', 'Food & Beverages / Restaurant (FSSAI)'],
    summary: 'Small companies (paid-up capital up to ₹4 Cr, turnover up to ₹40 Cr) are permitted to file condensed annual return form MGT-7A instead of the full MGT-7 form.',
    consequences: 'Reduces filing costs, simplifies governance, and decreases auditing fees for startups.',
    actionPlan: [
      'Share this notification with the company secretary.',
      'Check if the company fits the small company definition criteria.',
      'Prepare AGM minutes for filing return under MGT-7A.'
    ],
    sourceUrl: 'https://mca.gov.in',
    status: 'Compliant'
  },
  {
    id: 'notif-5',
    title: 'RBI Master Directions on Cross-Border Trade Credit & FDI Reporting Rules',
    authority: 'Reserve Bank of India (RBI)',
    circularNo: 'RBI/2026-27/45 A.P. (DIR Series)',
    date: '2026-08-01',
    category: 'Corporate Law',
    impact: 'Medium',
    applicableEntities: ['pvt_ltd', 'llp'],
    applicableIndustries: ['Information Technology & Software', 'E-commerce & Retail', 'Manufacturing & Industrial', 'Financial Services & Fintech'],
    summary: 'FEMA reporting requirements simplified for foreign direct investment under the automatic route. Liberalized trade credit limits up to $5M for eligible imports.',
    consequences: 'Reduces the compliance cost for startups raising international funds.',
    actionPlan: [
      'Review foreign exchange accounts against new reporting rules.',
      'Verify if FDI reporting forms (FC-GPR) need modifications.'
    ],
    sourceUrl: 'https://rbi.org.in',
    status: 'Monitoring'
  }
];

const RegulatoryUpdates = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedImpact, setSelectedImpact] = useState('All');
  const [expandedCard, setExpandedCard] = useState(null);
  const [showMemoModal, setShowMemoModal] = useState(null); // stores notification object
  const [memoEmail, setMemoEmail] = useState('board@acmelegal.tech');
  const [memoSent, setMemoSent] = useState(false);

  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('lawbot-user-profile');
    return saved ? JSON.parse(saved) : { businessType: 'pvt_ltd', entityName: 'ACME LEGAL TECH PRIVATE LIMITED', industry: 'Information Technology & Software', state: 'Maharashtra' };
  });

  const handleResolveAction = (id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, status: n.status === 'Compliant' ? 'Action Required' : 'Compliant' } : n)
    );
  };

  const filteredNotifs = notifications.filter(notif => {
    const matchesCategory = selectedCategory === 'All' || notif.category === selectedCategory;
    const matchesImpact = selectedImpact === 'All' || notif.impact === selectedImpact;
    const matchesSearch = notif.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          notif.authority.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          notif.circularNo.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Relevance weighting check (e.g. check profile type/industry)
    const matchesProfileType = notif.applicableEntities.includes(userProfile.businessType);
    const matchesProfileIndustry = notif.applicableIndustries.includes(userProfile.industry);
    
    return matchesCategory && matchesImpact && matchesSearch && (matchesProfileType || matchesProfileIndustry);
  });

  const sendMemo = (e) => {
    e.preventDefault();
    setMemoSent(true);
    setTimeout(() => {
      setShowMemoModal(null);
      setMemoSent(false);
    }, 2000);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-center text-indigo-700">
              <Newspaper className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 font-sans">AI Legal & Regulatory Updates Feed</h1>
              <p className="text-xs text-slate-500">Real-time regulatory, tax, and compliance tracking tailored for your business</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-700">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span>{userProfile.entityName || 'My Entity'} ({userProfile.industry})</span>
          </div>
        </header>

        {/* Content Container */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left/Middle Column - Filter controls and Cards Feed */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Search and Quick Filters */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
              <div className="relative">
                <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search updates by keyword, authority, circular or clause..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none placeholder-slate-400"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 pr-1">Category:</span>
                  {['All', 'GST', 'Income Tax', 'Labour Law', 'Corporate Law'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        selectedCategory === cat
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Impact:</span>
                  {['All', 'High', 'Medium', 'Low'].map((imp) => (
                    <button
                      key={imp}
                      onClick={() => setSelectedImpact(imp)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                        selectedImpact === imp
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {imp}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Profile Smart Filter Notice */}
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 flex items-center justify-between text-xs text-indigo-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4.5 h-4.5 text-indigo-600" />
                <span>
                  Showing feed updates customized for <strong>{userProfile.entityName}</strong> located in <strong>{userProfile.state}</strong>.
                </span>
              </div>
              <span className="text-[10px] font-black uppercase text-indigo-600 bg-white px-2 py-0.5 rounded border border-indigo-200 tracking-wider">
                AUTO-FILTERED
              </span>
            </div>

            {/* Feed Cards */}
            <div className="space-y-4">
              {filteredNotifs.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500">
                  <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="font-bold text-slate-800">No matching updates found</p>
                  <p className="text-xs text-slate-400 mt-1">Try resetting the filters or broadening your search keywords.</p>
                </div>
              ) : (
                filteredNotifs.map((notif) => {
                  const isExpanded = expandedCard === notif.id;
                  const isHighImpact = notif.impact === 'High';
                  const isMedImpact = notif.impact === 'Medium';
                  const isActionNeeded = notif.status === 'Action Required';

                  return (
                    <div 
                      key={notif.id}
                      className={`bg-white border rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md overflow-hidden ${
                        isExpanded ? 'ring-2 ring-indigo-600/10 border-indigo-300' : 'border-slate-200'
                      }`}
                    >
                      
                      {/* Top Header Card Info */}
                      <div className="p-5 flex items-start gap-4">
                        
                        {/* Impact Level Accent */}
                        <div className={`p-2.5 rounded-xl shrink-0 ${
                          isHighImpact ? 'bg-rose-50 text-rose-600 border border-rose-100' : 
                          isMedImpact ? 'bg-amber-50 text-amber-600 border border-amber-100' : 
                          'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        }`}>
                          <Zap className="w-5 h-5" />
                        </div>

                        {/* Title, Authority, Date */}
                        <div className="flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-extrabold rounded uppercase tracking-wider">
                              {notif.category}
                            </span>
                            <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded uppercase ${
                              isHighImpact ? 'bg-rose-100 text-rose-800' : 
                              isMedImpact ? 'bg-amber-100 text-amber-800' : 
                              'bg-emerald-100 text-emerald-800'
                            }`}>
                              {notif.impact} Impact
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">• {notif.circularNo}</span>
                          </div>

                          <h3 
                            onClick={() => setExpandedCard(isExpanded ? null : notif.id)}
                            className="font-bold text-sm sm:text-base text-slate-900 leading-snug hover:text-indigo-600 cursor-pointer"
                          >
                            {notif.title}
                          </h3>

                          <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                            <span className="font-semibold text-slate-600">{notif.authority}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{notif.date}</span>
                            </span>
                          </div>
                        </div>

                        {/* Expand Button */}
                        <button
                          onClick={() => setExpandedCard(isExpanded ? null : notif.id)}
                          className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg shrink-0 self-start"
                        >
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </div>

                      {/* Expanded Section Details */}
                      {isExpanded && (
                        <div className="border-t border-slate-100 bg-slate-50/50 p-5 space-y-5 animate-fadeIn">
                          
                          {/* Brief Summary */}
                          <div className="space-y-1.5">
                            <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                              <span>AI Executive Summary</span>
                            </h4>
                            <p className="text-xs text-slate-700 leading-relaxed font-sans">
                              {notif.summary}
                            </p>
                          </div>

                          {/* Consequences/Penalties */}
                          <div className="space-y-1.5 p-3.5 bg-rose-50/50 border border-rose-100 rounded-xl">
                            <h4 className="text-xs font-black uppercase text-rose-700 tracking-wider flex items-center gap-1.5">
                              <Scale className="w-3.5 h-3.5 text-rose-600" />
                              <span>Governance & Penalty Consequences</span>
                            </h4>
                            <p className="text-xs text-rose-900 font-sans leading-relaxed">
                              {notif.consequences}
                            </p>
                          </div>

                          {/* Interactive Checklist / Action Plan */}
                          <div className="space-y-3">
                            <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                              <CheckCircle className="w-3.5 h-3.5 text-indigo-600" />
                              <span>AI Checklist & Recommended Action Plan</span>
                            </h4>
                            <div className="space-y-2">
                              {notif.actionPlan.map((action, i) => (
                                <div key={i} className="flex items-start gap-3 bg-white p-3 border border-slate-100 rounded-xl text-xs">
                                  <input 
                                    type="checkbox" 
                                    defaultChecked={notif.status === 'Compliant'}
                                    className="mt-0.5 text-indigo-600 rounded focus:ring-indigo-500" 
                                  />
                                  <span className="text-slate-700">{action}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Expanded Actions Footer */}
                          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-200">
                            <div className="flex items-center gap-2">
                              <a
                                href={notif.sourceUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 rounded-lg text-xs font-semibold"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Official Gazette circular</span>
                              </a>
                              <button
                                onClick={() => setShowMemoModal(notif)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 rounded-lg text-xs font-semibold"
                              >
                                <Mail className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Send Board Memo</span>
                              </button>
                            </div>

                            <button
                              onClick={() => handleResolveAction(notif.id)}
                              className={`px-4 h-9 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ${
                                isActionNeeded 
                                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>{isActionNeeded ? 'Mark Actions Completed' : 'Compliant / Resolved'}</span>
                            </button>
                          </div>

                        </div>
                      )}

                    </div>
                  );
                })
              )}
            </div>

          </div>

          {/* Right Column - Side Widgets */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Feed Status Summary */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-lg border border-indigo-900/30">
              <div className="flex items-center gap-2">
                <Newspaper className="w-6 h-6 text-indigo-400" />
                <h3 className="font-bold text-sm uppercase tracking-widest text-indigo-200 font-mono">Feed Overview</h3>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <span className="text-[10px] font-bold text-rose-400 uppercase font-mono block">Action Needed</span>
                  <span className="text-3xl font-black block mt-1">
                    {notifications.filter(n => n.status === 'Action Required').length}
                  </span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase font-mono block">Compliant</span>
                  <span className="text-3xl font-black block mt-1">
                    {notifications.filter(n => n.status === 'Compliant').length}
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-white/10 space-y-3.5 text-xs text-indigo-100">
                <div className="flex justify-between items-center">
                  <span>Feed Sync Status:</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-black font-mono border border-emerald-500/40 px-2 py-0.5 rounded uppercase">
                    ONLINE
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Notifications Analyzed:</span>
                  <span className="font-mono font-bold text-slate-200">124</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Last Source Check:</span>
                  <span className="font-mono font-bold text-slate-200">Today, 12:45 PM</span>
                </div>
              </div>
            </div>

            {/* Indian Statutory Sources Indexed */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-indigo-600" />
                <span>Statutory Sources Indexed</span>
              </h4>
              <p className="text-xs text-slate-500">
                The LawBot360 engine continuously ingests updates directly from official sources:
              </p>

              <div className="space-y-3.5 pt-2 font-mono text-[11px]">
                {[
                  { name: 'Ministry of Corporate Affairs (MCA)', code: 'MCA Portal' },
                  { name: 'GST Council (CBIC)', code: 'cbic.gov.in' },
                  { name: 'Central Board of Direct Taxes (CBDT)', code: 'IT Portal' },
                  { name: 'Reserve Bank of India (RBI)', code: 'rbi.org.in' },
                  { name: 'EPFO & Employee Insurance (ESIC)', code: 'Labour Portal' }
                ].map((src, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-700 truncate mr-2">{src.name}</span>
                    <span className="text-slate-400 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-[10px] shrink-0">{src.code}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom AI Search Prompt Query */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <BookOpen className="w-4.5 h-4.5 text-indigo-600" />
                <span>Ask AI Agent about Circulars</span>
              </h4>
              <p className="text-xs text-slate-500">
                Input any specific notification number to generate instant executive summaries.
              </p>
              <div className="relative">
                <textarea
                  placeholder="e.g. Please clarify if Section 43B(h) applies to freelance contracts..."
                  rows={3}
                  className="w-full text-xs border border-slate-200 rounded-xl p-3 bg-slate-50 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent resize-none placeholder-slate-400"
                />
              </div>
              <button
                onClick={() => alert("Querying LawBot Agent...")}
                className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-1.5"
              >
                <span>Synthesize Compliance Report</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>

        </main>
      </div>

      {/* Board Memorandum Modal */}
      {showMemoModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-scaleUp">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">Generate Board Memorandum</h3>
              <button 
                onClick={() => setShowMemoModal(null)} 
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Auto-generate a structured executive briefing summary containing regulatory impact analysis and immediate actions.
            </p>

            <form onSubmit={sendMemo} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Recipient E-mail</label>
                <input
                  type="email"
                  required
                  value={memoEmail}
                  onChange={(e) => setMemoEmail(e.target.value)}
                  className="w-full h-11 px-3 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
                <p className="font-bold text-slate-800">Draft Subject:</p>
                <p className="text-slate-600 font-mono italic">
                  [COMPLIANCE MEMO] Urgent Action Required - {showMemoModal.title}
                </p>
                <p className="font-bold text-slate-800 mt-2">Draft Content Excerpt:</p>
                <p className="text-[11px] text-slate-500 leading-relaxed truncate">
                  Please find the briefing on CBIC/MCA/CBDT regulations. Immediate audit required before deadline.
                </p>
              </div>

              {memoSent ? (
                <div className="h-11 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center justify-center gap-2 text-xs font-bold">
                  <CheckCircle className="w-5 h-5 text-green-600 animate-bounce" />
                  <span>Memorandum Sent Successfully!</span>
                </div>
              ) : (
                <button
                  type="submit"
                  className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Disburse Executive Memo</span>
                </button>
              )}
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default RegulatoryUpdates;
