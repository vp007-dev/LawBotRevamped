import React, { useState } from 'react';
import { Building2, CheckCircle2, ChevronRight, Sparkles, Shield, FileCheck, ArrowRight, UserCheck } from 'lucide-react';

const BUSINESS_TYPES = [
  { id: 'proprietorship', title: 'Sole Proprietorship', desc: 'Single owner business without separate entity registration' },
  { id: 'pvt_ltd', title: 'Private Limited (Pvt Ltd)', desc: 'Registered company with shareholders & board of directors' },
  { id: 'llp', title: 'Limited Liability Partnership (LLP)', desc: 'Partnership with limited liability protection under MCA' },
  { id: 'opc', title: 'One Person Company (OPC)', desc: 'Corporate entity managed by a single founder' },
  { id: 'partnership', title: 'Partnership Firm', desc: 'Business owned by two or more partners with a partnership deed' },
  { id: 'individual', title: 'Individual / Freelancer', desc: 'General legal protection, tax, and personal legal queries' }
];

const INDUSTRIES = [
  'Information Technology & Software',
  'E-commerce & Retail',
  'Food & Beverages / Restaurant (FSSAI)',
  'Healthcare & Pharma',
  'Manufacturing & Industrial',
  'Real Estate & Construction',
  'Professional Services & Consulting',
  'Financial Services & Fintech'
];

const STATES = [
  'Maharashtra', 'Delhi NCR', 'Karnataka', 'Tamil Nadu', 'Gujarat', 
  'Telangana', 'Uttar Pradesh', 'West Bengal', 'Haryana', 'Other State'
];

const OnboardingWizard = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    businessType: 'pvt_ltd',
    entityName: '',
    industry: 'Information Technology & Software',
    state: 'Maharashtra',
    turnover: '50L - 2Cr',
    employeeCount: 5,
    registrations: {
      gst: true,
      pan: true,
      msme: false,
      fssai: false,
      shopAct: true,
      pfEsi: false
    }
  });

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Save profile locally
      localStorage.setItem('lawbot-user-profile', JSON.stringify(formData));
      if (onComplete) onComplete(formData);
    }
  };

  const toggleReg = (key) => {
    setFormData(prev => ({
      ...prev,
      registrations: { ...prev.registrations, [key]: !prev.registrations[key] }
    }));
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 p-6 text-white relative">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl">
            <Building2 className="w-6 h-6 text-indigo-200" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Smart Legal & Business Onboarding</h2>
            <p className="text-xs text-indigo-100 mt-1">
              LawAgent360 uses your business profile to auto-generate statutory compliance rules, vault tags, & scheme eligibility.
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mt-6">
          {[1, 2, 3].map((s) => (
            <div 
              key={s} 
              className={`flex-1 h-1.5 rounded-full transition-all ${
                s <= step ? 'bg-indigo-300' : 'bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="p-6 md:p-8">
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Select Business Entity Structure</h3>
              <p className="text-xs text-slate-500 mt-1">This determines your applicable statutes (Companies Act, GST Act, Partnership Act, etc.)</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {BUSINESS_TYPES.map((item) => {
                const selected = formData.businessType === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setFormData({ ...formData, businessType: item.id })}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selected 
                        ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/20' 
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-slate-900">{item.title}</h4>
                      {selected && <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0" />}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Entity Details & Operational Scale</h3>
              <p className="text-xs text-slate-500 mt-1">Helps us pinpoint regional laws, tax slabs, & compliance deadlines</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Business / Company Name</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Legal Solutions Pvt Ltd"
                  value={formData.entityName}
                  onChange={(e) => setFormData({ ...formData, entityName: e.target.value })}
                  className="w-full h-11 px-4 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Industry Sector</label>
                  <select
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full h-11 px-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-white"
                  >
                    {INDUSTRIES.map((ind, i) => <option key={i} value={ind}>{ind}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Primary Operating State</label>
                  <select
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full h-11 px-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-white"
                  >
                    {STATES.map((st, i) => <option key={i} value={st}>{st}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Annual Turnover Bracket</label>
                  <select
                    value={formData.turnover}
                    onChange={(e) => setFormData({ ...formData, turnover: e.target.value })}
                    className="w-full h-11 px-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-white"
                  >
                    <option value="Under 20L">Under ₹20 Lakhs (GST Exempted)</option>
                    <option value="20L - 40L">₹20L - ₹40L (GST Threshold)</option>
                    <option value="40L - 1.5Cr">₹40L - ₹1.5 Cr (Composition Slabs)</option>
                    <option value="50L - 2Cr">₹50L - ₹2 Cr (Regular GST)</option>
                    <option value="2Cr - 5Cr">₹2 Cr - ₹5 Cr (Audit Slabs)</option>
                    <option value="Above 5Cr">Above ₹5 Cr (E-Invoicing Mandatory)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Employee Count</label>
                  <input
                    type="number"
                    value={formData.employeeCount}
                    onChange={(e) => setFormData({ ...formData, employeeCount: parseInt(e.target.value) || 0 })}
                    className="w-full h-11 px-4 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Existing Registrations & Licenses</h3>
              <p className="text-xs text-slate-500 mt-1">Select licenses you already hold to auto-configure your User Knowledge Vault</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { key: 'gst', label: 'GST Registration (GSTIN)', desc: 'Monthly/Quarterly GSTR-1 & 3B compliance' },
                { key: 'pan', label: 'Company / Business PAN', desc: 'Income tax returns & TDS compliance' },
                { key: 'msme', label: 'Udyam MSME Registration', desc: 'Qualifies for 45-day MSME payment protection & subsidies' },
                { key: 'fssai', label: 'FSSAI License / Registration', desc: 'Food safety audit & renewal tracking' },
                { key: 'shopAct', label: 'Shop & Establishment License', desc: 'State labour law & local authority registration' },
                { key: 'pfEsi', label: 'EPFO / ESIC Registration', desc: 'Statutory employee benefits (15+ employees)' },
              ].map((reg) => (
                <div
                  key={reg.key}
                  onClick={() => toggleReg(reg.key)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                    formData.registrations[reg.key]
                      ? 'border-indigo-600 bg-indigo-50/50'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.registrations[reg.key]}
                    onChange={() => {}}
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">{reg.label}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{reg.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-amber-800 text-xs">
              <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
              <span>
                Based on your selections, LawAgent360 will initialize your <strong>Compliance Calendar</strong> with 14 statutory filing dates & unlock matching government schemes!
              </span>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-5 h-11 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
            >
              Back
            </button>
          ) : <div />}

          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 h-11 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-200 transition-all ml-auto"
          >
            <span>{step === 3 ? 'Save Profile & Launch Agent' : 'Continue'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
