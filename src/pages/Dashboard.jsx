import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { fetchLiveWeather } from "../Services/weatherService";
import { useAuth } from "../hooks/useAuth";
import BottomNav from "../components/BottomNav";
import ErrorDisplay from "../components/ErrorDisplay";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldAlert, CloudRain, Wind, AlertTriangle, ShieldCheck, 
  Wallet as WalletIcon, PlusCircle, Activity, Droplets,
  Info, X, List, Bell
} from "lucide-react";

import { 
  calculateRiskScore, 
  calculatePayoutAmount, 
  incomeMap, 
  defaultWeights, 
  planMultipliers 
} from "../Services/riskEngine";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [showCoverage, setShowCoverage] = useState(false);

  const [dashboardData, setDashboardData] = useState({
    premium: 0,
    payout: 0,
    riskScore: 0,
    coverage: 0,
    payoutTriggered: false,
    aqi: 0,
    rainfall: 0,
    floodRisk: 0,
    severity: "Low",
    zoneName: "",
    zoneThreshold: 80,
    weights: defaultWeights,
    selectedPlan: "Standard" 
  });

  const computeAndPersistDashboard = useCallback(async (rider, settings) => {
    const assignedZoneId = rider?.assigned_zone_id;
    const selectedPlan = rider?.selected_plan || "Standard";
    
    if (!rider) throw new Error("Rider profile not found.");

    if (user.id !== '99999999-9999-9999-9999-999999999999' && !rider.upi_id) {
      navigate("/wallet-setup");
      return;
    }

    let zoneThreshold = 80;
    let zoneName = "Unknown Zone";
    let weights = defaultWeights;
    let liveWeather = { aqi: 0, rainfall: 0, humidity: 0, temperature: 30 };

    if (assignedZoneId) {
      const { data: zoneData, error: zoneError } = await supabase
        .from("zones")
        .select("*")
        .eq("id", assignedZoneId)
        .single();

      if (!zoneError) {
        zoneThreshold = zoneData?.risk_threshold || 80;
        zoneName = zoneData?.zone_name || "Unknown Zone";
        if (zoneData?.weights) {
          weights = { ...defaultWeights, ...zoneData.weights };
        }
        liveWeather = await fetchLiveWeather(zoneData.latitude, zoneData.longitude);
      }
    }

    const riskScore = calculateRiskScore(liveWeather, weights, settings);
    const payoutTriggered = riskScore >= zoneThreshold;
    const payoutAmount = calculatePayoutAmount(rider.daily_income_range, selectedPlan);
    
    const coverageMultiplier = planMultipliers[selectedPlan] || 0.8;
    const coverage = Math.round(coverageMultiplier * 100);

    setDashboardData({
      premium: Math.round(rider.plan_premium || 125),
      payout: payoutTriggered ? payoutAmount : 0,
      riskScore,
      coverage,
      payoutTriggered,
      aqi: Math.round(liveWeather.aqi),
      rainfall: Math.round(liveWeather.rainfall),
      floodRisk: (liveWeather.rainfall * 10) > 50 ? 85 : 40,
      severity: riskScore >= 85 ? "Extreme" : riskScore >= 70 ? "High" : riskScore >= 50 ? "Moderate" : "Low",
      zoneName,
      zoneThreshold,
      weights,
      selectedPlan
    });
  }, [user, navigate]);

  const fetchDashboardMetrics = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setError("Unable to find an authenticated rider session.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: settings } = await supabase.from('system_settings').select('*').limit(1).maybeSingle();

      if (user.id === '99999999-9999-9999-9999-999999999999') {
         setDashboardData({
          premium: 125, payout: 1200, 
          riskScore: calculateRiskScore({ aqi: 120/20, rainfall: 60/10, humidity: 85 }, defaultWeights, settings),
          coverage: 85, payoutTriggered: true, aqi: 120, rainfall: 60, floodRisk: 85, severity: "High",
          zoneName: "Metro Center", zoneThreshold: 80, weights: defaultWeights, selectedPlan: "Pro"
         });
         setLoading(false);
         return;
      }

      const { data: rider, error: riderError } = await supabase.from("riders").select("*").eq("id", user.id).single();

      if (riderError) {
        const fallback = await supabase.from("riders").select("*").eq("phone_number", user.phone || "").maybeSingle();
        if (fallback.error) throw fallback.error;
        if (!fallback.data) throw new Error("Rider profile not found.");
        await computeAndPersistDashboard(fallback.data, settings);
      } else {
        await computeAndPersistDashboard(rider, settings);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, computeAndPersistDashboard]);

  useEffect(() => {
    fetchDashboardMetrics();
  }, [fetchDashboardMetrics]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent1/30 border-t-accent1 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background text-slate-200 flex items-center justify-center p-6">
        <ErrorDisplay message={error} onRetry={fetchDashboardMetrics} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-slate-200 pb-24 relative overflow-hidden">
      {/* Mesh Background */}
      <div className="absolute inset-0 bg-mesh opacity-40 z-0 pointer-events-none"></div>

      {/* Header */}
      <header className="fixed top-0 w-full z-40 bg-surface/30 backdrop-blur-2xl border-b border-white/5 flex justify-between items-center px-4 h-[72px]">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowCoverage(true)}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-accent1"
          >
            <Info className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-extrabold tracking-tight text-white hidden sm:block">GigShield <span className="text-accent1">AI</span></h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate("/wallet")}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-accent1"
          >
            <Bell className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setShowStats(true)}
            className="w-10 h-10 rounded-full border border-white/20 bg-surface/80 flex items-center justify-center p-0.5 hover:ring-2 hover:ring-accent1/50 transition-all shadow-[0_0_15px_rgba(255,255,255,0.05)]"
          >
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=transparent" alt="Avatar" className="w-full h-full rounded-full" />
          </button>
        </div>
      </header>

      <main className="pt-24 px-4 max-w-lg mx-auto z-10 relative space-y-6">
        
        {/* Animated Threat Indicator */}
        <AnimatePresence>
          {dashboardData.payoutTriggered && (
             <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: -20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               className="glass-panel border-red-500/30 bg-red-950/40 rounded-3xl p-5 shadow-[0_0_30px_rgba(239,68,68,0.15)] flex flex-col gap-3"
             >
               <div className="flex items-center gap-3 text-red-400">
                 <AlertTriangle className="w-6 h-6 animate-pulse" />
                 <h3 className="font-bold text-lg">Disruption Threshold Exceeded</h3>
               </div>
               <p className="text-sm text-red-200/70 leading-relaxed">
                 Extreme weather detected in {dashboardData.zoneName}. Automated income protection is active.
               </p>
               <button
                 onClick={() => navigate("/disruption")}
                 className="mt-2 w-full py-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 font-semibold rounded-xl border border-red-500/30 transition-all active:scale-[0.98]"
               >
                 View Disruption Event
               </button>
             </motion.div>
          )}
        </AnimatePresence>

        {/* Protection Banner Card */}
        <motion.div 
           initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
           className="relative overflow-hidden rounded-3xl glass-panel-heavy p-6 shadow-2xl"
        >
          {/* Subtle glow behind card text */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent1/20 blur-[50px] rounded-full"></div>
          
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="inline-flex items-center gap-2 bg-accent1/10 px-3 py-1 rounded-full border border-accent1/20">
                  <div className="w-2 h-2 rounded-full bg-accent1 animate-pulse"></div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-accent1">Active Protection</span>
                </div>
                {/* Active Plan Badge */}
                <div className={`px-3 py-1 rounded-full border text-[10px] uppercase tracking-wider font-bold ${
                  dashboardData.selectedPlan === 'Pro' ? 'bg-purple-500/20 border-purple-500/30 text-purple-300' :
                  dashboardData.selectedPlan === 'Standard' ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300' :
                  'bg-slate-500/20 border-slate-500/30 text-slate-300'
                }`}>
                  {dashboardData.selectedPlan} Plan
                </div>
              </div>
              <h2 className="text-3xl font-bold text-white tracking-tight">Week 12</h2>
            </div>
            
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center backdrop-blur-md shadow-inner">
               <ShieldCheck className="w-6 h-6 text-accent1 mb-1" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
             <div className="bg-slate-900/40 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Coverage</p>
                <p className="text-2xl font-bold text-white">{dashboardData.coverage}%</p>
             </div>
             <div className="bg-slate-900/40 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Premium</p>
                <p className="text-2xl font-bold text-white">₹{dashboardData.premium}</p>
             </div>
          </div>
        </motion.div>


        {/* Action Grid */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="grid grid-cols-2 gap-4">
           <button onClick={() => navigate("/wallet")} className="glass-panel p-4 rounded-3xl flex flex-col items-center justify-center gap-3 hover:bg-white/5 transition-all text-center group active:scale-[0.98]">
             <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center mb-1 group-hover:shadow-[0_0_20px_rgba(123,44,191,0.5)] transition-shadow">
               <WalletIcon className="w-5 h-5 text-white" />
             </div>
             <span className="text-sm font-semibold text-slate-200">Wallet</span>
           </button>
           <button onClick={() => navigate("/risk-profiling")} className="glass-panel p-4 rounded-3xl flex flex-col items-center justify-center gap-3 hover:bg-white/5 transition-all text-center group active:scale-[0.98]">
             <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-1 group-hover:bg-white/20 transition-all">
               <PlusCircle className="w-5 h-5 text-accent1" />
             </div>
             <span className="text-sm font-semibold text-slate-200">Upgrade</span>
           </button>
        </motion.div>

        {/* Live Risk Monitor */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h3 className="text-lg font-bold text-white mb-4 px-1">Live Risk Matrix <span className="text-sm font-normal text-slate-400 ml-2">({dashboardData.zoneName})</span></h3>
          <div className="grid grid-cols-2 gap-4">
             <div className="glass-panel p-5 rounded-3xl flex items-start justify-between">
                <div>
                   <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Wind & AQI</p>
                   <p className="text-2xl font-bold text-white">{dashboardData.aqi}</p>
                </div>
                <Wind className="w-6 h-6 text-slate-500" />
             </div>
             <div className="glass-panel p-5 rounded-3xl flex items-start justify-between">
                <div>
                   <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Rainfall</p>
                   <p className="text-2xl font-bold text-white">{dashboardData.rainfall}<span className="text-base text-slate-400 ml-1">mm</span></p>
                </div>
                <CloudRain className="w-6 h-6 text-blue-400" />
             </div>
             <div className="glass-panel p-5 rounded-3xl flex items-start justify-between">
                <div>
                   <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Flood Risk</p>
                   <p className="text-2xl font-bold text-white">Lvl {Math.ceil(dashboardData.floodRisk / 25)}</p>
                </div>
                <Droplets className="w-6 h-6 text-cyan-500" />
             </div>
             <div className="glass-panel p-5 rounded-3xl flex items-start justify-between">
                <div>
                   <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">AI Score</p>
                   <p className="text-2xl font-bold text-accent1">{dashboardData.riskScore}</p>
                </div>
                <Activity className="w-6 h-6 text-accent1" />
             </div>
          </div>
        </motion.div>

      </main>

      <BottomNav />

      {/* OVERLAYS: Total System Cohesion Fix */}
      <AnimatePresence>
        {showStats && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-12 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setShowStats(false)}
          >
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-sm glass-panel-heavy rounded-[2.5rem] p-8 space-y-8"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Account Intelligence</h3>
                <button onClick={() => setShowStats(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"><X className="w-4 h-4" /></button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-3xl bg-white/5 border border-white/5">
                  <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Total Payouts</p>
                  <p className="text-xl font-bold text-accent1">₹{dashboardData.payoutTriggered ? dashboardData.payout : 1200}</p>
                </div>
                <div className="p-4 rounded-3xl bg-white/5 border border-white/5">
                  <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Risk Avg</p>
                  <p className="text-xl font-bold text-purple-400">42.5</p>
                </div>
              </div>

              <div className="space-y-3">
                <button onClick={() => navigate("/wallet")} className="w-full py-4 glass-button rounded-2xl flex items-center justify-center gap-3 font-bold text-sm">
                  <WalletIcon className="w-5 h-5" /> View Ledger History
                </button>
                <button onClick={() => navigate("/profile")} className="w-full py-4 bg-white text-slate-900 rounded-2xl flex items-center justify-center gap-3 font-bold text-sm">
                  Identity Settings <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showCoverage && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setShowCoverage(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm glass-panel-heavy rounded-[3rem] p-8 border border-accent1/20"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-cyan flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,240,255,0.3)]">
                <ShieldCheck className="w-8 h-8 text-slate-950" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Protocol: {dashboardData.selectedPlan}</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Your income protection is currently <span className="text-accent1 font-bold">ACTIVE</span>. 
                Risk monitoring for {dashboardData.zoneName} is operational with a {dashboardData.zoneThreshold}% trigger threshold.
              </p>
              
              <div className="space-y-2 mb-8">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                  <span>Current Safety Gap</span>
                  <span>{100 - dashboardData.riskScore}%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-accent1" style={{ width: `${100 - dashboardData.riskScore}%` }}></div>
                </div>
              </div>

              <button onClick={() => setShowCoverage(false)} className="w-full py-4 bg-accent1 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest">
                Close Connection
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
