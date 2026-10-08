import React, { useState, useEffect, useRef } from 'react';
import { Scale, BookOpen, Search, Brain, FileText, Shield, Gavel, CheckCircle } from 'lucide-react';

const STEPS = [
  { icon: Search,      label: "Receiving your query...",           color: "text-blue-500",    bg: "bg-blue-50",    border: "border-blue-200",    ring: "ring-blue-400/30" },
  { icon: BookOpen,    label: "Gathering relevant laws...",        color: "text-violet-500",  bg: "bg-violet-50",  border: "border-violet-200",  ring: "ring-violet-400/30" },
  { icon: Brain,       label: "Understanding the context...",      color: "text-amber-500",   bg: "bg-amber-50",   border: "border-amber-200",   ring: "ring-amber-400/30" },
  { icon: Scale,       label: "Analyzing legal provisions...",     color: "text-indigo-500",  bg: "bg-indigo-50",  border: "border-indigo-200",  ring: "ring-indigo-400/30" },
  { icon: Shield,      label: "Checking applicable sections...",   color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-200", ring: "ring-emerald-400/30" },
  { icon: Gavel,       label: "Cross-referencing case law...",     color: "text-rose-500",    bg: "bg-rose-50",    border: "border-rose-200",    ring: "ring-rose-400/30" },
  { icon: FileText,    label: "Preparing your advice...",          color: "text-teal-500",    bg: "bg-teal-50",    border: "border-teal-200",    ring: "ring-teal-400/30" },
  { icon: CheckCircle, label: "Finalizing response...",            color: "text-green-500",   bg: "bg-green-50",   border: "border-green-200",   ring: "ring-green-400/30" },
];

const LoadingStatus = ({ className = "", compact = false }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    // If we've reached the final step, stop scheduling new steps
    if (activeStep >= STEPS.length - 1) return;

    // Use original slower timing (around 2800ms) with a tiny bit of random jitter
    // If it's the 7th step (index 6, "Preparing your advice..."), hold there longer
    const baseDelay = activeStep === 6 ? 5000 : 2800;
    const delay = baseDelay + (Math.random() * 400 - 200);

    const timer = setTimeout(() => {
      setIsTransitioning(true);
      
      setTimeout(() => {
        setActiveStep((prev) => prev + 1);
        setIsTransitioning(false);
      }, 300); // 300ms transition duration
      
    }, delay);

    return () => clearTimeout(timer);
  }, [activeStep]);

  const current = STEPS[activeStep];
  const Icon = current.icon;

  // Compact mode for inline use (AIChat.jsx)
  if (compact) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className={`relative w-7 h-7 rounded-lg ${current.bg} flex items-center justify-center transition-all duration-500`}>
          <Icon className={`w-4 h-4 ${current.color} transition-all duration-300 ${isTransitioning ? 'scale-75 opacity-0' : 'scale-100 opacity-100'}`} />
          {/* Spinning ring */}
          <div className={`absolute inset-[-3px] rounded-lg border-2 border-transparent ${current.border} border-t-transparent animate-spin`}
               style={{ animationDuration: '1.5s' }} />
        </div>
        <span className={`text-sm font-medium transition-all duration-300 ${current.color} ${isTransitioning ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'}`}>
          {current.label}
        </span>
      </div>
    );
  }

  // Full mode for TypingIndicator in HomePage
  return (
    <div className={`${className}`}>
      <div className="flex flex-col gap-3">
        {/* Current Step with animated icon */}
        <div className="flex items-center gap-3">
          <div className={`relative w-9 h-9 rounded-xl ${current.bg} flex items-center justify-center transition-all duration-500 ring-2 ${current.ring}`}>
            <Icon className={`w-5 h-5 ${current.color} transition-all duration-300 ${isTransitioning ? 'scale-50 opacity-0 rotate-90' : 'scale-100 opacity-100 rotate-0'}`} />
            {/* Spinning border */}
            <svg className="absolute inset-[-4px] w-[calc(100%+8px)] h-[calc(100%+8px)] animate-spin" style={{ animationDuration: '3s' }}>
              <rect x="1" y="1" width="calc(100% - 2px)" height="calc(100% - 2px)" rx="12" ry="12"
                    fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="20 80"
                    className={`${current.color} opacity-40`} />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className={`text-sm font-semibold transition-all duration-300 ${isTransitioning ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0'} text-slate-800`}>
              {current.label}
            </span>
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">
              Step {activeStep + 1} of {STEPS.length}
            </span>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex gap-1.5 ml-1">
          {STEPS.map((step, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-500 ${
                i < activeStep
                  ? 'w-3 bg-indigo-500'
                  : i === activeStep
                    ? 'w-6 bg-indigo-600 animate-pulse'
                    : 'w-2 bg-slate-200'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoadingStatus;
