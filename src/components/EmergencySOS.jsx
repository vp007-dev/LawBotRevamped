import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, UserX, AlertTriangle, AlertOctagon, Phone, Send, 
  MapPin, Shield, BookOpen, Scale, Clock, MessageSquare, CheckCircle, 
  X, Compass, BellRing, Eye, EyeOff
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SCENARIOS = [
  {
    id: 'arrest',
    title: 'Arrest & Detention',
    icon: UserX,
    color: 'from-rose-600 to-red-700',
    borderColor: 'border-red-500',
    glowColor: 'shadow-red-500/20',
    rights: [
      {
        title: 'Right to Remain Silent',
        statute: 'Constitution of India - Article 20(3)',
        description: 'You cannot be compelled to be a witness against yourself. You have the right to remain silent and refuse to answer incriminating questions during interrogation.'
      },
      {
        title: 'Right to Know Grounds of Arrest',
        statute: 'CrPC Section 50 / BNSS Section 47',
        description: 'The police officer arresting you must immediately inform you of the full particulars of the offense and the specific grounds for your arrest.'
      },
      {
        title: 'Right to Legal Counsel & Representation',
        statute: 'Constitution of India - Article 22(1)',
        description: 'You have the right to consult and be defended by a legal practitioner of your choice. You can request to meet your lawyer during interrogation (CrPC Sec 41D).'
      },
      {
        title: '24-Hour Magistrate Production',
        statute: 'CrPC Section 57 / BNSS Section 58',
        description: 'You cannot be detained in custody for more than 24 hours (excluding travel time) without being produced before a Magistrate.'
      },
      {
        title: 'Bail Regulations & Rights',
        statute: 'CrPC Section 436 / BNSS Section 478',
        description: 'If the offense is bailable, you have an absolute right to be released on bail after submitting surety. For non-bailable offenses, bail is at the discretion of the Magistrate.'
      },
      {
        title: 'Arrest Rules for Women',
        statute: 'CrPC Section 46(4)',
        description: 'Women cannot be arrested after sunset (6 PM) and before sunrise (6 AM) except in exceptional circumstances and only by a female officer with prior permission from a Magistrate.'
      }
    ],
    mockContacts: ['Primary Counsel (+91 98765 43210)', 'Business Partner (+91 99999 88888)', 'Family Contact (+91 98888 77777)'],
    defaultMessage: "EMERGENCY SOS: John Doe is facing an Arrest/Detention situation. Current GPS Lat: 19.0760, Lon: 72.8777. Dispatching LawBot360 response team."
  },
  {
    id: 'accident',
    title: 'Accident & Liability',
    icon: AlertTriangle,
    color: 'from-amber-600 to-orange-700',
    borderColor: 'border-orange-500',
    glowColor: 'shadow-orange-500/20',
    rights: [
      {
        title: 'Right to Immediate Medical Aid',
        statute: 'Supreme Court - Golden Hour Rule',
        description: 'Under the Landmark Parmanand Katara judgment, every injured citizen has a right to receive immediate medical aid from any hospital (public or private) without prior police paperwork.'
      },
      {
        title: 'Third-Party Liability Cover',
        statute: 'Motor Vehicles Act - Section 146',
        description: 'Third-party insurance is legally mandatory. If you are a victim, you have the right to claim compensation via the Motor Accident Claims Tribunal (MACT).'
      },
      {
        title: 'Right against Harassment (Good Samaritan)',
        statute: 'Good Samaritan Guidelines',
        description: 'If you assist an accident victim, you are not bound to disclose your name/identity, nor can you be forced to visit police stations or pay admission fees.'
      },
      {
        title: 'Right to File FIR/Spot Recording',
        statute: 'MV Act & Police Manuals',
        description: 'You have the right to take geo-tagged photographs of the scene and vehicles. Police must record your statement or accept a written complaint to register an FIR.'
      }
    ],
    mockContacts: ['Insurance Desk (+91 1800 200 300)', 'Fleet Manager (+91 97777 66666)', 'Emergency Contact (+91 98888 77777)'],
    defaultMessage: "EMERGENCY SOS: John Doe has been involved in a Road Accident. Current GPS Lat: 19.0820, Lon: 72.8890. Medical & Insurance desk alert triggered."
  },
  {
    id: 'harassment',
    title: 'Harassment & Threat',
    icon: ShieldAlert,
    color: 'from-rose-500 to-pink-700',
    borderColor: 'border-pink-500',
    glowColor: 'shadow-pink-500/20',
    rights: [
      {
        title: 'Zero FIR Rights',
        statute: 'Criminal Law Amendment Act 2013',
        description: 'You can register a Zero FIR at ANY police station, regardless of the jurisdiction where the offense occurred. It must later be transferred to the correct station.'
      },
      {
        title: 'Workplace Harassment Protection',
        statute: 'POSH Act 2013',
        description: 'Every employer with 10+ workers must maintain an Internal Complaints Committee (ICC). You have the right to a safe work environment and file complaints without fear of retaliation.'
      },
      {
        title: 'Cyber Bullying & Stalking',
        statute: 'IT Act Section 66E / BNS Section 78',
        description: 'Capturing, publishing, or transmitting images of a private area without consent, online stalking, or sending offensive messages is punishable by imprisonment.'
      },
      {
        title: 'Right to Female Officer Escalation',
        statute: 'CrPC Section 154 Proviso',
        description: 'Statements regarding harassment or sexual offenses must be recorded by a woman police officer at your residence or place of convenience.'
      }
    ],
    mockContacts: ['HR Hot-line (+91 96666 55555)', 'Legal Advisor (+91 98765 43210)', 'Police Control (112)'],
    defaultMessage: "EMERGENCY SOS: John Doe reports a Harassment / Personal Threat emergency. Current GPS Lat: 19.0680, Lon: 72.8655. Activating protective response."
  },
  {
    id: 'fraud',
    title: 'Financial & Cyber Fraud',
    icon: AlertOctagon,
    color: 'from-purple-600 to-indigo-700',
    borderColor: 'border-indigo-500',
    glowColor: 'shadow-indigo-500/20',
    rights: [
      {
        title: 'Immediate Cyber Helpline Freeze',
        statute: 'MHA National Cyber Crime Portal',
        description: 'Call 1930 immediately. Reporting within the "Golden Hour" of transaction allows banks and police to freeze the stolen funds before they leave the banking ecosystem.'
      },
      {
        title: 'Zero Liability Policy',
        statute: 'RBI Customer Liability Circular',
        description: 'Your liability is ZERO if you report unauthorized electronic bank transactions within 3 working days of receiving the alert.'
      },
      {
        title: 'Right to Dispute Resolution',
        statute: 'Payment and Settlement Systems Act',
        description: 'Banks are bound to resolve disputed card/online payments within 90 days, failing which they must credit the disputed amount provisionally.'
      }
    ],
    mockContacts: ['Bank Security Desk (+91 1800 425 111)', 'CFO / Accounts (+91 95555 44444)', 'Cyber Crime Cell (1930)'],
    defaultMessage: "EMERGENCY SOS: John Doe reports a major Financial/Cyber Fraud incident. Account freeze requested. GPS Lat: 19.0760, Lon: 72.8777."
  }
];

