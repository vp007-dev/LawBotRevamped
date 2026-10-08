import React from 'react';
import { ShieldAlert, AlertTriangle, AlertCircle, Clock, Info, ShieldCheck } from 'lucide-react';

const RISK_EVENTS = [
  {
    id: 1,
    title: 'TDS Return Filing (Form 26Q) Overdue',
    severity: 'high',
    date: '2026-07-31',
    description: 'Overdue by 7 days. Penalty accruing at ₹200/day (Sec 234E).',
    actionNeeded: 'File return immediately'
  },
  {
    id: 2,
    title: 'Tenant Rights - Eviction Response Due',
    severity: 'medium',
    date: '2026-08-02',
    description: 'Eviction notice legal consultation pending action.',
    actionNeeded: 'Approve drafted reply notice'
  },
  {
    id: 3,
    title: 'EPFO & ESIC Contribution Deposit',
    severity: 'low',
    date: '2026-08-15',
    description: 'Filing window open. Avoid 12% p.a. statutory interest penalty.',
    actionNeeded: 'Upload payroll sheet'
  }
];

const RiskRadarWidget = () => {
  const getSeverityStyles = (severity) => {
    switch (severity) {
      case 'high':
        return {
          bg: 'bg-red-500/10 border-red-500/30',
          text: 'text-red-400',
          icon: ShieldAlert,
          dotColor: 'bg-red-500'
        };
      case 'medium':
        return {
          bg: 'bg-amber-500/10 border-amber-500/30',
          text: 'text-amber-400',
          icon: AlertTriangle,
          dotColor: 'bg-amber-500'
        };
      default:
        return {
          bg: 'bg-blue-500/10 border-blue-500/30',
          text: 'text-blue-400',
          icon: Clock,
          dotColor: 'bg-blue-500'
        };
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-slate-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="relative">
            <span className="absolute inline-flex h-2.5 w-2.5 rounded-full bg-red-500 opacity-75 animate-ping"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
          </div>
          <h3 className="font-bold text-sm uppercase tracking-wider text-slate-200">Statutory Risk Radar</h3>
        </div>
        <span className="text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full">
          1 High Risk
        </span>
      </div>

      <div className="space-y-4">
        {RISK_EVENTS.map((event) => {
          const style = getSeverityStyles(event.severity);
          const Icon = style.icon;

          return (
            <div 
              key={event.id}
              className={`p-4 border rounded-2xl flex gap-4 transition-all hover:bg-slate-800/40 ${style.bg}`}
            >
              <div className="flex-shrink-0 mt-0.5">
                <div className={`w-8 h-8 rounded-xl bg-slate-950 flex items-center justify-center ${style.text}`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h4 className="font-bold text-xs text-white truncate">{event.title}</h4>
                  <span className="text-[9px] text-slate-400 font-medium">{event.date}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-normal">{event.description}</p>
                <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-800/60">
                  <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    <span>Action Required</span>
                  </span>
                  <button className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold transition-colors">
                    {event.actionNeeded} &rarr;
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 p-3 bg-slate-950 rounded-2xl border border-slate-800/80 flex items-center gap-2.5 text-[11px] text-slate-400">
        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
        <span>Your GSTR-1, Shop Act, and PF filings are compliant and clear of penal risk.</span>
      </div>
    </div>
  );
};

export default RiskRadarWidget;
