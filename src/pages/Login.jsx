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
    <div className="min-h-screen bg-[#0c0e14] font-sans text-white relative flex items-center justify-center p-4 overflow-hidden selection:bg-purple-500/30 selection:text-white">
      
      {/* Background Ambience / Subtle Purple Glow */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-15%] left-[-15%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-15%] right-[-15%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px]" />
      </div>

      {/* Invisible Recaptcha container */}
      <div id="recaptcha-container"></div>

      {/* Main Card Container */}
      <div className="relative z-10 w-full max-w-md bg-[#161922] rounded-3xl border border-white/[0.08] shadow-2xl overflow-hidden">
        
        {/* Header Accent Line */}
        <div className="h-0.5 w-full bg-violet-500/60" />
        
        <div className="p-8 md:p-10 flex flex-col items-center">
          {/* Logo / Branding */}
          <div className="flex items-center gap-3 mb-6 group cursor-default">
            <div className="w-11 h-11 rounded-2xl bg-violet-500/10 border border-violet-500/25 flex items-center justify-center p-2">
              <img
                src={logo}
                alt="LawBot 360"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-left">
              <span className="text-xl font-bold tracking-tight text-white block">
                LawBot<span className="text-violet-400">360</span>
              </span>
              <span className="text-[9px] font-mono tracking-widest text-violet-400/90 font-medium uppercase block">
                Enterprise Legal Workspace
              </span>
            </div>
          </div>

          <h2 className="text-xl font-bold text-center text-white tracking-tight">
            Welcome to LawBot 360
          </h2>
          <p className="text-xs text-slate-400 mt-1.5 text-center leading-relaxed mb-6 max-w-xs">
            Authenticate to access your privileged compliance cockpit, legal vault, and AI counsel.
          </p>

          {/* Alert messages */}
          {error && (
            <div className="w-full mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-xs text-rose-300 animate-slideDown">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <p className="leading-normal">{error}</p>
            </div>
          )}

          {successMsg && (
            <div className="w-full mb-5 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start gap-2.5 text-xs text-emerald-300 animate-slideDown">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <p className="leading-normal">{successMsg}</p>
            </div>
          )}

          {/* Custom Tabs */}
          <div className="w-full flex bg-[#0c0e14] rounded-xl p-1 mb-6 border border-white/[0.08]">
            <button
              onClick={() => {
                setActiveTab("google");
                setError("");
                setSuccessMsg("");
              }}
              className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "google"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/25"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Google Workspace
            </button>
            <button
              onClick={() => {
                setActiveTab("phone");
                setError("");
                setSuccessMsg("");
              }}
              className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "phone"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/25"
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
                className="w-full py-3.5 px-6 bg-white hover:bg-slate-100 text-slate-900 font-semibold rounded-xl transition-all duration-200 shadow-md flex items-center justify-center gap-3 relative group"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                    <span className="text-xs">Continue with Google SSO</span>
                  </>
                )}
                <div className="absolute right-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                </div>
              </button>
              
              <div className="flex items-center gap-2 justify-center text-[10px] text-slate-500 pt-2 font-mono">
                <Lock className="w-3 h-3 text-purple-400" />
                <span>OAUTH 2.0 PROTOCOL SECURED</span>
              </div>
            </div>
          ) : (
            <div className="w-full">
              <div id="recaptcha-container"></div>
              {!otpSent ? (
                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Mobile Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-semibold text-xs">
                        +91
                      </div>
                      <input
                        type="tel"
                        maxLength="10"
                        placeholder="98765 43210"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                        className="w-full h-11 bg-[#0c0e14] border border-white/[0.08] rounded-xl pl-12 pr-4 text-xs font-medium text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 placeholder:text-slate-600 transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || phoneNumber.length < 10}
                    className="w-full h-11 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-600/20 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 group relative text-xs"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Phone className="w-3.5 h-3.5" />
                        <span>Get Verification OTP</span>
                        <ArrowRight className="w-3.5 h-3.5 absolute right-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOTP} className="space-y-4 animate-slideDown">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
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
                        className="w-full h-11 bg-[#0c0e14] border border-white/[0.08] rounded-xl pl-10 pr-4 text-xs font-mono tracking-[0.4em] font-bold text-white text-center focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 placeholder:text-slate-700 transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otpCode.length < 6}
                    className="w-full h-11 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-600/20 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-xs"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Verify & Enter Workspace</span>
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
                    className="w-full text-center text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors"
                  >
                    Change Phone Number
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Quick Demo Access for Evaluation */}
          <div className="w-full mt-6 pt-5 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={handleGuestSignIn}
              disabled={loading}
              className="w-full py-3 px-4 bg-[#141721] hover:bg-[#1a1e2b] text-purple-300 hover:text-white border border-purple-500/30 hover:border-purple-500/60 font-semibold text-xs rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm group cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Instant Demo Session (1-Click Access)</span>
              <ArrowRight className="w-3.5 h-3.5 text-purple-400 group-hover:translate-x-1 transition-transform ml-auto" />
            </button>
          </div>

          {/* Secure Trust Badges */}
          <div className="mt-5 pt-4 border-t border-white/[0.06] w-full text-center space-y-1.5">
            <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Compliant with DPDP Act 2023 & Bar Council Regulations</span>
            </p>
            <p className="text-[9px] text-slate-500 leading-normal max-w-[280px] mx-auto font-light">
              By accessing LawBot 360, you confirm authorized access to confidential legal workflows.
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