const EmergencySOS = ({ onClose }) => {
  const { user } = useAuth();
  const [selectedScenario, setSelectedScenario] = useState(SCENARIOS[0]);
  const [sosActive, setSosActive] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [alertStatus, setAlertStatus] = useState('idle'); // 'idle' | 'countdown' | 'dispatching' | 'sent'
  const [customMsg, setCustomMsg] = useState('');
  const [liveLocation, setLiveLocation] = useState({ lat: '19.0760', lon: '72.8777', accuracy: '12m' });
  const [dispatchedAlerts, setDispatchedAlerts] = useState([]);

  useEffect(() => {
    const userName = user?.displayName || "John Doe";
    const userPhone = user?.phoneNumber ? ` (${user.phoneNumber})` : "";
    const msg = selectedScenario.defaultMessage.replace("John Doe", `${userName}${userPhone}`);
    setCustomMsg(msg);
  }, [selectedScenario, user]);

  useEffect(() => {
    let timer;
    if (alertStatus === 'countdown') {
      if (countdown > 0) {
        timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      } else {
        triggerDispatch();
      }
    }
    return () => clearTimeout(timer);
  }, [countdown, alertStatus]);

  const startSOS = () => {
    setCountdown(5);
    setAlertStatus('countdown');
    setSosActive(true);
  };

  const cancelSOS = () => {
    setAlertStatus('idle');
    setSosActive(false);
    setCountdown(5);
  };

  const triggerDispatch = () => {
    setAlertStatus('dispatching');
    
    // Simulate SMS dispatching with staggered arrival
    const alerts = [];
    selectedScenario.mockContacts.forEach((contact, index) => {
      setTimeout(() => {
        setDispatchedAlerts(prev => [
          ...prev, 
          { contact, time: new Date().toLocaleTimeString(), status: 'Delivered' }
        ]);
        
        if (index === selectedScenario.mockContacts.length - 1) {
          setAlertStatus('sent');
        }
      }, (index + 1) * 1200);
    });
  };

  return (
    <div className="w-full max-w-4xl bg-slate-950 text-white rounded-3xl border border-red-900/50 shadow-[0_0_50px_rgba(239,68,68,0.15)] overflow-hidden flex flex-col md:flex-row">
      
      {/* Left panel: Control Room & Interactive SOS Trigger */}
      <div className="w-full md:w-5/12 bg-gradient-to-b from-slate-900 via-slate-950 to-red-950/40 p-6 md:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-red-950/50">
        
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-red-500 font-mono">
                SECURE EMERGENCY LINK
              </span>
            </div>
            {onClose && (
              <button 
                onClick={onClose}
                className="text-slate-400 hover:text-white hover:bg-slate-800/80 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <h2 className="text-2xl font-black text-slate-100 flex items-center gap-2 tracking-tight">
            <ShieldAlert className="w-7 h-7 text-red-500 animate-pulse" />
            <span>Emergency SOS</span>
          </h2>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Select your scenario to view critical rights and broadcast real-time GPS coords to legal team & emergency contacts.
          </p>

          {/* Scenario Grid Selector */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            {SCENARIOS.map((sc) => {
              const Icon = sc.icon;
              const isSelected = selectedScenario.id === sc.id;
              return (
                <button
                  key={sc.id}
                  disabled={alertStatus === 'countdown' || alertStatus === 'dispatching'}
                  onClick={() => setSelectedScenario(sc)}
                  className={`p-3.5 rounded-2xl border text-left transition-all duration-300 flex flex-col justify-between h-28 relative overflow-hidden group ${
                    isSelected 
                      ? `bg-slate-900 border-red-600 shadow-lg ${sc.glowColor}` 
                      : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <div className={`p-2 rounded-xl w-fit bg-gradient-to-br ${sc.color} text-white`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-200">{sc.title}</h4>
                    <span className="text-[9px] text-slate-400 mt-0.5 block">Tap to Arm</span>
                  </div>
                  {isSelected && (
                    <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-bl-lg" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* SOS Button Console */}
        <div className="mt-8 space-y-4">
          
          {alertStatus === 'idle' && (
            <div className="flex flex-col items-center">
              <button
                onClick={startSOS}
                className="w-36 h-36 rounded-full bg-red-600 hover:bg-red-500 text-white font-black text-lg flex flex-col items-center justify-center gap-1.5 transition-all duration-300 border-[8px] border-red-950 hover:border-red-900 shadow-[0_0_40px_rgba(239,68,68,0.4)] active:scale-95 group"
              >
                <BellRing className="w-8 h-8 group-hover:animate-bounce" />
                <span className="tracking-widest text-[13px] font-mono font-black uppercase">PUSH SOS</span>
              </button>
              <p className="text-[10px] text-red-400 mt-3 font-mono font-medium animate-pulse">
                Clicking initiates 5s cancellation countdown
              </p>
            </div>
          )}

          {alertStatus === 'countdown' && (
            <div className="flex flex-col items-center p-4 bg-red-950/40 border border-red-800/40 rounded-2xl">
              <span className="text-[10px] font-mono tracking-widest text-red-400 font-bold">BROADCAST PENDING</span>
              <span className="text-5xl font-black text-red-500 my-2 font-mono">{countdown}s</span>
              <button
                onClick={cancelSOS}
                className="w-full py-2 bg-slate-900 border border-red-500/30 hover:border-red-500 text-red-400 hover:text-white rounded-xl text-xs font-bold transition-all"
              >
                Cancel Broadcast
              </button>
            </div>
          )}

          {(alertStatus === 'dispatching' || alertStatus === 'sent') && (
            <div className="space-y-3 p-4 bg-slate-900/80 border border-red-900/30 rounded-2xl">
              <div className="flex justify-between items-center text-xs">
                <span className="text-red-400 font-bold flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 animate-spin" />
                  <span>{alertStatus === 'sent' ? 'Transmission Complete' : 'Sending Alerts...'}</span>
                </span>
                <span className="text-[10px] font-mono text-slate-500">Secured Log</span>
              </div>
              <div className="space-y-1.5 max-h-24 overflow-y-auto custom-scrollbar font-mono text-[9px]">
                {dispatchedAlerts.map((log, i) => (
                  <div key={i} className="flex justify-between text-slate-300 py-0.5 border-b border-slate-800/50">
                    <span className="truncate">{log.contact}:</span>
                    <span className="text-green-400">{log.status}</span>
                  </div>
                ))}
                {dispatchedAlerts.length === 0 && (
                  <div className="text-slate-500 py-1">Connecting to gateway...</div>
                )}
              </div>
              {alertStatus === 'sent' && (
                <button
                  onClick={cancelSOS}
                  className="w-full py-2 bg-red-950/40 border border-red-700/40 hover:bg-red-900/40 text-red-200 rounded-xl text-xs font-bold transition-all"
                >
                  Reset Controller
                </button>
              )}
            </div>
          )}

          {/* Simulated Location Status */}
          <div className="flex items-center gap-3 p-3 bg-slate-900/50 border border-slate-800/80 rounded-2xl text-xs">
            <MapPin className="w-5 h-5 text-red-500 shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-[11px] text-slate-200">GPS Live Sharing Enabled</p>
              <p className="text-[10px] text-slate-400 font-mono">
                Lat: {liveLocation.lat}, Lon: {liveLocation.lon} (±{liveLocation.accuracy})
              </p>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          </div>
        </div>

      </div>

      {/* Right panel: Instant Rights Briefing Card */}
      <div className="flex-1 bg-slate-900 p-6 md:p-8 flex flex-col justify-between overflow-y-auto max-h-[600px] md:max-h-none custom-scrollbar">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
            <div>
              <span className="text-[9px] font-bold text-red-400 bg-red-950/60 border border-red-800/40 px-2 py-0.5 rounded-md uppercase tracking-wider">
                Briefing System
              </span>
              <h3 className="text-base font-bold text-slate-100 mt-1.5 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-red-400" />
                <span>Instant Rights Briefing</span>
              </h3>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-bold bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
              <Scale className="w-3.5 h-3.5 text-red-500" />
              <span>{selectedScenario.title}</span>
            </div>
          </div>

          <div className="space-y-4">
            {selectedScenario.rights.map((right, idx) => (
              <div 
                key={idx}
                className="bg-slate-950/60 border border-slate-800/80 hover:border-red-900/20 rounded-xl p-4 transition-all duration-300 relative group overflow-hidden"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-600 rounded-r-lg" />
                <div className="flex justify-between items-start gap-3">
                  <h4 className="text-xs font-bold text-slate-100 group-hover:text-red-400 transition-colors">
                    {right.title}
                  </h4>
                  <span className="text-[9px] font-bold font-mono text-red-500 bg-red-950/20 border border-red-900/30 px-1.5 py-0.5 rounded shrink-0">
                    {right.statute}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2 leading-relaxed font-sans">
                  {right.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* SOS alert dispatch customization panel */}
        <div className="mt-8 pt-5 border-t border-slate-800 space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">
              Custom SOS Message Broadcast
            </label>
            <div className="relative">
              <textarea
                disabled={alertStatus === 'countdown' || alertStatus === 'dispatching'}
                value={customMsg}
                onChange={(e) => setCustomMsg(e.target.value)}
                rows={2}
                className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-300 focus:outline-none focus:border-red-500/50 resize-none font-mono focus:ring-1 focus:ring-red-500/20"
              />
            </div>
          </div>

          <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-4 flex gap-3 text-xs">
            <Shield className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <h5 className="font-bold text-slate-200">Pre-programmed Emergency Numbers</h5>
              <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                Broadcasting is also routed directly to the Centralized Legal Hotline. A duty attorney is assigned immediately to verify your location.
              </p>
            </div>
          </div>
        </div>

      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default EmergencySOS;
