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
    <div className="bg-[#141721] border border-white/[0.08] p-2.5 rounded-xl space-y-2 text-white">
      {/* Engine Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Cloud className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-300">
            AWS Bedrock Engine
          </span>
        </div>
        <span className="text-[8px] font-medium px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/25 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400"></span>
          Unified API
        </span>
      </div>

      {/* Active Model Selector Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-[#161922] hover:bg-[#1b202c] border border-white/[0.08] p-2 rounded-lg transition-all text-left group"
        title="Change AWS Bedrock Model"
      >
        <div className="min-w-0 pr-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-white truncate">
              {activeModel.shortName}
            </span>
            <span className="text-[8px] px-1.5 py-0.5 rounded bg-white/[0.06] text-violet-300 font-semibold border border-white/[0.05]">
              {activeModel.badge}
            </span>
          </div>
          <p className="text-[9px] text-zinc-400 truncate mt-0.5">
            {activeModel.description}
          </p>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 group-hover:text-violet-300 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Model Selection Dropdown Menu */}
      {isOpen && (
        <div className="space-y-1 pt-1 border-t border-white/[0.08] animate-in fade-in slide-in-from-top-1 duration-150">
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider px-1">
            Select AWS Bedrock Model:
          </span>
          <div className="space-y-1">
            {AWS_MODELS.map((model) => {
              const isSelected = activeModel.id === model.id;
              return (
                <button
                  key={model.id}
                  onClick={() => handleSelectModel(model.id)}
                  className={`w-full text-left p-1.5 rounded-lg text-[10px] transition-all flex items-start justify-between ${
                    isSelected
                      ? 'bg-violet-500/15 border border-violet-500/30 text-violet-200 font-semibold'
                      : 'hover:bg-white/[0.05] text-zinc-300 border border-transparent'
                  }`}
                >
                  <div className="min-w-0 pr-1">
                    <div className="flex items-center gap-1">
                      <span className="truncate">{model.shortName}</span>
                      <span className="text-[7px] px-1 py-0.2 rounded bg-white/[0.06] text-zinc-400">
                        {model.badge}
                      </span>
                    </div>
                    <span className="text-[8px] text-zinc-400 line-clamp-1 block">
                      {model.provider}
                    </span>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />
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
        className="w-full pt-1.5 border-t border-white/[0.08] flex items-center justify-between text-[9px] text-zinc-300 hover:text-white px-1 py-1 rounded-lg hover:bg-white/[0.04] transition-all cursor-pointer group"
        title="Open Obsidian Knowledge Graph & Sources"
      >
        <span className="flex items-center gap-1.5 text-violet-300 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span>Obsidian Graph RAG</span>
        </span>
        <span className="text-[8px] bg-violet-500/15 text-violet-300 border border-violet-500/25 px-1.5 py-0.2 rounded-full font-bold">
          448 Articles
        </span>
      </button>
    </div>
  );
};

export default APIToggle;