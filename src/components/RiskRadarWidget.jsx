import React from 'react';
import { ShieldAlert, AlertTriangle, Clock, Info, ShieldCheck } from 'lucide-react';

const RISK_EVENTS = [
  {
    id: 1,
    title: 'TDS Return Filing (Form 26Q) Overdue',
    severity: 'urgent',
    date: '31 Jul 2026',
    description: 'Overdue by 7 days. Penalty accruing at ₹200/day (Sec 234E).',
    actionNeeded: 'File return immediately'
  },
  {
    id: 2,
    title: 'Tenant Rights - Eviction Response Due',
    severity: 'high',
    date: '02 Aug 2026',
    description: 'Eviction notice legal consultation pending action.',
    actionNeeded: 'Approve drafted reply'
  },
  {
    id: 3,
    title: 'EPFO & ESIC Contribution Deposit',
    severity: 'low',
    date: '15 Aug 2026',
    description: 'Filing window open. Avoid 12% p.a. statutory interest penalty.',
    actionNeeded: 'Upload payroll sheet'
  }
];

const RiskRadarWidget = () => {
  const getBadgeClass = (severity) => {
    switch (severity) {
      case 'urgent':
        return 'badge-urgent';
      case 'high':
        return 'badge-high';
      case 'medium':
        return 'badge-medium';
      default:
        return 'badge-low';
    }
  };

  return (
    <div className="bg-[#161922] border border-white/[0.08] rounded-3xl p-6 text-zinc-300">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="relative">
            <span className="absolute inline-flex h-2 w-2 rounded-full bg-rose-500 opacity-75 animate-ping"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          </div>
          <h3 className="font-bold text-xs uppercase tracking-wider text-white">Statutory Risk Radar</h3>
        </div>
        <span className="badge-urgent">
          1 Action Required
        </span>
      </div>

      <div className="space-y-3">
        {RISK_EVENTS.map((event) => {
          return (
            <div 
              key={event.id}
              className="p-3.5 bg-[#11131a] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold text-xs text-white leading-tight">{event.title}</h4>
                <span className={getBadgeClass(event.severity)}>
                  {event.severity.charAt(0).toUpperCase() + event.severity.slice(1)}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">{event.description}</p>
              
              <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-white/[0.05] text-[10px]">
                <span className="text-zinc-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{event.date}</span>
                </span>
                <button className="text-violet-400 hover:text-violet-300 font-medium transition-colors flex items-center gap-1">
                  <span>{event.actionNeeded}</span>
                  <span>&rarr;</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 p-3 bg-[#11131a] rounded-xl border border-white/[0.05] flex items-center gap-2.5 text-[11px] text-zinc-400">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>GSTR-1 and MCA annual return status compliant with 0 statutory flags.</span>
      </div>
    </div>
  );
};

export default RiskRadarWidget;
