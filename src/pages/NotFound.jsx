import { motion } from "framer-motion";
import { Search, ArrowLeft, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * Premium 404 Catch-All Page for GigShield AI.
 * Explains the error in clear, professional English.
 */
export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-white flex items-center justify-center p-6 text-center overflow-hidden relative">
      {/* Mesh Background */}
      <div className="absolute inset-0 bg-mesh opacity-30 z-0 pointer-events-none"></div>
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-[150px] pointer-events-none"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg glass-panel-heavy rounded-[3.5rem] p-12 border border-white/5 relative z-10 shadow-2xl"
      >
        <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-tr from-accent1/20 to-purple-500/20 flex items-center justify-center mx-auto mb-10 border border-white/5 relative overflow-hidden">
           <div className="absolute inset-0 bg-accent1 opacity-5 mix-blend-overlay"></div>
           <Search className="w-10 h-10 text-accent1 drop-shadow-glow" />
        </div>
        
        <h1 className="text-5xl font-black tracking-tighter mb-4 text-white">404</h1>
        <h2 className="text-2xl font-bold tracking-tight mb-6">Coordinate Not Found</h2>
        
        <p className="text-slate-400 text-sm leading-relaxed mb-12 max-w-xs mx-auto">
          The hub location you're looking for was not found in our global risk matrix. 
          Please return to the secure dashboard to resume protection.
        </p>

        <div className="flex flex-col gap-4">
          <button 
            onClick={() => navigate("/dashboard")}
            className="w-full py-5 bg-accent1 text-slate-950 rounded-3xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-[0_15px_40px_rgba(0,240,255,0.25)] hover:scale-[1.02] transition-all"
          >
            Return to Dashboard
          </button>
          
          <button 
            onClick={() => navigate(-1)}
            className="w-full py-5 glass-button rounded-3xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
        </div>

        <div className="mt-12 flex items-center justify-center gap-2 opacity-30">
           <ShieldCheck className="w-4 h-4" />
           <span className="text-[10px] font-bold uppercase tracking-widest">Protocol Secured</span>
        </div>
      </motion.div>
    </div>
  );
}
