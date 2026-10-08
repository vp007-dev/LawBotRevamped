// src/components/ObsidianGraphModal.jsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Network, Search, Filter, ZoomIn, ZoomOut, RotateCcw, 
  Maximize2, Minimize2, X, ExternalLink, BookOpen, Sparkles, 
  Scale, FileText, CheckCircle2, Layers, Activity, Info, 
  ChevronRight, ArrowRight, ShieldCheck, Database, RefreshCw
} from 'lucide-react';
import { constitutionKnowledgeService } from '../services/constitutionKnowledgeService';
import { indianKanoonService } from '../services/indianKanoonService';

const ObsidianGraphModal = ({ isOpen, onClose, initialArticleNo = null }) => {
  const [activeTab, setActiveTab] = useState('graph'); // 'graph' | 'dataset' | 'kanoon' | 'pipeline'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [datasetSearch, setDatasetSearch] = useState('');
  const [datasetPartFilter, setDatasetPartFilter] = useState('ALL');

  // Kanoon live search inside modal
  const [kanoonQuery, setKanoonQuery] = useState('Article 21 right to privacy');
  const [kanoonResults, setKanoonResults] = useState([]);
  const [isSearchingKanoon, setIsSearchingKanoon] = useState(false);

  // Canvas ref & transform state
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const transformRef = useRef({ k: 0.85, x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const draggedNodeRef = useRef(null);

  // Load all articles and graph data
  const allArticles = useMemo(() => constitutionKnowledgeService.getAllArticles(), []);
  const allParts = useMemo(() => constitutionKnowledgeService.getAllParts(), []);
  const baseGraph = useMemo(() => constitutionKnowledgeService.getGraphData(), []);

  // Filtered categories
  const categories = useMemo(() => {
    const cats = new Set(allArticles.map(a => a.category).filter(Boolean));
    return ['ALL', ...Array.from(cats)];
  }, [allArticles]);

  // Nodes and links with local physics simulation state & cooling alpha
  const simulationStateRef = useRef({
    nodes: [],
    links: [],
    alpha: 1.0,
    initialized: false
  });

  // ESC key listener to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Calculate cluster constellation position for spacious Obsidian galaxy layout
  const getClusterPosition = useCallback((article, index, total) => {
    const artNum = parseInt(article.artNo?.replace(/\D/g, '') || '0', 10);
    let baseAngle = 0;
    let baseRadius = 280;

    if (artNum >= 12 && artNum <= 35) {
      // Part III: Fundamental Rights (Core top constellation)
      baseAngle = -Math.PI / 2; // North
      baseRadius = 170 + ((artNum - 12) % 12) * 12;
    } else if (artNum >= 36 && artNum <= 51) {
      // Part IV & IVA: DPSP & Duties (North-East)
      baseAngle = -Math.PI / 4;
      baseRadius = 260 + (artNum - 36) * 7;
    } else if (artNum >= 124 && artNum <= 147) {
      // Part V: Supreme Court & Judiciary (East-North-East)
      baseAngle = -Math.PI / 8;
      baseRadius = 310 + ((artNum - 124) % 10) * 8;
    } else if (artNum >= 52 && artNum <= 123) {
      // Part V: Union Executive & Parliament (East)
      baseAngle = Math.PI / 12;
      baseRadius = 370 + ((artNum - 52) % 18) * 9;
    } else if (artNum >= 148 && artNum <= 237) {
      // Part VI: The States & High Courts (South-East)
      baseAngle = Math.PI / 3;
      baseRadius = 390 + ((artNum - 148) % 22) * 8;
    } else if (artNum >= 243 && artNum <= 244) {
      // Part IX: Panchayats & Municipalities (South)
      baseAngle = Math.PI / 2;
      baseRadius = 360;
    } else if (artNum >= 245 && artNum <= 300) {
      // Part XI & XII: Centre-State & Finance/Property (South-West)
      baseAngle = 2 * Math.PI / 3;
      baseRadius = 380 + ((artNum - 245) % 18) * 8;
    } else if (artNum >= 308 && artNum <= 329) {
      // Part XIV & XV: Civil Services & Elections (West-South-West)
      baseAngle = 5 * Math.PI / 6;
      baseRadius = 400 + ((artNum - 308) % 15) * 8;
    } else if (artNum >= 352 && artNum <= 360) {
      // Part XVIII: Emergency Provisions (West)
      baseAngle = Math.PI;
      baseRadius = 290 + ((artNum - 352) % 8) * 10;
    } else if (artNum === 368) {
      // Part XX: Constitutional Amendment (North-West)
      baseAngle = -5 * Math.PI / 6;
      baseRadius = 250;
    } else {
      // General / Transitional: gracefully distributed outer galaxy
      const frac = index / Math.max(1, total);
      baseAngle = frac * Math.PI * 2;
      baseRadius = 440 + (index % 6) * 20;
    }

    const angleJitter = (Math.random() - 0.5) * 0.38;
    const radJitter = (Math.random() - 0.5) * 50;
    const finalAngle = baseAngle + angleJitter;
    const finalRadius = Math.max(120, baseRadius + radJitter);

    return {
      x: Math.cos(finalAngle) * finalRadius,
      y: Math.sin(finalAngle) * finalRadius
    };
  }, []);

  // Initialize simulation nodes and links with constellation coordinates
  useEffect(() => {
    if (!isOpen) return;

    const total = baseGraph.nodes.length;
    const nodes = baseGraph.nodes.map((n, i) => {
      const pos = getClusterPosition(n, i, total);
      return {
        ...n,
        x: pos.x,
        y: pos.y,
        vx: 0,
        vy: 0
      };
    });

    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const links = baseGraph.edges.map(e => ({
      ...e,
      sourceNode: nodeMap.get(e.source),
      targetNode: nodeMap.get(e.target)
    })).filter(l => l.sourceNode && l.targetNode);

    simulationStateRef.current = { nodes, links, alpha: 1.0, initialized: true };

    // If an initial article is specified, select it
    if (initialArticleNo) {
      const target = nodes.find(n => n.artNo === String(initialArticleNo).toUpperCase());
      if (target) setSelectedNode(target);
    } else {
      const art21 = nodes.find(n => n.artNo === '21');
      if (art21) setSelectedNode(art21);
    }
  }, [isOpen, baseGraph, initialArticleNo, getClusterPosition]);

  // Obsidian High-DPI Canvas Render & Force Simulation Loop
  useEffect(() => {
    if (!isOpen || activeTab !== 'graph') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let running = true;

    const render = () => {
      if (!running) return;

      const sim = simulationStateRef.current;
      const { nodes, links } = sim;
      const { k, x, y } = transformRef.current;

      const rect = canvas.getBoundingClientRect();
      const cssW = rect.width > 0 ? rect.width : 900;
      const cssH = rect.height > 0 ? rect.height : 650;
      const dpr = window.devicePixelRatio || 1;

      // Keep physical pixel buffer matching device pixel ratio (Retina 2x/1.5x)
      if (canvas.width !== Math.floor(cssW * dpr) || canvas.height !== Math.floor(cssH * dpr)) {
        canvas.width = Math.floor(cssW * dpr);
        canvas.height = Math.floor(cssH * dpr);
        canvas.style.width = `${cssW}px`;
        canvas.style.height = `${cssH}px`;
      }

      // 1. Force Simulation Step (Runs while cooling down alpha > 0.005)
      if (sim.alpha > 0.005) {
        const alpha = sim.alpha;

        // Boundary fence gravity (prevents runaway drift while keeping nodes spaced)
        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i];
          if (n === draggedNodeRef.current) continue;

          const distSq = n.x * n.x + n.y * n.y;
          if (distSq > 360000) { // soft boundary at radius 600px
            const dist = Math.sqrt(distSq);
            const pull = (dist - 600) * 0.0004 * alpha;
            n.vx -= (n.x / dist) * pull;
            n.vy -= (n.y / dist) * pull;
          }

          n.vx *= 0.88;
          n.vy *= 0.88;
          n.x += n.vx;
          n.y += n.vy;
        }

        // Spring links (cohesion between interconnected articles)
        for (let i = 0; i < links.length; i++) {
          const l = links[i];
          const s = l.sourceNode;
          const t = l.targetNode;
          const dx = t.x - s.x;
          const dy = t.y - s.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const desiredDist = 135;
          const force = (dist - desiredDist) * 0.005 * alpha;

          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          if (s !== draggedNodeRef.current) {
            s.vx += fx;
            s.vy += fy;
          }
          if (t !== draggedNodeRef.current) {
            t.vx -= fx;
            t.vy -= fy;
          }
        }

        // Fast Spatial Grid Repulsion (prevents overlapping in 60 FPS)
        const cellSize = 130;
        const grid = new Map();
        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i];
          const cx = Math.floor(n.x / cellSize);
          const cy = Math.floor(n.y / cellSize);
          const key = `${cx},${cy}`;
          if (!grid.has(key)) grid.set(key, []);
          grid.get(key).push(n);
        }

        for (const [key, cellNodes] of grid.entries()) {
          const [cx, cy] = key.split(',').map(Number);
          for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
              const neighborKey = `${cx + dx},${cy + dy}`;
              const neighbors = grid.get(neighborKey);
              if (!neighbors) continue;
              for (let i = 0; i < cellNodes.length; i++) {
                const a = cellNodes[i];
                for (let j = 0; j < neighbors.length; j++) {
                  const b = neighbors[j];
                  if (a.id >= b.id) continue;
                  const diffX = b.x - a.x;
                  const diffY = b.y - a.y;
                  const dSq = diffX * diffX + diffY * diffY || 1;
                  if (dSq < 25600) { // within 160px
                    const d = Math.sqrt(dSq);
                    const rep = ((160 - d) / 160) * 1.6 * alpha;
                    const rx = (diffX / d) * rep;
                    const ry = (diffY / d) * rep;
                    if (a !== draggedNodeRef.current) { a.vx -= rx; a.vy -= ry; }
                    if (b !== draggedNodeRef.current) { b.vx += rx; b.vy += ry; }
                  }
                }
              }
            }
          }
        }

        sim.alpha *= 0.988;
      }

      // 2. High-DPI Retina Rendering Context
      ctx.save();
      ctx.scale(dpr, dpr); // Map physical pixels to CSS pixels!

      // Clear Screen with Obsidian charcoal theme
      ctx.fillStyle = '#0f1117';
      ctx.fillRect(0, 0, cssW, cssH);

      // Viewport center
      const vpCenterX = cssW / 2 + x;
      const vpCenterY = cssH / 2 + y;

      ctx.save();
      ctx.translate(vpCenterX, vpCenterY);
      ctx.scale(k, k);

      // Subtle Obsidian Dotted Grid
      const gridSize = 45;
      const minGridX = Math.floor((-vpCenterX / k) / gridSize) * gridSize - gridSize;
      const maxGridX = Math.ceil(((cssW - vpCenterX) / k) / gridSize) * gridSize + gridSize;
      const minGridY = Math.floor((-vpCenterY / k) / gridSize) * gridSize - gridSize;
      const maxGridY = Math.ceil(((cssH - vpCenterY) / k) / gridSize) * gridSize + gridSize;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      for (let gx = minGridX; gx < maxGridX; gx += gridSize) {
        for (let gy = minGridY; gy < maxGridY; gy += gridSize) {
          ctx.beginPath();
          ctx.arc(gx, gy, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Focus set (neighbors of selected or hovered node)
      const focusNode = hoveredNode || selectedNode;
      const neighborIds = new Set();
      if (focusNode) {
        neighborIds.add(focusNode.id);
        links.forEach(l => {
          if (l.sourceNode.id === focusNode.id) neighborIds.add(l.targetNode.id);
          if (l.targetNode.id === focusNode.id) neighborIds.add(l.sourceNode.id);
        });
      }

      // 3. Draw Links (Spiderweb neural connections)
      for (let i = 0; i < links.length; i++) {
        const l = links[i];
        const s = l.sourceNode;
        const t = l.targetNode;

        const isHighlighted = focusNode && (neighborIds.has(s.id) && neighborIds.has(t.id));
        const isDimmed = focusNode && !isHighlighted;

        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(t.x, t.y);

        if (isHighlighted) {
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.9)';
          ctx.lineWidth = 2.0;
          ctx.shadowColor = 'rgba(251, 191, 36, 0.7)';
          ctx.shadowBlur = 8;
        } else if (isDimmed) {
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.05)';
          ctx.lineWidth = 0.5;
          ctx.shadowBlur = 0;
        } else {
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
          ctx.lineWidth = 0.9;
          ctx.shadowBlur = 0;
        }
        ctx.stroke();
      }
      ctx.shadowBlur = 0;

      // 4. Draw Nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const isSelected = selectedNode && selectedNode.id === n.id;
        const isHovered = hoveredNode && hoveredNode.id === n.id;
        const isNeighbor = neighborIds.has(n.id);
        const isDimmed = focusNode && !isNeighbor;

        const categoryMatch = selectedCategory === 'ALL' || n.category === selectedCategory;
        const searchMatch = !searchQuery || 
          n.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
          (n.fullTitle && n.fullTitle.toLowerCase().includes(searchQuery.toLowerCase()));

        const isHub = n.importance === 'fundamental';
        const isHigh = n.importance === 'high';
        const radius = isHub ? 13 : (isHigh ? 9 : 6);
        const alpha = isDimmed ? 0.18 : (categoryMatch && searchMatch ? 1.0 : 0.2);
        const color = n.color || '#94a3b8';

        // Glowing Halo
        if (isSelected || isHovered) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, radius + 8, 0, Math.PI * 2);
          ctx.fillStyle = isSelected ? 'rgba(251, 191, 36, 0.3)' : 'rgba(255, 255, 255, 0.2)';
          ctx.fill();
        } else if (isHub) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, radius + 5, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
          ctx.fill();
        }

        // Inner Circle
        ctx.beginPath();
        ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.fill();

        // High-contrast Stroke
        ctx.strokeStyle = isSelected ? '#fbbf24' : (isHovered ? '#ffffff' : 'rgba(255, 255, 255, 0.4)');
        ctx.lineWidth = isSelected ? 2.5 : 1.0;
        ctx.stroke();

        // Vector Crisp Text Labels (Outlined for 100% legibility)
        const showLabel = isSelected || isHovered || isNeighbor || isHub || (k > 1.1 && isHigh) || k > 1.6;
        if (showLabel && categoryMatch && searchMatch) {
          const fontSize = isSelected || isHovered ? 12 : (isHub ? 11 : 10);
          ctx.font = `${isHub || isSelected ? '700' : '500'} ${fontSize}px "Inter", -apple-system, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';

          const labelY = n.y + radius + 4;
          const text = n.label;

          // Charcoal dark outline
          ctx.strokeStyle = '#0f1117';
          ctx.lineWidth = 3.5;
          ctx.lineJoin = 'round';
          ctx.strokeText(text, n.x, labelY);

          // Foreground fill
          ctx.fillStyle = isSelected ? '#fef08a' : (isHovered ? '#ffffff' : (isHub ? '#fde68a' : 'rgba(226, 232, 240, 0.9)'));
          ctx.fillText(text, n.x, labelY);
        }

        ctx.globalAlpha = 1.0;
      }

      ctx.restore(); // restore viewport transform
      ctx.restore(); // restore dpr scale

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      running = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isOpen, activeTab, selectedNode, hoveredNode, selectedCategory, searchQuery]);

  // Handle Canvas Resize with Device Pixel Ratio
  useEffect(() => {
    if (!isOpen || activeTab !== 'graph') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = rect.width > 0 ? rect.width : 900;
      const h = rect.height > 0 ? rect.height : 650;

      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, activeTab, isFullscreen]);

  // Canvas Mouse Interactions (Pan, Drag, Click, Zoom with Centered Coords)
  const handleCanvasMouseDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.x;
    const clickY = e.clientY - rect.y;

    const { k, x, y } = transformRef.current;
    const vpCenterX = rect.width / 2 + x;
    const vpCenterY = rect.height / 2 + y;
    const graphX = (clickX - vpCenterX) / k;
    const graphY = (clickY - vpCenterY) / k;

    // Check if clicked on a node
    const { nodes } = simulationStateRef.current;
    let clickedNode = null;
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      const dx = n.x - graphX;
      const dy = n.y - graphY;
      if (dx * dx + dy * dy <= (n.radius + 8) * (n.radius + 8)) {
        clickedNode = n;
        break;
      }
    }

    if (clickedNode) {
      draggedNodeRef.current = clickedNode;
      setSelectedNode(clickedNode);
      if (simulationStateRef.current) {
        simulationStateRef.current.alpha = Math.max(simulationStateRef.current.alpha, 0.4);
      }
    } else {
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.clientX - x, y: e.clientY - y };
    }
  };

  const handleCanvasMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.x;
    const mouseY = e.clientY - rect.y;

    const { k, x, y } = transformRef.current;
    const vpCenterX = rect.width / 2 + x;
    const vpCenterY = rect.height / 2 + y;
    const graphX = (mouseX - vpCenterX) / k;
    const graphY = (mouseY - vpCenterY) / k;

    if (draggedNodeRef.current) {
      draggedNodeRef.current.x = graphX;
      draggedNodeRef.current.y = graphY;
      draggedNodeRef.current.vx = 0;
      draggedNodeRef.current.vy = 0;
      if (simulationStateRef.current) {
        simulationStateRef.current.alpha = Math.max(simulationStateRef.current.alpha, 0.35);
      }
      return;
    }

    if (isDraggingRef.current) {
      transformRef.current.x = e.clientX - dragStartRef.current.x;
      transformRef.current.y = e.clientY - dragStartRef.current.y;
      return;
    }

    // Hover detection
    const { nodes } = simulationStateRef.current;
    let found = null;
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      const dx = n.x - graphX;
      const dy = n.y - graphY;
      if (dx * dx + dy * dy <= (n.radius + 6) * (n.radius + 6)) {
        found = n;
        break;
      }
    }
    setHoveredNode(found);
  };

  const handleCanvasMouseUp = () => {
    draggedNodeRef.current = null;
    isDraggingRef.current = false;
  };

  const handleCanvasWheel = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.x;
    const mouseY = e.clientY - rect.y;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    const newK = Math.max(0.25, Math.min(4.0, transformRef.current.k * zoomFactor));

    const { x, y, k } = transformRef.current;
    const vpCenterX = rect.width / 2 + x;
    const vpCenterY = rect.height / 2 + y;

    const graphX = (mouseX - vpCenterX) / k;
    const graphY = (mouseY - vpCenterY) / k;

    transformRef.current.x = mouseX - rect.width / 2 - graphX * newK;
    transformRef.current.y = mouseY - rect.height / 2 - graphY * newK;
    transformRef.current.k = newK;
  };

  // Zoom controls helper
  const handleZoom = (factor) => {
    const newK = Math.max(0.25, Math.min(4.0, transformRef.current.k * factor));
    transformRef.current.k = newK;
  };

  const handleResetView = () => {
    transformRef.current = { k: 0.85, x: 0, y: 0 };
    if (simulationStateRef.current) {
      simulationStateRef.current.alpha = Math.max(simulationStateRef.current.alpha, 0.4);
    }
  };

  // Live search Indian Kanoon API for precedents
  const handleSearchKanoon = async (queryToSearch) => {
    const q = queryToSearch || kanoonQuery;
    if (!q) return;
    setIsSearchingKanoon(true);
    try {
      const docs = await indianKanoonService.queryLegalPrecedents(q, 6);
      setKanoonResults(docs);
    } catch (e) {
      console.warn('Indian Kanoon query error:', e);
    } finally {
      setIsSearchingKanoon(false);
    }
  };

  // Trigger search on selected node
  const handleInspectPrecedentsForNode = (node) => {
    if (!node) return;
    const searchString = `Article ${node.artNo} Constitution ${node.fullTitle || ''}`;
    setKanoonQuery(searchString);
    handleSearchKanoon(searchString);
  };

  // Filtered dataset view
  const filteredDataset = useMemo(() => {
    return allArticles.filter(art => {
      const matchPart = datasetPartFilter === 'ALL' || art.PartNo === datasetPartFilter;
      const matchSearch = !datasetSearch || 
        art.ArtNo.toLowerCase().includes(datasetSearch.toLowerCase()) ||
        art.Name.toLowerCase().includes(datasetSearch.toLowerCase()) ||
        (art.ArtDesc && art.ArtDesc.toLowerCase().includes(datasetSearch.toLowerCase())) ||
        (art.keywords && art.keywords.some(k => k.includes(datasetSearch.toLowerCase())));
      return matchPart && matchSearch;
    });
  }, [allArticles, datasetPartFilter, datasetSearch]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`bg-[#0f1117] border border-slate-800 text-slate-100 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
        isFullscreen ? 'w-full h-full rounded-none' : 'w-[96vw] max-w-7xl h-[90vh]'
      }`}>
        
        {/* Top Header Bar */}
        <div className="h-14 px-4 bg-[#141721] border-b border-slate-800/80 flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <Network className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black tracking-wide text-white flex items-center gap-1.5">
                  Obsidian Knowledge Graph & Sources
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                  448 Articles • Graph RAG
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Constitution of India Dataset & Indian Kanoon Precedents
              </p>
            </div>
          </div>

          {/* Navigation View Switcher Tabs */}
          <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('graph')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'graph' 
                  ? 'bg-amber-500 text-slate-950 shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              Obsidian Graph
            </button>
            <button
              onClick={() => setActiveTab('dataset')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'dataset' 
                  ? 'bg-amber-500 text-slate-950 shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              Constitution Dataset ({allArticles.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('kanoon');
                if (kanoonResults.length === 0) handleSearchKanoon();
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'kanoon' 
                  ? 'bg-amber-500 text-slate-950 shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              Indian Kanoon Sources
            </button>
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'pipeline' 
                  ? 'bg-amber-500 text-slate-950 shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Graph RAG Engine
            </button>
          </div>

          {/* Window Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen View'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 relative overflow-hidden flex">

          {/* TAB 1: OBSIDIAN GRAPH VIEW */}
          {activeTab === 'graph' && (
            <div className="flex-1 flex overflow-hidden relative">
              
              {/* Canvas Interactive Area */}
              <div className="flex-1 relative h-full bg-[#0f1117] overflow-hidden cursor-crosshair">
                <canvas
                  ref={canvasRef}
                  width={900}
                  height={650}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onWheel={handleCanvasWheel}
                  className="w-full h-full block"
                />

                {/* Floating Top Graph Search & Filters Bar */}
                <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
                  <div className="flex items-center gap-2 pointer-events-auto bg-[#141721]/90 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-xl shadow-lg">
                    <Search className="w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search articles in graph (e.g. 21, speech, privacy)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-56 sm:w-64"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-white">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Category Pills (Hidden scrollbar) */}
                  <div 
                    className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto max-w-xl py-1 bg-[#141721]/90 backdrop-blur-md border border-slate-800 px-2 rounded-xl shadow-lg"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    <span className="text-[10px] font-bold text-slate-500 uppercase px-1">Cluster:</span>
                    {['ALL', 'Right to Freedom & Personal Liberty', 'Right to Equality', 'Supreme Court of India', 'Constitutional Remedies & Writs', 'Emergency Provisions'].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`text-[10px] px-2 py-0.5 rounded-md font-semibold whitespace-nowrap transition-colors ${
                          selectedCategory === cat
                            ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        {cat === 'ALL' ? 'All Clusters' : cat.split('&')[0].trim()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Floating Bottom Left Controls & Retina HUD */}
                <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-[#141721]/95 backdrop-blur-md border border-slate-800/90 px-3 py-1.5 rounded-xl shadow-2xl pointer-events-auto">
                  <button
                    onClick={() => handleZoom(1.25)}
                    className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleZoom(0.8)}
                    className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleResetView}
                    className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    title="Reset View"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <div className="w-px h-4 bg-slate-800"></div>
                  <span className="text-[11px] font-mono font-bold text-amber-400">
                    {Math.round(transformRef.current.k * 100)}%
                  </span>
                  <div className="w-px h-4 bg-slate-800 hidden sm:block"></div>
                  <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                    448 Articles • Drag nodes • Scroll to Zoom
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono">
                    Retina HD
                  </span>
                </div>
              </div>

              {/* Obsidian Right Note Inspector Panel */}
              {selectedNode && (
                <div className="w-80 sm:w-96 bg-[#12151f] border-l border-slate-800 flex flex-col h-full shadow-2xl shrink-0 z-20 animate-in slide-in-from-right duration-200 overflow-hidden">
                  <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-[#151926]">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedNode.color || '#fbbf24' }}></span>
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                        {selectedNode.type === 'case' ? 'Judicial Precedent' : `Article ${selectedNode.artNo}`}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedNode(null)}
                      className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs scroll-smooth">
                    <div>
                      <h3 className="text-sm font-black text-white leading-snug">
                        {selectedNode.fullTitle || selectedNode.label}
                      </h3>
                      {selectedNode.partName && (
                        <p className="text-[11px] text-slate-400 font-medium mt-1">
                          Part {selectedNode.partNo}: {selectedNode.partName}
                        </p>
                      )}
                      {selectedNode.category && (
                        <span className="inline-block mt-2 text-[9px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                          {selectedNode.category}
                        </span>
                      )}
                    </div>

                    {/* Verbatim Article Description */}
                    {selectedNode.desc && (
                      <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1.5">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                          Constitutory Text
                        </span>
                        <p className="text-slate-300 leading-relaxed text-[11px] whitespace-pre-line font-serif">
                          {selectedNode.desc}
                        </p>
                      </div>
                    )}

                    {/* Connected Articles Cross-References (Obsidian graph edges) */}
                    {selectedNode.relatedArticles && selectedNode.relatedArticles.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                          Connected Articles ({selectedNode.relatedArticles.length})
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedNode.relatedArticles.map(rNo => {
                            const relArt = constitutionKnowledgeService.getArticle(rNo);
                            return (
                              <button
                                key={rNo}
                                onClick={() => {
                                  const target = simulationStateRef.current.nodes.find(n => n.artNo === rNo);
                                  if (target) setSelectedNode(target);
                                }}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-1 rounded-md text-[10px] font-semibold border border-slate-700 flex items-center gap-1 transition-colors"
                              >
                                <span>Art {rNo}</span>
                                <ChevronRight className="w-2.5 h-2.5 text-slate-500" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Landmark Case Precedents */}
                    {selectedNode.landmarkCases && selectedNode.landmarkCases.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase text-amber-400/90 block tracking-wider flex items-center gap-1">
                          <Scale className="w-3 h-3 text-amber-400" />
                          Landmark Precedents
                        </span>
                        <div className="space-y-1">
                          {selectedNode.landmarkCases.map((cName, idx) => (
                            <div key={idx} className="bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg text-[10px] text-amber-200 font-medium flex items-center justify-between">
                              <span>⚖️ {cName}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Query Indian Kanoon Button */}
                    <div className="pt-2 border-t border-slate-800">
                      <button
                        onClick={() => {
                          handleInspectPrecedentsForNode(selectedNode);
                          setActiveTab('kanoon');
                        }}
                        className="w-full py-2 px-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                      >
                        <Scale className="w-3.5 h-3.5 text-amber-400" />
                        Search Kanoon Precedents for Art {selectedNode.artNo}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: COMPLETE CONSTITUTION DATASET (448 ARTICLES) */}
          {activeTab === 'dataset' && (
            <div className="flex-1 flex flex-col h-full bg-[#0f1117] overflow-hidden p-4 space-y-3">
              {/* Dataset Search & Filter bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#141721] p-3 rounded-xl border border-slate-800 shrink-0">
                <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search 448 articles by number, title, clause or keywords..."
                    value={datasetSearch}
                    onChange={(e) => setDatasetSearch(e.target.value)}
                    className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-full"
                  />
                  {datasetSearch && (
                    <button onClick={() => setDatasetSearch('')} className="text-slate-400 hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Part selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-semibold">Filter Part:</span>
                  <select
                    value={datasetPartFilter}
                    onChange={(e) => setDatasetPartFilter(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-xs text-white px-2.5 py-1.5 rounded-lg focus:outline-none"
                  >
                    <option value="ALL">All 25 Parts</option>
                    {allParts.map(p => (
                      <option key={p.PartNo} value={p.PartNo}>
                        Part {p.PartNo}: {p.PartName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dataset Articles List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                <div className="text-[11px] text-slate-400 font-semibold px-1">
                  Showing {filteredDataset.length} of {allArticles.length} Constitutional Provisions:
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {filteredDataset.map(art => (
                    <div
                      key={art.ArtNo}
                      className="bg-[#141721] border border-slate-800 hover:border-amber-500/50 p-3.5 rounded-xl transition-all space-y-2 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-black text-amber-400">
                            Article {art.ArtNo}
                          </span>
                          <span className="text-[9px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-bold">
                            Part {art.PartNo}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white mt-1">
                          {art.Name}
                        </h4>
                        <p className="text-[11px] text-slate-400 line-clamp-3 mt-1.5 leading-relaxed font-serif">
                          {art.ArtDesc}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-[9px] text-slate-500 font-medium">
                          {art.category || 'Constitutional Law'}
                        </span>
                        <button
                          onClick={() => {
                            const target = simulationStateRef.current.nodes.find(n => n.artNo === art.ArtNo);
                            if (target) setSelectedNode(target);
                            setActiveTab('graph');
                          }}
                          className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
                        >
                          <span>Inspect in Graph</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: INDIAN KANOON LIVE SOURCES */}
          {activeTab === 'kanoon' && (
            <div className="flex-1 flex flex-col h-full bg-[#0f1117] overflow-hidden p-4 space-y-3">
              {/* Kanoon Search Input */}
              <div className="bg-[#141721] p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2 flex-1">
                  <Scale className="w-4 h-4 text-emerald-400" />
                  <input
                    type="text"
                    placeholder="Search Supreme Court & High Court precedents on Indian Kanoon..."
                    value={kanoonQuery}
                    onChange={(e) => setKanoonQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchKanoon()}
                    className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-full"
                  />
                </div>
                <button
                  onClick={() => handleSearchKanoon()}
                  disabled={isSearchingKanoon}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
                >
                  {isSearchingKanoon ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-3.5 h-3.5" />
                      Search Precedents
                    </>
                  )}
                </button>
              </div>

              {/* Kanoon Results */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                <div className="text-[11px] text-slate-400 font-semibold px-1">
                  Verified Judgments & Citations ({kanoonResults.length} retrieved):
                </div>

                {kanoonResults.length === 0 && !isSearchingKanoon && (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    Type a legal query or provision above to retrieve live Supreme Court and High Court precedents.
                  </div>
                )}

                {kanoonResults.map((doc, idx) => (
                  <div
                    key={idx}
                    className="bg-[#141721] border border-slate-800 hover:border-emerald-500/50 p-4 rounded-xl space-y-2 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-white leading-snug">
                        ⚖️ {doc.title}
                      </h4>
                      {doc.url && (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1 shrink-0 font-bold"
                        >
                          <span>Open Kanoon</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    {doc.headline && (
                      <p className="text-[11px] text-slate-300 leading-relaxed font-serif bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                        {doc.headline}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-[10px] text-slate-500">
                      <span>Doc ID: {doc.tid}</span>
                      <span>•</span>
                      <span className="text-emerald-500/90 font-medium">Verified Legal Precedent</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: GRAPH RAG PIPELINE EXPLAINER */}
          {activeTab === 'pipeline' && (
            <div className="flex-1 overflow-y-auto p-6 bg-[#0f1117] text-slate-300 space-y-6">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-amber-400" />
                  How Graph RAG Grounds LawBot360
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                  Unlike conventional vector-only RAG that retrieves isolated text chunks, Graph RAG models statutory law as an interconnected semantic network of articles, rights, restrictions, and judicial precedents.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-[#141721] border border-slate-800 p-4 rounded-xl space-y-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-black text-xs flex items-center justify-center">1</span>
                  <h4 className="text-xs font-bold text-white">Entity Extraction</h4>
                  <p className="text-[11px] text-slate-400">User prompts are analyzed for statutory numbers, legal doctrines, and rights (e.g. Article 21, bail, warrant).</p>
                </div>
                <div className="bg-[#141721] border border-slate-800 p-4 rounded-xl space-y-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-black text-xs flex items-center justify-center">2</span>
                  <h4 className="text-xs font-bold text-white">Graph Activation</h4>
                  <p className="text-[11px] text-slate-400">Hub nodes in the 448-article knowledge graph are activated along with their statutory categories.</p>
                </div>
                <div className="bg-[#141721] border border-slate-800 p-4 rounded-xl space-y-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-black text-xs flex items-center justify-center">3</span>
                  <h4 className="text-xs font-bold text-white">2-Hop Traversal</h4>
                  <p className="text-[11px] text-slate-400">Traverses cross-references (e.g. Art 21 expands to Art 14, 19, 22, 32, plus Puttaswamy privacy precedents).</p>
                </div>
                <div className="bg-[#141721] border border-slate-800 p-4 rounded-xl space-y-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-black text-xs flex items-center justify-center">4</span>
                  <h4 className="text-xs font-bold text-white">AWS Bedrock Grounding</h4>
                  <p className="text-[11px] text-slate-400">Context is assembled into strict anti-hallucination prompts powering Amazon Nova Pro & Llama 3.3.</p>
                </div>
              </div>

              {/* Visual Graph Architecture Card */}
              <div className="bg-[#141721] border border-slate-800 p-5 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Knowledge Sub-Networks in LawBot360
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                    <span className="font-bold text-violet-400 block mb-1">Part III: Fundamental Rights</span>
                    <span className="text-[11px] text-slate-400">Articles 12 to 35: Equality Code (14-18), Freedom & Liberty (19-22), Remedies & Writs (32).</span>
                  </div>
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                    <span className="font-bold text-sky-400 block mb-1">Part V & VI: The Judiciary</span>
                    <span className="text-[11px] text-slate-400">Supreme Court (124, 136, 141, 142) & High Courts (214, 226, 227) supervisory and writ jurisdiction.</span>
                  </div>
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                    <span className="font-bold text-emerald-400 block mb-1">Part IV: DPSP & Part IVA: Duties</span>
                    <span className="text-[11px] text-slate-400">Directive Principles (36-51), Free Legal Aid (39A), Uniform Civil Code (44), and Fundamental Duties (51A).</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ObsidianGraphModal;
