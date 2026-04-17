import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import BottomNav from "../components/BottomNav";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Wallet as WalletIcon, ArrowUpRight, ArrowDownRight, Clock, ChevronRight } from "lucide-react";

/**
 * Renders rider wallet using live transaction history from Supabase.
 * @returns {JSX.Element}
 */
export default function Wallet() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [showAllHistory, setShowAllHistory] = useState(false);

  useEffect(() => {
    const fetchWalletData = async () => {
      if (!user) {
        setError("Authenticated user not found.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        if (user.id === '99999999-9999-9999-9999-999999999999') {
          const demoTransactions = [
            { id: '1', type: 'payout', amount: 1200, created_at: new Date().toISOString(), description: 'Automated Payout - Heavy Rain' },
            { id: '2', type: 'premium', amount: 125, created_at: new Date(Date.now() - 86400000).toISOString(), description: 'Weekly Premium Debit' },
            { id: '3', type: 'premium', amount: 125, created_at: new Date(Date.now() - 86400000 * 8).toISOString(), description: 'Weekly Premium Debit' }
          ];
          setTransactions(demoTransactions);
          setLoading(false);
          return;
        }

        let riderId = user.id;

        const { data: riderById, error: riderByIdError } = await supabase
          .from("riders")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        if (riderByIdError) {
          throw riderByIdError;
        }

        if (!riderById) {
          const { data: riderByPhone, error: riderByPhoneError } = await supabase
            .from("riders")
            .select("id")
            .eq("phone_number", user.phone || "")
            .maybeSingle();

          if (riderByPhoneError) {
            throw riderByPhoneError;
          }

          if (!riderByPhone) {
            throw new Error("Rider profile record not found.");
          }

          riderId = riderByPhone.id;
        }

        const { data: txData, error: txError } = await supabase
          .from("transactions")
          .select("*")
          .eq("rider_id", riderId)
          .order("created_at", { ascending: false });

        if (txError) {
          throw txError;
        }

        setTransactions(txData || []);
      } catch (walletError) {
        setError(walletError.message || "Failed to load wallet transactions.");
      } finally {
        setLoading(false);
      }
    };

    fetchWalletData();
  }, [user]);

  const totals = useMemo(() => {
    const payoutTotal = transactions
      .filter((tx) => tx.type === "payout")
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

    const premiumTotal = transactions
      .filter((tx) => tx.type === "premium")
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

    return {
      protectedEarnings: payoutTotal - premiumTotal,
      payoutTotal,
      cycleProgress: payoutTotal > 0 ? Math.min(Math.round((payoutTotal / (payoutTotal + premiumTotal + 1)) * 100), 100) : 0
    };
  }, [transactions]);

  const progressClass =
    totals.cycleProgress >= 90
      ? "w-full"
      : totals.cycleProgress >= 75
        ? "w-3/4"
        : totals.cycleProgress >= 50
          ? "w-1/2"
          : totals.cycleProgress >= 25
            ? "w-1/4"
            : "w-0";

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-white pb-24 overflow-x-hidden relative flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-accent1/30 border-t-accent1 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-slate-200 pb-24 relative overflow-hidden">
      {/* Mesh Background */}
      <div className="absolute inset-0 bg-mesh opacity-40 z-0 pointer-events-none"></div>

      {/* Header */}
      <header className="fixed top-0 w-full z-40 bg-surface/30 backdrop-blur-2xl border-b border-white/5 flex justify-between items-center px-6 h-[72px]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-cyan flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.4)] border border-accent1/20">
            <ShieldCheck className="w-6 h-6 text-slate-900" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-white">Wallet</h1>
        </div>
        <button 
          onClick={() => navigate("/dashboard")}
          className="glass-button px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2"
        >
          Back
        </button>
      </header>

      <main className="pt-24 px-4 max-w-lg mx-auto z-10 relative space-y-6">
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel-heavy border-red-500/30 px-4 py-3 rounded-2xl text-red-200 text-sm flex items-center justify-center text-center">
            {error}
          </motion.div>
        )}

        <motion.section 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-panel-heavy p-6 rounded-3xl border border-white/10 relative overflow-hidden"
        >
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-accent1/20 blur-[50px] rounded-full pointer-events-none"></div>
          
          <div className="flex justify-between items-start mb-6">
             <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Protected Balance</p>
             <span className="glass-panel px-2 py-1 text-[10px] text-accent1 rounded-full border border-accent1/30">Live Sync</span>
          </div>
          
          <h2 className="text-4xl font-bold text-white mb-2 tracking-tight">₹{Math.max(totals.protectedEarnings, 0).toFixed(2)}</h2>
          <p className="text-sm text-slate-400 flex items-center gap-1">
             <ArrowUpRight className="w-4 h-4 text-cyan-400" />
             <span className="text-cyan-400">₹{totals.payoutTotal.toFixed(2)}</span> total payouts received
          </p>
        </motion.section>

        <motion.section
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex justify-between items-center mb-4 px-2">
            <h4 className="text-lg font-bold">Recent History</h4>
            <span 
              className="text-accent1 text-xs font-semibold cursor-pointer hover:text-white transition-colors"
              onClick={() => {
                setShowAllHistory(!showAllHistory);
                supabase.from('app_logs').insert([{ action: 'toggle_wallet_history', user_id: user?.id }]).then();
              }}
            >
              {showAllHistory ? "View Less" : "View All"}
            </span>
          </div>

          <div className="space-y-3">
            {transactions.length === 0 ? (
              <div className="glass-panel p-8 rounded-3xl flex flex-col items-center justify-center text-center border border-white/5">
                <Clock className="w-8 h-8 text-slate-500 mb-3" />
                <p className="text-slate-400 text-sm">No transactions found yet.</p>
              </div>
            ) : (
              (showAllHistory ? transactions : transactions.slice(0, 4)).map((tx, idx) => (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + (idx * 0.05) }}
                  key={tx.id}
                  className="glass-panel p-4 rounded-2xl border border-white/5 flex justify-between items-center group active:scale-[0.98] transition-transform"
                >
                  <div className="flex gap-4 items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === "payout" ? "bg-cyan-400/10" : "bg-white/5"}`}>
                       {tx.type === "payout" ? <ArrowDownRight className="w-5 h-5 text-cyan-400" /> : <ArrowUpRight className="w-5 h-5 text-slate-400" />}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-white group-hover:text-accent1 transition-colors">{tx.description || (tx.type === "payout" ? "Triggered Payout" : "Premium Debit")}</p>
                      <p className="text-[11px] text-slate-500">
                        {new Date(tx.created_at).toLocaleString("en-IN", {
                          day: "2-digit", month: "short",
                          hour: "2-digit", minute: "2-digit"
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className={`font-bold text-sm ${tx.type === "payout" ? "text-cyan-400" : "text-white"}`}>
                      {tx.type === "payout" ? "+" : "-"}₹{Number(tx.amount || 0).toFixed(2)}
                    </p>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.section>

        <motion.section
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="glass-panel p-6 rounded-3xl border border-white/5 text-center mt-6"
        >
           <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
             <Clock className="w-5 h-5 text-accent1" />
           </div>
           <p className="text-white text-sm font-semibold mb-1">Cycle Progress</p>
           <p className="text-xs text-slate-400 mb-4">{totals.cycleProgress}% of current payout flow active</p>
           
           <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mb-2 relative">
             <div className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-accent1 via-cyan-400 to-purple-400 z-10 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,240,255,0.5)]" style={{ width: `${totals.cycleProgress}%` }} />
           </div>

           <button
             onClick={() => navigate("/dashboard")}
             className="mt-6 w-full glass-button py-3.5 rounded-2xl text-accent1 font-bold active:scale-[0.98] transition-transform text-sm"
           >
             Back to Core Dashboard
           </button>
        </motion.section>
      </main>

      <BottomNav />
    </div>
  );
}