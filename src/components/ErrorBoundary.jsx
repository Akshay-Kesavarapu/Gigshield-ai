import React from "react";
import { motion } from "framer-motion";
import { ShieldAlert, RefreshCcw, Home } from "lucide-react";

/**
 * Global Error Boundary to catch React runtime crashes.
 * Provides a premium "System Recovery" interface instead of a blank screen.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("GigShield Runtime Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background text-white flex items-center justify-center p-6 text-center overflow-hidden relative">
          {/* Cyber Background */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent1/10 rounded-full blur-[120px] pointer-events-none"></div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md glass-panel-heavy rounded-[3rem] p-10 border border-red-500/20 relative z-10"
          >
            <div className="w-20 h-20 rounded-3xl bg-red-500/20 flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
              <ShieldAlert className="w-10 h-10 text-red-400" />
            </div>
            
            <h2 className="text-3xl font-bold tracking-tight mb-4">System Interruption</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-10">
              We've encountered a secure protocol exception. Don't worry, your data and wallet are safe. 
              The connection just needs a quick reset.
            </p>

            <div className="space-y-4">
              <button 
                onClick={() => window.location.reload()}
                className="w-full py-4 bg-accent1 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(0,240,255,0.3)]"
              >
                <RefreshCcw className="w-4 h-4" /> Reset Connection
              </button>
              
              <button 
                onClick={() => window.location.href = "/"}
                className="w-full py-4 glass-button rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3"
              >
                <Home className="w-4 h-4" /> Force Hub Return
              </button>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
