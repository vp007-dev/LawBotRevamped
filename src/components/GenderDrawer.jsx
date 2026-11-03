import React from 'react';
import { X, User, UserCheck } from 'lucide-react';

const GenderDrawer = ({ isOpen, onClose, selectedGender, onGenderChange }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#161922] border border-white/[0.08] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#141721]">
          <h2 className="text-base font-bold text-white tracking-tight">Select Voice Counsel Persona</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-3">
          <div 
            onClick={() => onGenderChange('male')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              selectedGender === 'male' 
                ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/10' 
                : 'border-white/[0.08] bg-[#141721] hover:border-purple-500/30'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm text-white">Male Voice Persona</h3>
                <p className="text-xs text-slate-400">Authoritative Bar Council style tone</p>
              </div>
              {selectedGender === 'male' && (
                <UserCheck className="w-4 h-4 text-purple-400" />
              )}
            </div>
          </div>

          <div 
            onClick={() => onGenderChange('female')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              selectedGender === 'female' 
                ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/10' 
                : 'border-white/[0.08] bg-[#141721] hover:border-purple-500/30'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm text-white">Female Voice Persona</h3>
                <p className="text-xs text-slate-400">Specialized articulate consultation</p>
              </div>
              {selectedGender === 'female' && (
                <UserCheck className="w-4 h-4 text-purple-400" />
              )}
            </div>
          </div>
        </div>

        <div className="p-4 bg-[#141721] border-t border-white/[0.08]">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-purple-600/20 transition-all"
          >
            Continue with {selectedGender === 'male' ? 'Male' : 'Female'} Persona
          </button>
        </div>
      </div>
    </div>
  );
};

export default GenderDrawer;