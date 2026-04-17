import { createContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

export const AuthContext = createContext(null);

/**
 * Provides Supabase authentication state and auth actions to the app.
 * @param {{ children: import("react").ReactNode }} props
 * @returns {JSX.Element}
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const bootstrapSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (isMounted) {
          setSession(data.session);
          setUser(data.session?.user ?? null);
        }
      } catch (error) {
        if (isMounted) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    bootstrapSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (isMounted) {
          setSession(nextSession);
          setUser(nextSession?.user ?? null);
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  /**
   * Logs in a user using Email/Password or Username/Password.
   */
  const login = async (identifier, password) => {
    try {
      let finalEmail = identifier;
      
      // If it doesn't look like an email, assume it's a User Name and translate it via RPC
      if (!identifier.includes("@")) {
        const { data: mappedEmail, error: rpcError } = await supabase.rpc("get_email_by_username", {
          p_username: identifier
        });
        
        if (rpcError || !mappedEmail) {
          throw new Error("Could not find an account with that User Name.");
        }
        finalEmail = mappedEmail;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: finalEmail,
        password: password,
      });

      if (error) throw error;
      return { success: true, error: null, user: data.user };
    } catch (error) {
      return { success: false, error: error.message || "Failed to log in." };
    }
  };

  /**
   * Registers a user via email and triggers an OTP to their inbox.
   */
  const registerWithEmail = async (email, password) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error.message || "Failed to register." };
    }
  };

  /**
   * Verifies the OTP sent to the user's email during registration.
   */
  const verifyEmailOtp = async (email, otp) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "signup"
      });

      if (error) throw error;
      setSession(data.session ?? null);
      setUser(data.user ?? null);
      return { success: true, error: null, user: data.user };
    } catch (error) {
      return { success: false, error: error.message || "Failed to verify email OTP." };
    }
  };

  /**
   * Signs out the current authenticated rider.
   * @returns {Promise<{ success: boolean, error: string | null }>}
   */
  const logout = async () => {
    try {
      if (session?.access_token === 'demo-token-1234') {
        setSession(null);
        setUser(null);
        return { success: true, error: null };
      }

      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      setSession(null);
      setUser(null);

      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error.message || "Failed to sign out." };
    }
  };

  /**
   * Login as demo user bypassing Supabase completely
   */
  const loginAsDemo = async (role = 'rider') => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 600)); // simulate slight loading
    
    const mockUser = {
      id: role === 'admin' ? '77777777-7777-7777-7777-777777777777' : '99999999-9999-9999-9999-999999999999',
      phone: role === 'admin' ? '+919999999999' : '+918888888888',
      role: role 
    };

    const mockSession = {
      access_token: 'demo-token-1234',
      user: mockUser,
    };

    setSession(mockSession);
    setUser(mockUser);
    setLoading(false);
    return { success: true, error: null };
  };

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      login,
      registerWithEmail,
      verifyEmailOtp,
      logout,
      loginAsDemo
    }),
    [user, session, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
