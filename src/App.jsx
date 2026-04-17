import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import Auth from "./pages/Auth";
import RiskProfiling from "./pages/RiskProfiling";
import Dashboard from "./pages/Dashboard";
import Disruption from "./pages/Disruption";
import Payout from "./pages/Payout";
import Profile from "./pages/Profile";
import Wallet from "./pages/Wallet";
import WalletSetup from "./pages/WalletSetup";
import AdminDashboard from "./pages/AdminDashboard";
import AdminProfile from "./pages/AdminProfile";
import AdminRiskReports from "./pages/AdminRiskReports";
import { useAuth } from "./hooks/useAuth";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "./lib/supabase";
import { useEffect, useState } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import NotFound from "./pages/NotFound";

function ProtectedRoute({ children }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-accent1/30 border-t-accent1 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AdminRoute({ children }) {
  const { session, loading, user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (!session || !user) {
      if (isMounted) setChecking(false);
      return;
    }

    // Bypass check for the quick demo admin user
    if (user.id === '77777777-7777-7777-7777-777777777777') {
      setIsAdmin(true);
      setChecking(false);
      return;
    }

    const checkAdmin = async () => {
      try {
        const { data } = await supabase.from('admin_profiles').select('id').eq('id', user.id).maybeSingle();
        if (isMounted) {
          setIsAdmin(!!data);
          setChecking(false);
        }
      } catch (e) {
        if (isMounted) setChecking(false);
      }
    };
    checkAdmin();
    
    return () => { isMounted = false; };
  }, [session, user]);

  if (loading || checking) {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-accent1/30 border-t-accent1 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}

const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -15 }}
    transition={{ duration: 0.3 }}
    className="h-full w-full"
  >
    {children}
  </motion.div>
);

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><Auth /></PageWrapper>} />
        <Route path="/risk-profiling" element={<ProtectedRoute><PageWrapper><RiskProfiling /></PageWrapper></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><PageWrapper><Dashboard /></PageWrapper></ProtectedRoute>} />
        <Route path="/disruption" element={<ProtectedRoute><PageWrapper><Disruption /></PageWrapper></ProtectedRoute>} />
        <Route path="/payout" element={<ProtectedRoute><PageWrapper><Payout /></PageWrapper></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><PageWrapper><Profile /></PageWrapper></ProtectedRoute>} />
        <Route path="/wallet" element={<ProtectedRoute><PageWrapper><Wallet /></PageWrapper></ProtectedRoute>} />
        <Route path="/wallet-setup" element={<ProtectedRoute><PageWrapper><WalletSetup /></PageWrapper></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<AdminRoute><PageWrapper><AdminDashboard /></PageWrapper></AdminRoute>} />
        <Route path="/admin/profile" element={<AdminRoute><PageWrapper><AdminProfile /></PageWrapper></AdminRoute>} />
        <Route path="/admin/risk-reports" element={<AdminRoute><PageWrapper><AdminRiskReports /></PageWrapper></AdminRoute>} />
        <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  );
}

/**
 * Defines GigShield AI application routes.
 * @returns {JSX.Element}
 */
function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AnimatedRoutes />
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;