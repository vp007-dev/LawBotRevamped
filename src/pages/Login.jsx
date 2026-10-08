import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  Scale, 
  ShieldCheck, 
  ArrowRight, 
  Lock, 
  Phone, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  KeyRound, 
  Loader2 
} from "lucide-react";
import logo from "../assets/lawbot360-logo-updated.svg";

export default function Login() {
  const { signInWithGoogle, signInWithPhone, signInAsGuest, confirmOTP, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState("google"); // "google" | "phone"
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Determine redirect path
  const from = location.state?.from?.pathname || "/dashboard";

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleGuestSignIn = () => {
    setLoading(true);
    try {
      signInAsGuest("Executive Legal Counsel");
      setSuccessMsg("Entering LawBot360 Demo Session...");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error(err);
      setError("Failed to enter demo session.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    try {
      await signInWithGoogle();
      setSuccessMsg("Logged in successfully!");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to sign in with Google. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!phoneNumber) {
      setError("Please enter a valid phone number.");
      return;
    }

    setLoading(true);
    setError("");
    
    // Format phone number to standard E.164 (+91 for India if no prefix is provided)
    let formattedPhone = phoneNumber.trim();
    if (!formattedPhone.startsWith("+")) {
      // Default to India +91 if length is 10 digits
      if (formattedPhone.length === 10) {
        formattedPhone = "+91" + formattedPhone;
      } else {
        setError("Please enter phone number with country code, e.g. +91 9876543210");
        setLoading(false);
        return;
      }
    }

    try {
      await signInWithPhone(formattedPhone, "recaptcha-container");
      setOtpSent(true);
      setSuccessMsg(`OTP sent successfully to ${formattedPhone}`);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to send OTP. Ensure number is correct and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await confirmOTP(otpCode.trim());
      setSuccessMsg("Phone number verified successfully!");
    } catch (err) {
      console.error(err);
      setError(err.message || "Invalid OTP code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-white relative flex items-center justify-center p-4 overflow-hidden">
      
      {/* Background Ambience / Glow Blobs */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] bg-blue-600/25 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
      </div>

      {/* Invisible Recaptcha container */}
      <div id="recaptcha-container"></div>

      {/* Main Glassmorphism Card Container */}
      <div className="relative z-10 w-full max-w-md bg-white/5 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 shadow-[0_0_60px_rgba(99,102,241,0.15)] overflow-hidden">
        
        {/* Header Ribbon / Gradient Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600" />
        
        <div className="p-8 md:p-10 flex flex-col items-center">
          {/* Logo / Branding */}
          <div className="flex items-center gap-3 mb-8 group cursor-default">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 blur-md opacity-30 group-hover:opacity-55 transition-opacity" />
              <img
                src={logo}
                alt="LawBot 360"
                className="w-10 h-10 relative z-10 transition-transform duration-500 group-hover:rotate-12"
              />
            </div>
            <div className="text-left">
              <span className="text-2xl font-black tracking-tight text-white block">
                LawBot<span className="text-blue-400">360</span>
              </span>
              <span className="text-[9px] font-mono tracking-widest text-indigo-400 font-bold uppercase -mt-1 block">
                Security Command Center
              </span>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-center text-slate-100 tracking-tight">
            Welcome to LawBot 360
          </h2>
          <p className="text-xs text-slate-400 mt-2 text-center leading-relaxed mb-6">
            Access statutory tools, compliance workflows, contract analysis, and voice consultation.
          </p>

          {/* Alert messages */}
          {error && (
            <div className="w-full mb-6 p-4 bg-red-900/25 border border-red-500/30 rounded-2xl flex items-start gap-3 text-xs text-red-300 animate-slideDown">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="leading-normal">{error}</p>
            </div>
          )}

          {successMsg && (
            <div className="w-full mb-6 p-4 bg-emerald-900/25 border border-emerald-500/30 rounded-2xl flex items-start gap-3 text-xs text-emerald-300 animate-slideDown">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="leading-normal">{successMsg}</p>
            </div>
          )}

          {/* Custom Tabs */}
          <div className="w-full flex bg-slate-900/80 rounded-2xl p-1 mb-8 border border-white/5">
            <button
              onClick={() => {
                setActiveTab("google");
                setError("");
                setSuccessMsg("");
              }}
              className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${
                activeTab === "google"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Google Auth
            </button>
            <button
              onClick={() => {
                setActiveTab("phone");
                setError("");
                setSuccessMsg("");
              }}
              className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${
                activeTab === "phone"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Mobile OTP
            </button>
          </div>

          {/* Active Tab Content */}
          {activeTab === "google" ? (
            <div className="w-full space-y-4">
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-4 px-6 bg-white hover:bg-slate-50 text-slate-900 font-bold rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-xl flex items-center justify-center gap-3 relative group"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#EA4335"
                        d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.48 14.97 1 12 1 7.21 1 3.16 3.73 1.25 7.72l3.85 2.99C6.01 7.32 8.78 5.04 12 5.04z"
                      />
                      <path
                        fill="#4285F4"
                        d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.42 3.58v2.99h3.89c2.28-2.1 3.56-5.18 3.56-8.72z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.1 14.73c-.23-.69-.36-1.42-.36-2.18s.13-1.49.36-2.18L1.25 7.38C.45 8.98 0 10.77 0 12.64c0 1.88.45 3.67 1.25 5.27l3.85-3.18z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.89-2.99c-1.08.72-2.45 1.16-4.07 1.16-3.22 0-5.99-2.28-6.96-5.36L1.19 15.9C3.1 19.89 7.15 23 12 23z"
                      />
                    </svg>
                    <span className="text-sm">Continue with Google</span>
                  </>
                )}
                <div className="absolute right-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>
              </button>
              
              <div className="flex items-center gap-2 justify-center text-[10px] text-slate-500 pt-4 font-mono font-bold">
                <Lock className="w-3 h-3 text-indigo-500" />
                <span>OAUTH 2.0 PROTOCOL SECURED</span>
              </div>
            </div>
          ) : (
            <div className="w-full">
              <div id="recaptcha-container"></div>
              {!otpSent ? (
                <form onSubmit={handleSendOTP} className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 font-mono">
                      Mobile Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 font-bold text-sm">
                        🇮🇳 +91
                      </div>
                      <input
                        type="tel"
                        maxLength="10"
                        placeholder="98765 43210"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                        className="w-full h-12 bg-slate-900 border border-white/10 rounded-2xl pl-16 pr-4 text-sm font-semibold tracking-wide text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 placeholder:text-slate-600 transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || phoneNumber.length < 10}
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-900/20 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all flex items-center justify-center gap-2 group relative overflow-hidden"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Phone className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                        <span className="text-sm">Get Verification OTP</span>
                        <ArrowRight className="w-4 h-4 absolute right-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOTP} className="space-y-5 animate-slideDown">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 font-mono">
                      6-Digit Security OTP
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        maxLength="6"
                        placeholder="123456"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                        className="w-full h-12 bg-slate-900 border border-white/10 rounded-2xl pl-10 pr-4 text-sm font-mono tracking-[0.4em] font-extrabold text-white text-center focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 placeholder:text-slate-700 transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otpCode.length < 6}
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-900/20 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all flex items-center justify-center gap-2 group"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-sm">Verify & Access Dashboard</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtpCode("");
                      setError("");
                      setSuccessMsg("");
                    }}
                    className="w-full text-center text-xs text-indigo-400 hover:text-indigo-300 font-bold transition-colors"
                  >
                    Change Phone Number
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Quick Demo Access for Evaluation & Hackathons */}
          <div className="w-full mt-6 pt-5 border-t border-slate-800/80">
            <button
              type="button"
              onClick={handleGuestSignIn}
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-slate-900 to-indigo-950/80 hover:from-indigo-900/40 hover:to-indigo-800/40 text-indigo-300 hover:text-white border border-indigo-500/30 hover:border-indigo-400/60 font-bold text-xs rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg group cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse group-hover:scale-110 transition-transform" />
              <span>Explore Demo Session (1-Click Instant Access)</span>
              <ArrowRight className="w-3.5 h-3.5 text-indigo-400 group-hover:translate-x-1 transition-transform ml-auto" />
            </button>
          </div>

          {/* Secure Trust Badges */}
          <div className="mt-6 pt-5 border-t border-white/5 w-full text-center space-y-2.5">
            <p className="text-[10px] text-slate-500 leading-normal flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Compliant with DPDP Act 2023 & BNS Directives</span>
            </p>
            <p className="text-[9px] text-slate-600 leading-normal max-w-[280px] mx-auto font-light">
              By accessing LawBot 360, you agree to our Terms of Use and verify your legal capacity to consult AI counsel under Indian Laws.
            </p>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideDown {
          animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
