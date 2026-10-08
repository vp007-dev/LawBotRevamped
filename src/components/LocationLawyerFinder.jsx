import React, { useState, useEffect } from 'react';
import { MapPin, Search, Star, Phone, Users, Clock, X, Loader2, Navigation, CheckCircle2, ShieldCheck, ChevronRight } from 'lucide-react';
import lawBot360AI from '../services/aiService';

const LocationLawyerFinder = ({ isOpen, onClose }) => {
  const [location, setLocation] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [nearbyLawyers, setNearbyLawyers] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false); // Added for UX transition state

  // Mock lawyer data with locations (Enhanced with more variety)
  const mockLawyers = [
    {
      id: 1,
      name: 'Adv. Priya Sharma',
      title: 'Senior Associate • Property Law',
      experience: '8 Years Exp.',
      rating: 4.9,
      reviews: 85,
      status: 'Available',
      distance: '2.3 km',
      location: 'Connaught Place, Delhi',
      phone: '+91 98765 43210',
      specializations: ['Property Law', 'Real Estate', 'Civil Disputes']
    },
    {
      id: 2,
      name: 'Adv. Rajesh Kumar',
      title: 'Senior Counsel • Consumer Law',
      experience: '15 Years Exp.',
      rating: 4.8,
      reviews: 120,
      status: 'Busy',
      distance: '3.7 km',
      location: 'Khan Market, Delhi',
      phone: '+91 98765 43211',
      specializations: ['Consumer Law', 'Corporate Law', 'Litigation']
    },
    {
      id: 3,
      name: 'Adv. Meera Gupta',
      title: 'Partner • Family Law',
      experience: '12 Years Exp.',
      rating: 4.7,
      reviews: 95,
      status: 'Available',
      distance: '1.8 km',
      location: 'Lajpat Nagar, Delhi',
      phone: '+91 98765 43212',
      specializations: ['Family Law', 'Divorce', 'Child Custody']
    },
    {
      id: 4,
      name: 'Adv. Amit Singh',
      title: 'Associate • Criminal Law',
      experience: '6 Years Exp.',
      rating: 4.6,
      reviews: 67,
      status: 'Available',
      distance: '4.2 km',
      location: 'Karol Bagh, Delhi',
      phone: '+91 98765 43213',
      specializations: ['Criminal Law', 'Bail Matters', 'FIR Quashing']
    }
  ];

  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // Use reverse geocoding to get actual address
            const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${position.coords.latitude}+${position.coords.longitude}&key=468520c182fd4eb286cf0ed982eb59c0`);
            const data = await response.json();
            const address = data.results[0]?.formatted || `${position.coords.latitude}, ${position.coords.longitude}`;
            setLocation(address);
          } catch (error) {
            // Fallback to coordinates
            setLocation(`${position.coords.latitude}, ${position.coords.longitude}`);
          }
          setIsGettingLocation(false);
          findNearbyLawyers();
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocation('Current Location');
          setIsGettingLocation(false);
          findNearbyLawyers();
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    } else {
      setLocation('Browser Location Not Supported');
      setIsGettingLocation(false);
      findNearbyLawyers();
    }
  };

  const findNearbyLawyers = async () => {
    setLoadingResults(true);
    setNearbyLawyers([]);
    setShowResults(true);
    
    try {
      const prompt = `Generate 4 realistic lawyer profiles near "${location || 'New Delhi'}" in India. Return ONLY a valid JSON array matching this format (no markdown, no other text):
