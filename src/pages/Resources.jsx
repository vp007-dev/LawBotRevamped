import React, { useState } from 'react';
import { 
  Scale, BookOpen, Search, ExternalLink, Download, Eye, 
  Filter, ChevronRight, FileText, Gavel, Shield, Home, 
  Users, Car, Landmark, Star, ArrowRight, Book, Menu, Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import logo from '../assets/lawbot360-logo-updated.svg';

const legalResources = [
  {
    id: 1,
    title: 'Consumer Protection Act 2019',
    category: 'Consumer Law',
    type: 'Act',
    description: 'Complete statutory guide to consumer rights, redressal commissions, and protection mechanisms.',
    url: 'https://ncdrc.nic.in/bare_acts/CPA2019.pdf',
    rating: 4.8,
    views: 1250,
    pages: 45
  },
  {
    id: 2,
    title: 'Right to Information Act 2005',
    category: 'Government',
    type: 'Act',
    description: 'Comprehensive guide on RTI procedures, public officer obligations, and disclosure process.',
    url: 'https://colart.delhi.gov.in/sites/default/files/2024-05/rti_act_2005.pdf',
    rating: 4.9,
    views: 2100,
    pages: 32
  },
  {
    id: 3,
    title: 'Motor Vehicles Act 1988',
    category: 'Traffic Law',
    type: 'Act',
    description: 'Detailed traffic rules, accident claim procedures, and statutory vehicle registration regulations.',
    url: 'https://ebook.commerciallawpublishers.com/fa/mva/',
    rating: 4.6,
    views: 890,
    pages: 120
  },
  {
    id: 4,
    title: 'Bharatiya Nyaya Sanhita (BNS)',
    category: 'Criminal Law',
    type: 'Reference',
    description: 'Updated criminal code replacing IPC sections with case laws, penalties, and procedural mandates.',
    url: 'https://www.indiacode.nic.in/repealedfileopen?rfilename=A1860-45.pdf',
    rating: 4.7,
    views: 3200,
    pages: 85
  },
  {
    id: 5,
    title: 'Transfer of Property Act',
    category: 'Property Law',
    type: 'Guide',
    description: 'Understanding lease agreements, tenancy rights, title deeds, and dispute resolutions.',
    url: 'https://www.indiacode.nic.in/bitstream/123456789/2338/1/A1882-04.pdf',
    rating: 4.5,
    views: 1560,
    pages: 24
  },
  {
    id: 6,
    title: 'Family Court & Matrimonial Law',
    category: 'Family Law',
    type: 'Handbook',
    description: 'Essentials of Hindu Marriage Act, Special Marriage Act, alimony guidelines, and child custody.',
    url: 'https://www.plrs.org.in/pdfs/Hindu%20Marriage%20Act.pdf',
    rating: 4.4,
    views: 980,
    pages: 56
  }
];

const categories = ['All', 'Consumer Law', 'Criminal Law', 'Property Law', 'Family Law', 'Traffic Law', 'Government'];
const resourceTypes = ['All', 'Act', 'Guide', 'Handbook', 'Reference', 'Template'];

// Helper to get icon based on category
const getCategoryIcon = (category) => {
  switch (category) {
    case 'Consumer Law': return <Scale className="w-5 h-5" />;
    case 'Criminal Law': return <Gavel className="w-5 h-5" />;
    case 'Property Law': return <Home className="w-5 h-5" />;
    case 'Family Law': return <Users className="w-5 h-5" />;
    case 'Traffic Law': return <Car className="w-5 h-5" />;
    case 'Government': return <Landmark className="w-5 h-5" />;
    default: return <BookOpen className="w-5 h-5" />;
  }
};

const ResourceCard = ({ resource }) => {
  const typeStyles = {
    'Act': 'badge-purple',
    'Guide': 'badge-low',
    'Handbook': 'badge-medium',
    'Reference': 'badge-high',
    'Template': 'badge-urgent'
  };

  return (
    <div className="group bg-[#161922] rounded-2xl border border-white/[0.08] hover:border-purple-500/40 hover:bg-[#1a1e2b] transition-all duration-300 flex flex-col h-full overflow-hidden">
      
      {/* Card Header */}
      <div className="p-6 flex-1">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 bg-[#141721] border border-white/[0.08] rounded-xl group-hover:border-purple-500/30 group-hover:text-purple-400 transition-colors text-slate-400">
            {getCategoryIcon(resource.category)}
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${typeStyles[resource.type] || 'badge-purple'}`}>
            {resource.type}
          </span>
        </div>

        <h3 className="text-base font-bold text-white mb-2 line-clamp-1 group-hover:text-purple-400 transition-colors">
          {resource.title}
        </h3>
        <p className="text-xs text-slate-400 mb-6 line-clamp-2 leading-relaxed">
          {resource.description}
        </p>

        {/* Metadata */}
        <div className="flex items-center gap-4 text-xs font-medium text-slate-500 border-t border-white/[0.06] pt-4">
          <div className="flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="text-slate-300">{resource.rating}</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-slate-700" />
          <div className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            <span>{resource.views.toLocaleString()}</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-slate-700" />
          <div className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            <span>{resource.pages} pgs</span>
          </div>
        </div>
      </div>

      {/* Card Actions */}
      <div className="bg-[#141721] p-4 flex items-center gap-3 border-t border-white/[0.06]">
        <button 
          onClick={() => window.open(resource.url, '_blank')}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-purple-600/20 active:scale-95"
        >
          View Bare Act <ArrowRight className="w-3.5 h-3.5" />
        </button>
        <button 
          onClick={() => window.open(resource.url, '_blank')}
          className="p-2.5 bg-[#161922] border border-white/[0.08] text-slate-400 hover:text-purple-400 hover:border-purple-500/30 rounded-xl transition-colors"
          title="Download PDF"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default function Resources() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedType, setSelectedType] = useState('All');

  const filteredResources = legalResources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || resource.category === selectedCategory;
    const matchesType = selectedType === 'All' || resource.type === selectedType;
    
    return matchesSearch && matchesCategory && matchesType;
  });

  return (
    <div className="flex h-screen bg-[#0c0e14] text-[#f1f5f9] font-sans selection:bg-purple-500/30 selection:text-white">
      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <div className="bg-[#0c0e14]/90 backdrop-blur-md border-b border-white/[0.08] px-6 py-4 flex items-center justify-between z-20">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 hover:bg-white/[0.04] rounded-lg text-slate-400">
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-0.5">
                <span>Repository</span>
                <span>/</span>
                <span className="text-purple-400">Legal Knowledge Base</span>
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Statutory Acts & Guidelines
              </h1>
            </div>
          </div>
        </div>
        
        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* Hero Section */}
            <div className="bg-[#141721] text-white relative overflow-hidden rounded-2xl border border-white/[0.08] shadow-2xl">
              <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="px-8 py-12 relative z-10">
                <div className="max-w-3xl mx-auto text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold mb-5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Digital Statutory Repository • India Central & State Acts</span>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
                    Comprehensive Indian <span className="text-violet-400">Bare Acts & Guides</span>
                  </h1>
                  <p className="text-sm text-slate-400 mb-8 leading-relaxed max-w-2xl mx-auto">
                    Search authenticated Indian bare acts, High Court references, and statutory procedural manuals directly indexed for citation.
                  </p>

                  {/* Search Bar */}
                  <div className="relative max-w-2xl mx-auto">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-slate-500" />
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-11 pr-28 py-3.5 bg-[#0c0e14] border border-white/[0.08] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 shadow-inner transition-all"
                      placeholder="Search for acts, section numbers, or legal topics..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="absolute inset-y-0 right-2 flex items-center">
                       <button className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-md shadow-purple-600/20">
                          Search
                       </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics Bar */}
            <div className="bg-[#161922] rounded-2xl border border-white/[0.08] p-6 flex flex-wrap justify-between items-center gap-6">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                     <p className="text-xl font-bold text-white">{legalResources.length}+</p>
                     <p className="text-xs text-slate-400">Active Bare Acts</p>
                  </div>
               </div>
               <div className="w-px h-10 bg-white/[0.08] hidden md:block"></div>
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                     <p className="text-xl font-bold text-white">100%</p>
                     <p className="text-xs text-slate-400">Official Gazette Verified</p>
                  </div>
               </div>
               <div className="w-px h-10 bg-white/[0.08] hidden md:block"></div>
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                     <p className="text-xl font-bold text-white">5,000+</p>
                     <p className="text-xs text-slate-400">Advocate Citations</p>
                  </div>
               </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
               <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto scrollbar-hide">
                 {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                        selectedCategory === cat 
                          ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25' 
                          : 'bg-[#161922] text-slate-400 border border-white/[0.08] hover:text-white hover:bg-[#1a1e2b]'
                      }`}
                    >
                      {cat}
                    </button>
                 ))}
               </div>
               
               <div className="flex items-center gap-2 w-full md:w-auto">
                 <Filter className="w-4 h-4 text-slate-400" />
                 <select
                   value={selectedType}
                   onChange={(e) => setSelectedType(e.target.value)}
                   className="bg-[#161922] border border-white/[0.08] text-slate-300 text-xs rounded-xl focus:border-purple-500/50 block w-full p-2.5 outline-none"
                 >
                   {resourceTypes.map(type => (
                     <option key={type} value={type} className="bg-[#161922] text-white">Type: {type}</option>
                   ))}
                 </select>
               </div>
            </div>

            {/* Resources Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.map(resource => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>

            {/* Empty State */}
            {filteredResources.length === 0 && (
              <div className="text-center py-16 bg-[#161922] rounded-2xl border border-dashed border-white/[0.12] p-8">
                <div className="bg-[#141721] w-16 h-16 rounded-2xl border border-white/[0.08] flex items-center justify-center mx-auto mb-4">
                   <Search className="w-8 h-8 text-slate-500" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">No documents found</h3>
                <p className="text-xs text-slate-400 mb-6 max-w-md mx-auto">
                  We could not find any resources matching "{searchTerm}" in category {selectedCategory}.
                </p>
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('All');
                    setSelectedType('All');
                  }}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition-colors shadow-lg shadow-purple-600/20"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}