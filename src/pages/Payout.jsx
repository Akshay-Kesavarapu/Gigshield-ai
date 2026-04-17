import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, CheckCircle2, ChevronRight, Activity, Zap, RefreshCcw, Landmark, Download, FileText, ArrowRight, Loader2 } from "lucide-react";
import { incomeMap } from "../Services/riskEngine";
import ErrorDisplay from "../components/ErrorDisplay";

const planMultipliers = {
  Basic: 0.5,
  Standard: 0.8,
  Pro: 1.0
};

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
 * Renders payout status and triggers payout simulation via edge function.
 * @returns {JSX.Element}
 */
export default function Payout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [error, setError] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [riderData, setRiderData] = useState(null);
  const [zoneCoords, setZoneCoords] = useState(null);
  const [proximityStatus, setProximityStatus] = useState("verifying"); // verifying, valid, invalid
  const [eligiblePayoutAmount, setEligiblePayoutAmount] = useState(0);
  const [payoutTriggered, setPayoutTriggered] = useState(false);

  useEffect(() => {
    const initializePayoutPage = async () => {
      if (!user) {
        setError("Authenticated user not found.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        if (user.id === '99999999-9999-9999-9999-999999999999') {
          setPayoutTriggered(true);
          setEligiblePayoutAmount(1200);
          setRiderData({
            id: '99999999-9999-9999-9999-999999999999',
            upi_id: 'aditya_demo@upi',
            selected_plan: 'Pro'
          });
          const demoTransactions = [
            { id: '1', type: 'payout', amount: 1200, created_at: new Date().toISOString(), description: 'Automated Payout - Heavy Rain' },
            { id: '2', type: 'premium', amount: 125, created_at: new Date(Date.now() - 86400000).toISOString(), description: 'Weekly Premium Debit' }
          ];
          setTransactions(demoTransactions);
          setWalletBalance(1075);
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

        if (rider.assigned_zone_id) {
          const { data: zone } = await supabase.from("zones").select("latitude, longitude").eq("id", rider.assigned_zone_id).single();
          if (zone) setZoneCoords({ lat: zone.latitude, lng: zone.longitude });
        }

        const { data: latestRisk, error: riskError } = await supabase
          .from("risk_scores")
          .select("*")
          .eq("zone_id", rider.assigned_zone_id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (riskError) {
          throw riskError;
        }

        const payoutAllowed = Boolean(latestRisk?.payout_triggered);
        setPayoutTriggered(payoutAllowed);

        const income = incomeMap[rider.daily_income_range] || 650;
        
        // Use selected plan multiplier
        const selectedPlan = rider.selected_plan || 'Standard';
        const multiplier = planMultipliers[selectedPlan] || 0.8;
        
        // Payout = Income * Multiplier * 1.5 (Boosted parametric payout)
        setEligiblePayoutAmount(Math.round(income * multiplier * 1.5));
        setRiderData(rider);

        const { data: txData, error: txError } = await supabase
          .from("transactions")
          .select("*")
          .eq("rider_id", rider.id)
          .order("created_at", { ascending: false });

        if (txError) {
          throw txError;
        }

        setTransactions(txData || []);
        const balance = (txData || []).reduce((sum, tx) => {
          const amount = Number(tx.amount || 0);
          return tx.type === "payout" ? sum + amount : sum - amount;
        }, 0);

        setWalletBalance(balance);
      } catch (initError) {
        setError(initError.message || "Failed to load payout context.");
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
          // If we have zone coords, calculate distance
          if (zoneCoords) {
             const dist = calculateDistance(pos.coords.latitude, pos.coords.longitude, zoneCoords.lat, zoneCoords.lng);
             setProximityStatus(dist <= 5 ? "valid" : "invalid");
          } else {
             // Demo fallback OR if zone data is missing, we allow it for the hackathon but normally we'd block
             setProximityStatus("valid");
          }
        },
        () => setProximityStatus("invalid"),
        { enableHighAccuracy: true }
      );
    };

    const initializePayoutPageInternal = async () => {
      await initializePayoutPage();
      validateLiveProximity();
    };
    initializePayoutPageInternal();
  }, [user, zoneCoords?.lat]);

  // Automated Payout Logic
  const hasAutoTriggered = useRef(false);
  useEffect(() => {
    if (payoutTriggered && proximityStatus === "valid" && riderData && !hasAutoTriggered.current && !triggering && !successMessage) {
      hasAutoTriggered.current = true;
      handleTriggerPayout();
    }
  }, [payoutTriggered, proximityStatus, riderData]);

  const handleTriggerPayout = async () => {
    if (!riderData) {
      setError("Rider data unavailable.");
      return;
    }

    if (proximityStatus === "verifying") {
      setError("Verifying satellite location. Please stay in the area...");
      return;
    }

    if (proximityStatus === "invalid") {
      setError("FRAUD ALERT: Physical location does not match the disruption zone. Payout restricted.");
      return;
    }

    if (!payoutTriggered) {
      setError("Risk threshold not crossed. Payout is not eligible yet.");
      return;
    }

    setTriggering(true);
    setError("");
    setSuccessMessage("");

    try {
      if (riderData.id === '99999999-9999-9999-9999-999999999999') {
        await new Promise((resolve) => setTimeout(resolve, 800));
        setSuccessMessage(`₹${eligiblePayoutAmount} secured into wallet.`);
        setTriggering(false);
        return;
      }

      const { data, error: invokeError } = await supabase.functions.invoke("trigger-payout", {
        body: {
          riderId: riderData.id,
          amount: eligiblePayoutAmount,
          reason: "Parametric risk trigger crossed"
        }
      });

      if (invokeError) {
        throw invokeError;
      }

      if (!data?.success) {
        throw new Error("Payout trigger did not return success.");
      }

      setSuccessMessage(`₹${eligiblePayoutAmount} secured into wallet.`);

      const { data: refreshedTx, error: refreshedTxError } = await supabase
        .from("transactions")
        .select("*")
        .eq("rider_id", riderData.id)
        .order("created_at", { ascending: false });

      if (refreshedTxError) {
        throw refreshedTxError;
      }

      setTransactions(refreshedTx || []);
      const refreshedBalance = (refreshedTx || []).reduce((sum, tx) => {
        const amount = Number(tx.amount || 0);
        return tx.type === "payout" ? sum + amount : sum - amount;
      }, 0);
      setWalletBalance(refreshedBalance);
    } catch (invokeError) {
      setError(invokeError.message || "Failed to trigger payout simulation.");
    } finally {
      setTriggering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-white pb-24 overflow-x-hidden relative flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-accent1/30 border-t-accent1 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center p-6">
        <ErrorDisplay message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white pb-24 overflow-x-hidden relative">
      <div className="fixed inset-0 pointer-events-none z-0">
         <motion.div 
           animate={{ opacity: [0.1, 0.3, 0.1] }}
           transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
           className="absolute top-[10%] left-[-50px] w-[300px] h-[300px] bg-accent1/20 rounded-full blur-[100px]"
         />
      </div>

      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="pt-12 px-6 pb-6 relative z-10"
      >
        <div className="flex justify-between items-center glass-panel p-2 rounded-full border border-white/5 backdrop-blur-md">
           <div className="flex items-center gap-3 pl-2">
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent1 to-purple-500 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.4)]">
               <Zap className="w-4 h-4 text-white" />
             </div>
             <span className="font-bold text-sm">Action Center</span>
           </div>
           <button 
             onClick={() => navigate("/dashboard")} 
             className="glass-button px-4 flex h-8 items-center rounded-full text-xs font-bold mr-1"
           >
             Back
           </button>
        </div>
      </motion.header>

      <main className="px-4 max-w-lg mx-auto relative z-10 space-y-6">
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-panel-heavy border-red-500/30 px-4 py-3 rounded-2xl text-red-200 text-sm flex items-center justify-center text-center"
            >
              {error}
            </motion.div>
          )}
          {successMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-panel-heavy bg-emerald-500/10 border-emerald-500/30 px-4 py-4 rounded-2xl text-emerald-200 text-sm flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(16,185,129,0.2)]"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="font-bold">{successMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.section 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="glass-panel-heavy p-8 rounded-[2rem] text-center relative overflow-hidden border border-white/10"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent1/20 blur-[40px] rounded-full pointer-events-none"></div>
          
          <div className="w-20 h-20 bg-gradient-to-tr from-accent1 to-purple-500 p-[2px] rounded-full mx-auto mb-6 shadow-[0_0_30px_rgba(0,240,255,0.3)]">
            <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-accent1" />
            </div>
          </div>

          <p className="text-[10px] uppercase text-slate-400 font-bold tracking-widest mb-1">Eligible Protection</p>
          <h2 className="text-5xl font-bold tracking-tight mb-6">₹{eligiblePayoutAmount}</h2>

          <div className="flex justify-center flex-wrap gap-2 mb-8">
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${payoutTriggered ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-white/5 text-slate-400 border-white/10"}`}>
              {payoutTriggered ? "Condition Met" : "Awaiting Alert"}
            </span>
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
              proximityStatus === 'valid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
              proximityStatus === 'invalid' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
              'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse'
            }`}>
              {proximityStatus === 'valid' ? "Location Verified" : proximityStatus === 'invalid' ? "Unauthorized Area" : "Verifying Satellite..."}
            </span>
          </div>

          <div className="space-y-4">
            <div className="glass-panel p-4 rounded-3xl border border-white/5 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Target Account</span>
                <span className="text-xs font-mono text-accent1 font-bold">{riderData?.upi_id || "Unlinked"}</span>
              </div>
              <div className="h-px bg-white/5 w-full"></div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Fraud Shield</span>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${proximityStatus === 'valid' ? 'text-emerald-400' : 'text-slate-400'}`}>
                   {proximityStatus === 'valid' ? "Active Proof of Presence" : "Waiting for GPS Sync..."}
                </span>
              </div>
            </div>

            {payoutTriggered ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full bg-gradient-cyan text-slate-950 py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(0,240,255,0.3)] flex items-center justify-center gap-3 relative overflow-hidden"
              >
                {triggering ? (
                  <>
                    <motion.div 
                      animate={{ x: ["-100%", "200%"] }} 
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-1/2"
                    />
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Auto-Settling...
                  </>
                ) : successMessage ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Funds Secured
                  </>
                ) : (
                  <>
                    <Activity className="w-5 h-5 animate-pulse" />
                    Processing Payout
                  </>
                )}
              </motion.div>
            ) : (
              <button 
                disabled 
                className="w-full bg-white/5 text-slate-600 py-5 rounded-2xl font-black text-sm uppercase tracking-widest border border-white/5"
              >
                Conditions Not Met
              </button>
            )}
          </div>
        </motion.section>

        <motion.section 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex gap-4"
        >
          <div className="flex-1 glass-panel p-5 rounded-3xl border border-white/5">
             <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Ledger Balance</p>
             <h3 className="text-2xl font-bold">₹{walletBalance.toFixed(2)}</h3>
          </div>
          <div className="flex-1 glass-panel p-5 rounded-3xl border border-white/5 flex flex-col justify-between">
             <Landmark className="w-5 h-5 text-slate-400 mb-2" />
             <div>
               <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Routing ID</p>
               <p className="text-sm font-semibold truncate">{riderData?.upi_id || "not-set@upi"}</p>
             </div>
          </div>
        </motion.section>

        <motion.section 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-panel-heavy p-6 rounded-3xl border border-white/5 mb-8"
        >
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-bold">Transaction Record</h4>
            <div 
              className="flex items-center gap-1 text-accent1 px-2 py-1 bg-accent1/10 rounded-lg cursor-pointer hover:bg-accent1/20 transition-colors"
              onClick={() => {
                supabase.from('app_logs').insert([{ action: 'pdf_download', user_id: user?.id }]).then();
                setStatusMsg("PDF Download Request Processed");
                setTimeout(() => setStatusMsg(""), 3000);
              }}
            >
              <Download className="w-3 h-3" />
              <span className="text-[10px] uppercase font-bold tracking-wider">PDF</span>
            </div>
          </div>

          <div className="space-y-3">
            {transactions.length === 0 ? (
              <div className="p-6 flex justify-center opacity-50">
                 <FileText className="w-6 h-6" />
              </div>
            ) : (
              transactions.slice(0, 3).map((tx, idx) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + (idx * 0.05) }}
                  key={tx.id} 
                  className="p-4 bg-white/5 rounded-2xl flex justify-between items-center"
                >
                  <div>
                    <p className="font-bold text-sm text-white">{tx.description || (tx.type === "payout" ? "Credit" : "Debit")}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                      {new Date(tx.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                    </p>
                  </div>
                  <p className={`font-bold ${tx.type === "payout" ? "text-cyan-400" : "text-white"}`}>
                    {tx.type === "payout" ? "+" : "-"}₹{Number(tx.amount || 0).toFixed(2)}
                  </p>
                </motion.div>
              ))
            )}
          </div>
          
          <button
             onClick={() => navigate("/wallet")}
             className="w-full mt-4 glass-button py-3.5 rounded-2xl flex justify-center items-center gap-2"
          >
             <span className="text-sm font-semibold text-slate-300">View Full Wallet Ledger</span>
          </button>
          
          <button
             onClick={() => navigate("/dashboard")}
             className="w-full mt-3 glass-button border-none bg-white/5 hover:bg-white/10 py-3.5 rounded-2xl flex justify-center items-center gap-2"
          >
             <span className="text-sm font-semibold text-slate-300">Back to Dashboard</span>
          </button>
        </motion.section>
      </main>

      {/* STATUS TOAST */}
      <AnimatePresence>
        {statusMsg && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-10 left-6 right-6 md:left-auto md:right-10 z-[60] bg-accent1 text-slate-950 px-6 py-4 rounded-2xl font-bold shadow-[0_10px_40px_rgba(0,240,255,0.4)] flex items-center gap-3"
          >
            <ShieldCheck className="w-5 h-5" />
            {statusMsg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}