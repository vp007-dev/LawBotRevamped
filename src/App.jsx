import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation
} from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import ChatApp from "./pages/HomePage";
import Dashboard from "./pages/Dashboard";
import Documents from "./pages/Documents";
import Resources from "./pages/Resources";
import Cases from "./pages/Cases";
import Lawyers from "./pages/Lawyers";
import ContractAnalysis from "./pages/ContractAnalysis";
import Help from "./pages/Help";
import Vault from "./pages/Vault";
import ComplianceCalendar from "./pages/ComplianceCalendar";
import Schemes from "./pages/Schemes";
import OnboardingWizard from "./pages/OnboardingWizard";
import RegulatoryUpdates from "./pages/RegulatoryUpdates";
import WorkflowManager from "./pages/WorkflowManager";
import Login from "./pages/Login";
import SarvamVoice from "./pages/SarvamVoice";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ObsidianGraphModal from "./components/ObsidianGraphModal";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function AppContent() {
  const [showGlobalGraphModal, setShowGlobalGraphModal] = useState(false);
  const [globalGraphArticle, setGlobalGraphArticle] = useState(null);

  useEffect(() => {
    const handleOpenGraph = (e) => {
      setGlobalGraphArticle(e?.detail?.artNo || '21');
      setShowGlobalGraphModal(true);
    };
    window.addEventListener('open-obsidian-graph', handleOpenGraph);
    return () => window.removeEventListener('open-obsidian-graph', handleOpenGraph);
  }, []);

  return (
    <div className="min-h-screen ">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        <Route path="/home" element={<Navigate to="/dashboard/chat" replace />} />
        <Route path="/workspace" element={<Navigate to="/dashboard" replace />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/chat" 
          element={
            <ProtectedRoute>
              <ChatApp />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/onboarding" 
          element={
            <ProtectedRoute>
              <OnboardingWizard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/vault" 
          element={
            <ProtectedRoute>
              <Vault />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/calendar" 
          element={
            <ProtectedRoute>
              <ComplianceCalendar />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/schemes" 
          element={
            <ProtectedRoute>
              <Schemes />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/regulatory-updates" 
          element={
            <ProtectedRoute>
              <RegulatoryUpdates />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/workflows" 
          element={
            <ProtectedRoute>
              <WorkflowManager />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/documents" 
          element={
            <ProtectedRoute>
              <Documents />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/lawyers" 
          element={
            <ProtectedRoute>
              <Lawyers />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/cases" 
          element={
            <ProtectedRoute>
              <Cases />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/resources" 
          element={
            <ProtectedRoute>
              <Resources />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/contracts" 
          element={
            <ProtectedRoute>
              <ContractAnalysis />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/sarvam-voice" 
          element={
            <ProtectedRoute>
              <SarvamVoice />
            </ProtectedRoute>
          } 
        />
        <Route path="/sarvam-voice" element={<Navigate to="/dashboard/sarvam-voice" replace />} />
        <Route path="/voice-helpline" element={<Navigate to="/dashboard/sarvam-voice" replace />} />
        <Route path="/contract-analysis" element={<Navigate to="/dashboard/contracts" replace />} />
        <Route path="/lawyers" element={<Navigate to="/dashboard/lawyers" replace />} />
        <Route path="/cases" element={<Navigate to="/dashboard/cases" replace />} />
        <Route path="/documents" element={<Navigate to="/dashboard/documents" replace />} />
        <Route path="/resources" element={<Navigate to="/dashboard/resources" replace />} />
        <Route path="/vault" element={<Navigate to="/dashboard/vault" replace />} />
        <Route path="/calendar" element={<Navigate to="/dashboard/calendar" replace />} />
        <Route path="/schemes" element={<Navigate to="/dashboard/schemes" replace />} />
        <Route path="/workflows" element={<Navigate to="/dashboard/workflows" replace />} />
        <Route path="/help" element={<Help />} />
      </Routes>
      <ObsidianGraphModal
        isOpen={showGlobalGraphModal}
        onClose={() => setShowGlobalGraphModal(false)}
        initialArticleNo={globalGraphArticle}
      />
    </div>
  );
}

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
