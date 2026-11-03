import React, { useState, useEffect, useMemo } from 'react';
import { FileText, Download, Trash2, Eye, Calendar, Plus, Search, CheckCircle, X, File, AlertCircle, Scale, Menu, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import documentService from '../services/documentService';
import Sidebar from '../components/Sidebar';

const TEMPLATE_OPTIONS = [
  { type: 'rti', title: 'RTI Application', description: 'Right to Information request template for government transparency.', icon: FileText, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  { type: 'fir', title: 'FIR Application', description: 'Standard format for filing a formal First Information Report.', icon: AlertCircle, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
  { type: 'consumer_complaint', title: 'Consumer Complaint', description: 'Formal draft for District Consumer Disputes Redressal Commission.', icon: Scale, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  { type: 'legal_notice', title: 'Legal Notice', description: 'Statutory demand notice format for pre-litigation civil disputes.', icon: File, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' }
];

const getTemplateContent = (type) => {
  const templates = {
    rti: `RIGHT TO INFORMATION APPLICATION

To,
The Public Information Officer (PIO)
[Department Name]
[Address]

Subject: Application under Right to Information Act, 2005

Respected Sir/Madam,

Under Section 6(1) of the Right to Information Act, 2005, I hereby request the following information:

1. [Specific information requested]
2. [Additional details]

The information is required for [purpose].
I am willing to pay the prescribed fee for obtaining this information.
Please provide the information within the stipulated time period of 30 days as per the RTI Act, 2005.

Yours faithfully,
[Your Name]
[Address]
[Contact Details]
Date: ${new Date().toLocaleDateString('en-IN')}`,

    fir: `FIRST INFORMATION REPORT (FIR)

To,
The Officer-in-Charge
[Police Station Name]
[Address]

Subject: Registration of FIR

Respected Sir/Madam,

I, [Your Name], resident of [Address], hereby report the following incident for registration of FIR:

Date of Incident: [Date]
Time of Incident: [Time]
Place of Incident: [Location]

DETAILS OF INCIDENT:
[Detailed description of what happened]

ACCUSED DETAILS:
Name: [If known]
Description: [Physical description if known]

WITNESSES:
1. [Name and address]
2. [Name and address]

I request you to kindly register the FIR and take necessary action as per law.

Signature
Name: [Your Name]
Date: ${new Date().toLocaleDateString('en-IN')}`,

    consumer_complaint: `CONSUMER COMPLAINT

Before the District Consumer Disputes Redressal Forum
[District Name]

Complaint under Section 35 of the Consumer Protection Act, 2019

Complainant: [Your Name]
Address: [Your Address]
Contact: [Phone/Email]

Vs.

Opposite Party: [Company/Seller Name]
Address: [Their Address]

FACTS OF THE CASE:

1. The complainant purchased [product/service] on [date] from the opposite party.
2. [Description of defect/deficiency]
3. Despite multiple requests, the opposite party has failed to [refund/replace/repair].
4. This amounts to deficiency in service and unfair trade practice.

RELIEF SOUGHT:

1. Refund of amount paid: Rs. [Amount]
2. Compensation for mental agony and harassment: Rs. [Amount]
3. Cost of litigation
4. Any other relief deemed fit

PRAYER:

It is therefore humbly prayed that this Hon'ble Forum may be pleased to:
- Direct the opposite party to refund the amount
- Award compensation as claimed above
- Pass any other order deemed fit

Place: [City]
Date: ${new Date().toLocaleDateString('en-IN')}

Signature of Complainant`,

    legal_notice: `LEGAL NOTICE

To,
[Name of the Person/Entity]
[Address]

Subject: Legal Notice

Dear Sir/Madam,

Under the instructions of my client [Your Name], I serve upon you this Legal Notice for the following:

1. FACTS:
[State the facts of the case]

2. CAUSE OF ACTION:
[Explain the legal grounds]

3. DEMAND:
You are hereby called upon to [specific demand/action required] within 15 days from the receipt of this notice, failing which my client will be constrained to initiate appropriate legal proceedings against you.

Yours faithfully,
[Advocate Name]
Date: ${new Date().toLocaleDateString('en-IN')}`
  };
  return templates[type] || 'Template not found';
};

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const loadDocuments = () => {
    const docs = documentService.getDocuments();
    setDocuments(docs || []);
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
  };

  const createTemplate = (template) => {
    const templateContent = getTemplateContent(template.type);
    const newDoc = documentService.saveDocument({
      type: template.type,
      content: templateContent,
      title: `${template.title} - ${new Date().toLocaleDateString()}`
    });
    
    if (newDoc) {
      loadDocuments();
      showNotification(`Generated new ${template.title}`);
    }
  };

  const handleDelete = (docId) => {
    if (window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      documentService.deleteDocument(docId);
      loadDocuments();
      showNotification('Document deleted permanently', 'error');
    }
  };

  const handleDownload = (doc) => {
    const element = document.createElement('a');
    const file = new Blob([doc.content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${doc.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    showNotification('Download started');
  };

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.type.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [documents, searchQuery]);

  return (
    <div className="flex h-screen bg-[#0c0e14] text-[#f1f5f9] font-sans selection:bg-purple-500/30 selection:text-white">
      
      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Header Bar */}
        <div className="bg-[#0c0e14]/90 backdrop-blur-md border-b border-white/[0.08] sticky top-0 z-20 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 hover:bg-white/[0.04] rounded-lg text-slate-400">
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-0.5">
                <span>Legal Workspace</span>
                <span>/</span>
                <span className="text-purple-400">Drafting Studio</span>
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                My Legal Documents
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-normal">
                  {filteredDocuments.length} files
                </span>
              </h1>
            </div>
          </div>
          
          <div className="relative w-full max-w-xs md:max-w-md ml-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-500" />
            </div>
            <input
              type="text"
              className="block w-full pl-9 pr-4 py-2 border border-white/[0.08] rounded-xl text-sm bg-[#141721] text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all"
              placeholder="Search documents by title or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* Template Options Grid */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Generate From Standard Templates</h2>
                </div>
                <span className="text-xs text-slate-500">Instant AI Legal Formats</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {TEMPLATE_OPTIONS.map((template) => (
                  <button
                    key={template.type}
                    onClick={() => createTemplate(template)}
                    className="flex flex-col p-5 bg-[#161922] border border-white/[0.08] rounded-2xl hover:border-purple-500/40 hover:bg-[#1a1e2b] hover:-translate-y-0.5 transition-all text-left group relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-11 h-11 rounded-xl ${template.bg} border flex items-center justify-center transition-transform group-hover:scale-105`}>
                        <template.icon className={`w-5 h-5 ${template.color}`} />
                      </div>
                      <span className="text-xs text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity font-medium flex items-center gap-1">
                        + Create
                      </span>
                    </div>
                    <h3 className="font-semibold text-white mb-1.5 group-hover:text-purple-400 transition-colors">
                      {template.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {template.description}
                    </p>
                  </button>
                ))}
              </div>
            </section>

            {/* Document List */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Repository Records</h2>
                <span className="text-xs text-slate-500">{filteredDocuments.length} active drafts</span>
              </div>

              <div className="bg-[#161922] rounded-2xl border border-white/[0.08] overflow-hidden min-h-[380px]">
                {filteredDocuments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-80 p-8 text-center">
                    <div className="w-16 h-16 bg-[#141721] rounded-2xl border border-white/[0.08] flex items-center justify-center mb-4">
                      <FileText className="w-8 h-8 text-slate-500" />
                    </div>
                    <h3 className="text-base font-semibold text-white mb-1">
                      {searchQuery ? 'No matching documents found' : 'No documents drafted yet'}
                    </h3>
                    <p className="text-xs text-slate-400 mb-6 max-w-sm leading-relaxed">
                      {searchQuery ? 'Try adjusting your search terms or keywords.' : 'Generate legal drafts using AI conversational assistant or pick from standard templates above.'}
                    </p>
                    {!searchQuery && (
                      <Link 
                        to="/dashboard/chat" 
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-medium shadow-sm transition-all"
                      >
                        <Sparkles className="w-4 h-4" /> Go to AI Counsel
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-white/[0.06]">
                    {filteredDocuments.map((doc) => (
                      <div key={doc.id} className="p-5 hover:bg-[#1a1e2b] transition-colors group">
                        <div className="flex items-start justify-between gap-4">
                          
                          <div className="flex items-start gap-4 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0 text-purple-400">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="text-sm font-semibold text-white truncate group-hover:text-purple-400 transition-colors">
                                  {doc.title}
                                </h3>
                                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/[0.04] text-slate-400 border border-white/[0.08]">
                                  {doc.type.replace('_', ' ')}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(doc.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 line-clamp-2 pr-4 font-mono leading-relaxed bg-[#0c0e14]/60 p-2.5 rounded-lg border border-white/[0.04]">
                                {doc.content.substring(0, 160)}...
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 self-start pt-1">
                            <button
                              onClick={() => setSelectedDoc(doc)}
                              className="p-2 text-slate-400 hover:text-purple-400 hover:bg-white/[0.04] rounded-lg transition-colors border border-transparent hover:border-white/[0.08]"
                              title="Preview"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDownload(doc)}
                              className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors border border-transparent hover:border-emerald-500/20"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(doc.id)}
                              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/20"
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
            </section>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-bounce-in border ${
          notification.type === 'success' 
            ? 'bg-[#161922] border-emerald-500/30 text-emerald-400 shadow-emerald-500/10' 
            : 'bg-[#161922] border-rose-500/30 text-rose-400 shadow-rose-500/10'
        }`}>
          {notification.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span className="font-medium text-xs text-white">{notification.message}</span>
        </div>
      )}

      {/* Document Preview Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#161922] border border-white/[0.08] rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-[#141721]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                  <FileText className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">{selectedDoc.title}</h3>
                  <p className="text-[10px] text-purple-400 uppercase tracking-wider">{selectedDoc.type.replace('_', ' ')}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedDoc(null)}
                className="p-1.5 hover:bg-white/[0.06] rounded-lg transition-colors text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-[#0c0e14]">
              <div className="bg-[#141721] p-8 rounded-xl border border-white/[0.08] shadow-inner mx-auto max-w-3xl">
                <pre className="whitespace-pre-wrap text-xs text-slate-300 font-mono leading-relaxed selection:bg-purple-500/30">
                  {selectedDoc.content}
                </pre>
              </div>
            </div>

            <div className="p-4 bg-[#141721] border-t border-white/[0.08] flex justify-end gap-3">
              <button 
                 onClick={() => setSelectedDoc(null)}
                 className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-white/[0.04] rounded-xl transition-colors"
              >
                Close
              </button>
              <button 
                 onClick={() => handleDownload(selectedDoc)}
                 className="px-4 py-2 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-lg shadow-purple-600/20 transition-all flex items-center gap-2"
              >
                <Download className="w-3.5 h-3.5" /> Download TXT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}