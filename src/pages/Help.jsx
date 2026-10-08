import React, { useState } from 'react';
import { 
  HelpCircle, Search, MessageCircle, Phone, Mail, Clock, 
  ChevronDown, ChevronRight, BookOpen, Video, FileText, 
  Users, Zap, Shield, Menu, Send, CheckCircle2, ArrowRight,
  LifeBuoy, Sparkles, ExternalLink
} from 'lucide-react';
import Sidebar from '../components/Sidebar';

const Help = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [formStatus, setFormStatus] = useState('idle'); // idle, submitting, success

  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const categories = [
    { id: 'all', label: 'All Topics', icon: LifeBuoy },
    { id: 'getting-started', label: 'Getting Started', icon: Zap },
    { id: 'ai-features', label: 'AI Intelligence', icon: Sparkles },
    { id: 'legal-tools', label: 'Drafting Tools', icon: BookOpen },
    { id: 'account', label: 'Billing & Plan', icon: Users },
    { id: 'security', label: 'Data Privacy', icon: Shield }
  ];

  const faqs = [
    {
      id: 1,
      category: 'getting-started',
      question: 'How do I onboard my legal team?',
      answer: 'Navigate to Settings > Team Management. You can invite members via email or CSV upload. Admin roles can define specific access permissions for paralegals vs. senior counsel.'
    },
    {
      id: 2,
      category: 'ai-features',
      question: 'Is the AI advice admissible in court?',
      answer: 'No. LawBot360 acts as a research assistant and drafting tool. While it cites specific Indian Penal Code sections, all outputs must be reviewed by a qualified attorney before use in legal proceedings.'
    },
    {
      id: 3,
      category: 'legal-tools',
      question: 'Does the OCR support handwritten affidavits?',
      answer: 'Our OCR engine is optimized for printed text. Handwritten recognition is currently in Beta (Pro Plan only) and works best with high-contrast scans.'
    },
    {
      id: 4,
      category: 'account',
      question: 'Can I pause my subscription?',
      answer: 'Yes, you can pause your subscription for up to 3 months. Go to Account > Billing > Manage Subscription. Your data will be archived safely during this period.'
    },
    {
      id: 5,
      category: 'security',
      question: 'Where is my client data hosted?',
      answer: 'All data is hosted on AWS servers located within India (Mumbai region) to comply with the Digital Personal Data Protection Act, 2023.'
    }
  ];

  const supportChannels = [
    {
      title: 'Priority Chat',
      description: 'Best for quick technical queries',
      icon: MessageCircle,
      action: 'Start Chat',
      status: 'Online',
      statusColor: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      wait: '< 2 min wait'
    },
    {
      title: 'Legal Engineering',
      description: 'Complex integration support',
      icon: Mail,
      action: 'Email Us',
      status: 'Response in 4h',
      statusColor: 'text-blue-600 bg-blue-50 border-blue-100',
      wait: 'Ticket based'
    },
    {
      title: 'Client Success Line',
      description: 'Mon-Fri 9AM-6PM IST',
      icon: Phone,
      action: '+91 8800 555 123',
      status: 'Available',
      statusColor: 'text-slate-600 bg-slate-100 border-slate-200',
      wait: 'Direct line'
    }
  ];

  const resources = [
    {
      title: 'Video Academy',
      description: 'Master the platform in minutes',
      icon: Video,
      color: 'bg-rose-50 text-rose-600 border-rose-100 group-hover:bg-rose-600 group-hover:text-white'
    },
    {
      title: 'API Documentation',
      description: 'Integration guides for developers',
      icon: FileText,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white'
    },
    {
      title: 'Legal Community',
      description: 'Connect with 10k+ lawyers',
      icon: Users,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white'
    }
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setFormStatus('submitting');
    // Simulate API call
    setTimeout(() => {
      setFormStatus('success');
      setContactForm({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setFormStatus('idle'), 3000);
    }, 1500);
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans antialiased text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header */}
        <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-30">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors">
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-semibold text-slate-900">Support Center</span>
        </div>

        <div className="flex-1 overflow-y-auto scroll-smooth">
          {/* Hero Section */}
          <div className="bg-slate-950 pt-20 pb-32 px-6 relative overflow-hidden isolate">
            {/* Elegant Background Gradients */}
            <div className="absolute top-0 right-0 -z-10 w-[40rem] h-[40rem] bg-indigo-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 opacity-50"></div>
            <div className="absolute bottom-0 left-0 -z-10 w-[30rem] h-[30rem] bg-blue-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2"></div>
            <div className="absolute inset-0 bg-white/5 opacity-20"></div>
            
            <div className="max-w-3xl mx-auto text-center relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/50 text-blue-300 text-xs font-semibold border border-slate-700/50 mb-8 backdrop-blur-sm shadow-xl">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                <span>New: AI Contract Analysis Documentation</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight leading-tight">
                How can LawBot360 <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-indigo-400">help you?</span>
              </h1>
              
              {/* Enhanced Search Box */}
              <div className="relative max-w-2xl mx-auto group mt-8">
                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                  <Search className="w-5 h-5 text-slate-400 group-focus-within:text-blue-400 transition-colors duration-300" />
                </div>
                <input
                  type="text"
                  placeholder="Ask a question (e.g., 'API keys', 'Billing', 'Export PDF')"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl text-white placeholder:text-slate-400 focus:bg-white focus:text-slate-900 focus:placeholder:text-slate-500 focus:ring-4 focus:ring-blue-500/30 focus:border-transparent outline-none transition-all duration-300 shadow-2xl"
                />
              </div>
              
              <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-400">
                <span className="opacity-70">Common topics:</span>
                <button onClick={() => setSearchTerm('Invoice')} className="hover:text-blue-300 transition-colors">Invoice & Billing</button>
                <button onClick={() => setSearchTerm('API')} className="hover:text-blue-300 transition-colors">API Access</button>
                <button onClick={() => setSearchTerm('Privacy')} className="hover:text-blue-300 transition-colors">Privacy Policy</button>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20 pb-20">
            
            {/* Support Channels Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {supportChannels.map((channel, index) => (
                <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60 hover:shadow-xl hover:shadow-slate-200/50 hover:border-blue-300 hover:-translate-y-1 transition-all duration-300 group cursor-pointer relative overflow-hidden">
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3.5 bg-slate-50 rounded-2xl group-hover:bg-blue-600 transition-all duration-300 shadow-sm border border-slate-100 group-hover:border-blue-500">
                      <channel.icon className="w-6 h-6 text-slate-700 group-hover:text-white transition-colors" />
                    </div>
                    <span className={`text-[11px] uppercase tracking-wide font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${channel.statusColor}`}>
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-current"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
                      </span>
                      {channel.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg mb-1.5">{channel.title}</h3>
                  <p className="text-slate-500 text-sm mb-6">{channel.description}</p>
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
                    <span className="text-slate-400 font-medium flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> {channel.wait}
                    </span>
                    <span className="text-blue-600 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      {channel.action} <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-12 gap-10">
              {/* Main Content: FAQ */}
              <div className="lg:col-span-8">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Knowledge Base</h2>
                  <p className="text-slate-500 mt-1">Instant answers to the most common questions.</p>
                </div>

                {/* Filter Tabs */}
                <div className="flex flex-wrap gap-2 mb-8">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 border ${
                        selectedCategory === category.id
                          ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <category.icon className={`w-4 h-4 ${selectedCategory === category.id ? 'text-blue-400' : 'text-slate-400'}`} />
                      {category.label}
                    </button>
                  ))}
                </div>

                {/* FAQ List */}
                <div className="space-y-4">
                  {filteredFaqs.length > 0 ? filteredFaqs.map((faq) => (
                    <div 
                      key={faq.id} 
                      className={`group bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${
                        expandedFaq === faq.id 
                          ? 'border-blue-200 shadow-lg shadow-blue-900/5 ring-1 ring-blue-500/20' 
                          : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                      }`}
                    >
                      <button
                        onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                        className="w-full flex items-start justify-between p-6 text-left"
                      >
                        <div className="flex gap-4">
                          <span className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${expandedFaq === faq.id ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>Q</span>
                          <span className={`font-semibold text-lg transition-colors ${expandedFaq === faq.id ? 'text-blue-700' : 'text-slate-900 group-hover:text-blue-700'}`}>
                            {faq.question}
                          </span>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-slate-400 flex-shrink-0 mt-1 transition-transform duration-300 ${expandedFaq === faq.id ? 'rotate-180 text-blue-500' : ''}`} />
                      </button>
                      <div 
                        className={`pl-[4.5rem] pr-8 text-slate-600 leading-relaxed overflow-hidden transition-all duration-300 ease-in-out ${
                          expandedFaq === faq.id ? 'max-h-96 opacity-100 pb-8' : 'max-h-0 opacity-0'
                        }`}
                      >
                         <p className="border-l-2 border-slate-100 pl-4">{faq.answer}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Search className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">No matching results</h3>
                        <p className="text-slate-500 mb-4">We couldn't find an answer for "{searchTerm}"</p>
                        <button onClick={() => setSearchTerm('')} className="text-blue-600 font-bold text-sm hover:underline hover:text-blue-700 transition-colors">Clear filters & search</button>
                    </div>
                  )}
                </div>

                {/* External Resources */}
                <div className="mt-16">
                   <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                     <BookOpen className="w-5 h-5 text-slate-400" /> Additional Resources
                   </h3>
                   <div className="grid sm:grid-cols-3 gap-5">
                     {resources.map((res, i) => (
                       <a href="#" key={i} className="flex flex-col p-6 bg-white border border-slate-200 rounded-2xl hover:border-blue-200 hover:shadow-lg hover:shadow-blue-900/5 transition-all group">
                          <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-4 transition-colors duration-300 ${res.color}`}>
                             <res.icon className="w-6 h-6" />
                          </div>
                          <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                            {res.title} <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0" />
                          </h4>
                          <p className="text-xs text-slate-500 font-medium leading-relaxed">{res.description}</p>
                       </a>
                     ))}
                   </div>
                </div>
              </div>

              {/* Sidebar: Sticky Contact Form */}
              <div className="lg:col-span-4 space-y-8">
                <div className="bg-white rounded-2xl p-1 border border-slate-200/80 shadow-xl shadow-slate-200/40 sticky top-6">
                  <div className="p-6 md:p-7 rounded-xl bg-slate-50/50">
                    {formStatus === 'success' ? (
                      <div className="text-center py-12 animate-in fade-in zoom-in duration-500">
                        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                          <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">Message Sent</h3>
                        <p className="text-slate-500 mb-8 text-sm leading-relaxed px-4">We've received your inquiry. A confirmation email with Ticket #4922 has been sent to you.</p>
                        <button onClick={() => setFormStatus('idle')} className="text-slate-900 font-bold text-sm border-b-2 border-slate-200 hover:border-blue-600 hover:text-blue-600 transition-colors pb-0.5">Send another message</button>
                      </div>
                    ) : (
                      <>
                        <div className="mb-8">
                          <h3 className="text-xl font-bold text-slate-900 mb-1">Direct Message</h3>
                          <p className="text-sm text-slate-500 font-medium">Get help from our Legal Engineering team.</p>
                        </div>
                        
                        <form onSubmit={handleContactSubmit} className="space-y-5">
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-1">Your Email</label>
                            <input
                              required
                              type="email"
                              value={contactForm.email}
                              onChange={e => setContactForm({...contactForm, email: e.target.value})}
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-medium placeholder:text-slate-300 hover:border-slate-300"
                              placeholder="name@company.com"
                            />
                          </div>
                          
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-1">Topic</label>
                            <div className="relative">
                              <select 
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-medium text-slate-700 appearance-none hover:border-slate-300 cursor-pointer"
                                value={contactForm.subject}
                                onChange={e => setContactForm({...contactForm, subject: e.target.value})}
                              >
                                 <option value="" disabled selected>Select a topic...</option>
                                 <option>Billing Issue</option>
                                 <option>Technical Support</option>
                                 <option>Feature Request</option>
                              </select>
                              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                          </div>
                          
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-1">How can we help?</label>
                            <textarea
                              required
                              rows="4"
                              value={contactForm.message}
                              onChange={e => setContactForm({...contactForm, message: e.target.value})}
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-medium resize-none placeholder:text-slate-300 hover:border-slate-300"
                              placeholder="Please describe your issue in detail..."
                            ></textarea>
                          </div>
                          
                          <button
                            disabled={formStatus === 'submitting'}
                            type="submit"
                            className="w-full py-3.5 bg-slate-900 hover:bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-slate-900/20 hover:shadow-blue-600/30 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                          >
                            {formStatus === 'submitting' ? (
                               <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            ) : (
                               <>Send Message <Send className="w-4 h-4" /></>
                            )}
                          </button>
                        </form>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 text-white text-center shadow-xl shadow-blue-900/20 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-500"></div>
                   <div className="relative z-10">
                     <h4 className="font-bold text-lg mb-2">Enterprise Solutions</h4>
                     <p className="text-blue-100 text-sm mb-6 leading-relaxed">For large firms needing dedicated servers, custom API limits, and 24/7 SLA support.</p>
                     <button className="px-6 py-2.5 bg-white text-blue-700 rounded-lg text-sm font-bold hover:bg-blue-50 transition-colors shadow-sm">Contact Sales</button>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;