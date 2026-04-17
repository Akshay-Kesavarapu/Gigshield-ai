import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import BottomNav from "../components/BottomNav";
import { motion } from "framer-motion";
import { ShieldCheck, UserCircle, LogOut, ChevronRight, MapPin, Phone, CreditCard, Shield } from "lucide-react";

/**
 * Renders rider profile with live data from Supabase.
 * @returns {JSX.Element}
 */
export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [riderProfile, setRiderProfile] = useState({
    fullName: "-",
    phoneNumber: "-",
    zoneName: "-",
    upiId: "not-set@upi",
    planName: "Standard",
    protectedEarnings: 0,
    coverageEnds: "-"
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setError("Authenticated user not found.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        if (user.id === '99999999-9999-9999-9999-999999999999') {
          setRiderProfile({
            fullName: "Aditya (Demo)",
            phoneNumber: "+91 88888 88888",
            zoneName: "Metro Center",
            upiId: "aditya_demo@upi",
            planName: "Premium Shield",
            protectedEarnings: 1200,
            coverageEnds: "Auto-Renews in 2 Days"
          });
          setLoading(false);
          return;
        }

        let riderRecord = null;

        const { data: riderById, error: riderByIdError } = await supabase
          .from("riders")
          .select("*, zones(*)")
          .eq("id", user.id)
          .maybeSingle();

        if (riderByIdError) {
          throw riderByIdError;
        }

        riderRecord = riderById;



        if (!riderRecord) {
          throw new Error("Rider profile record not found.");
        }

        const { data: latestPayout, error: payoutError } = await supabase
          .from("transactions")
          .select("amount")
          .eq("rider_id", riderRecord.id)
          .eq("type", "payout")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (payoutError) {
          throw payoutError;
        }

        setRiderProfile({
          fullName: riderRecord.full_name || "-",
          phoneNumber: riderRecord.phone_number || user.phone || "-",
          zoneName: riderRecord.zones?.zone_name || "Unassigned Zone",
          upiId: riderRecord.upi_id || `${(riderRecord.full_name || "rider").toLowerCase().replace(/\\s+/g, "")}@upi`,
          planName: riderRecord.selected_plan || "Standard",
          protectedEarnings: Math.round(Number(latestPayout?.amount || 0)),
          coverageEnds: "Weekly Auto-Renew"
        });
      } catch (profileError) {
        setError(profileError.message || "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleLogout = async () => {
    setError("");

    try {
      const { success, error: logoutError } = await logout();

      if (!success) {
        setError(logoutError || "Failed to logout.");
        return;
      }

      navigate("/");
    } catch (logoutError) {
      setError(logoutError.message || "Failed to logout.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-white pb-24 overflow-x-hidden relative flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-accent1/30 border-t-accent1 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white pb-24 overflow-x-hidden relative">
      {/* App Header */}
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
             <span className="font-bold text-sm">Identity & Settings</span>
           </div>
           <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
             <UserCircle className="w-4 h-4 text-accent1" />
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
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col items-center justify-center mb-8 mt-2"
        >
          <div className="w-24 h-24 rounded-[30px] bg-gradient-to-tr from-accent1 to-purple-500 flex items-center justify-center shadow-[0_10px_30px_rgba(0,240,255,0.3)] mb-4 rotate-3 group overflow-hidden">
            <UserCircle className="w-12 h-12 text-white -rotate-3" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">{riderProfile.fullName}</h2>
          <div className="flex items-center gap-2 mt-2 px-3 py-1 glass-panel rounded-full border border-accent1/30">
            <span className="relative w-2 h-2 rounded-full bg-accent1 shadow-[0_0_8px_rgba(0,240,255,0.8)] animate-pulse"></span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-accent1">{riderProfile.planName}</span>
          </div>
        </motion.section>

        <motion.section 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-panel-heavy rounded-3xl p-2 border border-white/5"
        >
          <div className="flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Contact Number</p>
                  <p className="text-sm font-bold text-white">{riderProfile.phoneNumber}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Active Risk Zone</p>
                  <p className="text-sm font-bold text-white">{riderProfile.zoneName}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">UPI Payout Route</p>
                  <p className="text-sm font-bold text-white">{riderProfile.upiId}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex gap-4"
        >
          <div className="flex-1 glass-panel-heavy p-5 rounded-3xl border border-white/5 flex flex-col justify-between">
            <Shield className="w-6 h-6 text-cyan-400 mb-3" />
            <p className="text-xs text-slate-500 font-medium mb-1">Protected Earnings</p>
            <p className="text-2xl font-bold text-white">₹{riderProfile.protectedEarnings}</p>
          </div>
          <div className="flex-1 glass-panel p-5 rounded-3xl border border-white/5 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute right-0 bottom-0 w-24 h-24 bg-purple-500/10 blur-[20px] rounded-full pointer-events-none"></div>
            <div className="w-6 h-6 rounded-full border-2 border-slate-500 mb-3 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-slate-400"></div>
            </div>
            <p className="text-xs text-slate-500 font-medium mb-1">Coverage Ends</p>
            <p className="text-sm font-bold text-white leading-tight">{riderProfile.coverageEnds}</p>
          </div>
        </motion.section>

        <motion.section 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6"
        >
          <button 
            onClick={handleLogout}
            className="w-full glass-button py-4 rounded-3xl flex items-center justify-center gap-2 group border border-white/5 active:scale-[0.98] transition-all bg-red-500/10 hover:bg-red-500/20"
          >
            <LogOut className="w-5 h-5 text-red-400 group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold text-red-400">Sign Out Safely</span>
          </button>
        </motion.section>
      </main>

      <BottomNav />
    </div>
  );
}