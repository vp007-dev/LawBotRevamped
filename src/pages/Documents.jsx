import React, { useState, useEffect, useMemo } from 'react';
import { FileText, Download, Trash2, Eye, Calendar, Plus, Search, CheckCircle, X, File, AlertCircle, Scale, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import documentService from '../services/documentService';
import Sidebar from '../components/Sidebar';

const TEMPLATE_OPTIONS = [
  { type: 'rti', title: 'RTI Application', description: 'Right to Information request template for government data.', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
  { type: 'fir', title: 'FIR Application', description: 'Standard format for filing a First Information Report.', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
  { type: 'consumer_complaint', title: 'Consumer Complaint', description: 'Draft for Consumer Disputes Redressal Forum.', icon: Scale, color: 'text-orange-600', bg: 'bg-orange-50' },
  { type: 'legal_notice', title: 'Legal Notice', description: 'Formal notice format for civil disputes.', icon: File, color: 'text-purple-600', bg: 'bg-purple-50' }
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
    <div className="flex h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900">
      
      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-600">
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Documents</h1>
              <p className="text-sm text-slate-500 font-medium">Manage your legal documents</p>
            </div>
          </div>
          
          <div className="relative w-full max-w-xs md:max-w-md ml-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out sm:text-sm"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto space-y-8">
            
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Plus className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-slate-800">Create New</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {TEMPLATE_OPTIONS.map((template) => (
                  <button
                    key={template.type}
                    onClick={() => createTemplate(template)}
                    className="flex flex-col p-5 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 text-left group"
                  >
                    <div className={`w-12 h-12 rounded-xl ${template.bg} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                      <template.icon className={`w-6 h-6 ${template.color}`} />
                    </div>
                    <h3 className="font-bold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors">{template.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{template.description}</p>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-800">My Documents</h2>
                <span className="text-sm text-slate-500">{filteredDocuments.length} files found</span>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
                {filteredDocuments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-96 p-8 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                      <FileText className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 mb-1">
                      {searchQuery ? 'No matching documents found' : 'No documents yet'}
                    </h3>
                    <p className="text-slate-500 mb-6 max-w-sm">
                      {searchQuery ? 'Try adjusting your search terms' : 'Generate legal documents through AI chat or use the templates above.'}
                    </p>
                    {!searchQuery && (
                      <Link 
                        to="/dashboard/chat" 
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                      >
                        Go to AI Chat
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-px bg-slate-200">
                    {filteredDocuments.map((doc) => (
                      <div key={doc.id} className="bg-white p-5 hover:bg-slate-50 transition-colors group">
                        <div className="flex items-start justify-between gap-4">
                          
                          <div className="flex items-start gap-4 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                              <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base font-semibold text-slate-800 truncate mb-1 group-hover:text-blue-600 transition-colors">
                                {doc.title}
                              </h3>
                              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(doc.createdAt).toLocaleDateString()}
                                </span>
                                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                <span className="uppercase tracking-wider font-medium text-slate-400">
                                  {doc.type.replace('_', ' ')}
                                </span>
                              </div>
                              <p className="mt-2 text-sm text-slate-600 line-clamp-2 pr-4">
                                {doc.content.substring(0, 150)}...
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 self-start pt-1">
                            <button
                              onClick={() => setSelectedDoc(doc)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Preview"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDownload(doc)}
                              className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Download"
                            >
                              <Download className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(doc.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
            </section>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-bounce-in ${
          notification.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span className="font-medium text-sm">{notification.message}</span>
        </div>
      )}

      {/* Document Preview Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{selectedDoc.title}</h3>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">{selectedDoc.type.replace('_', ' ')}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedDoc(null)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
              <div className="bg-white p-10 shadow-sm border border-slate-200 min-h-full mx-auto max-w-3xl">
                <pre className="whitespace-pre-wrap text-sm text-slate-800 font-serif leading-relaxed">
                  {selectedDoc.content}
                </pre>
              </div>
            </div>

            <div className="p-4 bg-white border-t border-slate-100 flex justify-end gap-3">
              <button 
                 onClick={() => setSelectedDoc(null)}
                 className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Close
              </button>
              <button 
                 onClick={() => handleDownload(selectedDoc)}
                 className="px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}