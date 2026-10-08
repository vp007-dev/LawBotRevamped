import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';

const ComplianceScoreWidget = () => {
  const [score, setScore] = useState(0);

  useEffect(() => {
    // Fake logic for compliance score
    // In a real app this would use profile, vault documents, etc.
    const savedDocuments = JSON.parse(localStorage.getItem('lawbot-documents') || '[]');
    let baseScore = 50;
    if (savedDocuments.length > 0) baseScore += 20;
    if (savedDocuments.length > 3) baseScore += 15;
    
    // Simulate some deadline checks
    const deadlinesMet = true;
    if (deadlinesMet) baseScore += 10;
    
    setScore(Math.min(baseScore, 100));
  }, []);

  const getScoreColor = (s) => {
    if (s >= 80) return 'text-emerald-500';
    if (s >= 50) return 'text-amber-500';
    return 'text-red-500';
  };
  
  const getScoreBg = (s) => {
    if (s >= 80) return 'bg-emerald-50';
    if (s >= 50) return 'bg-amber-50';
    return 'bg-red-50';
  };

  const circumference = 2 * Math.PI * 45; // r=45
  const strokeDashoffset = circumference - (circumference * score) / 100;

  return (
    <div className={`rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 bg-white`}>
      <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <Shield className="w-6 h-6 text-indigo-500" />
        Compliance Health
      </h2>
      <div className="flex flex-col items-center">
        <div className={`w-32 h-32 rounded-full ${getScoreBg(score)} flex items-center justify-center border-4 border-white shadow-inner relative`}>
          <svg className="absolute w-full h-full transform -rotate-90">
            <circle cx="64" cy="64" r="45" fill="none" stroke="#e2e8f0" strokeWidth="8" />
            <circle cx="64" cy="64" r="45" fill="none" className={`stroke-current ${getScoreColor(score)}`} strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} style={{ transition: 'stroke-dashoffset 1s ease-in-out' }} />
          </svg>
          <div className="text-center z-10 relative mt-2">
            <span className={`text-3xl font-extrabold ${getScoreColor(score)}`}>{score}</span>
            <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Score</span>
          </div>
        </div>
        <div className="mt-8 w-full space-y-4">
            <div className="flex justify-between text-sm items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="flex items-center gap-2 text-slate-700 font-medium"><CheckCircle className="w-4 h-4 text-emerald-500" /> Documents Completeness</span>
                <span className="font-bold text-emerald-600">85%</span>
            </div>
            <div className="flex justify-between text-sm items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="flex items-center gap-2 text-slate-700 font-medium"><AlertTriangle className="w-4 h-4 text-amber-500" /> Risk Indicators</span>
                <span className="font-bold text-amber-600">2 Medium</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceScoreWidget;
