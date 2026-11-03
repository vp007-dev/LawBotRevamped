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
      answer: 'No. LawBot360 acts as a research assistant and drafting tool. While it cites specific Indian Penal Code & BNS sections, all outputs must be reviewed by a qualified attorney before use in legal proceedings.'
    },
    {
      id: 3,
      category: 'legal-tools',
      question: 'Does the OCR support handwritten affidavits?',
      answer: 'Our OCR engine is optimized for printed text. Handwritten recognition is currently supported through Gemini Multimodal Vision and works best with high-contrast scans.'
    },
    {
      id: 4,
      category: 'account',
      question: 'Can I pause my subscription?',
      answer: 'Yes, you can pause your subscription for up to 3 months. Go to Account > Billing > Manage Subscription. Your data will be archived safely in your encrypted vault.'
    },
    {
      id: 5,
      category: 'security',
      question: 'Where is my client data hosted?',
      answer: 'All data is hosted on AWS servers located within India (Mumbai region) with AES-256 encryption to strictly comply with the Digital Personal Data Protection Act, 2023.'
    }
  ];

  const supportChannels = [
    {
      title: 'Priority Chat',
      description: 'Instant technical & legal queries',
      icon: MessageCircle,
      action: 'Start Live Chat',
      status: 'Online',
      statusColor: 'badge-low',
      wait: '< 2 min wait'
    },
    {
      title: 'Legal Engineering',
      description: 'Custom API and integration support',
      icon: Mail,
      action: 'Email Us',
      status: 'Response in 4h',
      statusColor: 'badge-purple',
      wait: 'Ticket based'
    },
    {
      title: 'Sarvam Telephony Desk',
      description: 'Toll-free 24/7 vernacular phone assist',
      icon: Phone,
      action: '+91 80 0012 3456',
      status: 'Available',
      statusColor: 'badge-medium',
      wait: 'Direct dial'
    }
  ];

  const resources = [
    {
      title: 'Video Academy',
      description: 'Master LawBot360 workflows in minutes',
      icon: Video,
      color: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
    },
    {
      title: 'API Documentation',
      description: 'REST and WebSocket documentation',
      icon: FileText,
      color: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
    },
    {
      title: 'Bar Community',
      description: 'Connect with 10k+ verified legal counsel',
      icon: Users,
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
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
    setTimeout(() => {
      setFormStatus('success');
      setContactForm({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setFormStatus('idle'), 3000);
    }, 1500);
  };

  return (
    <div className="flex h-screen bg-[#0c0e14] text-[#f1f5f9] font-sans selection:bg-purple-500/30 selection:text-white">
      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Header */}
        <div className="bg-[#0c0e14]/90 backdrop-blur-md border-b border-white/[0.08] px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 hover:bg-white/[0.04] rounded-lg text-slate-400">
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-0.5">
                <span>Support</span>
                <span>/</span>
                <span className="text-purple-400">Help & Knowledge Desk</span>
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight">Support Center</h1>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scroll-smooth">
          {/* Hero Section */}
          <div className="bg-[#141721] pt-12 pb-24 px-6 relative overflow-hidden border-b border-white/[0.08]">
            <div className="absolute top-0 right-0 w-[35rem] h-[35rem] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none"></div>
            
            <div className="max-w-3xl mx-auto text-center relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 text-violet-400 text-xs font-medium border border-violet-500/20 mb-6 backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI-Powered Legal Help Desk & Documentation</span>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
                How can we <span className="text-violet-400">assist your practice?</span>
              </h2>
              <p className="text-sm text-slate-400 max-w-xl mx-auto mb-8">
                Search answers across our knowledge base, read feature guides, or submit a direct ticket to legal engineering.
              </p>
              
              {/* Search Box */}
              <div className="relative max-w-2xl mx-auto">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-slate-500" />
                </div>
                <input
                  type="text"
                  placeholder="Ask a question (e.g., 'API keys', 'BNS sections', 'Export PDF', 'Telephony')"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-5 py-3.5 bg-[#0c0e14] border border-white/[0.08] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 text-sm shadow-inner transition-all"
                />
              </div>
              
              <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-slate-500">
                <span>Frequent tags:</span>
                <button onClick={() => setSearchTerm('Telephony')} className="hover:text-purple-400 transition-colors">Sarvam Telephony</button>
                <button onClick={() => setSearchTerm('API')} className="hover:text-purple-400 transition-colors">Bedrock API</button>
                <button onClick={() => setSearchTerm('Privacy')} className="hover:text-purple-400 transition-colors">DPDP Act Compliance</button>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20 pb-20">
            
            {/* Support Channels Cards */}
            <div className="grid md:grid-cols-3 gap-5 mb-10">
              {supportChannels.map((channel, index) => (
                <div key={index} className="bg-[#161922] rounded-2xl p-6 border border-white/[0.08] hover:border-purple-500/40 hover:bg-[#1a1e2b] hover:-translate-y-0.5 transition-all duration-300 group cursor-pointer relative overflow-hidden">
                  <div className="flex justify-between items-start mb-5">
                    <div className="p-3 bg-[#141721] rounded-xl group-hover:bg-purple-600 transition-all text-purple-400 group-hover:text-white border border-white/[0.08]">
                      <channel.icon className="w-5 h-5" />
                    </div>
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${channel.statusColor}`}>
                      {channel.status}
                    </span>
                  </div>
                  <h3 className="font-semibold text-white text-base mb-1">{channel.title}</h3>
                  <p className="text-slate-400 text-xs mb-5 leading-relaxed">{channel.description}</p>
                  <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> {channel.wait}
                    </span>
                    <span className="text-purple-400 font-semibold group-hover:text-purple-300 transition-colors flex items-center gap-1">
                      {channel.action} <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
              {/* Main Content: FAQ */}
              <div className="lg:col-span-8">
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-white tracking-tight">Frequently Answered Questions</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Instant answers to typical platform and legal questions.</p>
                </div>

                {/* Filter Tabs */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                        selectedCategory === category.id
                          ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-600/25'
                          : 'bg-[#161922] text-slate-400 border-white/[0.08] hover:text-white hover:bg-[#1a1e2b]'
                      }`}
                    >
                      <category.icon className={`w-3.5 h-3.5 ${selectedCategory === category.id ? 'text-white' : 'text-slate-500'}`} />
                      {category.label}
                    </button>
                  ))}
                </div>

                {/* FAQ List */}
                <div className="space-y-3">
                  {filteredFaqs.length > 0 ? filteredFaqs.map((faq) => (
                    <div 
                      key={faq.id} 
                      className={`group bg-[#161922] rounded-2xl border transition-all duration-300 overflow-hidden ${
                        expandedFaq === faq.id 
                          ? 'border-purple-500/50 bg-[#191c27]' 
                          : 'border-white/[0.08] hover:border-purple-500/30'
                      }`}
                    >
                      <button
                        onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                        className="w-full flex items-start justify-between p-5 text-left"
                      >
                        <div className="flex gap-3.5 items-center">
                          <span className={`flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold border ${
                            expandedFaq === faq.id 
                              ? 'bg-purple-600 text-white border-purple-400' 
                              : 'bg-[#141721] text-purple-400 border-white/[0.08]'
                          }`}>Q</span>
                          <span className={`font-semibold text-sm transition-colors ${expandedFaq === faq.id ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                            {faq.question}
                          </span>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-slate-500 flex-shrink-0 transition-transform duration-300 ${expandedFaq === faq.id ? 'rotate-180 text-purple-400' : ''}`} />
                      </button>
                      <div 
                        className={`pl-14 pr-6 text-xs text-slate-400 leading-relaxed overflow-hidden transition-all duration-300 ease-in-out ${
                          expandedFaq === faq.id ? 'max-h-96 opacity-100 pb-5' : 'max-h-0 opacity-0'
                        }`}
                      >
                         <p className="border-l-2 border-purple-500/40 pl-4 text-slate-300">{faq.answer}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-12 bg-[#161922] rounded-2xl border border-dashed border-white/[0.12] p-6">
                        <div className="w-12 h-12 bg-[#141721] rounded-xl border border-white/[0.08] flex items-center justify-center mx-auto mb-3">
                          <Search className="w-6 h-6 text-slate-500" />
                        </div>
                        <h3 className="text-sm font-semibold text-white">No matching results</h3>
                        <p className="text-xs text-slate-400 mb-3">We couldn't find an answer matching "{searchTerm}"</p>
                        <button onClick={() => setSearchTerm('')} className="text-purple-400 font-semibold text-xs hover:underline">Clear filters & search</button>
                    </div>
                  )}
                </div>

                {/* External Resources */}
                <div className="mt-10">
                   <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wider">
                     <BookOpen className="w-4 h-4 text-purple-400" /> Additional Resources
                   </h3>
                   <div className="grid sm:grid-cols-3 gap-4">
                     {resources.map((res, i) => (
                       <a href="#" key={i} className="flex flex-col p-5 bg-[#161922] border border-white/[0.08] rounded-2xl hover:border-purple-500/40 hover:bg-[#1a1e2b] transition-all group">
                          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-3 ${res.color}`}>
                             <res.icon className="w-5 h-5" />
                          </div>
                          <h4 className="font-semibold text-white text-xs mb-1 flex items-center gap-1.5 group-hover:text-purple-400 transition-colors">
                            {res.title} <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all -translate-x-0.5 group-hover:translate-x-0" />
                          </h4>
                          <p className="text-[11px] text-slate-400 leading-relaxed">{res.description}</p>
                       </a>
                     ))}
                   </div>
                </div>
              </div>

              {/* Sidebar: Sticky Contact Form */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-[#161922] rounded-2xl border border-white/[0.08] p-6 sticky top-24">
                  {formStatus === 'success' ? (
                    <div className="text-center py-8 animate-in fade-in zoom-in duration-300">
                      <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-7 h-7" />
                      </div>
                      <h3 className="text-base font-bold text-white mb-1">Inquiry Submitted</h3>
                      <p className="text-xs text-slate-400 mb-6 leading-relaxed">Ticket #4922 created. An engineer will follow up within 4 hours.</p>
                      <button onClick={() => setFormStatus('idle')} className="text-purple-400 font-semibold text-xs hover:underline">Send another message</button>
                    </div>
                  ) : (
                    <>
                      <div className="mb-6">
                        <h3 className="text-base font-bold text-white mb-1">Direct Message</h3>
                        <p className="text-xs text-slate-400">Reach our Legal Engineering & Compliance squad.</p>
                      </div>
                      
                      <form onSubmit={handleContactSubmit} className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Your Work Email</label>
                          <input
                            required
                            type="email"
                            value={contactForm.email}
                            onChange={e => setContactForm({...contactForm, email: e.target.value})}
                            className="w-full px-3.5 py-2.5 bg-[#0c0e14] border border-white/[0.08] rounded-xl focus:border-purple-500/50 outline-none text-xs text-white placeholder-slate-500 transition-all"
                            placeholder="counsel@firm.com"
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Topic</label>
                          <div className="relative">
                            <select 
                              className="w-full px-3.5 py-2.5 bg-[#0c0e14] border border-white/[0.08] rounded-xl focus:border-purple-500/50 outline-none text-xs text-slate-300 appearance-none cursor-pointer"
                              value={contactForm.subject}
                              onChange={e => setContactForm({...contactForm, subject: e.target.value})}
                            >
                               <option value="" disabled selected>Select category...</option>
                               <option>Bedrock API & Models</option>
                               <option>Contract OCR Issue</option>
                               <option>Sarvam Telephony Callback</option>
                               <option>Billing & Enterprise Plan</option>
                            </select>
                            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Describe the issue</label>
                          <textarea
                            required
                            rows="4"
                            value={contactForm.message}
                            onChange={e => setContactForm({...contactForm, message: e.target.value})}
                            className="w-full px-3.5 py-2.5 bg-[#0c0e14] border border-white/[0.08] rounded-xl focus:border-purple-500/50 outline-none text-xs text-white placeholder-slate-500 transition-all resize-none"
                            placeholder="Detail steps to reproduce or legal questions..."
                          ></textarea>
                        </div>
                        
                        <button
                          disabled={formStatus === 'submitting'}
                          type="submit"
                          className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-purple-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {formStatus === 'submitting' ? (
                             <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                          ) : (
                             <>Send Ticket <Send className="w-3.5 h-3.5" /></>
                          )}
                        </button>
                      </form>
                    </>
                  )}
                </div>
                
                {/* Enterprise Box */}
                <div className="bg-[#141721] border border-purple-500/20 rounded-2xl p-6 text-white text-center relative overflow-hidden group">
                   <div className="relative z-10">
                     <h4 className="font-bold text-sm mb-1.5">Enterprise Legal SLA</h4>
                     <p className="text-slate-400 text-xs mb-4 leading-relaxed">Dedicated VPC, custom fine-tuned Indian legal models, and 99.99% uptime guarantee.</p>
                     <button className="px-5 py-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-white rounded-xl text-xs font-semibold transition-colors">
                       Contact Enterprise Sales
                     </button>
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