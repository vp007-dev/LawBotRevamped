import React, { useState, useEffect, useMemo } from 'react';
import { Network, X, Sparkles, CheckCircle } from 'lucide-react';

const VaultGraph = () => {
  const [profile, setProfile] = useState(null);
  const [docs, setDocs] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  // Using fixed dimensions for initial layout math
  const dimensions = { width: 800, height: 600 };
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const p = localStorage.getItem('lawbot-user-profile');
    const d = localStorage.getItem('lawbot-vault-docs');
    if (p) setProfile(JSON.parse(p));
    if (d) setDocs(JSON.parse(d));
  }, []);

  const { nodes, edges } = useMemo(() => {
    const nodes = [];
    const edges = [];
    
    const centerId = 'entity-1';
    nodes.push({
      id: centerId,
      label: profile?.entityName || 'Acme Legal Pvt Ltd',
      type: 'entity',
      x: dimensions.width / 2,
      y: dimensions.height / 2,
      data: profile || { entityName: 'Acme Legal Pvt Ltd', industry: 'Legal Tech' }
    });

    const docNodes = docs.slice(0, 6).map((doc, idx) => {
      const total = Math.max(Math.min(docs.length, 6), 1);
      const angle = (Math.PI * 2 * idx) / total;
      const radius = 140;
      return {
        id: doc.id,
        label: doc.title,
        type: 'doc',
        x: dimensions.width / 2 + Math.cos(angle) * radius,
        y: dimensions.height / 2 + Math.sin(angle) * radius,
        data: doc
      };
    });
    
    nodes.push(...docNodes);
    docNodes.forEach(doc => {
      edges.push({ source: centerId, target: doc.id, type: 'solid' });
    });

    const extendedNodes = [
      { id: 'l2-1', label: 'GSTR-3B Deadline', type: 'deadline', parent: docNodes[0]?.id || centerId, data: { action: 'File by 20th', status: 'Pending' } },
      { id: 'l2-2', label: 'TDS Filing', type: 'deadline', parent: docNodes[1]?.id || centerId, data: { action: 'Q3 TDS Return', status: 'Upcoming' } },
      { id: 'l3-1', label: 'PMEGP Scheme', type: 'scheme', parent: 'l2-1', data: { benefit: 'Credit Linked Subsidy', match: '95%' } },
      { id: 'l3-2', label: 'CGTMSE', type: 'scheme', parent: centerId, data: { benefit: 'Collateral Free Loan', match: '88%' } },
    ];

    extendedNodes.forEach((en, idx) => {
      const parentNode = nodes.find(n => n.id === en.parent) || nodes[0];
      const angle = (Math.PI * 2 * idx) / extendedNodes.length + Math.PI / 4;
      const radius = 100;
      en.x = parentNode.x + Math.cos(angle) * radius;
      en.y = parentNode.y + Math.sin(angle) * radius;
      nodes.push(en);
      edges.push({ source: parentNode.id, target: en.id, type: 'dashed' });
    });

    return { nodes, edges };
  }, [profile, docs]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const getNodeColor = (type) => {
    switch(type) {
      case 'entity': return { fill: '#312e81', stroke: '#6366f1', text: '#fff' };
      case 'doc': return { fill: '#1e1b4b', stroke: '#818cf8', text: '#fff' };
      case 'deadline': return { fill: '#064e3b', stroke: '#10b981', text: '#fff' };
      case 'scheme': return { fill: '#78350f', stroke: '#f59e0b', text: '#fff' };
      default: return { fill: '#333', stroke: '#555', text: '#fff' };
    }
  };

  return (
    <div className="relative w-full h-[600px] bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-xl flex">
      <div 
        className="flex-1 cursor-grab active:cursor-grabbing relative overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={(e) => setZoom(prev => Math.min(Math.max(0.5, prev - e.deltaY * 0.001), 3))}
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        <svg width="100%" height="100%">
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`} className="transition-transform duration-75">
            {edges.map((edge, i) => {
              const source = nodes.find(n => n.id === edge.source);
              const target = nodes.find(n => n.id === edge.target);
              if (!source || !target) return null;
              return (
                <line 
                  key={i} 
                  x1={source.x} y1={source.y} x2={target.x} y2={target.y}
                  stroke={edge.type === 'dashed' ? '#6366f1' : '#4f46e5'}
                  strokeWidth={edge.type === 'dashed' ? 1.5 : 2.5}
                  strokeDasharray={edge.type === 'dashed' ? '6 6' : 'none'}
                  opacity={0.8}
                />
              );
            })}
            
            {nodes.map(node => {
              const colors = getNodeColor(node.type);
              const isSelected = selectedNode?.id === node.id;
              return (
                <g 
                  key={node.id} 
                  transform={`translate(${node.x}, ${node.y})`} 
                  onClick={(e) => { e.stopPropagation(); setSelectedNode(node); }}
                  className="cursor-pointer transition-transform duration-200 hover:scale-105 group"
                >
                  <circle 
                    r={node.type === 'entity' ? 55 : 45} 
                    fill={colors.fill} 
                    stroke={isSelected ? '#ffffff' : colors.stroke} 
                    strokeWidth={isSelected ? 4 : 2} 
                    className="shadow-2xl transition-all duration-200 group-hover:filter group-hover:brightness-125"
                  />
                  <text 
                    textAnchor="middle" 
                    dy="-5" 
                    fill={colors.text} 
                    fontSize={node.type === 'entity' ? '12' : '10'} 
                    fontWeight="bold"
                    className="pointer-events-none select-none"
                  >
                    {node.label.length > 15 ? node.label.substring(0, 12) + '...' : node.label}
                  </text>
                  <text 
                    textAnchor="middle" 
                    dy="12" 
                    fill={colors.stroke} 
                    fontSize="9"
                    className="pointer-events-none select-none uppercase tracking-widest"
                  >
                    {node.type}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      <div className={`w-80 bg-white border-l border-slate-200 shadow-2xl transition-all duration-300 z-10 ${selectedNode ? 'translate-x-0' : 'translate-x-full absolute right-0 top-0 h-full'}`}>
        {selectedNode && (
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-indigo-50">
              <div className="flex items-center gap-2">
                <Network className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900">Node Properties</h3>
              </div>
              <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-slate-900 p-1 rounded-md hover:bg-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-5 flex-1 overflow-y-auto space-y-6">
              <div>
                <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold uppercase tracking-wider mb-2 inline-block">
                  {selectedNode.type} Node
                </span>
                <h2 className="text-xl font-bold text-slate-900">{selectedNode.label}</h2>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Metadata</h4>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                  {Object.entries(selectedNode.data || {}).map(([key, value]) => {
                    if (typeof value === 'object' || Array.isArray(value)) return null; 
                    return (
                      <div key={key} className="flex flex-col">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">{key}</span>
                        <span className="text-sm font-medium text-slate-900 break-words">{value || 'N/A'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Action Items</h4>
                <button className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 transition-all">
                  <Sparkles className="w-4 h-4" />
                  Ask AI about this
                </button>
                <button className="w-full h-10 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all">
                  <CheckCircle className="w-4 h-4" />
                  Mark as Verified
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VaultGraph;
