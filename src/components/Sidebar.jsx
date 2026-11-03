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
      { path: "/contract-analysis", icon: FileSearch, label: "Contract Analysis" },
    ]
  },
  {
    group: "Agentic Vault & Intelligence",
    items: [
      { path: "/dashboard/court-sim", icon: Scale, label: "Court Simulator", isNew: true },
      { path: "/dashboard/vault", icon: FolderLock, label: "Knowledge Vault & SIS", isNew: true },
      { path: "#graph", icon: Network, label: "Obsidian Graph RAG", isNew: true, action: 'open_graph' },
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
        className={`fixed inset-0 bg-[#0c0e14]/80 backdrop-blur-md z-40 transition-opacity lg:hidden ${
          isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sidebar Container */}
      <aside 
        className={`
          fixed lg:relative z-50 h-screen bg-[#0c0e14] border-r border-white/[0.08] shadow-2xl lg:shadow-none
          transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          w-64
          flex flex-col overflow-hidden text-slate-200
        `}
      >
        
        {/* Header Section */}
        <div className="h-16 flex items-center px-5 border-b border-white/[0.07] shrink-0 justify-between">
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center shadow-sm shrink-0 group-hover:bg-violet-500 transition-colors">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-white leading-none text-base tracking-tight">LawBot<span className="text-violet-400">360</span></span>
              <span className="text-[10px] text-violet-400/90 font-medium tracking-wider mt-1">LEGAL INTELLIGENCE</span>
            </div>
          </Link>
          <button 
            onClick={() => setIsSidebarOpen(false)} 
            className="lg:hidden p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Business Switcher Dropdown */}
        <div className="px-3.5 py-3 border-b border-white/[0.07] bg-[#10131d]/60 relative shrink-0">
          <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 font-mono">
            Active Entity Profile
          </label>
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-full flex items-center justify-between p-2 bg-[#161922] border border-white/[0.08] rounded-xl hover:border-violet-500/40 hover:bg-[#1a1f2c] transition-all text-left"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 bg-violet-500/10 border border-violet-500/25 rounded-lg flex items-center justify-center text-violet-400 shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate leading-none">
                  {currentProfile.entityName || 'Select Profile'}
                </p>
                <span className="text-[9px] text-zinc-400 font-mono mt-0.5 block capitalize truncate">
                  {currentProfile.businessType?.replace('_', ' ')}
                </span>
              </div>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${showDropdown ? 'rotate-180 text-violet-400' : ''}`} />
          </button>

          {showDropdown && (
            <div className="absolute left-3.5 right-3.5 mt-1.5 bg-[#161922] border border-white/[0.12] rounded-xl shadow-2xl z-50 py-1.5 max-h-56 overflow-y-auto divide-y divide-white/[0.05]">
              {MOCK_PROFILES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleBusinessSwitch(p)}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                    currentProfile.id === p.id 
                      ? 'bg-violet-500/15 font-semibold text-violet-300' 
                      : 'text-zinc-300 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="truncate pr-2">
                    <p className="truncate leading-none mb-0.5">{p.entityName}</p>
                    <span className="text-[9px] text-zinc-400 font-mono capitalize">{p.businessType?.replace('_', ' ')}</span>
                  </div>
                  {currentProfile.id === p.id && (
                    <div className="w-1.5 h-1.5 bg-violet-400 rounded-full shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-6 custom-scrollbar">
          {MENU_DATA.map((section, idx) => (
            <div key={idx} className="px-3">
              <p className="px-3 mb-2 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.18em]">
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
                        className="w-full text-left group relative flex items-center h-10 px-3.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-all cursor-pointer"
                      >
                        <item.icon className="w-4 h-4 shrink-0 transition-transform duration-200 text-violet-400 group-hover:scale-110" />
                        <span className="ml-3 text-xs font-medium whitespace-nowrap text-zinc-300 group-hover:text-white">
                          {item.label}
                        </span>
                        <div className="ml-auto">
                          <span className="bg-violet-500/15 text-violet-300 border border-violet-500/25 text-[9px] font-bold px-1.5 py-0.5 rounded-full">448</span>
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
                        group relative flex items-center h-10 px-3.5 rounded-xl transition-all duration-200
                        ${active 
                          ? 'bg-violet-500/10 text-violet-300 border border-violet-500/20 font-semibold' 
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] border border-transparent'}
                      `}
                    >
                      {/* Active indicator bar */}
                      {active && (
                        <div className="absolute left-0 top-2 bottom-2 w-1 bg-violet-400 rounded-r-full" />
                      )}
                      
                      <item.icon className={`w-4 h-4 shrink-0 transition-transform duration-200 ${active ? 'text-violet-400 scale-105' : 'text-zinc-400 group-hover:text-zinc-200 group-hover:scale-105'}`} />
                      
                      <span className="ml-3 text-xs tracking-tight whitespace-nowrap">
                        {item.label}
                      </span>

                      {/* Badge / New Tag */}
                      <div className="ml-auto flex items-center gap-1.5">
                        {item.badge && (
                          <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                            {item.badge}
                          </span>
                        )}
                        {item.isNew && (
                          <span className="bg-violet-500/15 text-violet-300 border border-violet-500/25 text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                            NEW
                          </span>
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
        <div className="p-3 mt-auto border-t border-white/[0.07] space-y-3 bg-[#0a0c12]/90">
          
          <div>
            <APIToggle />
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#141721] border border-white/[0.06] hover:border-white/[0.12] transition-all">
            <div className="relative shrink-0">
              {user?.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName} 
                  className="w-8 h-8 rounded-full object-cover border border-violet-500/30"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-violet-500/15 border border-violet-500/25 flex items-center justify-center text-violet-300 font-bold text-xs">
                  {getInitials(user?.displayName)}
                </div>
              )}
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#141721] rounded-full"></div>
            </div>
            
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-semibold text-white truncate leading-none">{user?.displayName || 'Authorized User'}</p>
              <p className="text-[10px] text-zinc-400 truncate mt-0.5">{user?.email || user?.phoneNumber || 'Pro Enterprise Tier'}</p>
            </div>
            <button 
              onClick={() => logout()} 
              className="p-1.5 hover:bg-white/[0.06] rounded-lg text-zinc-400 hover:text-rose-400 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(168, 85, 247, 0.4);
        }
      `}</style>
    </>
  );
};

export default Sidebar;