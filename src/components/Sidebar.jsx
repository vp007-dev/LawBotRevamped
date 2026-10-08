import React, { useState } from 'react';
import { 
  Scale, MessageSquare, FileText, Users, Menu, X, LayoutDashboard, 
  Gavel, BookOpen, Settings, ChevronRight, FileSearch, Home,
  Bell, User, LogOut, HelpCircle, Shield, Zap, ChevronLeft,
  FolderLock, Calendar, Award, Sparkles, UserCheck, Building2, ChevronDown, Network, PhoneCall
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import APIToggle from './APIToggle';
import { useAuth } from '../context/AuthContext';

const MENU_DATA = [
  {
    group: "Overview",
    items: [
      { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { path: "/dashboard/chat", icon: MessageSquare, label: "AI Research Chat" },
      { path: "/dashboard/sarvam-voice", icon: PhoneCall, label: "Sarvam 24/7 Helpline", isNew: true },
      { path: "/dashboard/regulatory-updates", icon: Bell, label: "Regulatory Feed", isNew: true },
      { path: "/contract-analysis", icon: FileSearch, label: "Contract Analysis" },
    ]
  },
  {
    group: "Agentic Vault & Intelligence",
    items: [
      { path: "/dashboard/onboarding", icon: UserCheck, label: "Onboarding Wizard", isNew: true },
      { path: "/dashboard/vault", icon: FolderLock, label: "Knowledge Vault & SIS", isNew: true },
      { path: "#graph", icon: Network, label: "Obsidian Graph RAG", isNew: true, action: 'open_graph' },
      { path: "/dashboard/calendar", icon: Calendar, label: "Compliance Calendar", isNew: true },
      { path: "/dashboard/schemes", icon: Award, label: "Scheme Discovery", isNew: true },
      { path: "/dashboard/workflows", icon: Zap, label: "Compliance Workflows", isNew: true },
    ]
  },
  {
    group: "Legal Services",
    items: [
      { path: "/dashboard/cases", icon: Gavel, label: "Case Manager", badge: 3 },
      { path: "/dashboard/documents", icon: FileText, label: "My Documents" },
      { path: "/dashboard/lawyers", icon: Users, label: "Find Lawyers" },
    ]
  },
  {
    group: "Support",
    items: [
      { path: "/dashboard/resources", icon: BookOpen, label: "Knowledge Base" },
      { path: "/help", icon: HelpCircle, label: "Help Center" },
    ]
  }
];

const MOCK_PROFILES = [
  {
    id: 'pvt_ltd',
    entityName: 'Acme Legal Tech Pvt Ltd',
    businessType: 'pvt_ltd',
    industry: 'Information Technology & Software',
    state: 'Maharashtra',
    turnover: '50L - 2Cr',
    employeeCount: 15,
    registrations: { gst: true, pan: true, msme: true, shopAct: true }
  },
  {
    id: 'proprietorship',
    entityName: 'Acme Organic Foods',
    businessType: 'proprietorship',
    industry: 'Food & Beverages / Restaurant (FSSAI)',
    state: 'Karnataka',
    turnover: '20L - 40L',
    employeeCount: 3,
    registrations: { gst: true, pan: true, fssai: true, shopAct: true }
  },
  {
    id: 'llp',
    entityName: 'Alpha Financial Advisors',
    businessType: 'llp',
    industry: 'Financial Services & Fintech',
    state: 'Delhi NCR',
    turnover: 'Above 5Cr',
    employeeCount: 45,
    registrations: { gst: true, pan: true, msme: true, pfEsi: true }
  }
];

const Sidebar = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [currentProfile, setCurrentProfile] = useState(() => {
    const saved = localStorage.getItem('lawbot-user-profile');
    return saved ? JSON.parse(saved) : MOCK_PROFILES[0];
  });
  const [showDropdown, setShowDropdown] = useState(false);

  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleBusinessSwitch = (profile) => {
    setCurrentProfile(profile);
    localStorage.setItem('lawbot-user-profile', JSON.stringify(profile));
    setShowDropdown(false);
    window.location.reload();
  };

  const isActive = (path) => {
    if (location.pathname === path) return true;
    if (path === '/dashboard' && location.pathname === '/dashboard/chat') return false;
    return location.pathname.startsWith(path + '/');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <div 
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 transition-opacity lg:hidden ${
          isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sidebar Container */}
      <aside 
        className={`
          fixed lg:relative z-50 h-screen bg-white border-r border-slate-200 shadow-2xl lg:shadow-none
          transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          w-64
          flex flex-col overflow-hidden
        `}
      >
        
        {/* Header Section */}
        <div className="h-16 flex items-center px-5 border-b border-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 shrink-0">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 leading-none text-sm">LawBot360</span>
              <span className="text-[10px] text-indigo-600 font-bold tracking-widest mt-1">LEGAL AI</span>
            </div>
          </div>
        </div>

        {/* Business Switcher Dropdown */}
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 relative shrink-0">
          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
            Active Business Profile
          </label>
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-full flex items-center justify-between p-2 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-all text-left shadow-sm"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate leading-none">
                  {currentProfile.entityName || 'Select Profile'}
                </p>
                <span className="text-[9px] text-slate-400 font-mono mt-0.5 block capitalize">
                  {currentProfile.businessType?.replace('_', ' ')}
                </span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showDropdown && (
            <div className="absolute left-4 right-4 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 max-h-48 overflow-y-auto">
              {MOCK_PROFILES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleBusinessSwitch(p)}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    currentProfile.id === p.id ? 'bg-indigo-50/50 font-bold text-indigo-700' : 'text-slate-600'
                  }`}
                >
                  <div className="truncate">
                    <p className="truncate leading-none mb-0.5">{p.entityName}</p>
                    <span className="text-[9px] text-slate-400 font-mono capitalize">{p.businessType?.replace('_', ' ')}</span>
                  </div>
                  {currentProfile.id === p.id && (
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full shrink-0 ml-1" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-6 space-y-8 custom-scrollbar">
          {MENU_DATA.map((section, idx) => (
            <div key={idx} className="px-3">
              <p className="px-4 mb-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                {section.group}
              </p>
              <div className="space-y-1">
                {section.items.map((item, itemIdx) => {
                  if (item.action === 'open_graph') {
                    return (
                      <button
                        key={itemIdx}
                        type="button"
                        onClick={() => {
                          if (setIsSidebarOpen) setIsSidebarOpen(false);
                          if (typeof window !== 'undefined') {
                            window.dispatchEvent(new CustomEvent('open-obsidian-graph', { detail: { artNo: '21' } }));
                          }
                        }}
                        className="w-full text-left group relative flex items-center h-11 px-4 rounded-xl text-slate-600 hover:bg-amber-500/10 hover:text-amber-600 transition-all duration-300 cursor-pointer"
                      >
                        <item.icon className="w-5 h-5 shrink-0 transition-transform duration-300 text-amber-500 group-hover:scale-110" />
                        <span className="ml-4 text-sm font-semibold whitespace-nowrap text-slate-800 group-hover:text-amber-600">
                          {item.label}
                        </span>
                        <div className="ml-auto">
                          <span className="bg-amber-500 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">448</span>
                        </div>
                      </button>
                    );
                  }
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={itemIdx}
                      to={item.path}
                      className={`
                        group relative flex items-center h-11 px-4 rounded-xl transition-all duration-300
                        ${active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
                      `}
                    >
                      {/* Active indicator bar */}
                      {active && <div className="absolute left-0 w-1 h-5 bg-indigo-600 rounded-r-full" />}
                      
                      <item.icon className={`w-5 h-5 shrink-0 transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
                      
                      <span className="ml-4 text-sm font-medium whitespace-nowrap">
                        {item.label}
                      </span>

                      {/* Badge / New Tag */}
                      <div className="ml-auto">
                        {item.badge && (
                          <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ring-2 ring-white">
                            {item.badge}
                          </span>
                        )}
                        {item.isNew && (
                          <span className="bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase">NEW</span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Section */}
        <div className="p-4 mt-auto border-t border-slate-100 space-y-4">
          
          <div>
            <APIToggle />
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-all">
            <div className="relative shrink-0">
              {user?.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName} 
                  className="w-9 h-9 rounded-full object-cover border border-indigo-200"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-100 to-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs">
                  {getInitials(user?.displayName)}
                </div>
              )}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-bold text-slate-900 truncate">{user?.displayName}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email || user?.phoneNumber}</p>
              {user?.email && user?.phoneNumber && (
                <p className="text-[9px] text-slate-400 font-mono truncate">{user?.phoneNumber}</p>
              )}
            </div>
            <button 
              onClick={() => logout()} 
              className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
      `}</style>
    </>
  );
};

export default Sidebar;