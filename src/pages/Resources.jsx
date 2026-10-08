import React, { useState } from 'react';
import { 
  Scale, BookOpen, Search, ExternalLink, Download, Eye, 
  Filter, ChevronRight, FileText, Gavel, Shield, Home, 
  Users, Car, Landmark, Star, ArrowRight, Book, Menu
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
    description: 'Complete guide to consumer rights, redressal commissions, and protection mechanisms.',
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
    description: 'Comprehensive guide on RTI procedures, exemptions, and the application process.',
    url: 'https://colart.delhi.gov.in/sites/default/files/2024-05/rti_act_2005.pdf',
    rating: 4.9,
    views: 2100,
    pages: 32
  },
  {
    id: 3,
    title: 'Motor Vehicle Act 1988',
    category: 'Traffic Law',
    type: 'Act',
    description: 'Detailed traffic rules, penalties for violations, and vehicle registration regulations.',
    url: 'https://ebook.commerciallawpublishers.com/fa/mva/',
    rating: 4.6,
    views: 890,
    pages: 120
  },
  {
    id: 4,
    title: 'Indian Penal Code Sections',
    category: 'Criminal Law',
    type: 'Reference',
    description: 'Common IPC sections explained with case laws, penalties, and illustrations.',
    url: 'https://www.indiacode.nic.in/repealedfileopen?rfilename=A1860-45.pdf',
    rating: 4.7,
    views: 3200,
    pages: 85
  },
  {
    id: 5,
    title: 'Property Law Guide',
    category: 'Property Law',
    type: 'Guide',
    description: 'Understanding rent control, property disputes, transfer of property, and tenant rights.',
    url: 'https://www.indiacode.nic.in/bitstream/123456789/2338/1/A1882-04.pdf',
    rating: 4.5,
    views: 1560,
    pages: 24
  },
  {
    id: 6,
    title: 'Family Law Handbook',
    category: 'Family Law',
    type: 'Handbook',
    description: 'Essentials of marriage registration, divorce proceedings, maintenance, and child custody.',
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
    'Act': 'bg-blue-50 text-blue-700 border-blue-200',
    'Guide': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Handbook': 'bg-purple-50 text-purple-700 border-purple-200',
    'Reference': 'bg-amber-50 text-amber-700 border-amber-200',
    'Template': 'bg-rose-50 text-rose-700 border-rose-200'
  };

  return (
    <div className="group bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 flex flex-col h-full overflow-hidden">
      
      {/* Card Header */}
      <div className="p-6 flex-1">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 bg-slate-50 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors text-slate-500">
            {getCategoryIcon(resource.category)}
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${typeStyles[resource.type] || 'bg-gray-100 text-gray-700'}`}>
            {resource.type}
          </span>
        </div>

        <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
          {resource.title}
        </h3>
        <p className="text-sm text-slate-500 mb-6 line-clamp-2 leading-relaxed">
          {resource.description}
        </p>

        {/* Metadata */}
        <div className="flex items-center gap-4 text-xs font-medium text-slate-400 border-t border-slate-100 pt-4">
          <div className="flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="text-slate-700">{resource.rating}</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-slate-300" />
          <div className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            <span>{resource.views.toLocaleString()}</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-slate-300" />
          <div className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            <span>{resource.pages} pgs</span>
          </div>
        </div>
      </div>

      {/* Card Actions */}
      <div className="bg-slate-50 p-4 flex items-center gap-3 border-t border-slate-100 group-hover:bg-white transition-colors">
        <button 
          onClick={() => window.open(resource.url, '_blank')}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 transition-all active:scale-95 shadow-sm"
        >
          View Document <ArrowRight className="w-4 h-4" />
        </button>
        <button 
          onClick={() => window.open(resource.url, '_blank')}
          className="p-2.5 bg-white border border-slate-200 text-slate-500 rounded-lg hover:text-blue-600 hover:border-blue-200 transition-colors"
          title="Download PDF"
        >
          <Download className="w-4 h-4" />
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
    <div className="flex h-screen bg-slate-50 font-sans">
      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-600">
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Knowledge Base</h1>
              <p className="text-sm text-slate-500">Legal resources and guides</p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            {/* Hero Section */}
            <div className="bg-slate-900 text-white relative overflow-hidden rounded-2xl mb-8">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
              <div className="absolute inset-0 bg-gradient-to-b from-slate-900/0 to-slate-900/80"></div>
              
              <div className="px-8 py-16 relative z-10">
                <div className="max-w-3xl mx-auto text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm font-medium mb-6">
                    <Book className="w-4 h-4" />
                    <span>Digital Legal Repository</span>
                  </div>
                  <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
                    Knowledge is your <span className="text-blue-400">Best Defense</span>
                  </h1>
                  <p className="text-lg text-slate-300 mb-10 leading-relaxed">
                    Access India's most comprehensive collection of acts, legal templates, and expert guides. 
                    Verified and updated daily.
                  </p>

                  {/* Search Bar */}
                  <div className="relative max-w-2xl mx-auto">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-11 pr-4 py-4 bg-white rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/30 shadow-2xl transition-all"
                      placeholder="Search for acts, sections, or legal topics..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="absolute inset-y-0 right-2 flex items-center">
                       <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                          Search
                       </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Statistics Bar */}
            <div className="bg-white rounded-xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6 flex flex-wrap justify-between items-center gap-6 mb-10">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg text-blue-600"><BookOpen className="w-6 h-6" /></div>
                  <div>
                     <p className="text-2xl font-bold text-slate-900">{legalResources.length}+</p>
                     <p className="text-sm text-slate-500">Active Documents</p>
                  </div>
               </div>
               <div className="w-px h-10 bg-slate-100 hidden md:block"></div>
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600"><Shield className="w-6 h-6" /></div>
                  <div>
                     <p className="text-2xl font-bold text-slate-900">100%</p>
                     <p className="text-sm text-slate-500">Verified Content</p>
                  </div>
               </div>
               <div className="w-px h-10 bg-slate-100 hidden md:block"></div>
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-50 rounded-lg text-purple-600"><Users className="w-6 h-6" /></div>
                  <div>
                     <p className="text-2xl font-bold text-slate-900">5k+</p>
                     <p className="text-sm text-slate-500">Daily Readers</p>
                  </div>
               </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
               <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto scrollbar-hide">
                 {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        selectedCategory === cat 
                          ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' 
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
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
                   className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                 >
                   {resourceTypes.map(type => (
                     <option key={type} value={type}>Type: {type}</option>
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
              <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                   <Search className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No documents found</h3>
                <p className="text-slate-500 mb-8 max-w-md mx-auto">
                  We could not find any resources matching "{searchTerm}" in {selectedCategory}.
                </p>
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('All');
                    setSelectedType('All');
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
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