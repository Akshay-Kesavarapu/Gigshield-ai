import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, LayoutDashboard, Activity, Settings, 
  MapPin, AlertTriangle, Download, Calendar, 
  ChevronRight, ArrowLeft, Search, Filter 
} from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * Renders historical risk trigger reports and event logs for admin review.
 * @returns {JSX.Element}
 */
export default function AdminRiskReports() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reports, setReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      setError("");

      try {
        if (user?.id === '77777777-7777-7777-7777-777777777777') {
          // Mock data for demo admin
          setReports([
            { id: '1', zone_name: 'Metro Center', city: 'Chennai', score: 88, timestamp: new Date(Date.now() - 3600000).toISOString(), triggers: ['Heavy Rain', 'AQI > 200'] },
            { id: '2', zone_name: 'Coastal Belt', city: 'Chennai', score: 82, timestamp: new Date(Date.now() - 72000000).toISOString(), triggers: ['High Wind Speed'] },
            { id: '3', zone_name: 'IT Corridor', city: 'Chennai', score: 85, timestamp: new Date(Date.now() - 172800000).toISOString(), triggers: ['Monsoon Flood Alert'] },
            { id: '4', zone_name: 'Metro Center', city: 'Chennai', score: 91, timestamp: new Date(Date.now() - 259200000).toISOString(), triggers: ['Cyclone Warning'] },
          ]);
          setLoading(false);
          return;
        }

        const { data, error: reportsError } = await supabase
          .from("risk_scores")
          .select("*, zones(zone_name, city_name)")
          .eq("payout_triggered", true)
          .order("created_at", { ascending: false });

        if (reportsError) throw reportsError;

        setReports(data.map(r => ({
          id: r.id,
          zone_name: r.zones?.zone_name || "Unknown Zone",
          city: r.zones?.city_name || "Unknown City",
          score: r.risk_score,
          timestamp: r.created_at,
          triggers: r.metadata?.triggers || ['Threshold Crossed']
        })));
      } catch (err) {
        setError(err.message || "Failed to load risk reports.");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [user]);

  const exportCSV = () => {
    const headers = ["ID", "Zone", "City", "Score", "Timestamp", "Triggers"];
    const rows = reports.map(r => [r.id, r.zone_name, r.city, r.score, r.timestamp, r.triggers.join('; ')]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `gigshield_risk_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredReports = reports.filter(r => 
    r.zone_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.triggers.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
          <button className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-accent1 bg-accent1/10 font-medium">
            <Activity className="w-5 h-5" />
            Risk Reports
          </button>
          <button onClick={() => navigate("/admin/profile")} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
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
            <button onClick={() => navigate("/admin/dashboard")} className="p-2 rounded-full bg-white/5 text-slate-300">
                <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-lg font-bold text-white tracking-tight">Risk Reports</span>
            <button onClick={exportCSV} className="p-2 rounded-full bg-accent1/10 text-accent1">
              <Download className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="p-6 md:p-10 max-w-7xl mx-auto relative z-10">
          <header className="mb-10 flex justify-between items-end hidden md:flex">
            <div>
              <h2 className="text-4xl font-bold tracking-tight">Historical Risks</h2>
              <p className="text-sm text-slate-400 mt-2 font-medium">Audit trail of automated climate triggers and payout validations.</p>
            </div>
            <button 
              onClick={exportCSV}
              className="px-6 py-3 rounded-xl bg-accent1 text-slate-900 font-bold flex items-center gap-2 hover:bg-white transition-colors shadow-[0_0_20px_rgba(0,240,255,0.4)]"
            >
              <Download className="w-5 h-5" />
              Export CSV
            </button>
          </header>

          {/* Search Table */}
          <section className="glass-panel rounded-[2rem] border border-white/5 overflow-hidden">
            <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Search zone or city..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:border-accent1 transition-colors outline-none"
                />
              </div>
              <div className="flex gap-2">
                <button className="glass-button px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5" />
                  Filter
                </button>
                <div className="glass-panel px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 border border-white/5">
                  Showing {filteredReports.length} events
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-20 text-center flex flex-col items-center gap-4">
                  <Activity className="w-10 h-10 text-accent1 animate-pulse" />
                  <p className="text-slate-500 font-medium">Querying historical ledger...</p>
                </div>
              ) : filteredReports.length === 0 ? (
                <div className="p-20 text-center">
                  <AlertTriangle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-500 font-bold">No historical disruption events found matching criteria.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5 text-[10px] uppercase tracking-widest font-bold text-slate-500">
                      <th className="px-8 py-6">Timestamp / Event ID</th>
                      <th className="px-8 py-6">Location</th>
                      <th className="px-8 py-6">Risk Index</th>
                      <th className="px-8 py-6">Parametric Triggers</th>
                      <th className="px-8 py-6 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredReports.map((report, idx) => (
                      <motion.tr 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={report.id} 
                        className="group hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-3">
                              <Calendar className="w-4 h-4 text-slate-600 group-hover:text-accent1 transition-colors" />
                              <div className="leading-tight">
                                <p className="font-bold text-white mb-0.5">
                                  {new Date(report.timestamp).toLocaleDateString()}
                                </p>
                                <p className="text-[10px] text-slate-500 font-mono">#{report.id.slice(0, 8).toUpperCase()}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-2">
                             <MapPin className="w-4 h-4 text-slate-600" />
                             <div>
                               <p className="font-bold text-white leading-tight">{report.zone_name}</p>
                               <p className="text-[10px] text-slate-500 font-bold uppercase">{report.city}</p>
                             </div>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${report.score >= 85 ? "bg-red-500/10 text-red-400" : "bg-yellow-500/10 text-yellow-400"}`}>
                                 {report.score}
                              </div>
                              <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                 <div className={`h-full ${report.score >= 85 ? "bg-red-500" : "bg-yellow-500"}`} style={{ width: `${report.score}%` }}></div>
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex flex-wrap gap-2">
                              {report.triggers.map(t => (
                                <span key={t} className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[9px] font-bold uppercase text-slate-400 whitespace-nowrap">
                                  {t}
                                </span>
                              ))}
                           </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                           <button className="w-8 h-8 rounded-full glass-button flex items-center justify-center ml-auto group-hover:bg-accent1 group-hover:text-slate-900 transition-all">
                              <ChevronRight className="w-4 h-4" />
                           </button>
                        </td>
                      </motion.tr>
                    ))}
                   </tbody>
                </table>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