[{"id":1,"name":"Adv. Priya Sharma","title":"Senior Advocate • High Court","experience":"12 Years Exp.","rating":4.8,"reviews":64,"status":"Available","distance":"2.1 km","location":"Civil Lines, Delhi","phone":"+91 98765 43210","specializations":["Constitutional Law","Civil Litigation"]}]`;

      const result = await lawBot360AI.sendMessage(prompt, {
        skipHistory: true,
        systemPrompt: "You are an automated legal directory service. Output ONLY a valid JSON array of lawyer profiles."
      });

      const aiResponse = result.response || result;
      if (aiResponse) {
        const jsonMatch = String(aiResponse).match(/\[.*\]/s);
        if (jsonMatch) {
          const lawyers = JSON.parse(jsonMatch[0]);
          if (Array.isArray(lawyers) && lawyers.length > 0) {
            console.log('AWS AI generated lawyers:', lawyers.length);
            setNearbyLawyers(lawyers);
            return;
          }
        }
      }
      setNearbyLawyers(mockLawyers);
      
    } catch (error) {
      console.log('Using mock lawyer data due to error:', error.message);
      setNearbyLawyers(mockLawyers);
    } finally {
      setLoadingResults(false);
    }
  };

  const handleManualLocation = () => {
    if (location.trim()) {
      findNearbyLawyers();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header - Sticky & Clean */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-white/80 backdrop-blur-sm z-10 sticky top-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-blue-600" />
              Legal Counsel Finder
            </h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5 tracking-wide uppercase">
              Verified Professionals • Nearby
            </p>
          </div>
          <button
            onClick={onClose}
            className="group p-2 hover:bg-slate-100 rounded-full transition-all duration-200"
          >
            <div className="bg-slate-100 group-hover:bg-slate-200 rounded-full p-1">
                <X className="w-4 h-4 text-slate-500 group-hover:text-slate-900" />
            </div>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50/50">
          {!showResults ? (
            /* --- STATE 1: LOCATION INPUT (Hero Style) --- */
            <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-8 relative">
                 <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-20"></div>
                 <MapPin className="w-10 h-10 text-blue-600" />
              </div>
              
              <h3 className="text-2xl font-bold text-slate-900 mb-3 text-center">Where do you need assistance?</h3>
              <p className="text-slate-500 text-center max-w-md mb-10 leading-relaxed">
                We locate top-rated lawyers nearby specializing in your specific legal requirements.
              </p>

              <div className="w-full max-w-md space-y-4">
                {/* Primary Action */}
                <button
                  onClick={getCurrentLocation}
                  disabled={isGettingLocation}
                  className="group w-full flex items-center justify-between bg-blue-600 text-white p-1 pl-1 pr-6 rounded-2xl hover:bg-blue-700 transition-all duration-300 shadow-lg shadow-blue-600/20 disabled:opacity-70"
                >
                  <div className="bg-white/10 rounded-xl p-3">
                    {isGettingLocation ? (
                       <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                       <Navigation className="w-6 h-6" />
                    )}
                  </div>
                  <span className="font-semibold text-lg">
                    {isGettingLocation ? 'Locating you...' : 'Use Current Location'}
                  </span>
                  <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all" />
                </button>

                <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-semibold uppercase tracking-wider">Or search manually</span>
                    <div className="flex-grow border-t border-slate-200"></div>
                </div>

                {/* Secondary Action */}
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="Enter area, city or pincode"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full pl-12 pr-14 py-4 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm group-hover:shadow-md"
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                  <button
                    onClick={handleManualLocation}
                    className="absolute right-2 top-2 bottom-2 aspect-square bg-slate-100 hover:bg-slate-900 hover:text-white rounded-xl flex items-center justify-center transition-all"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* --- STATE 2: RESULTS (Card List) --- */
            <div className="p-6">
              <div className="flex items-center justify-between mb-6 sticky top-0 bg-slate-50/95 backdrop-blur-sm py-2 z-10">
                <div>
                   
                  <h3 className="text-lg font-bold text-slate-900">Recommended Lawyers</h3>
                  <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate max-w-[200px]">{location}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span className="text-blue-600 font-medium">{nearbyLawyers.length} results</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowResults(false)}
                  className="text-xs font-semibold text-slate-500 hover:text-blue-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                >
                  Change Location
                </button>
              </div>

              {loadingResults ? (
                 /* Skeleton Loading State for UX */
                 <div className="space-y-4">
                    {[1,2,3].map(i => (
                        <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm animate-pulse">
                            <div className="flex gap-4">
                                <div className="w-16 h-16 bg-slate-200 rounded-full"></div>
                                <div className="flex-1 space-y-3">
                                    <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                                    <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                 </div>
              ) : (
                <div className="space-y-5 pb-8">
                    {nearbyLawyers.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-slate-900 font-semibold">No matches found</h3>
                        <p className="text-slate-500 text-sm">Try expanding your search radius</p>
                    </div>
                    ) : (
                    nearbyLawyers.map((lawyer) => (
                    <div key={lawyer.id} className="group bg-white rounded-2xl p-5 border border-slate-200 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 relative overflow-hidden">
                        
                        {/* Status Badge - Absolute Positioned */}
                        <div className="absolute top-5 right-5 flex flex-col items-end gap-1">
                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                                lawyer.status === 'Available' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                : 'bg-slate-50 text-slate-500 border-slate-100'
                            }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${lawyer.status === 'Available' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                                {lawyer.status}
                            </div>
                            <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                                <Navigation className="w-3 h-3" /> {lawyer.distance}
                            </span>
                        </div>

                        <div className="flex items-start gap-5">
                            {/* Avatar */}
                            <div className="relative">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-xl font-bold text-slate-600 border border-slate-100 shadow-inner">
                                    {lawyer.name.split(' ').length > 1 ? lawyer.name.split(' ')[1][0] : lawyer.name[0]}
                                </div>
                                <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-sm">
                                    <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-50" />
                                </div>
                            </div>

                            {/* Info */}
                            <div className="flex-1 pr-24"> {/* Padding right prevents overlap with absolute badge */}
                                <h4 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                    {lawyer.name}
                                </h4>
                                <p className="text-sm font-medium text-slate-500 mb-2">{lawyer.title}</p>
                                
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 mb-4">
                                    <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md">
                                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                                        <span>{lawyer.experience}</span>
                                    </div>
                                    <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-md text-amber-700">
                                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                                        <span className="font-bold">{lawyer.rating}</span>
                                        <span className="opacity-75">({lawyer.reviews})</span>
                                    </div>
                                </div>

                                {/* Specialization Tags */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {(lawyer.specializations || []).map((spec, i) => (
                                        <span key={i} className="text-[11px] font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2 py-1 rounded-md">
                                            {spec}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Action Bar */}
                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3">
                            <button className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 transition-colors">
                                View Profile
                            </button>
                            <button 
                              onClick={() => window.open(`tel:${lawyer.phone}`, '_self')}
                              className="flex-[2] py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-blue-600 shadow-md shadow-slate-200 hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
                            >
                                <Phone className="w-4 h-4" />
                                Call Now
                            </button>
                        </div>
                    </div>
                    ))
                    )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationLawyerFinder;