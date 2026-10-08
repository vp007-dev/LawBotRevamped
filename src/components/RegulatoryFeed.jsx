import React from 'react';
import { Newspaper, ChevronRight, Zap } from 'lucide-react';

const feedItems = [
  { id: 1, title: 'GST Rate Changes for E-commerce Platforms Applicable from Next Month', date: '2 days ago', tag: 'Taxation', impact: 'High' },
  { id: 2, title: 'BNS Amendments: New Provisions for Cyber Fraud and Data Privacy', date: '1 week ago', tag: 'Criminal Law', impact: 'Medium' },
  { id: 3, title: 'MCA Circular on Annual Returns Filing Deadlines for SMEs', date: '2 weeks ago', tag: 'Corporate', impact: 'High' },
];

const RegulatoryFeed = () => {
  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-blue-500" />
            AI Regulatory Feed
        </h2>
        <button className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 px-3 py-1.5 rounded-lg">
          View All
        </button>
      </div>
      <div className="space-y-4 flex-1">
        {feedItems.map(item => (
          <div key={item.id} className="p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all group cursor-pointer relative overflow-hidden bg-gradient-to-br from-white to-slate-50">
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full -z-10 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-white border border-slate-200 text-slate-600 rounded-lg group-hover:border-blue-200 group-hover:text-blue-600 transition-colors shadow-sm">{item.tag}</span>
              <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-md">{item.date}</span>
            </div>
            <h3 className="text-sm font-bold text-slate-800 leading-snug group-hover:text-blue-700 transition-colors">{item.title}</h3>
            
            <div className="mt-4 flex items-center justify-between">
                <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${item.impact === 'High' ? 'text-rose-500' : 'text-amber-500'}`}>
                    <Zap className="w-3 h-3" /> {item.impact} Impact
                </div>
                <div className="flex items-center text-xs text-blue-600 font-bold opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 duration-300">
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
