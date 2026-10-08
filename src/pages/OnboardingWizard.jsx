import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import OnboardingWizardComponent from '../components/OnboardingWizard';
import { UserCheck } from 'lucide-react';

const OnboardingWizard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleComplete = (profile) => {
    // Optionally redirect to dashboard or vault
    window.location.href = '/dashboard/vault';
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-center text-indigo-700">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">Onboarding Wizard</h1>
              <p className="text-xs text-slate-500">Configure your business profile & legal entity details</p>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 flex items-center justify-center">
          <OnboardingWizardComponent onComplete={handleComplete} />
        </main>
      </div>
    </div>
  );
};

export default OnboardingWizard;
