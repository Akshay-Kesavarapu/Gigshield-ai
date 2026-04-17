import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Bell, UserCircle, Key, Globe, Settings, Map, SlidersHorizontal, RefreshCcw, LayoutDashboard, Activity, X, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";

export default function AdminProfile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [rainfallBuffer, setRainfallBuffer] = useState(12.5);
  const [aqiThrottle, setAqiThrottle] = useState(150);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [adminName, setAdminName] = useState("");
  const [adminRole, setAdminRole] = useState("");
  const [adminClearance, setAdminClearance] = useState("");
  const [adminNode, setAdminNode] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase.from('system_settings').select('*').limit(1).maybeSingle();
        if (data) {
          if (data.rainfall_buffer) setRainfallBuffer(data.rainfall_buffer);
          if (data.aqi_throttle) setAqiThrottle(data.aqi_throttle);
        }
      } catch (err) {}
      setLoading(false);
    };

    const fetchAdminInfo = async () => {
      if (!user) return;
      if (user.id === '77777777-7777-7777-7777-777777777777') {
         setAdminName("Alex Chen");
         setAdminRole("GigShield Global Operations");
         setAdminClearance("Super Admin");
         setAdminNode("APAC Core");
      } else {
         try {
           const { data } = await supabase.from('admin_profiles').select('*').eq('id', user.id).maybeSingle();
           const defaultName = user.email ? user.email.split('@')[0] : "Admin User";
           setAdminName(data?.full_name || defaultName);
           setAdminRole("GigShield Global Operations"); 
           setAdminClearance(data?.clearance_level || "Standard Admin");
           setAdminNode(data?.node || "Unknown Node");
         } catch (err) {
           setAdminName(user.email ? user.email.split('@')[0] : "Admin User");
           setAdminRole("GigShield Global Operations");
           setAdminClearance("Standard Admin");
           setAdminNode("Unknown Node");
         }
      }
    };
    
    fetchSettings();
    fetchAdminInfo();
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };
  
  const handleSaveSettings = async () => {
    try {
      await supabase.from('system_settings').upsert({ id: 1, rainfall_buffer: rainfallBuffer, aqi_throttle: aqiThrottle });
      await supabase.from('app_logs').insert([{ action: 'admin_push_consensus', user_id: user?.id }]);
      setStatusMsg("Parametric parameters securely pushed to live nodes.");
      setTimeout(() => setStatusMsg(""), 3000);
    } catch (err) {
      console.error(err);
    }
  };
  
  const handleBellClick = async () => {
    setNotificationsOpen(true);
    try {
      const { data } = await supabase.from('app_logs').select('*').order('created_at', { ascending: false }).limit(10);
      setLogs(data || []);
    } catch (e) {}
  };

  const handleRiskReports = () => {
    navigate("/admin/risk-reports");
  };

  return (
    <div className="min-h-screen bg-background text-white overflow-hidden flex">
      {/* Sidebar Command Center */}
      <aside className="hidden md:flex inset-y-0 left-0 w-72 glass-panel-heavy border-r border-white/5 flex-col z-50">
        <div className="p-8 pb-4">
          <div className="w-12 h-12 bg-gradient-to-tr from-accent1 to-purple-500 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.4)] mb-6">
             <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <p className="text-white font-bold text-xl tracking-tight mb-1">Command Center</p>
          <span className="glass-panel px-2 py-1 rounded-md text-[10px] text-accent1 border border-accent1/20 font-bold uppercase tracking-widest">
            System Admin
          </span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-8">
          <button onClick={() => navigate("/admin/dashboard")} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
             <LayoutDashboard className="w-5 h-5" />
             Dashboard
          </button>
          <button onClick={() => navigate("/admin/risk-reports")} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
             <Activity className="w-5 h-5" />
             Risk Reports
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-accent1 bg-accent1/10 font-medium">
             <Settings className="w-5 h-5" />
             Settings
          </button>
        </nav>
      </aside>

      <div className="flex-1 overflow-y-auto w-full relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent1/10 rounded-full blur-[120px] pointer-events-none"></div>

        {/* Mobile Nav Top Bar */}
        <header className="md:hidden glass-panel-heavy sticky top-0 z-50 border-b border-white/5">
          <div className="flex justify-between items-center px-6 h-20">
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 bg-gradient-to-tr from-accent1 to-purple-500 rounded-lg flex items-center justify-center">
                 <ShieldCheck className="w-4 h-4 text-white" />
               </div>
               <span className="text-lg font-bold text-white tracking-tight">System Settings</span>
             </div>
             <button aria-label="Open alerts" onClick={handleBellClick} className="p-2 rounded-full bg-white/5 text-slate-300">
               <Bell className="w-5 h-5" />
             </button>
          </div>
        </header>

        <main className="p-6 md:p-10 max-w-7xl mx-auto relative z-10 space-y-8">
          <header className="mb-8 hidden md:flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-2">Admin Security & Identity</h1>
              <p className="text-slate-400">Secure configuration portal for global management routing.</p>
            </div>
            <button aria-label="Open alerts" onClick={handleBellClick} className="p-3 rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 transition-colors border border-white/5">
              <Bell className="w-5 h-5" />
            </button>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <motion.div 
               initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
               className="md:col-span-4"
            >
              <div className="glass-panel-heavy rounded-3xl p-6 border border-white/5 relative overflow-hidden">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-accent1 to-purple-500 flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.4)] mb-6 -rotate-3">
                   <UserCircle className="w-10 h-10 text-white rotate-3" />
                </div>
                
                <h3 className="text-3xl font-bold tracking-tight mb-1">{adminName || "Loading..."}</h3>
                <p className="text-accent1 text-sm font-semibold mb-8">{adminRole}</p>

                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <div className="flex items-center gap-3">
                       <Key className="w-4 h-4 text-slate-500" />
                       <span className="text-sm font-medium text-slate-400">Clearance</span>
                    </div>
                    <span className="text-sm font-bold text-white px-3 py-1 bg-white/5 rounded-full">{adminClearance}</span>
                  </div>

                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <div className="flex items-center gap-3">
                       <Globe className="w-4 h-4 text-slate-500" />
                       <span className="text-sm font-medium text-slate-400">Node</span>
                    </div>
                    <span className="text-sm font-bold text-white">{adminNode}</span>
                  </div>

                  <div className="flex items-center justify-between pb-2">
                    <div className="flex items-center gap-3">
                       <Activity className="w-4 h-4 text-slate-500" />
                       <span className="text-sm font-medium text-slate-400">Status</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span className="text-sm font-bold text-emerald-400">Active Sec Auth</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <button onClick={handleLogout} className="mt-4 w-full bg-red-500/10 text-red-400 hover:bg-red-500/20 py-3.5 rounded-2xl font-bold transition-colors active:scale-95 border border-red-500/20">
                Terminate Admin Session
              </button>
            </motion.div>

            <motion.div 
               initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
               className="md:col-span-8"
            >
              <div className="glass-panel-heavy rounded-3xl p-8 border border-white/5 h-full">
                <div className="flex items-center gap-3 mb-8">
                  <SlidersHorizontal className="w-6 h-6 text-accent1" />
                  <h2 className="text-2xl font-bold tracking-tight">Parametric Override Controls</h2>
                </div>

                <div className="space-y-8">
                  <div className="glass-panel p-5 rounded-2xl border border-white/5 relative">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-cyan-400/10 blur-[20px] rounded-full pointer-events-none"></div>
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <span className="text-sm font-bold text-white flex items-center gap-2">
                           <Map className="w-4 h-4 text-cyan-400" />
                           Rainfall Density Buffer
                        </span>
                        <p className="text-xs text-slate-400 mt-1">Global modifier scalar applied to ML weather detection</p>
                      </div>
                      <span className="text-2xl font-bold text-cyan-400">{rainfallBuffer}<span className="text-sm text-slate-500 ml-1">mm</span></span>
                    </div>
                    <input 
                       type="range" 
                       min="0" max="50" step="0.5" 
                       value={rainfallBuffer} 
                       onChange={(e) => setRainfallBuffer(Number(e.target.value))}
                       className="w-full accent-cyan-400 cursor-pointer" 
                    />
                  </div>

                  <div className="glass-panel p-5 rounded-2xl border border-white/5 relative">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <span className="text-sm font-bold text-white flex items-center gap-2">
                           <Globe className="w-4 h-4 text-accent1" />
                           AQI System Critical Throttle
                        </span>
                        <p className="text-xs text-slate-400 mt-1">Baseline override threshold for hazardous zone alerts</p>
                      </div>
                      <span className="text-2xl font-bold text-accent1">{aqiThrottle}<span className="text-sm text-slate-500 ml-1">PM</span></span>
                    </div>
                    <input 
                       type="range" 
                       min="50" max="1000" step="10" 
                       value={aqiThrottle} 
                       onChange={(e) => setAqiThrottle(Number(e.target.value))}
                       className="w-full accent-accent1 cursor-pointer" 
                    />
                  </div>

                  <div className="flex justify-end gap-4 pt-4 mt-8 border-t border-white/5">
                    <button onClick={() => window.location.reload()} className="px-6 py-3 rounded-2xl glass-panel text-slate-300 font-bold active:scale-95 transition-transform border border-white/10 hover:bg-white/5">
                      Discard Edits
                    </button>
                    <button onClick={handleSaveSettings} className="px-8 py-3 rounded-2xl glass-button text-accent1 font-bold active:scale-95 transition-transform flex items-center gap-2">
                      <RefreshCcw className="w-4 h-4" />
                      Push Consensus
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
      
      {/* STATUS TOAST */}
      <AnimatePresence>
        {statusMsg && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-10 right-10 z-[60] bg-accent1 text-slate-950 px-6 py-4 rounded-2xl font-bold shadow-[0_10px_40px_rgba(0,240,255,0.4)] flex items-center gap-3"
          >
            <ShieldCheck className="w-5 h-5" />
            {statusMsg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}