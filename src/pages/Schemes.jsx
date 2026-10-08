import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { Sparkles, CheckCircle, ArrowRight } from 'lucide-react';

const SCHEMES = [
  {
    id: 'scheme-1',
    title: 'Mudra Yojana – Credit for Micro‑Enterprises',
    description: 'Up to ₹10 Lakh low‑interest loans for eligible micro‑businesses.',
    eligibility: ['Annual turnover < ₹2 Cr', 'Micro‑enterprise (≤ 10 employees)'],
    benefits: ['Interest rate as low as 7.5 % per annum', 'No collateral required'],
    docsNeeded: ['PAN', 'GST Registration', 'Bank Statement'],
    link: 'https://pmumudra.org.in/'
  },
  {
    id: 'scheme-2',
    title: 'Startup India – Innovation & Scaling Support',
    description: 'Incubation, tax benefits, and fund of funds for tech‑driven startups.',
    eligibility: ['Recognised startup under DIPP', 'Minimum 2 years of operation'],
    benefits: ['80 % income‑tax exemption for 3 years', 'Access to INR 10 Cr fund'],
    docsNeeded: ['Certificate of Incorporation', 'Startup India registration', 'Pitch deck'],
    link: 'https://startupindia.gov.in/'
  },
  {
    id: 'scheme-3',
    title: 'PMEGP – Credit for New Ventures',
    description: 'Margin capital for setting up new manufacturing / service units.',
    eligibility: ['First‑time entrepreneur', 'Project cost up to ₹1 Cr'],
    benefits: ['30 % subsidy on interest for 5 years', 'Long repayment tenure'],
    docsNeeded: ['Project report', 'Land lease', 'GST & PAN'],
    link: 'https://pgpbvin.com/'
  }
];

const Schemes = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profile, setProfile] = useState(() => {
    // Load saved onboarding profile from localStorage if present
    const saved = localStorage.getItem('lawbot-profile');
    return saved ? JSON.parse(saved) : null;
  });

  const matchesEligibility = (scheme) => {
    if (!profile) return false;
    // Very lightweight matching – demo purpose only
    const isMicro = profile.businessType === 'proprietorship' || profile.businessType === 'individual';
    if (scheme.id === 'scheme-1' && isMicro) return true;
    if (scheme.id === 'scheme-2' && profile.businessType === 'pvt ltd') return true;
    if (scheme.id === 'scheme-3' && profile.businessType === 'startup') return true;
    return false;
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-center text-indigo-700">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">Government Schemes Discovery</h1>
              <p className="text-xs text-slate-500">Personalised scheme suggestions based on your onboarding profile</p>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
          {!profile && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-center">
              <p className="text-sm font-medium text-amber-800">Complete the onboarding wizard first to receive personalised scheme recommendations.</p>
            </div>
          )}

          {profile && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {SCHEMES.filter(matchesEligibility).map((scheme) => (
                <div key={scheme.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-indigo-600" />
                    <h2 className="text-lg font-semibold text-slate-900">{scheme.title}</h2>
                  </div>
                  <p className="text-sm text-slate-600 mb-3">{scheme.description}</p>
                  <ul className="text-xs text-slate-500 list-disc list-inside mb-3">
                    <li><strong>Eligibility:</strong> {scheme.eligibility.join(', ')}</li>
                    <li><strong>Benefits:</strong> {scheme.benefits.join(', ')}</li>
                    <li><strong>Docs Needed:</strong> {scheme.docsNeeded.join(', ')}</li>
                  </ul>
                  <a href={scheme.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-indigo-600 hover:underline text-sm font-medium">
                    Apply now <ArrowRight className="w-3 h-3" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Schemes;
