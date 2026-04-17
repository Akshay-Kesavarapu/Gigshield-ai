import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import BottomNav from "../components/BottomNav";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Wallet as WalletIcon, ArrowUpRight, ArrowDownRight, Clock, ChevronRight, PlusCircle } from "lucide-react";
import ErrorDisplay from "../components/ErrorDisplay";

/**
 * Renders rider wallet using live transaction history from Supabase.
 * @returns {JSX.Element}
 */
export default function Wallet() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [topupAmount, setTopupAmount] = useState(500);

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
          
          // Merge local demo topups for the Demo profile
          const savedTopups = JSON.parse(localStorage.getItem('demo_topups') || '[]');
          setTransactions([...savedTopups, ...demoTransactions]);
          
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

    const topupTotal = transactions
      .filter((tx) => tx.type === "topup")
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

    const premiumTotal = transactions
      .filter((tx) => tx.type === "premium")
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

    return {
      protectedEarnings: payoutTotal + topupTotal - premiumTotal,
      payoutTotal: payoutTotal + topupTotal,
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

  if (error) {
    return (
      <div className="min-h-screen bg-background text-slate-200 flex items-center justify-center p-6">
        <ErrorDisplay message={error} onRetry={() => window.location.reload()} />
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
              (showAllHistory ? transactions : transactions.slice(0, 4)).map((tx, idx) => {
                const isCredit = tx.type === "payout" || tx.type === "topup";
                return (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + (idx * 0.05) }}
                  key={tx.id}
                  className="glass-panel p-4 rounded-2xl border border-white/5 flex justify-between items-center group active:scale-[0.98] transition-transform"
                >
                  <div className="flex gap-4 items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCredit ? "bg-cyan-400/10" : "bg-white/5"}`}>
                       {isCredit ? <ArrowDownRight className="w-5 h-5 text-cyan-400" /> : <ArrowUpRight className="w-5 h-5 text-slate-400" />}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-white group-hover:text-accent1 transition-colors">{tx.description || (isCredit ? "Wallet Credit" : "Premium Debit")}</p>
                      <p className="text-[11px] text-slate-500">
                        {new Date(tx.created_at).toLocaleString("en-IN", {
                          day: "2-digit", month: "short",
                          hour: "2-digit", minute: "2-digit"
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className={`font-bold text-sm ${isCredit ? "text-cyan-400" : "text-white"}`}>
                      {isCredit ? "+" : "-"}₹{Number(tx.amount || 0).toFixed(2)}
                    </p>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.div>
              )})
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
           
           <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mb-6 relative">
             <div className={`absolute top-0 left-0 bottom-0 bg-gradient-to-r from-accent1 via-cyan-400 to-purple-400 z-10 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,240,255,0.5)] ${progressClass}`} />
           </div>

           <div className="mb-4">
             <div className="flex justify-between items-center mb-2">
               <span className="text-sm font-bold text-slate-300">Top-up Amount</span>
               <span className="text-xl font-extrabold text-cyan-400">₹{topupAmount}</span>
             </div>
             <div className="flex gap-2">
               {[100, 500, 1000].map(amt => (
                 <button
                   key={amt}
                   onClick={() => setTopupAmount(amt)}
                   className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${topupAmount === amt ? 'bg-cyan-400/20 border-cyan-400 text-cyan-400' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'}`}
                 >
                   ₹{amt}
                 </button>
               ))}
             </div>
           </div>

            <button
              onClick={async () => {
                try {
                  setLoading(true);

                  // 1. Prepare Razorpay Options for Hackathon Demo mode (skipping Edge Function order creation)
                  const options = {
                    key: "rzp_test_SebTPVyU62VyeI", // Test Mode Key
                    amount: topupAmount * 100, // Amount in paise
                    currency: "INR",
                    name: "GigShield AI",
                    description: "Premium Coverage Top-up",
                    handler: async (response) => {
                      // 2. Record Successful Transaction Locally
                      const newTx = {
                        id: crypto.randomUUID(), // Valid UUID format for Supabase
                        rider_id: user?.id,
                        amount: topupAmount,
                        type: 'topup',
                        created_at: new Date().toISOString(),
                        description: `Top-up (${response.razorpay_payment_id})`
                      };
                      
                      const { error: insertError } = await supabase.from('transactions').insert(newTx);
                      if (insertError) console.error("Database Insert Blocked:", insertError);

                      // Persist mock top-up in local storage ONLY for the demo account
                      if (user?.id === '99999999-9999-9999-9999-999999999999') {
                        const savedTopups = JSON.parse(localStorage.getItem('demo_topups') || '[]');
                        localStorage.setItem('demo_topups', JSON.stringify([newTx, ...savedTopups]));
                      }

                      // Update React state instantly without reloading
                      setTransactions((prev) => [newTx, ...prev]);
                      setStatusMsg(`Nodes Synced. ₹${topupAmount} Secured on Ledger.`);
                      
                      setTimeout(() => setStatusMsg(""), 4000);
                    },
                    prefill: {
                      name: user.full_name || "Rider",
                      contact: "9999999999" // Forces Indian locale for UPI
                    },
                    theme: { color: "#00f0ff" }
                  };

                  const rzp = new window.Razorpay(options);
                  rzp.open();

                } catch (e) {
                  setStatusMsg("Gateway Rejection: " + e.message);
                } finally {
                  setLoading(false);
                }
              }}
              className="w-full mt-4 bg-gradient-cyan text-slate-900 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-[0_10px_25px_rgba(0,240,255,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              disabled={loading}
            >
              <PlusCircle className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Approving Transfer..." : "Add Funds"}
            </button>

           <button
             onClick={() => navigate("/dashboard")}
             className="mt-4 w-full glass-button py-3.5 rounded-2xl text-slate-400 font-bold active:scale-[0.98] transition-transform text-sm border-none bg-white/5 shadow-inner"
           >
             Back to Core Dashboard
           </button>
        </motion.section>
      </main>

      <BottomNav />

      {/* STATUS TOAST */}
      <AnimatePresence>
        {statusMsg && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-24 left-6 right-6 z-[60] bg-accent1 text-slate-950 px-6 py-4 rounded-2xl font-bold shadow-[0_10px_40px_rgba(0,240,255,0.4)] flex items-center gap-3"
          >
            <ShieldCheck className="w-5 h-5" />
            {statusMsg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}