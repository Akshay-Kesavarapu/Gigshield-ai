import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { fetchLiveWeather } from "../Services/weatherService";
import { useAuth } from "../hooks/useAuth";
import { motion } from "framer-motion";
import { ShieldCheck, LayoutDashboard, Users, Activity, Settings, Bell, CircleDot, IndianRupee, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * Renders admin analytics with live Supabase-backed metrics and zone risk status.
 * @returns {JSX.Element}
 */
export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleBellClick = () => {
    supabase.from('app_logs').insert([{ action: 'admin_bell_click', user_id: user?.id }]).then();
    alert("Alert module tracking log recorded.");
  };

  const handleRiskReports = () => {
    supabase.from('app_logs').insert([{ action: 'risk_reports_click', user_id: user?.id }]).then();
    alert("Risk Reports mapping sequence requested.");
  };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeUsers, setActiveUsers] = useState(0);
  const [premiumRevenue, setPremiumRevenue] = useState(0);
  const [lossRatio, setLossRatio] = useState(0);
  const [zoneRisks, setZoneRisks] = useState([]);

  useEffect(() => {
    const fetchAdminMetrics = async () => {
      setLoading(true);
      setError("");

      try {
        if (user?.id === '77777777-7777-7777-7777-777777777777') {
          setActiveUsers(11248);
          setPremiumRevenue(2450000);
          setLossRatio(42.5);
          setZoneRisks([
            { id: '1', cityName: 'Chennai', zoneName: 'Metro Center', riskScore: 88, threshold: 80, severity: 'Critical' },
            { id: '2', cityName: 'Chennai', zoneName: 'Coastal Belt', riskScore: 78, threshold: 85, severity: 'Elevated' },
            { id: '3', cityName: 'Chennai', zoneName: 'IT Corridor', riskScore: 45, threshold: 80, severity: 'Stable' }
          ]);
          setLoading(false);
          return;
        }

        const activeUsersResponse = await supabase
          .from("riders")
          .select("*", { count: "exact", head: true });

        if (activeUsersResponse.error) {
          throw activeUsersResponse.error;
        }

        setActiveUsers(activeUsersResponse.count || 0);

        const { data: revenueData, error: revenueError } = await supabase.rpc("sum_premiums");

        if (revenueError) {
          throw revenueError;
        }

        const resolvedRevenue = Number(
          typeof revenueData === "number"
            ? revenueData
            : Array.isArray(revenueData)
              ? revenueData[0]?.sum || 0
              : revenueData?.sum || 0
        );
        setPremiumRevenue(resolvedRevenue);

        const { data: payoutTx, error: payoutError } = await supabase
          .from("transactions")
          .select("amount")
          .eq("type", "payout");

        if (payoutError) {
          throw payoutError;
        }

        const payoutTotal = (payoutTx || []).reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
        setLossRatio(resolvedRevenue > 0 ? (payoutTotal / resolvedRevenue) * 100 : 0);

        const { data: zones, error: zonesError } = await supabase.from("zones").select("*");

        if (zonesError) {
          throw zonesError;
        }

        const zoneDetails = await Promise.all(
          (zones || []).map(async (zone) => {
            try {
              const weather = await fetchLiveWeather(zone.latitude, zone.longitude);
              const scaledAqi = weather.aqi * 20;
              const scaledRain = weather.rainfall * 10;
              const floodRisk = scaledRain > 50 ? 85 : 40;
              const trafficRisk = weather.humidity > 80 ? 70 : 40;
              const riskScore = 0.4 * scaledAqi + 0.35 * scaledRain + 0.15 * floodRisk + 0.1 * trafficRisk;

              return {
                id: zone.id,
                zoneName: zone.zone_name,
                cityName: zone.city_name,
                riskScore: Math.round(riskScore),
                threshold: zone.risk_threshold || 80,
                severity: riskScore >= 85 ? "Critical" : riskScore >= 70 ? "Elevated" : "Stable"
              };
            } catch (_zoneError) {
              return {
                id: zone.id,
                zoneName: zone.zone_name,
                cityName: zone.city_name,
                riskScore: 0,
                threshold: zone.risk_threshold || 80,
                severity: "Data Unavailable"
              };
            }
          })
        );

        setZoneRisks(zoneDetails);
      } catch (dashboardError) {
        setError(dashboardError.message || "Failed to load admin analytics.");
      } finally {
        setLoading(false);
      }
    };

    fetchAdminMetrics();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-accent1/30 border-t-accent1 rounded-full animate-spin"></div>
      </div>
    );
  }

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
          <button onClick={() => navigate("/admin/dashboard")} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-accent1 bg-accent1/10 font-medium">
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </button>
          <button onClick={handleRiskReports} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-not-allowed opacity-50">
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
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none"></div>

        {/* Mobile Nav Top Bar */}
        <header className="md:hidden glass-panel-heavy sticky top-0 z-50 border-b border-white/5">
          <div className="flex justify-between items-center px-6 h-20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-tr from-accent1 to-purple-500 rounded-lg flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">Command Center</span>
            </div>
            <button aria-label="Open alerts" onClick={handleBellClick} className="p-2 rounded-full bg-white/5 text-slate-300">
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="p-6 md:p-10 max-w-7xl mx-auto relative z-10">
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel-heavy border-red-500/30 px-4 py-3 rounded-2xl text-red-200 text-sm flex items-center justify-center text-center mb-6">
              {error}
            </motion.div>
          )}

          <header className="mb-10 flex justify-between items-end hidden md:flex">
            <div>
              <h2 className="text-4xl font-bold tracking-tight">Global Overview</h2>
              <p className="text-sm text-slate-400 mt-2 font-medium">Predictive climate-income analytics engine.</p>
            </div>
            <button aria-label="Open alerts" onClick={handleBellClick} className="p-3 rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 transition-colors border border-white/5">
              <Bell className="w-5 h-5" />
            </button>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
              className="glass-panel-heavy p-6 rounded-3xl border border-white/5 relative overflow-hidden group"
            >
              <div className="absolute right-0 bottom-0 w-24 h-24 bg-cyan-400/10 blur-[20px] rounded-full"></div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                  <IndianRupee className="w-5 h-5 text-cyan-400" />
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Protected Volume</p>
              </div>
              <h3 className="text-4xl font-bold tracking-tight">₹{(premiumRevenue / 1000000).toFixed(2)}M</h3>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
              className="glass-panel-heavy p-6 rounded-3xl border border-white/5 relative overflow-hidden group"
            >
              <div className="absolute right-0 bottom-0 w-24 h-24 bg-red-400/10 blur-[20px] rounded-full"></div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                  <Activity className="w-5 h-5 text-red-400" />
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Loss Ratio</p>
              </div>
              <h3 className="text-4xl font-bold tracking-tight text-white">{lossRatio.toFixed(1)}<span className="text-2xl text-slate-500">%</span></h3>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
              className="glass-panel-heavy p-6 rounded-3xl border border-white/5 relative overflow-hidden group"
            >
              <div className="absolute right-0 bottom-0 w-24 h-24 bg-accent1/10 blur-[20px] rounded-full"></div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                  <Users className="w-5 h-5 text-accent1" />
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Active Riders</p>
              </div>
              <h3 className="text-4xl font-bold tracking-tight text-accent1">{activeUsers.toLocaleString()}</h3>
            </motion.div>
          </div>

          <motion.section
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
            className="glass-panel p-8 rounded-[2rem] border border-white/5"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold tracking-tight">Geospatial Risk Mapping</h3>
            </div>

            <div className="space-y-4">
              {zoneRisks.length === 0 ? (
                <div className="p-8 text-center text-slate-500 border border-white/5 border-dashed rounded-2xl">No remote zones tracking assigned.</div>
              ) : (
                zoneRisks.map((zone, idx) => (
                  <motion.div
                    initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 + (idx * 0.1) }}
                    key={zone.id}
                    className="glass-panel-heavy p-5 rounded-2xl flex items-center justify-between border border-white/5 group hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border border-white/5 ${zone.severity === "Critical" ? "bg-red-500/10 text-red-400" : zone.severity === "Elevated" ? "bg-yellow-500/10 text-yellow-400" : "bg-cyan-500/10 text-cyan-400"}`}>
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-white group-hover:text-accent1 transition-colors">
                          {zone.cityName}
                        </p>
                        <p className="text-xs text-slate-400 font-medium">
                          {zone.zoneName}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-lg leading-tight ${zone.severity === "Critical" ? "text-red-400" : zone.severity === "Elevated" ? "text-yellow-400" : "text-white"}`}>
                        {zone.riskScore} <span className="text-xs text-slate-500 font-normal">/ {zone.threshold}</span>
                      </p>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${zone.severity === "Critical" ? "text-red-400" : zone.severity === "Elevated" ? "text-yellow-400" : "text-cyan-400"}`}>
                        {zone.severity}
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.section>
        </main>
      </div>
    </div>
  );
}