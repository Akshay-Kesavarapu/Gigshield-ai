import { NavLink } from "react-router-dom";
import { Home, Bell, Wallet, UserCircle } from "lucide-react";
import { motion } from "framer-motion";

const tabs = [
  { path: "/dashboard", label: "Home", icon: Home },
  { path: "/disruption", label: "Alerts", icon: Bell },
  { path: "/wallet", label: "Wallet", icon: Wallet },
  { path: "/profile", label: "Profile", icon: UserCircle }
];

/**
 * Renders the mobile bottom navigation for rider-facing pages.
 * @returns {JSX.Element}
 */
export default function BottomNav() {
  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md">
      <div className="glass-panel-heavy rounded-full flex justify-between items-center px-2 py-2">
        {tabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            aria-label={`Go to ${tab.label}`}
            className="relative flex flex-col items-center justify-center w-16 h-14 rounded-full"
          >
            {({ isActive }) => {
              const Icon = tab.icon;
              return (
                <>
                  <Icon
                    className={`w-6 h-6 z-10 transition-colors duration-300 ${
                      isActive ? "text-white" : "text-slate-400 hover:text-white"
                    }`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span
                    className={`text-[10px] mt-1 font-semibold z-10 transition-colors duration-300 ${
                      isActive ? "text-white mt-0 absolute -bottom-1 opacity-0" : "text-slate-400 opacity-100"
                    }`}
                  >
                    {tab.label}
                  </span>

                  {isActive && (
                    <motion.div
                      layoutId="active-nav-pill"
                      className="absolute inset-0 bg-white/10 rounded-full border border-white/20"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="active-dot"
                      className="absolute bottom-1.5 w-1 h-1 rounded-full bg-accent1 shadow-[0_0_8px_rgba(0,240,255,0.8)]"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </>
              );
            }}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
