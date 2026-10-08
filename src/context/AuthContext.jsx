import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  signInWithPhoneNumber, 
  RecaptchaVerifier 
} from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState(null);
  const [confirmationResult, setConfirmationResult] = useState(null);

  // Sync / merge custom user data like phone number from localStorage
  const getUserProfile = (firebaseUser) => {
    if (!firebaseUser) return null;
    const localPhone = localStorage.getItem(`lawbot-phone-${firebaseUser.uid}`);
    return {
      uid: firebaseUser.uid,
      displayName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
      email: firebaseUser.email || "",
      photoURL: firebaseUser.photoURL || null,
      phoneNumber: firebaseUser.phoneNumber || localPhone || "",
    };
  };

  useEffect(() => {
    // Check local guest session
    const savedGuest = localStorage.getItem("lawbot-guest-session");
    if (savedGuest) {
      try {
        setUser(JSON.parse(savedGuest));
        setLoading(false);
      } catch (e) {
        // ignore
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(getUserProfile(firebaseUser));
      } else {
        if (!localStorage.getItem("lawbot-guest-session")) {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      // Clean up Recaptcha on unmount
      if (recaptchaVerifier) {
        recaptchaVerifier.clear();
      }
    };
  }, [recaptchaVerifier]);

  // Google sign in
  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setUser(getUserProfile(result.user));
      return result.user;
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Setup Recaptcha for Phone Auth
  const setupRecaptcha = (containerId) => {
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (e) {
        // ignore cleanup error
      }
      window.recaptchaVerifier = null;
    }

    const containerElem = document.getElementById(containerId);
    if (!containerElem) {
      throw new Error(`reCAPTCHA container '#${containerId}' not found in DOM.`);
    }

    try {
      const verifier = new RecaptchaVerifier(auth, containerId, {
        size: "invisible",
        callback: () => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        },
        "expired-callback": () => {
          console.warn("reCAPTCHA expired. Resetting.");
        }
      });
      window.recaptchaVerifier = verifier;
      setRecaptchaVerifier(verifier);
      return verifier;
    } catch (error) {
      console.error("Recaptcha setup error:", error);
      throw error;
    }
  };

  // Phone sign in (Send OTP)
  const signInWithPhone = async (phoneNumber, containerId) => {
    setLoading(true);
    try {
      const verifier = setupRecaptcha(containerId);
      const confirmResult = await signInWithPhoneNumber(auth, phoneNumber, verifier);
      setConfirmationResult(confirmResult);
      return confirmResult;
    } catch (error) {
      console.error("Phone sign in error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Confirm OTP
  const confirmOTP = async (otpCode) => {
    setLoading(true);
    try {
      if (!confirmationResult) {
        throw new Error("No pending phone verification found.");
      }
      const result = await confirmationResult.confirm(otpCode);
      setUser(getUserProfile(result.user));
      return result.user;
    } catch (error) {
      console.error("OTP Confirmation Error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Log out
  const logout = async () => {
    setLoading(true);
    try {
      localStorage.removeItem("lawbot-guest-session");
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Sign-Out Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // One-click Demo/Guest sign in for hackathons & evaluation
  const signInAsGuest = (name = "Executive Legal Counsel") => {
    const guestUser = {
      uid: "guest-" + Date.now(),
      displayName: name,
      email: "counsel@lawbot360.ai",
      photoURL: null,
      phoneNumber: "+91 98765 43210"
    };
    localStorage.setItem("lawbot-guest-session", JSON.stringify(guestUser));
    setUser(guestUser);
    return guestUser;
  };

  // Manually update custom phone number (e.g. for Google users)
  const updateUserPhone = (phone) => {
    if (!user) return;
    localStorage.setItem(`lawbot-phone-${user.uid}`, phone);
    setUser(prev => prev ? { ...prev, phoneNumber: phone } : null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signInWithPhone,
        signInAsGuest,
        confirmOTP,
        logout,
        updateUserPhone,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
