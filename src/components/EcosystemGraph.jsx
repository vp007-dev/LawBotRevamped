import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  User, FolderLock, FileCheck, Calendar, Sparkles, Briefcase, 
  X, ZoomIn, ZoomOut, RotateCcw, Shield, ShieldCheck, AlertCircle, 
  CheckCircle2, ArrowRight, ExternalLink, HelpCircle, Network
} from 'lucide-react';

const EcosystemGraph = () => {
  const [profile, setProfile] = useState(null);
  const [docs, setDocs] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef(null);

  // Load actual data from localStorage or fallback
  useEffect(() => {
    const savedProfile = localStorage.getItem('lawbot-user-profile');
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    } else {
      // Setup some default onboarding fields for rendering
      setProfile({
        entityName: 'Acme Legal Tech Pvt Ltd',
        businessType: 'pvt_ltd',
        industry: 'Information Technology & Software',
        state: 'Maharashtra',
        turnover: '50L - 2Cr',
        employeeCount: 12,
        registrations: { gst: true, pan: true, msme: true, fssai: false, shopAct: true, pfEsi: false }
      });
    }

    const savedDocs = localStorage.getItem('lawbot-vault-docs') || localStorage.getItem('lawbot-documents');
    if (savedDocs) {
      try {
        setDocs(JSON.parse(savedDocs));
      } catch {
        setDocs([]);
      }
    } else {
      setDocs([
        { id: 'doc-1', title: 'GST Registration Certificate (Form REG-06)', category: 'tax', date: '2024-04-12', status: 'Verified' },
        { id: 'doc-2', title: 'Company Permanent Account Number (PAN Card)', category: 'identity', date: '2024-03-28', status: 'Verified' },
        { id: 'doc-3', title: 'Standard Employment & IP Assignment Agreement', category: 'contract', date: '2024-05-15', status: 'AI Audited' }
      ]);
    }
  }, []);

  // Compute node definitions and their contents dynamically based on localStorage state
  const graphData = useMemo(() => {
    const activeLicenses = [];
    if (profile?.registrations) {
      if (profile.registrations.gst) activeLicenses.push({ name: 'GSTIN Registration', status: 'Active', docLink: 'GST Certificate' });
      if (profile.registrations.pan) activeLicenses.push({ name: 'Corporate PAN Card', status: 'Active', docLink: 'Company PAN' });
      if (profile.registrations.msme) activeLicenses.push({ name: 'Udyam MSME Registration', status: 'Active', docLink: 'MSME Certificate' });
      if (profile.registrations.shopAct) activeLicenses.push({ name: 'Shop & Establishment License', status: 'Active' });
      if (profile.registrations.fssai) activeLicenses.push({ name: 'FSSAI License', status: 'Active' });
      if (profile.registrations.pfEsi) activeLicenses.push({ name: 'EPFO / ESIC Registration', status: 'Active' });
    }
    if (activeLicenses.length === 0) {
      activeLicenses.push({ name: 'GSTIN Registration', status: 'Active' });
      activeLicenses.push({ name: 'Corporate PAN Card', status: 'Active' });
    }

    const complianceDeadlines = [
      { id: 'dl-1', title: 'GSTR-1 Monthly Return', dueDate: '2026-08-11', category: 'GST', status: 'Due Soon' },
      { id: 'dl-2', title: 'GSTR-3B Summary Return', dueDate: '2026-08-20', category: 'GST', status: 'Upcoming' },
      { id: 'dl-3', title: 'EPFO & ESIC Deposit', dueDate: '2026-08-15', category: 'Labour Law', status: 'Due Soon' },
      { id: 'dl-4', title: 'TDS Quarterly Return', dueDate: '2026-07-31', category: 'Income Tax', status: 'Overdue' }
    ];

    const eligibleSchemes = [];
    if (profile) {
      const isMicro = profile.businessType === 'proprietorship' || profile.businessType === 'individual';
      const isPvtLtd = profile.businessType === 'pvt_ltd' || profile.businessType === 'llp';
      
      if (isMicro || profile.employeeCount <= 10) {
        eligibleSchemes.push({ title: 'Mudra Yojana Loan', benefit: 'Low-interest loans up to ₹10L', link: 'https://pmumudra.org.in/' });
      }
      if (isPvtLtd || profile.industry.includes('Software') || profile.industry.includes('IT')) {
        eligibleSchemes.push({ title: 'Startup India Support', benefit: '80% tax exemption & fund access', link: 'https://startupindia.gov.in/' });
      }
      eligibleSchemes.push({ title: 'PMEGP Credit Linked Subsidy', benefit: '30% margin subsidy for new projects', link: 'https://pgpbvin.com/' });
    }

    const openWorkflows = [
      { id: 1, title: 'Consumer Complaint - Defective Mobile', progress: 60, nextAction: 'File in Court', status: 'In Progress' },
      { id: 2, title: 'RTI Application - Municipal Records', progress: 30, nextAction: 'Wait for Response', status: 'Submitted' },
      { id: 3, title: 'Tenant Rights - Eviction Dispute', progress: 20, nextAction: 'Consult Lawyer', status: 'Consultation' }
    ];

    const width = 800;
    const height = 550;
    const cx = width / 2;
    const cy = height / 2;

    const nodes = [
      {
        id: 'profile',
        label: profile?.entityName || 'Acme Business Profile',
        type: 'profile',
        x: cx,
        y: cy,
        icon: User,
        color: { bg: 'from-blue-600 to-indigo-700', border: 'border-blue-400', glow: 'rgba(59, 130, 246, 0.4)', text: '#fff' },
        data: {
          title: 'Active Entity Profile',
          subtitle: profile?.businessType ? profile.businessType.toUpperCase().replace('_', ' ') : 'PVT LTD',
          stats: [
            { label: 'Industry', value: profile?.industry || 'Technology' },
            { label: 'State Jurisdiction', value: profile?.state || 'Maharashtra' },
            { label: 'Turnover Slab', value: profile?.turnover || '50L - 2Cr' },
            { label: 'Team Size', value: `${profile?.employeeCount || 5} Employees` }
          ]
        }
      },
      {
        id: 'vault',
        label: `Vault Documents (${docs.length})`,
        type: 'vault',
        x: cx - 220,
        y: cy - 140,
        icon: FolderLock,
        color: { bg: 'from-indigo-900 to-purple-950', border: 'border-indigo-500', glow: 'rgba(99, 102, 241, 0.3)', text: '#fff' },
        data: {
          title: 'Secure Document Vault',
          subtitle: 'AI Indexed & Extracted Contracts/Certificates',
          list: docs.map((doc) => ({
            primary: doc?.title || 'Untitled document',
            secondary: `${String(doc?.category || 'Uncategorized').toUpperCase()} • ${doc?.status || 'Pending'}`
          }))
        }
      },
      {
        id: 'licenses',
        label: `Active Licenses (${activeLicenses.length})`,
        type: 'licenses',
        x: cx + 220,
        y: cy - 140,
        icon: FileCheck,
        color: { bg: 'from-emerald-950 to-teal-900', border: 'border-emerald-500', glow: 'rgba(16, 185, 129, 0.3)', text: '#fff' },
        data: {
          title: 'Registered Licenses & Registrations',
          subtitle: 'Active Statutory Certifications',
          list: activeLicenses.map(l => ({ primary: l.name, secondary: l.status }))
        }
      },
      {
        id: 'compliance',
        label: `Compliance (${complianceDeadlines.filter(c => c.status === 'Due Soon' || c.status === 'Overdue').length} Action)`,
        type: 'compliance',
        x: cx + 240,
        y: cy + 120,
        icon: Calendar,
        color: { bg: 'from-rose-950 to-amber-950', border: 'border-rose-500', glow: 'rgba(239, 68, 68, 0.3)', text: '#fff' },
        data: {
          title: 'Compliance Deadlines',
          subtitle: 'Statutory filing calendar',
          list: complianceDeadlines.map(c => ({
            primary: c.title,
            secondary: `Due: ${c.dueDate}`,
            badge: c.status,
            badgeColor: c.status === 'Overdue' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
          }))
        }
      },
      {
        id: 'schemes',
        label: `Eligible Schemes (${eligibleSchemes.length})`,
        type: 'schemes',
        x: cx,
        y: cy + 190,
        icon: Sparkles,
        color: { bg: 'from-amber-950 to-orange-950', border: 'border-amber-500', glow: 'rgba(245, 158, 11, 0.3)', text: '#fff' },
        data: {
          title: 'AI Matched Schemes',
          subtitle: 'Qualified central & state government benefits',
          list: eligibleSchemes.map(s => ({ primary: s.title, secondary: s.benefit, link: s.link }))
        }
      },
      {
        id: 'workflows',
        label: `Open Workflows (${openWorkflows.length})`,
        type: 'workflows',
        x: cx - 240,
        y: cy + 120,
        icon: Briefcase,
        color: { bg: 'from-violet-950 to-indigo-900', border: 'border-violet-500', glow: 'rgba(139, 92, 246, 0.3)', text: '#fff' },
        data: {
          title: 'Active Legal Workflows',
          subtitle: 'Litigations and document analysis trackers',
          list: openWorkflows.map(w => ({ primary: w.title, secondary: `Next: ${w.nextAction} (${w.progress}% Done)` }))
        }
      }
    ];

    const edges = [
      { source: 'profile', target: 'vault', type: 'solid' },
      { source: 'profile', target: 'licenses', type: 'solid' },
      { source: 'vault', target: 'licenses', type: 'dashed' },
      { source: 'licenses', target: 'compliance', type: 'solid' },
      { source: 'profile', target: 'schemes', type: 'dashed' },
      { source: 'profile', target: 'workflows', type: 'solid' },
      { source: 'vault', target: 'workflows', type: 'dashed' },
      { source: 'compliance', target: 'workflows', type: 'dashed' }
    ];

    return { nodes, edges };
  }, [profile, docs]);

  // Pan and Zoom Handlers
  const handleMouseDown = (e) => {
    if (e.target.closest('.node-element') || e.target.closest('.control-btn')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Node highlighting helper
  const isLinkActive = (edge) => {
    if (!hoveredNode) return true;
    return edge.source === hoveredNode || edge.target === hoveredNode;
  };

  const isNodeActive = (nodeId) => {
    if (!hoveredNode) return true;
    if (nodeId === hoveredNode) return true;
    // Highlight connected nodes too
    return graphData.edges.some(edge => 
      (edge.source === hoveredNode && edge.target === nodeId) ||
      (edge.target === hoveredNode && edge.source === nodeId)
    );
  };

  return (
    <div className="relative w-full h-[600px] bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex select-none">
      
      {/* Interactive Canvas */}
      <div 
        ref={containerRef}
        className="flex-1 cursor-grab active:cursor-grabbing relative overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Background Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none" 
          style={{ 
            backgroundImage: 'radial-gradient(#818cf8 1px, transparent 1px)', 
            backgroundSize: '24px 24px' 
          }}
        />

        {/* SVG Drawing Canvas */}
        <svg width="100%" height="100%" className="absolute inset-0">
          <defs>
            {/* Linear Gradients for links */}
            <linearGradient id="grad-solid" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="grad-dashed" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#c084fc" stopOpacity="0.4" />
            </linearGradient>
            
            {/* Node Shadows and Glows */}
            <filter id="glow-profile" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Group for pan & zoom */}
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`} className="transition-transform duration-75">
            
            {/* Links / Edges */}
            {graphData.edges.map((edge, i) => {
              const source = graphData.nodes.find(n => n.id === edge.source);
              const target = graphData.nodes.find(n => n.id === edge.target);
              if (!source || !target) return null;

              const active = isLinkActive(edge);

              return (
                <line 
                  key={`edge-${i}`} 
                  x1={source.x} y1={source.y} x2={target.x} y2={target.y}
                  stroke={edge.type === 'dashed' ? 'url(#grad-dashed)' : 'url(#grad-solid)'}
                  strokeWidth={edge.type === 'dashed' ? 1.5 : 2.5}
                  strokeDasharray={edge.type === 'dashed' ? '6 6' : 'none'}
                  opacity={active ? 1.0 : 0.15}
                  className="transition-all duration-300"
                />
              );
            })}
            
            {/* Pulsing indicator animations for active status nodes */}
            {graphData.nodes.map((node) => {
              if (node.type === 'profile') return null;
              return (
                <circle 
                  key={`pulse-${node.id}`}
                  cx={node.x}
                  cy={node.y}
                  r={58}
                  fill="none"
                  stroke={node.id === 'compliance' ? '#f43f5e' : '#6366f1'}
                  strokeWidth="2"
                  opacity={isNodeActive(node.id) ? 0.35 : 0.05}
                  className="animate-ping"
                  style={{ animationDuration: node.id === 'compliance' ? '3s' : '4s' }}
                />
              );
            })}

            {/* Nodes */}
            {graphData.nodes.map((node) => {
              const IconComponent = node.icon;
              const isSelected = selectedNode?.id === node.id;
              const active = isNodeActive(node.id);
              const isCenter = node.type === 'profile';
              const radius = isCenter ? 62 : 46;

              return (
                <g 
                  key={`node-${node.id}`} 
                  transform={`translate(${node.x}, ${node.y})`} 
                  onClick={(e) => { e.stopPropagation(); setSelectedNode(node); }}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  className="node-element cursor-pointer group"
                  opacity={active ? 1.0 : 0.25}
                  style={{ transition: 'opacity 0.3s, transform 0.2s' }}
                >
                  {/* Outer Glow Ring on Hover */}
                  <circle 
                    r={radius + 4} 
                    fill="none" 
                    stroke={isSelected ? '#ffffff' : 'transparent'} 
                    strokeWidth={2}
                    className="group-hover:stroke-indigo-400/50 transition-all duration-300"
                  />

                  {/* Main Rounded Circle Node */}
                  <circle 
                    r={radius} 
                    fill={`url(#grad-solid)`}
                    className={`bg-gradient-to-br ${node.color.bg} shadow-2xl transition-all duration-300 filter group-hover:brightness-125`}
                    style={{ 
                      filter: `drop-shadow(0px 8px 16px ${node.color.glow})`,
                    }}
                  />

                  {/* SVG Border Ring */}
                  <circle 
                    r={radius} 
                    fill="none" 
                    stroke={isSelected ? '#ffffff' : '#475569'} 
                    strokeWidth={isSelected ? 3.5 : 1.5}
                    className="transition-colors duration-200"
                  />

                  {/* Icon & Label */}
                  <g transform={`translate(0, ${isCenter ? -12 : -10})`}>
                    <foreignObject x={-12} y={-12} width={24} height={24} className="pointer-events-none">
                      <IconComponent className="w-6 h-6 text-white" />
                    </foreignObject>
                  </g>

                  {/* Main Label */}
                  <text 
                    textAnchor="middle" 
                    dy={isCenter ? 18 : 16} 
                    fill="#ffffff" 
                    fontSize={isCenter ? '11' : '9'} 
                    fontWeight="bold"
                    className="pointer-events-none select-none tracking-wide"
                  >
                    {node.label.length > 20 ? node.label.substring(0, 18) + '...' : node.label}
                  </text>

                  {/* Sub-label */}
                  <text 
                    textAnchor="middle" 
                    dy={isCenter ? 32 : 28} 
                    fill="#94a3b8" 
                    fontSize="7"
                    fontWeight="medium"
                    className="pointer-events-none select-none uppercase tracking-widest opacity-80"
                  >
                    {node.type}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Canvas HUD Overlay */}
        <div className="absolute top-5 left-5 pointer-events-none bg-slate-900/80 backdrop-blur-md border border-slate-800 px-4 py-3 rounded-2xl flex flex-col gap-1 shadow-xl">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-white tracking-wide">Legal Ecosystem Engine</span>
          </div>
          <span className="text-[9px] text-slate-400">Real-time statutory mapping and document status</span>
        </div>

        {/* Floating Zoom/Reset Controls */}
        <div className="absolute bottom-5 left-5 flex gap-2">
          <button 
            onClick={() => setZoom(prev => Math.min(prev + 0.15, 2.5))}
            className="control-btn p-2.5 bg-slate-900/90 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-all shadow-lg active:scale-95"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setZoom(prev => Math.max(prev - 0.15, 0.5))}
            className="control-btn p-2.5 bg-slate-900/90 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-all shadow-lg active:scale-95"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button 
            onClick={resetView}
            className="control-btn p-2.5 bg-slate-900/90 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-all shadow-lg active:scale-95"
            title="Reset View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Help Tip Overlay */}
        <div className="absolute bottom-5 right-5 pointer-events-none text-[10px] text-slate-500 bg-slate-900/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-800 flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5" />
          Drag canvas to pan • Scroll to zoom • Click node to audit
        </div>
      </div>

      {/* Slide-out details drawer */}
      <div 
        className={`w-80 bg-slate-900 border-l border-slate-800 shadow-2xl transition-all duration-300 z-10 flex flex-col relative ${
          selectedNode ? 'translate-x-0' : 'translate-x-full absolute right-0 top-0 h-full'
        }`}
      >
        {selectedNode && (
          <div className="h-full flex flex-col text-slate-300">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200">Legal Audit</h3>
              </div>
              <button 
                onClick={() => setSelectedNode(null)} 
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Drawer Content */}
            <div className="p-5 flex-1 overflow-y-auto space-y-6">
              <div>
                <span className="px-2 py-0.5 bg-indigo-900/40 text-indigo-300 border border-indigo-500/20 rounded-md text-[9px] font-bold uppercase tracking-wider mb-2 inline-block">
                  {selectedNode.type} Node
                </span>
                <h2 className="text-lg font-black text-white leading-tight">{selectedNode.data.title}</h2>
                <p className="text-xs text-slate-400 mt-1">{selectedNode.data.subtitle}</p>
              </div>

              {/* Profile Details Grid */}
              {selectedNode.type === 'profile' && selectedNode.data.stats && (
                <div className="grid grid-cols-2 gap-3">
                  {selectedNode.data.stats.map((stat, i) => (
                    <div key={i} className="bg-slate-950 border border-slate-800/80 rounded-xl p-3">
                      <span className="text-[9px] text-slate-500 uppercase font-bold block">{stat.label}</span>
                      <span className="text-xs font-semibold text-slate-200 mt-1 block truncate" title={stat.value}>{stat.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* General Metadata Lists */}
              {selectedNode.data.list && (
                <div className="space-y-2.5">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Connected Entities & Status</h4>
                  <div className="space-y-2">
                    {selectedNode.data.list.map((item, idx) => (
                      <div key={idx} className="bg-slate-950 border border-slate-800/50 rounded-xl p-3 flex flex-col justify-between gap-1 hover:border-slate-800 transition-all">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-bold text-slate-200 leading-tight">{item.primary}</p>
                          {item.badge && (
                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${item.badgeColor}`}>
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">{item.secondary}</p>
                        {item.link && (
                          <a 
                            href={item.link} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold mt-1.5 inline-flex items-center gap-1 w-max"
                          >
                            <span>Open Web Portal</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons inside Drawer */}
              <div className="space-y-2.5 pt-4 border-t border-slate-800">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quick Actions</h4>
                
                <button 
                  onClick={() => window.location.href = `/dashboard/${selectedNode.type === 'profile' ? 'chat' : selectedNode.type === 'vault' ? 'vault' : selectedNode.type === 'compliance' ? 'compliance' : selectedNode.type === 'workflows' ? 'cases' : selectedNode.type === 'schemes' ? 'schemes' : 'chat'}`}
                  className="w-full h-9 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-900/50 transition-all active:scale-95"
                >
                  <span>Go to Management Hub</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button 
                  onClick={() => alert(`Analyzing ${selectedNode.data.title} with LawBot360 AI...`)}
                  className="w-full h-9 bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 text-slate-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  <span>Run AI Statutory Audit</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EcosystemGraph;
