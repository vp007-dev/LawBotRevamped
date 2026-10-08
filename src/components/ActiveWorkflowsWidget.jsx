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
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-blue-600">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">Active Legal Workflows</h3>
            <p className="text-[10px] text-slate-500">Milestones and stage validation</p>
          </div>
        </div>
        <span className="text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full">
          {WORKFLOWS.length} Active
        </span>
      </div>

      <div className="space-y-6">
        {WORKFLOWS.map((flow) => (
          <div key={flow.id} className="border border-slate-100 rounded-2xl p-4 hover:border-slate-300 transition-all">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                  {flow.category}
                </span>
                <h4 className="font-bold text-sm text-slate-800 mt-1.5">{flow.title}</h4>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Progress</span>
                <span className="text-xs font-black text-slate-900">{flow.progress}%</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-1.5 mb-4">
              <div 
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${flow.progress}%` }}
              />
            </div>

            {/* Steps Timeline horizontal grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-50">
              {flow.steps.map((step, idx) => {
                const isCompleted = step.status === 'completed';
                const isActive = step.status === 'active';

                return (
                  <div key={idx} className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      {isCompleted ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      ) : isActive ? (
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-blue-600 flex items-center justify-center shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                        </span>
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                      )}
                      <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Step {idx + 1}</span>
                    </div>
                    <span className={`text-[10px] truncate leading-tight font-medium ${
                      isCompleted ? 'text-slate-500 font-normal' : isActive ? 'text-blue-600 font-bold' : 'text-slate-400'
                    }`}>
                      {step.name}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Bottom Meta */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-[10px]">
              <span className="text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>Next Milestone Due: <strong className="text-slate-700">{flow.dueDate}</strong></span>
              </span>
              <button 
                onClick={() => window.location.href = `/dashboard/cases`}
                className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
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
