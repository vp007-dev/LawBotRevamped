import React from 'react';
import { Newspaper, ChevronRight, Zap } from 'lucide-react';

const feedItems = [
  { id: 1, title: 'GST Rate Changes for E-commerce Platforms Applicable from Next Month', date: '2 days ago', tag: 'Taxation', impact: 'High' },
  { id: 2, title: 'BNS Amendments: New Provisions for Cyber Fraud and Data Privacy', date: '1 week ago', tag: 'Criminal Law', impact: 'Medium' },
  { id: 3, title: 'MCA Circular on Annual Returns Filing Deadlines for SMEs', date: '2 weeks ago', tag: 'Corporate', impact: 'High' },
];

const RegulatoryFeed = () => {
  return (
    <div className="bg-[#161922] rounded-2xl p-6 shadow-xl border border-white/[0.08] h-full flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-purple-400" />
            AI Regulatory Feed
        </h2>
        <button className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-lg">
          View All
        </button>
      </div>
      <div className="space-y-3 flex-1">
        {feedItems.map(item => (
          <div key={item.id} className="p-4 rounded-xl border border-white/[0.06] hover:border-purple-500/30 hover:bg-[#1a1e2b] transition-all group cursor-pointer relative overflow-hidden bg-[#141721]">
            <div className="flex justify-between items-start mb-2.5">
              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-white/[0.04] border border-white/[0.08] text-purple-400 rounded-md">{item.tag}</span>
              <span className="text-[10px] font-medium text-slate-500">{item.date}</span>
            </div>
            <h3 className="text-xs font-semibold text-slate-200 leading-snug group-hover:text-purple-300 transition-colors">{item.title}</h3>
            
            <div className="mt-3 flex items-center justify-between pt-2 border-t border-white/[0.04]">
                <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${item.impact === 'High' ? 'text-rose-400' : 'text-amber-400'}`}>
                    <Zap className="w-3 h-3" /> {item.impact} Impact
                </div>
                <div className="flex items-center text-xs text-purple-400 font-semibold opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 duration-300">
                    Read analysis <ChevronRight className="w-3 h-3 ml-0.5" />
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RegulatoryFeed;
