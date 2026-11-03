import React from 'react';
import { Briefcase, CheckCircle2, Circle, Play, ArrowRight, Activity, Calendar } from 'lucide-react';

const WORKFLOWS = [
  {
    id: 1,
    title: 'Consumer Complaint - Defective Mobile',
    category: 'Consumer Court',
    progress: 60,
    currentStep: 'Consumer Court Filing',
    steps: [
      { name: 'Grievance Registered', status: 'completed' },
      { name: 'Company Response Review', status: 'completed' },
      { name: 'Court Filing Draft', status: 'completed' },
      { name: 'Formal Forum Filing', status: 'active' },
      { name: 'Hearing Representation', status: 'pending' }
    ],
    dueDate: '2026-08-11'
  },
  {
    id: 2,
    title: 'RTI Application - Municipal Property Records',
    category: 'RTI Request',
    progress: 30,
    currentStep: 'Wait for PIO Reply',
    steps: [
      { name: 'RTI Draft Generated', status: 'completed' },
      { name: 'Fees Paid & Submitted', status: 'completed' },
      { name: 'PIO Review Phase', status: 'active' },
      { name: 'First Appeal Option', status: 'pending' }
    ],
    dueDate: '2026-08-20'
  }
];

const ActiveWorkflowsWidget = () => {
  return (
    <div className="bg-[#161922] border border-white/[0.08] rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center text-purple-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-white uppercase tracking-wider">Active Legal Workflows</h3>
            <p className="text-[10px] text-slate-400">Milestones and statutory stage validation</p>
          </div>
        </div>
        <span className="text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2.5 py-0.5 rounded-full">
          {WORKFLOWS.length} Active
        </span>
      </div>

      <div className="space-y-4">
        {WORKFLOWS.map((flow) => (
          <div key={flow.id} className="bg-[#141721] border border-white/[0.06] rounded-xl p-4 hover:border-purple-500/30 transition-all">
            <div className="flex items-start justify-between gap-3 mb-2.5">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-white/[0.04] text-slate-400 rounded-md border border-white/[0.06]">
                  {flow.category}
                </span>
                <h4 className="font-semibold text-xs text-white mt-1.5">{flow.title}</h4>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Progress</span>
                <span className="text-xs font-bold text-purple-400">{flow.progress}%</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-[#0c0e14] rounded-full h-1.5 mb-3.5 border border-white/[0.04]">
              <div 
                className="bg-purple-500 h-1.5 rounded-full transition-all duration-500 shadow-sm shadow-purple-500/50"
                style={{ width: `${flow.progress}%` }}
              />
            </div>

            {/* Steps Timeline horizontal grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2.5 border-t border-white/[0.04]">
              {flow.steps.map((step, idx) => {
                const isCompleted = step.status === 'completed';
                const isActive = step.status === 'active';

                return (
                  <div key={idx} className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      {isCompleted ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : isActive ? (
                        <span className="w-3.5 h-3.5 rounded-full border border-purple-400 flex items-center justify-center shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                        </span>
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      )}
                      <span className="text-[8px] font-bold uppercase tracking-wider text-slate-500">Step {idx + 1}</span>
                    </div>
                    <span className={`text-[10px] truncate leading-tight font-medium ${
                      isCompleted ? 'text-slate-400 font-normal' : isActive ? 'text-purple-300 font-bold' : 'text-slate-500'
                    }`}>
                      {step.name}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Bottom Meta */}
            <div className="flex items-center justify-between mt-3.5 pt-3 border-t border-white/[0.04] text-[10px]">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-slate-500" />
                <span>Next Milestone Due: <strong className="text-slate-300 font-semibold">{flow.dueDate}</strong></span>
              </span>
              <button 
                onClick={() => window.location.href = `/dashboard/cases`}
                className="text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 transition-colors"
              >
                <span>Launch Workspace</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActiveWorkflowsWidget;
