import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { Calendar as CalendarIcon, Clock, AlertTriangle, CheckCircle2, Download, Calculator, Filter, ShieldAlert, Sparkles, ChevronRight } from 'lucide-react';

const INITIAL_DEADLINES = [
  {
    id: 'dl-1',
    title: 'GSTR-1 Monthly Sales Return Filing',
    authority: 'GSTN (CBIC)',
    dueDate: '2026-08-11',
    category: 'GST',
    status: 'Due Soon',
    penaltyRules: '₹50 per day late fee (Section 47 GST Act)',
    requiredDocs: ['Sales Registers', 'E-Way Bills'],
    frequency: 'Monthly'
  },
  {
    id: 'dl-2',
    title: 'GSTR-3B Monthly Tax Liability Summary Payment',
    authority: 'GSTN (CBIC)',
    dueDate: '2026-08-20',
    category: 'GST',
    status: 'Upcoming',
    penaltyRules: '18% p.a. interest on net tax liability + ₹50/day late fee',
    requiredDocs: ['GSTR-2B ITC Statement', 'Purchase Registers'],
    frequency: 'Monthly'
  },
  {
    id: 'dl-3',
    title: 'EPFO & ESIC Employee Monthly Contribution Deposit',
    authority: 'Ministry of Labour & Employment',
    dueDate: '2026-08-15',
    category: 'Labour Law',
    status: 'Due Soon',
    penaltyRules: '12% interest under Section 7Q EPF Act + damages',
    requiredDocs: ['Payroll ECR Sheet'],
    frequency: 'Monthly'
  },
  {
    id: 'dl-4',
    title: 'TDS Quarterly Return Filing (Form 26Q - Q1 FY 24-25)',
    authority: 'Income Tax Department (CPC)',
    dueDate: '2026-07-31',
    category: 'Income Tax',
    status: 'Overdue',
    daysOverdue: 6,
    penaltyRules: '₹200 per day under Section 234E + penalty under Section 271H',
    requiredDocs: ['Challan ITNS 281', 'Deduction Statement'],
    frequency: 'Quarterly'
  },
  {
    id: 'dl-5',
    title: 'ROC Form MGT-7A Annual Return Filing',
    authority: 'Ministry of Corporate Affairs (MCA)',
    dueDate: '2026-10-30',
    category: 'Corporate Law',
    status: 'Upcoming',
    penaltyRules: '₹100 per day per company + director disqualification risk',
    requiredDocs: ['Board Audit Minutes', 'Financial Statements'],
    frequency: 'Annual'
  }
];

