import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, ShieldAlert, Zap, CloudRain, 
  Wind, Activity, Check, ChevronRight, AlertTriangle 
} from "lucide-react";

/**
 * Renders plan selection and stores selected plan to rider profile.
 * High-end visual redesign with glassmorphism and dynamic interactions.
 * @returns {JSX.Element}
 */
export default function RiskProfiling() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState("");
  const [error, setError] = useState("");

  const handlePlanSelect = async (plan) => {
    const planPriceMap = { Basic: 25, Standard: 45, Pro: 75 };

    if (!user) {
      setError("You must be logged in to select a plan.");
      return;
    }

    setLoadingPlan(plan);
    setError("");

    try {
      let riderId = user.id;

      // Ensure we have the correct rider record, fallback to phone mapping if needed
      const { data: riderById, error: riderByIdError } = await supabase
        .from("riders")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (riderByIdError) throw riderByIdError;

      if (!riderById) {
        const { data: riderByPhone, error: riderByPhoneError } = await supabase
          .from("riders")
          .select("id")
          .eq("phone_number", user.phone || "")
          .maybeSingle();

        if (riderByPhoneError) throw riderByPhoneError;
        if (!riderByPhone) throw new Error("Rider profile not found. Please log in again.");

        riderId = riderByPhone.id;
      }

      const { error: updateError } = await supabase
        .from("riders")
        .update({
          selected_plan: plan,
          plan_premium: planPriceMap[plan]
        })
        .eq("id", riderId);

      if (updateError) throw updateError;

      // Log the event
      await supabase.from('app_logs').insert([{ 
        action: 'plan_selected', 
        user_id: user.id, 
        metadata: { plan, premium: planPriceMap[plan] } 
      }]);

      navigate("/wallet-setup");
    } catch (selectError) {
      setError(selectError.message || "Failed to save selected plan.");
    } finally {
      setLoadingPlan("");
    }
  };

  const plans = [
    {
      name: "Basic",
      price: 25,
      tag: "Entry Protection",
      features: ["50% income coverage", "Rain & Flood triggers"],
      missing: ["No AQI coverage"],
      color: "slate",
      recommended: false
    },
    {
      name: "Pro",
      price: 75,
      tag: "Maximum Shield",
      features: ["100% income coverage", "All Weather Events", "Strikes & Curfews", "AQI / Pollution Lockdown"],
      missing: [],
      color: "cyan",
      recommended: true
    },
    {
      name: "Standard",
      price: 45,
      tag: "Balanced Shield",
      features: ["80% income coverage", "Weather disruptions", "Strikes & Curfews"],
      missing: [],
      color: "purple",
      recommended: false
    }
  ];

  return (
    <div className="min-h-screen bg-background text-slate-200 pb-24 relative overflow-hidden">
      {/* Mesh Background */}
      <div className="absolute inset-0 bg-mesh opacity-40 z-0 pointer-events-none"></div>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-surface/30 backdrop-blur-2xl border-b border-white/5 flex justify-between items-center px-6 h-[72px]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-cyan flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.4)]">
            <ShieldCheck className="w-6 h-6 text-slate-900" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-white">GigShield <span className="text-accent1">AI</span></h1>
        </div>
        <button 
          className="w-10 h-10 rounded-full glass-button flex items-center justify-center group"
          onClick={() => {
            supabase.from('app_logs').insert([{ action: 'rider_bell_click', user_id: user?.id }]).then();
          }}
        >
          <Activity className="w-5 h-5 text-slate-400 group-hover:text-accent1 transition-colors" />
        </button>
      </header>

      <main className="pt-28 pb-20 px-4 max-w-lg mx-auto relative z-10">
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-8 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-200 text-sm flex items-center gap-3"
            >
              <AlertTriangle className="w-5 h-5 text-red-400" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hero Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <div className="inline-flex items-center gap-2 bg-red-500/10 px-4 py-1.5 rounded-full border border-red-500/30 mb-6 mx-auto">
            <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse" />
            <span className="text-[10px] uppercase tracking-widest font-bold text-red-400">High Risk Alert</span>
          </div>

          <h2 className="text-4xl font-extrabold text-white mb-4 tracking-tight leading-tight">
            Predictive Risk: <span className="text-accent1">Elevated</span>
          </h2>

          <p className="text-slate-400 text-base leading-relaxed">
            AI predicts a <span className="text-white font-bold">65% probability</span> of income loss
            this week due to monsoon activity and AQI restrictions.
          </p>
        </motion.section>

        {/* Pricing Cards */}
        <div className="space-y-6">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * (idx + 1) }}
              className={`relative p-1 rounded-[2rem] overflow-hidden ${plan.recommended ? "bg-gradient-to-tr from-accent1 to-purple-500 p-[2px]" : "bg-white/5"}`}
            >
              <div className={`p-8 rounded-[1.9rem] flex flex-col h-full bg-slate-950/80 backdrop-blur-xl border border-white/5`}>
                {plan.recommended && (
                  <div className="absolute top-0 right-10 -translate-y-1/2 bg-accent1 text-slate-900 font-black px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest shadow-[0_4px_15px_rgba(0,240,255,0.4)]">
                    Direct AI Choice
                  </div>
                )}

                <div className="mb-6 flex justify-between items-start">
                  <div>
                    <span className={`text-[10px] uppercase font-bold tracking-widest mb-1 block ${plan.recommended ? "text-accent1" : "text-slate-500"}`}>
                      {plan.tag}
                    </span>
                    <h3 className="text-2xl font-black text-white">{plan.name}</h3>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-baseline justify-end gap-1">
                      <span className={`text-3xl font-black ${plan.recommended ? "text-accent1" : "text-white"}`}>₹{plan.price}</span>
                      <span className="text-xs text-slate-400">/wk</span>
                    </div>
                  </div>
                </div>

                <ul className="space-y-3 mb-8 flex-grow">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-3 text-sm text-slate-300">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-emerald-400" />
                      </div>
                      {f}
                    </li>
                  ))}
                  {plan.missing.map(m => (
                    <li key={m} className="flex items-center gap-3 text-sm text-slate-500 opacity-60">
                      <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-3 h-3 text-slate-600" />
                      </div>
                      {m}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePlanSelect(plan.name)}
                  disabled={loadingPlan.length > 0}
                  className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 ${
                    plan.recommended 
                      ? "bg-gradient-cyan text-slate-900 shadow-[0_10px_25px_rgba(0,240,255,0.2)]" 
                      : "glass-button text-white"
                  }`}
                >
                  {loadingPlan === plan.name ? (
                    <Activity className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>{plan.recommended ? "Activate Shield" : `Select ${plan.name}`}</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer Notice */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 p-6 rounded-3xl glass-panel text-center border-white/5"
        >
          <p className="text-[10px] uppercase tracking-[0.2em] text-red-400/70 font-bold mb-4">
            Income Protection Protocol Only
          </p>

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            <span className="flex items-center gap-1.5"><Zap className="w-3 h-3" /> No Health</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-3 h-3" /> No Life</span>
            <span className="flex items-center gap-1.5"><Activity className="w-3 h-3" /> No Accident</span>
          </div>
        </motion.div>
      </main>
    </div>
  );
}