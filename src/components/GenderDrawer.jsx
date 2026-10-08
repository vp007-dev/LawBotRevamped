import React from 'react';
import { X, User, UserCheck } from 'lucide-react';

const GenderDrawer = ({ isOpen, onClose, selectedGender, onGenderChange }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Choose AI Assistant</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div 
            onClick={() => onGenderChange('male')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
              selectedGender === 'male' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Male Assistant</h3>
                <p className="text-sm text-gray-600">Professional legal guidance</p>
              </div>
              {selectedGender === 'male' && (
                <UserCheck className="w-5 h-5 text-blue-600" />
              )}
            </div>
          </div>

          <div 
            onClick={() => onGenderChange('female')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
              selectedGender === 'female' 
                ? 'border-purple-500 bg-purple-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <User className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Female Assistant</h3>
                <p className="text-sm text-gray-600">Specialized legal consultation</p>
              </div>
              {selectedGender === 'female' && (
                <UserCheck className="w-5 h-5 text-purple-600" />
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
          >
            Continue with {selectedGender === 'male' ? 'Male' : 'Female'} Assistant
          </button>
        </div>
      </div>
    </div>
  );
};

export default GenderDrawer;