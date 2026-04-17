import { motion } from "framer-motion";
import { AlertCircle, RefreshCcw } from "lucide-react";

/**
 * Reusable, premium error display for in-page failures.
 * Translates technical issues into user-friendly English.
 */
export default function ErrorDisplay({ message, onRetry }) {
  // Simple translator for common technical codes
  const getFriendlyMessage = (msg) => {
    if (msg.includes("PGRST116") || msg.includes("not found")) {
      return "We couldn't locate your secure profile. If you're new, it might still be synchronized with the ledger.";
    }
    if (msg.includes("fetch") || msg.includes("network")) {
      return "The connection to our risk nodes was interrupted. Please check your signal.";
    }
    if (msg.includes("JWT") || msg.includes("authenticated")) {
      return "Your secure session has expired for your protection. Please log in again.";
    }
    return msg || "An unexpected protocol exception occurred.";
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel-heavy rounded-3xl p-8 border border-red-500/10 text-center space-y-6"
    >
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(239,68,68,0.1)]">
        <AlertCircle className="w-8 h-8 text-red-400" />
      </div>

      <div>
        <h3 className="text-xl font-bold tracking-tight mb-2">Protocol Error</h3>
        <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">
          {getFriendlyMessage(message)}
        </p>
      </div>

      {onRetry && (
        <button 
          onClick={onRetry}
          className="w-full py-4 glass-button rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-transform"
        >
          <RefreshCcw className="w-4 h-4" /> Retry Connection
        </button>
      )}
    </motion.div>
  );
}