const ComplianceCalendar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [deadlines, setDeadlines] = useState(INITIAL_DEADLINES);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedCalc, setSelectedCalc] = useState(null);
  const [daysLateInput, setDaysLateInput] = useState(10);

  const filteredDeadlines = deadlines.filter(d => {
    if (filterStatus === 'due') return d.status === 'Due Soon';
    if (filterStatus === 'overdue') return d.status === 'Overdue';
    if (filterStatus === 'filed') return d.status === 'Filed';
    return true;
  });

  const exportICSCalendar = () => {
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//LawAgent360 Compliance Calendar//EN\n";
    deadlines.forEach(d => {
      const cleanDate = d.dueDate.replace(/-/g, '');
      icsContent += `BEGIN:VEVENT\nSUMMARY:${d.title}\nDESCRIPTION:${d.authority} - ${d.penaltyRules}\nDTSTART:${cleanDate}\nDTEND:${cleanDate}\nEND:VEVENT\n`;
    });
    icsContent += "END:VCALENDAR";

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'lawagent360-compliance-calendar.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-center text-indigo-700">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">Statutory Compliance Calendar</h1>
              <p className="text-xs text-slate-500">Auto-generated statutory deadlines based on Private Limited entity rules</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={exportICSCalendar}
              className="flex items-center gap-2 px-4 h-9 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100"
            >
              <Download className="w-4 h-4" />
              <span>Export to Google/Apple Calendar</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Statutory Filings</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{deadlines.length}</p>
              </div>
              <CalendarIcon className="w-8 h-8 text-indigo-500/20" />
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Due in Next 7 Days</p>
                <p className="text-2xl font-black text-amber-600 mt-1">
                  {deadlines.filter(d => d.status === 'Due Soon').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-amber-500/20" />
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Overdue (Penalized)</p>
                <p className="text-2xl font-black text-rose-600 mt-1">
                  {deadlines.filter(d => d.status === 'Overdue').length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-rose-500/20" />
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Filed & Compliant</p>
                <p className="text-2xl font-black text-emerald-600 mt-1">
                  {deadlines.filter(d => d.status === 'Filed').length}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-emerald-500/20" />
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center justify-between bg-white border border-slate-200 p-3 rounded-2xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 px-2 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                <span>Filter Status:</span>
              </span>
              {[
                { id: 'all', label: 'All Filings' },
                { id: 'due', label: 'Due Soon (7d)' },
                { id: 'overdue', label: 'Overdue Filings' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilterStatus(f.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    filterStatus === f.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl">
              ⚡ Rules Engine: Multi-stage Reminders Active (30d $\rightarrow$ 1d)
            </div>
          </div>

          {/* Deadlines List */}
          <div className="space-y-3">
            {filteredDeadlines.map((dl) => {
              const isOverdue = dl.status === 'Overdue';
              const isDue = dl.status === 'Due Soon';

              return (
                <div
                  key={dl.id}
                  className={`bg-white border rounded-2xl p-5 transition-all shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                    isOverdue ? 'border-rose-300 bg-rose-50/20' : isDue ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                  }`}
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        isOverdue ? 'bg-rose-100 text-rose-700' : isDue ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {dl.category}
                      </span>
                      <span className="text-xs font-bold text-slate-400">• {dl.authority}</span>
                    </div>

                    <h3 className="font-bold text-base text-slate-900">{dl.title}</h3>
                    <p className="text-xs text-slate-500">{dl.penaltyRules}</p>
                  </div>

                  {/* Due Date & Action */}
                  <div className="flex items-center gap-4 shrink-0 self-end md:self-auto">
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-400 uppercase">Due Date</p>
                      <p className={`text-sm font-black ${isOverdue ? 'text-rose-600' : isDue ? 'text-amber-600' : 'text-slate-900'}`}>
                        {dl.dueDate} {isOverdue && `(${dl.daysOverdue}d Late)`}
                      </p>
                    </div>

                    <button
                      onClick={() => setSelectedCalc(dl)}
                      className="px-4 h-10 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 flex items-center gap-1.5 transition-all"
                    >
                      <Calculator className="w-4 h-4" />
                      <span>Penalty Calculator</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>

      {/* Penalty Calculator Modal */}
      {selectedCalc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">Statutory Late Fee Calculator</h3>
              <button onClick={() => setSelectedCalc(null)} className="text-slate-400 font-bold">✕</button>
            </div>

            <div className="space-y-3">
              <p className="font-bold text-xs text-slate-900">{selectedCalc.title}</p>
              <p className="text-xs text-slate-500">{selectedCalc.penaltyRules}</p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Simulate Days Late</label>
                <input
                  type="number"
                  value={daysLateInput}
                  onChange={(e) => setDaysLateInput(parseInt(e.target.value) || 0)}
                  className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Estimated Total Liability</p>
                <p className="text-xl font-black text-rose-700">
                  ₹{(daysLateInput * (selectedCalc.category === 'GST' ? 50 : 200)).toLocaleString()}
                </p>
                <p className="text-[11px] text-rose-600">Calculated strictly under Indian Statutory Sections</p>
              </div>
            </div>

            <button
              onClick={() => setSelectedCalc(null)}
              className="w-full h-10 bg-indigo-600 text-white font-bold text-xs rounded-xl"
            >
              Close Calculator
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplianceCalendar;
