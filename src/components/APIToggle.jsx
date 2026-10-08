import React, { useState, useEffect } from 'react';
import { Cloud, Sparkles, CheckCircle2, ChevronDown, ShieldCheck } from 'lucide-react';
import lawBot360AI from '../services/aiService';
import { AWS_MODELS } from '../services/awsAiService';

const APIToggle = () => {
  const [apiStatus, setApiStatus] = useState(lawBot360AI.getAPIStatus());
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setApiStatus(lawBot360AI.getAPIStatus());
  }, []);

  const handleSelectModel = (modelId) => {
    lawBot360AI.setModel(modelId);
    setApiStatus(lawBot360AI.getAPIStatus());
    setIsOpen(false);
  };

  const activeModel = apiStatus.activeModel || AWS_MODELS[0];

  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-2.5 rounded-xl space-y-2 text-white shadow-md">
      {/* Engine Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Cloud className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">
            AWS Bedrock Engine
          </span>
        </div>
        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
          Unified API
        </span>
      </div>

      {/* Active Model Selector Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 p-2 rounded-lg transition-all text-left group"
        title="Change AWS Bedrock Model"
      >
        <div className="min-w-0 pr-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-black text-amber-300 truncate">
              {activeModel.shortName}
            </span>
            <span className="text-[8px] px-1 py-0.2 rounded bg-slate-700 text-slate-300 font-semibold">
              {activeModel.badge}
            </span>
          </div>
          <p className="text-[9px] text-slate-400 truncate mt-0.5">
            {activeModel.description}
          </p>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Model Selection Dropdown Menu */}
      {isOpen && (
        <div className="space-y-1 pt-1 border-t border-slate-800/80 animate-in fade-in slide-in-from-top-1 duration-150">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-1">
            Select AWS Bedrock Model:
          </span>
          <div className="space-y-1">
            {AWS_MODELS.map((model) => {
              const isSelected = activeModel.id === model.id;
              return (
                <button
                  key={model.id}
                  onClick={() => handleSelectModel(model.id)}
                  className={`w-full text-left p-1.5 rounded-md text-[10px] transition-all flex items-start justify-between ${
                    isSelected
                      ? 'bg-amber-500/20 border border-amber-500/40 text-amber-200 font-bold'
                      : 'hover:bg-slate-800/60 text-slate-300 border border-transparent'
                  }`}
                >
                  <div className="min-w-0 pr-1">
                    <div className="flex items-center gap-1">
                      <span className="truncate">{model.shortName}</span>
                      <span className="text-[7px] px-1 py-0.2 rounded bg-slate-800 text-slate-400">
                        {model.badge}
                      </span>
                    </div>
                    <span className="text-[8px] text-slate-400 line-clamp-1 block">
                      {model.provider}
                    </span>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Obsidian Graph RAG Launcher Button */}
      <button
        type="button"
        onClick={() => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('open-obsidian-graph', { detail: { artNo: '21' } }));
          }
        }}
        className="w-full pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[9px] text-slate-300 hover:text-white px-1 py-1 rounded-lg hover:bg-slate-800/70 transition-all cursor-pointer group"
        title="Open Obsidian Knowledge Graph & Sources"
      >
        <span className="flex items-center gap-1.5 text-amber-400 font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Obsidian Graph RAG</span>
        </span>
        <span className="text-[8px] bg-amber-500/15 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded-full font-bold">
          448 Articles
        </span>
      </button>
    </div>
  );
};

export default APIToggle;