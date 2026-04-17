import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, User, Mail, Smartphone, ArrowRight, UserPlus, ShieldAlert, Loader2, Zap } from "lucide-react";

/**
 * Renders unified login and rider registration flows securely.
 * @returns {JSX.Element}
 */
export default function Auth() {
  const navigate = useNavigate();
  const { session, login, registerWithEmail, verifyEmailOtp, loginAsDemo } = useAuth();

  const [activeTab, setActiveTab] = useState("login"); // 'login' or 'register'

  // Login State
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  // Registration State
  const [regFullName, setRegFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [selectedZone, setSelectedZone] = useState("");
  const [incomeRange, setIncomeRange] = useState("");

  // Registration OTP State
  const [showEmailOtp, setShowEmailOtp] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");

  const [zones, setZones] = useState([]);
  const [zoneLoading, setZoneLoading] = useState(true);

  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let isMounted = true;
    const fetchZones = async () => {
      setZoneLoading(true);
      try {
        const { data, error } = await supabase.from("zones").select("*").order("city_name", { ascending: true });
        if (error) throw error;
        if (isMounted) setZones(data || []);
      } catch (error) {
        if (isMounted) setZones([{ id: 'z1', city_name: 'Chennai', zone_name: 'Metro Center' }]);
      } finally {
        if (isMounted) setZoneLoading(false);
      }
    };
    fetchZones();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (session) {
      const routeSession = async () => {
        setInitializing(true);
        // Bypass checks for demo users
        if (session.user.id === '99999999-9999-9999-9999-999999999999') {
          navigate("/dashboard", { replace: true }); return;
        }
        if (session.user.id === '77777777-7777-7777-7777-777777777777') {
          navigate("/admin/dashboard", { replace: true }); return;
        }

        const { data: adminData } = await supabase.from('admin_profiles').select('id').eq('id', session.user.id).maybeSingle();
        if (adminData && isMounted) {
          navigate("/admin/dashboard", { replace: true });
          return;
        }

        const { data: riderData } = await supabase.from('riders').select('id').eq('id', session.user.id).maybeSingle();
        if (riderData && isMounted) {
          navigate("/dashboard", { replace: true });
          return;
        }

        // If they have a session but aren't in either table, they are likely stuck from a partial registration.
        // They should complete their profile if they aren't already actively doing it.
        if (isMounted && activeTab !== 'register' && !showEmailOtp) {
          navigate("/risk-profiling", { replace: true });
        }
      };
      routeSession();
    }
    return () => { isMounted = false; };
  }, [session, navigate, activeTab, showEmailOtp]);

  const resetMessages = () => {
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    resetMessages();
    if (!identifier.trim() || !password.trim()) {
      setErrorMessage("Identifier and password are required.");
      return;
    }
    setLoading(true);
    try {
      const { success, error } = await login(identifier, password);
      if (!success) throw new Error(error || "Invalid credentials.");
      setSuccessMessage("Authentication successful.");
    } catch (error) {
      setErrorMessage(error.message || "Failed to log in.");
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    resetMessages();
    if (!regFullName.trim() || !regEmail.trim() || !regPassword.trim() || !regPhone.trim()) {
      setErrorMessage("Please fill all required primary fields.");
      return;
    }
    if (!selectedZone || !incomeRange) {
      setErrorMessage("Please select zone and income range.");
      return;
    }

    setLoading(true);
    try {
      const { success, error } = await registerWithEmail(regEmail, regPassword);
      if (!success) throw new Error(error || "Registration failed.");

      setSuccessMessage("Verification code sent to your email!");
      setShowEmailOtp(true);
      setLoading(false);
    } catch (error) {
      setErrorMessage(error.message || "Registration failed.");
      setLoading(false);
    }
  };

  const handleVerifyRegistrationOtp = async (e) => {
    e.preventDefault();
    resetMessages();
    if (!emailOtp.trim() || emailOtp.length < 6) {
      setErrorMessage("Please enter a valid 6-digit verification code.");
      return;
    }
    setLoading(true);
    try {
      // 1. Verify the OTP
      const { success, error, user } = await verifyEmailOtp(regEmail, emailOtp);
      if (!success || !user) throw new Error(error || "Invalid verification code.");

      // 2. Secretly update their User Metadata to hold their phone conditionally (optional but good practice)
      await supabase.auth.updateUser({ data: { phone: regPhone } });

      // 3. Immediately create their rider profile in the database mapping everything
      const { error: insertError } = await supabase.from('riders').insert({
        id: user.id,
        full_name: regFullName.trim(),
        phone_number: regPhone.trim(),
        assigned_zone_id: selectedZone,
        avg_daily_income: 0,
        daily_income_range: incomeRange
      });

      if (insertError) {
        throw new Error(insertError.message || "Failed to create rider profile.");
      }

      setSuccessMessage("Profile verified and created successfully!");
      navigate("/risk-profiling");
    } catch (error) {
      setErrorMessage(error.message || "Verification failed.");
      setLoading(false);
    }
  };

  const loadDemo = async (role) => {
    setLoading(true);
    resetMessages();
    const { error } = await loginAsDemo(role);
    if (error) {
      setErrorMessage(error);
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-accent1/30 border-t-accent1 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col justify-center items-center">
      <div className="absolute inset-0 bg-mesh opacity-60 z-0"></div>

      <main className="w-full max-w-md z-10 p-4 pt-12 pb-24">

        {/* Logo/Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-cyan neon-border mb-6">
            <ShieldCheck className="w-10 h-10 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">GigShield <span className="text-gradient">AI</span></h1>
          <p className="text-slate-400 font-medium">Predictive income protection for elite riders.</p>
        </motion.div>

        {/* Global Messages */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4">
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 text-sm flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <p>{errorMessage}</p>
              </div>
            </motion.div>
          )}
          {successMessage && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <p>{successMessage}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Auth Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-panel-heavy rounded-3xl p-6 shadow-2xl relative"
        >
          {/* Tab Switcher */}
          {!showEmailOtp && (
            <div className="flex bg-slate-900/50 p-1 rounded-2xl mb-6 backdrop-blur-md">
              <button
                type="button"
                onClick={() => { setActiveTab('login'); resetMessages(); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'login' ? 'bg-gradient-cyan text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('register'); resetMessages(); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'register' ? 'bg-gradient-cyan text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                Register
              </button>
            </div>
          )}

          <AnimatePresence mode="wait">
            {showEmailOtp ? (
              <motion.form
                key="otp-verification"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleVerifyRegistrationOtp}
                className="space-y-4"
              >
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold tracking-tight text-white mb-2">Verify Email</h2>
                  <p className="text-sm text-slate-400">Enter the 6-digit code sent to <span className="text-white font-medium">{regEmail}</span></p>
                </div>

                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full bg-slate-900/60 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-white font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-accent1/50 transition-all text-2xl"
                    placeholder="••••••"
                    type="text"
                    disabled={loading}
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-primary text-white py-4 rounded-2xl font-bold disabled:opacity-70 flex items-center justify-center gap-2 mt-4 transition-transform active:scale-[0.98]"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Complete Signup"}
                  {!loading && <ArrowRight className="w-5 h-5" />}
                </button>
              </motion.form>
            ) : activeTab === 'login' ? (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleLogin}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider pl-1">Email or User Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full bg-slate-900/60 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-accent1/50 transition-all"
                      placeholder="john@example.com or johndoe"
                      type="text"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider pl-1 mt-2 block">Password</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-900/60 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-accent1/50 transition-all text-lg"
                      placeholder="••••••••"
                      type="password"
                      disabled={loading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full group relative overflow-hidden bg-white text-slate-900 py-4 rounded-2xl font-bold disabled:opacity-70 mt-2 transition-transform active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Secure Login"}
                  {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleRegister}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 gap-3">
                  <div className="relative">
                    <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      className="w-full bg-slate-900/60 border border-slate-700/50 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-accent1/50"
                      placeholder="User Name (for login)"
                      disabled={loading}
                    />
                  </div>

                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full bg-slate-900/60 border border-slate-700/50 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-accent1/50"
                      placeholder="Email Address"
                      type="email"
                      disabled={loading}
                    />
                  </div>

                  <div className="relative">
                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="w-full bg-slate-900/60 border border-slate-700/50 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-accent1/50"
                      placeholder="Phone Number (+91...)"
                      type="tel"
                      disabled={loading}
                    />
                  </div>

                  <div className="relative">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full bg-slate-900/60 border border-slate-700/50 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-accent1/50"
                      placeholder="Create Password"
                      type="password"
                      disabled={loading}
                    />
                  </div>

                  <select
                    value={selectedZone}
                    onChange={(e) => setSelectedZone(e.target.value)}
                    disabled={zoneLoading || loading}
                    className="w-full bg-slate-900/60 border border-slate-700/50 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-accent1/50 outline-none text-sm disabled:opacity-60 text-white"
                  >
                    <option value="" className="text-slate-800">Select Zone</option>
                    {zones.map((z) => <option key={z.id} value={z.id} className="text-slate-800">{z.city_name} - {z.zone_name}</option>)}
                  </select>

                  <select
                    value={incomeRange}
                    onChange={(e) => setIncomeRange(e.target.value)}
                    disabled={loading}
                    className="w-full bg-slate-900/60 border border-slate-700/50 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-accent1/50 outline-none text-sm text-white"
                  >
                    <option value="" className="text-slate-800">Daily Income Target</option>
                    <option value="300-500" className="text-slate-800">₹300 - ₹500</option>
                    <option value="500-800" className="text-slate-800">₹500 - ₹800</option>
                    <option value="800-1200" className="text-slate-800">₹800 - ₹1200</option>
                    <option value="1200+" className="text-slate-800">₹1200+</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-primary text-white py-4 rounded-2xl font-bold disabled:opacity-70 flex items-center justify-center gap-2 mt-4"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
                  {!loading && <ArrowRight className="w-5 h-5" />}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Quick Demo Section */}
          {!showEmailOtp && (
            <div className="mt-8 pt-6 border-t border-slate-700/50">
              <p className="text-center text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Express Demonstration</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => loadDemo('rider')}
                  disabled={loading}
                  className="glass-button w-full py-3.5 rounded-2xl text-slate-200 font-medium flex items-center justify-center gap-2 group hover:text-white"
                >
                  <Zap className="w-4 h-4 text-yellow-400 group-hover:scale-110 transition-transform" />
                  <span className="text-sm">Rider Demo</span>
                </button>
                <button
                  type="button"
                  onClick={() => loadDemo('admin')}
                  disabled={loading}
                  className="glass-button w-full py-3.5 rounded-2xl text-slate-300 font-medium flex items-center justify-center gap-2 group hover:text-white border-none bg-black/20"
                >
                  <ShieldCheck className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                  <span className="text-sm">Admin Demo</span>
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
