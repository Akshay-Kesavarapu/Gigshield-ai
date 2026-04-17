import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

/**
 * Returns the shared authentication context state and actions.
 * @returns {{
 * user: import("@supabase/supabase-js").User | null,
 * session: import("@supabase/supabase-js").Session | null,
 * loading: boolean,
 * sendOtp: (phone: string) => Promise<{ success: boolean, error: string | null }>,
 * verifyOtp: (phone: string, otp: string) => Promise<{ success: boolean, error: string | null }>,
 * logout: () => Promise<{ success: boolean, error: string | null }>,
 * loginAsDemo: (role?: 'rider' | 'admin') => Promise<{ success: boolean, error: string | null }>
 * }}
 */
export const useAuth = () => useContext(AuthContext);
