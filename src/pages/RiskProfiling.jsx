import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";

/**
 * Renders plan selection and stores selected plan to rider profile.
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
          throw new Error("Rider profile not found.");
        }

        riderId = riderByPhone.id;
      }

      const { error: updateError } = await supabase
        .from("riders")
        .update({
          selected_plan: plan,
          plan_premium: planPriceMap[plan]
        })
        .eq("id", riderId);

      if (updateError) {
        throw updateError;
      }

      navigate("/dashboard");
    } catch (selectError) {
      setError(selectError.message || "Failed to save selected plan.");
    } finally {
      setLoadingPlan("");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24">
      {/* Top Header */}
      <header className="fixed top-0 w-full z-50 bg-slate-900/60 backdrop-blur-xl shadow-lg flex justify-between items-center px-6 h-16">
        <div className="flex items-center gap-3">
          <span className="text-cyan-400 text-2xl">🛡️</span>
          <h1 className="text-xl font-bold text-cyan-400">
            GigShield AI
          </h1>
        </div>

        <button 
          className="text-slate-400"
          onClick={() => {
            supabase.from('app_logs').insert([{ action: 'rider_bell_click', user_id: user?.id }]).then();
            alert("Notification lookup executed.");
          }}
        >
          🔔
        </button>
      </header>

      <main className="pt-24 pb-20 px-4 max-w-lg mx-auto">
        {error ? (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-200 text-sm">
            {error}
          </div>
        ) : null}

        {/* Header */}
        <section className="mb-12 text-center md:text-left">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Risk Profile:{" "}
            <span className="text-cyan-400">
              Elevated
            </span>
          </h2>

          <p className="text-slate-400 max-w-2xl text-lg">
            AI predicts a 65% probability of income loss
            this week due to monsoon activity and AQI
            restrictions.
          </p>
        </section>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          {/* Basic */}
          <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 flex flex-col">
            <div className="mb-8">
              <span className="text-xs uppercase text-slate-400 block mb-2">
                Entry Protection
              </span>

              <h3 className="text-2xl font-bold mb-4">
                Basic
              </h3>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">
                  ₹25
                </span>
                <span className="text-slate-400">
                  /week
                </span>
              </div>
            </div>

            <ul className="space-y-4 mb-10 flex-grow text-sm">
              <li>✔ 50% income coverage</li>
              <li>🌧 Rain & Flood triggers</li>
              <li className="text-slate-500">
                ✖ No AQI coverage
              </li>
            </ul>

            <button
              onClick={() => handlePlanSelect("Basic")}
              disabled={loadingPlan.length > 0}
              aria-label="Select Basic plan"
              className="w-full py-4 rounded-xl border border-slate-600 disabled:opacity-60"
            >
              {loadingPlan === "Basic" ? "Saving..." : "Select Basic"}
            </button>
          </div>

          {/* Pro */}
          <div className="relative p-8 rounded-2xl bg-slate-800 border border-cyan-400/30 shadow-lg flex flex-col">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-cyan-400 text-black font-bold px-4 py-1 rounded-full text-xs">
              AI Recommended
            </div>

            <div className="mb-8">
              <span className="text-xs uppercase text-cyan-400 block mb-2">
                Maximum Shield
              </span>

              <h3 className="text-3xl font-bold mb-4">
                Pro
              </h3>

              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-bold text-cyan-400">
                  ₹75
                </span>
                <span className="text-slate-400">
                  /week
                </span>
              </div>
            </div>

            <ul className="space-y-4 mb-10 flex-grow text-sm">
              <li>✔ 100% income coverage</li>
              <li>⛈ All Weather Events</li>
              <li>🚧 Strikes & Curfews</li>
              <li>🌫 AQI / Pollution Lockdown</li>
            </ul>

            <button
              onClick={() => handlePlanSelect("Pro")}
              disabled={loadingPlan.length > 0}
              aria-label="Activate Pro plan"
              className="w-full py-4 rounded-xl bg-cyan-400 text-black font-bold disabled:opacity-60"
            >
              {loadingPlan === "Pro" ? "Saving..." : "Activate Pro Shield"}
            </button>
          </div>

          {/* Standard */}
          <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 flex flex-col">
            <div className="mb-8">
              <span className="text-xs uppercase text-slate-400 block mb-2">
                Balanced Shield
              </span>

              <h3 className="text-2xl font-bold mb-4">
                Standard
              </h3>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">
                  ₹45
                </span>
                <span className="text-slate-400">
                  /week
                </span>
              </div>
            </div>

            <ul className="space-y-4 mb-10 flex-grow text-sm">
              <li>✔ 80% income coverage</li>
              <li>☁ Weather disruptions</li>
              <li>🛡 Strikes & Curfews</li>
            </ul>

            <button
              onClick={() =>
                handlePlanSelect("Standard")
              }
              disabled={loadingPlan.length > 0}
              aria-label="Select Standard plan"
              className="w-full py-4 rounded-xl border border-slate-600 disabled:opacity-60"
            >
              {loadingPlan === "Standard" ? "Saving..." : "Select Standard"}
            </button>
          </div>
        </div>

        {/* Footer Notice */}
        <div className="mt-16 p-6 rounded-2xl bg-slate-800 text-center">
          <p className="text-xs uppercase tracking-widest text-red-400">
            Income Protection Only
          </p>

          <div className="flex justify-center gap-6 mt-4 text-xs text-slate-400 uppercase">
            <span>No Health</span>
            <span>No Life</span>
            <span>No Accident</span>
            <span>No Vehicle</span>
          </div>
        </div>
      </main>
    </div>
  );
}