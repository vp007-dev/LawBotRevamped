import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, Sparkles } from 'lucide-react';

const ComplianceScoreWidget = () => {
  const [score, setScore] = useState(0);

  useEffect(() => {
    const savedDocuments = JSON.parse(localStorage.getItem('lawbot-documents') || '[]');
    let baseScore = 50;
    if (savedDocuments.length > 0) baseScore += 20;
    if (savedDocuments.length > 3) baseScore += 15;
    
    const deadlinesMet = true;
    if (deadlinesMet) baseScore += 10;
    
    setScore(Math.min(baseScore, 100));
  }, []);

  const getScoreColor = (s) => {
    if (s >= 80) return 'text-violet-400';
    if (s >= 50) return 'text-amber-400';
    return 'text-rose-400';
  };

  const circumference = 2 * Math.PI * 45; // r=45
  const strokeDashoffset = circumference - (circumference * score) / 100;

  return (
    <div className="bg-[#161922] border border-white/[0.08] rounded-3xl p-6 text-white transition-all">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-violet-400" />
          <span>Statutory Compliance Health</span>
        </h2>
        <span className="badge-purple">
          Real-time Audit
        </span>
      </div>

      <div className="flex flex-col items-center">
        <div className="w-32 h-32 rounded-full bg-[#11131a] border border-white/[0.08] flex items-center justify-center relative">
          <svg className="absolute w-full h-full transform -rotate-90">
            <circle cx="64" cy="64" r="45" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
            <circle 
              cx="64" 
              cy="64" 
              r="45" 
              fill="none" 
              stroke="#8b5cf6" 
              strokeWidth="8" 
              strokeDasharray={circumference} 
              strokeDashoffset={strokeDashoffset} 
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)' }} 
            />
          </svg>
          <div className="text-center z-10 relative">
            <span className={`text-3xl font-extrabold ${getScoreColor(score)}`}>{score}</span>
            <span className="text-[9px] text-zinc-400 block uppercase font-bold tracking-wider">Health Index</span>
          </div>
        </div>

        <div className="mt-6 w-full space-y-2.5">
          <div className="flex justify-between text-xs items-center bg-[#11131a] p-3 rounded-xl border border-white/[0.06]">
            <span className="flex items-center gap-2 text-zinc-300 font-medium">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Documents Completeness
            </span>
            <span className="font-bold text-emerald-400">85%</span>
          </div>
          <div className="flex justify-between text-xs items-center bg-[#11131a] p-3 rounded-xl border border-white/[0.06]">
            <span className="flex items-center gap-2 text-zinc-300 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Risk Indicators
            </span>
            <span className="badge-medium">2 Under Review</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceScoreWidget;
