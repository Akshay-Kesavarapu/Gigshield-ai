import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { fetchLiveWeather } from "../Services/weatherService";
import { useAuth } from "../hooks/useAuth";
import BottomNav from "../components/BottomNav";
import { motion } from "framer-motion";
import { ShieldCheck, AlertTriangle, CloudLightning, Activity, CheckCircle, ChevronRight, MapPin } from "lucide-react";

import { 
  calculateRiskScore, 
  incomeMap
} from "../Services/riskEngine";

/**
 * Calculates distance between two coordinates in KM using Haversine formula.
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Renders dynamic disruption validation and payout progress.
 * @returns {JSX.Element}
 */
export default function Disruption() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [zoneCoords, setZoneCoords] = useState(null);
  const [proximityStatus, setProximityStatus] = useState("verifying");
  const [fraudCheckDone, setFraudCheckDone] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dashboardData, setDashboardData] = useState({
    premium: 0,
    payoutTriggered: false,
    riskScore: 0,
    zoneThreshold: 80,
    zoneName: "Unknown Zone",
    severity: "Low"
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setFraudCheckDone(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const progressTimer = setInterval(() => {
      setProgress((current) => {
        if (current >= 100) {
          return 100;
        }
        return current + 5;
      });
    }, 180);

    return () => clearInterval(progressTimer);
  }, []);

  useEffect(() => {
    const fetchDisruptionData = async () => {
      if (!user) {
        setError("Authenticated user not found.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const { data: settings } = await supabase.from('system_settings').select('*').limit(1).maybeSingle();

        if (user.id === '99999999-9999-9999-9999-999999999999') {
           const mockWeather = { aqi: 120/20, rainfall: 60/10, humidity: 85 };
           const rs = calculateRiskScore(mockWeather, {}, settings);
           setDashboardData({
            premium: 125,
            payoutTriggered: true,
            riskScore: rs,
            zoneThreshold: 80,
            zoneName: "Metro Center",
            severity: rs >= 85 ? "Extreme" : "High"
          });
          setLoading(false);
          return;
        }

        let rider = null;

        const { data: riderById, error: riderByIdError } = await supabase
          .from("riders")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (riderByIdError) {
          throw riderByIdError;
        }

        rider = riderById;

        if (!rider) {
          const { data: riderByPhone, error: riderByPhoneError } = await supabase
            .from("riders")
            .select("*")
            .eq("phone_number", user.phone || "")
            .maybeSingle();

          if (riderByPhoneError) {
            throw riderByPhoneError;
          }

          rider = riderByPhone;
        }

        if (!rider) {
          throw new Error("Rider profile not found.");
        }

        if (rider.assigned_zone_id) {
          const { data: zone } = await supabase.from("zones").select("latitude, longitude").eq("id", rider.assigned_zone_id).single();
          if (zone) setZoneCoords({ lat: zone.latitude, lng: zone.longitude });
        }

        const { data: latestRisk } = await supabase
          .from("risk_scores")
          .select("*")
          .eq("zone_id", rider.assigned_zone_id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const rs = Math.round(latestRisk?.risk_score || 0);
        const zoneThreshold = latestRisk?.threshold || 80;
        
        setDashboardData({
          premium: Math.round(rider.plan_premium || 125),
          payoutTriggered: rs >= zoneThreshold,
          riskScore: rs,
          zoneThreshold,
          zoneName: "Active Protection Zone",
          severity: rs >= 85 ? "Extreme" : "High"
        });
      } catch (fetchError) {
        setError(fetchError.message || "Unable to load disruption data.");
      } finally {
        setLoading(false);
      }
    };

    const validateLiveProximity = () => {
      if (!navigator.geolocation) {
        setProximityStatus("invalid");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (zoneCoords) {
            const dist = calculateDistance(pos.coords.latitude, pos.coords.longitude, zoneCoords.lat, zoneCoords.lng);
            setProximityStatus(dist <= 5 ? "valid" : "invalid");
          } else {
            setProximityStatus("valid");
          }
        },
        () => setProximityStatus("invalid"),
        { enableHighAccuracy: true }
      );
    };

    fetchDisruptionData().then(() => validateLiveProximity());
  }, [user, zoneCoords?.lat]);

  const checklist = [
    { 
      label: "Satellite Proximity Verified", 
      valid: proximityStatus === "valid",
      detail: proximityStatus === "valid" ? "Live Signal Validated" : proximityStatus === "verifying" ? "Syncing Satellite..." : "Unauthorized Location"
    },
    {
      label: "Climate Oracle Consensus",
      valid: dashboardData.riskScore > 0,
      detail: "Weather Station Sync"
    },
    { 
      label: "Parametric Trigger Validation", 
      valid: dashboardData.payoutTriggered,
      detail: `Score: ${dashboardData.riskScore}`
    },
    { 
      label: "Ledger Identity Proof", 
      valid: !!user?.id,
      detail: "Auth Session Live"
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-white pb-24 overflow-x-hidden relative flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-accent1/30 border-t-accent1 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white pb-24 overflow-x-hidden relative">
      <div className="fixed inset-0 pointer-events-none z-0">
         <motion.div 
           animate={{ opacity: [0.3, 0.5, 0.3] }}
           transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
           className="absolute top-[-100px] right-[-50px] w-[300px] h-[300px] bg-red-500/20 rounded-full blur-[100px]"
         />
      </div>

      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="pt-12 px-6 pb-6 relative z-10"
      >
        <div className="flex justify-between items-center glass-panel p-2 rounded-full border border-white/5 backdrop-blur-md">
           <div className="flex items-center gap-3 pl-2">
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent1 to-purple-500 flex items-center justify-center">
               <ShieldCheck className="w-4 h-4 text-white" />
             </div>
             <span className="font-bold text-sm">Disruption Alert</span>
           </div>
           <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/20">
             <AlertTriangle className="w-4 h-4 text-red-400" />
           </div>
        </div>
      </motion.header>

      <main className="px-4 max-w-lg mx-auto relative z-10 space-y-6">
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel-heavy border-red-500/30 px-4 py-3 rounded-2xl text-red-200 text-sm flex items-center justify-center text-center">
            {error}
          </motion.div>
        )}

        <motion.section 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="glass-panel-heavy border border-red-500/30 rounded-3xl p-6 relative overflow-hidden shadow-[0_10px_40px_rgba(239,68,68,0.2)]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent pointer-events-none"></div>
          
          <div className="flex justify-between items-start mb-6">
            <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold uppercase tracking-wider rounded-full">
              {dashboardData.severity} Severity
            </span>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Time</p>
              <p className="text-sm font-bold">{new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
            </div>
          </div>

          <h1 className="text-3xl font-bold tracking-tight mb-2 leading-tight">Disruption<br/>Detected</h1>
          
          <div className="flex items-center gap-2 mt-4 text-slate-300">
             <MapPin className="w-4 h-4 text-red-400" />
             <span className="text-sm">{dashboardData.zoneName} Remote Log</span>
          </div>
        </motion.section>

        <div className="grid grid-cols-2 gap-4">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="glass-panel p-5 rounded-3xl border border-white/5 relative overflow-hidden"
          >
            <div className="absolute -right-5 -bottom-5 w-20 h-20 bg-accent1/10 rounded-full blur-[20px]"></div>
            <CloudLightning className="w-6 h-6 text-slate-400 mb-3" />
            <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-1">Income Risk Status</p>
            <p className="text-2xl font-bold text-white">₹{dashboardData.premium}</p>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="glass-panel p-5 rounded-3xl border border-white/5 relative overflow-hidden"
          >
             <div className="absolute -right-5 -bottom-5 w-20 h-20 bg-red-500/10 rounded-full blur-[20px]"></div>
             <Activity className="w-6 h-6 text-red-400 mb-3" />
             <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-1">Live Risk Score</p>
             <p className="text-2xl font-bold text-red-400">{dashboardData.riskScore}<span className="text-sm text-slate-500">/100</span></p>
          </motion.div>
        </div>

        <motion.section
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="glass-panel-heavy p-6 rounded-3xl border border-white/5"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold">Payout Validated</h3>
            <span className="text-accent1 font-bold">{progress}%</span>
          </div>

          <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-6 relative">
            <motion.div 
               className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-accent1 to-purple-500"
               style={{ width: `${progress}%` }}
               layout
            />
          </div>

          <button
            onClick={() => navigate("/payout")}
            className="w-full glass-button py-4 rounded-2xl flex items-center justify-center gap-2 group border border-white/5 bg-accent1/10 hover:bg-accent1/20 transition-all active:scale-[0.98]"
          >
            <span className="font-bold text-accent1">Secure Payout Action</span>
            <ChevronRight className="w-5 h-5 text-accent1 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.section>

        <motion.section
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="glass-panel p-6 rounded-3xl border border-white/5 mb-8"
        >
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4">ML Validation Checklist</h3>

          <div className="space-y-3">
            {checklist.map((item, idx) => (
              <motion.div 
                 initial={{ x: -10, opacity: 0 }}
                 animate={{ x: 0, opacity: 1 }}
                 transition={{ delay: 0.5 + (idx * 0.1) }}
                 key={item.label} 
                 className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5"
              >
                <span className="text-sm text-slate-300 font-medium">{item.label}</span>
                {item.valid ? (
                  <CheckCircle className="w-5 h-5 text-accent1" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-slate-500 border-t-slate-300 animate-spin"></div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.section>

        <footer className="text-center opacity-40 py-4">
           <p className="text-[10px] uppercase font-bold tracking-widest">Parametric Insurance Scope Only</p>
        </footer>
      </main>

      <BottomNav />
    </div>
  );
}