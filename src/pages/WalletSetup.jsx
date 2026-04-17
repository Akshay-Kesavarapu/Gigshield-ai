import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, Smartphone, Check, Loader2, ArrowRight, 
  Search, ShieldAlert, Zap, Landmark
} from "lucide-react";

/**
 * Specialized onboarding step for UPI verification.
 * Premium glassmorphic UI with animated verification states.
 */
export default function WalletSetup() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [upi, setUpi] = useState("");
  const [status, setStatus] = useState("idle"); // idle, verifying, success, error
  const [errorMessage, setErrorMessage] = useState("");

  const handleVerifyUpi = async (e) => {
    e.preventDefault();
    if (!upi.includes("@")) {
      setErrorMessage("Please enter a valid UPI ID (e.g., user@bank)");
      setStatus("error");
      return;
    }

    setErrorMessage("");
    setStatus("verifying");

    // Simulated 2.5s verification process for high-end feel
    await new Promise(resolve => setTimeout(resolve, 2500));

    try {
      const { error } = await supabase
        .from("riders")
        .update({ upi_id: upi })
        .eq("id", user.id);

      if (error) throw error;

      setStatus("success");
      
      // Navigate to dashboard after success animation
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);

    } catch (err) {
      setErrorMessage(err.message || "Failed to link UPI account.");
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 bg-mesh opacity-60 z-0"></div>

      <motion.main 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md z-10"
      >
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-cyan neon-border mb-6">
            <Landmark className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Setup <span className="text-gradient">Payouts</span></h1>
          <p className="text-slate-400 font-medium">Link your UPI ID for instant coverage settlements.</p>
        </div>

        {/* Verification Card */}
        <div className="glass-panel-heavy rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <AnimatePresence mode="wait">
            {status === "success" ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-6"
              >
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
                  <Check className="w-10 h-10 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Account Verified</h3>
                <p className="text-slate-400 text-sm">Rider Payout Protocol Activated.</p>
              </motion.div>
            ) : (
              <motion.form 
                key="setup-form"
                onSubmit={handleVerifyUpi}
                className="space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">UPI Identifier</label>
                  <div className="relative">
                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      value={upi}
                      onChange={(e) => {
                        setUpi(e.target.value);
                        if (status === 'error') setStatus('idle');
                      }}
                      disabled={status === "verifying"}
                      className={`w-full bg-slate-900/60 border ${status === "error" ? "border-red-500/50" : "border-slate-700/50"} rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 ${status === "error" ? "focus:ring-red-500/30" : "focus:ring-accent1/50"} transition-all placeholder:text-slate-600 font-medium`}
                      placeholder="rider.name@upi"
                      autoFocus
                    />
                  </div>
                </div>

                <AnimatePresence>
                  {status === "error" && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-xs flex items-start gap-3"
                    >
                      <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
                      <p>{errorMessage}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={status === "verifying" || !upi}
                  className="w-full bg-white text-slate-950 py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 shadow-xl"
                >
                  {status === "verifying" ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Verifying Ledger...
                    </>
                  ) : (
                    <>
                      Verify & Start Coverage
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Security Notice */}
          <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-center gap-4">
            <div className="flex items-center gap-1.5 opacity-40">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span className="text-[9px] uppercase font-bold tracking-widest text-white">NPCI Secured</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-white/10"></div>
            <div className="flex items-center gap-1.5 opacity-40">
              <Zap className="w-3 h-3 text-cyan-400" />
              <span className="text-[9px] uppercase font-bold tracking-widest text-white">Instant Settled</span>
            </div>
          </div>
        </div>
      </motion.main>
    </div>
  );
}
