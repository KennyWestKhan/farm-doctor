import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "../db/supabase";
import { migrateGuestData } from "./migrate";

import { AuthCtx } from "./useAuth.js";
const Ctx = AuthCtx;

const GUEST_KEY = "fd_guest";
const WELCOME_KEY = "fd_welcomed";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [welcomed, setWelcomed] = useState(() => {
    try {
      return localStorage.getItem(WELCOME_KEY) === "1";
    } catch {
      /* private browsing */
      return false;
    }
  });

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (supabase) {
        const {
          data: { session }
        } = await supabase.auth.getSession();
        if (!cancelled) {
          setUser(session?.user ?? null);
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }

    init();

    const { data: listener } = supabase
      ? supabase.auth.onAuthStateChange((_event, session) => {
          const u = session?.user ?? null;
          setUser(u);
          if (u) {
            migrateGuestData(u.id);
            // Any real session (anonymous, Google, or phone) leaves guest-only
            // mode and passes the welcome gate.
            try {
              localStorage.removeItem(GUEST_KEY);
              localStorage.setItem(WELCOME_KEY, "1");
            } catch {
              /* private browsing */
            }
            setWelcomed(true);
          }
        })
      : { data: null };

    return () => {
      cancelled = true;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const isGuest = useMemo(() => {
    if (user) return false;
    try {
      return localStorage.getItem(GUEST_KEY) === "1";
    } catch {
      /* private browsing */
      return false;
    }
  }, [user]);

  const continueAsGuest = useCallback(() => {
    try {
      localStorage.setItem(GUEST_KEY, "1");
      localStorage.setItem(WELCOME_KEY, "1");
    } catch {
      /* private mode */
    }
    setWelcomed(true);
  }, []);

  const markWelcomed = useCallback(() => {
    try {
      localStorage.setItem(WELCOME_KEY, "1");
    } catch {
      /* private browsing */
    }
    setWelcomed(true);
  }, []);

  const authError = "Auth not configured";

  const sendOtp = useCallback(async (phone) => {
    if (!supabase) return { error: { message: authError } };
    const { error } = await supabase.auth.signInWithOtp({ phone });
    return { error };
  }, []);

  const verifyOtp = useCallback(async (phone, token) => {
    if (!supabase) return { error: { message: authError } };
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: "sms"
    });
    if (!error && data?.user) {
      try {
        localStorage.removeItem(GUEST_KEY);
        localStorage.setItem(WELCOME_KEY, "1");
      } catch {
        /* private browsing */
      }
      setWelcomed(true);
    }
    return { data, error };
  }, []);

  // Frictionless entry: mark them in immediately (offline-safe guest state)
  // and, when online, upgrade to a real anonymous backend identity. The
  // auth-change listener migrates the just-created guest data onto that id.
  const getStarted = useCallback(() => {
    continueAsGuest();
    if (supabase && navigator.onLine) {
      supabase.auth.signInAnonymously().catch(() => {
        /* offline / not enabled — stays guest, still fully usable */
      });
    }
  }, [continueAsGuest]);

  // Google OAuth: free, cross-device identity. Full-page redirect back to the
  // app; the session is picked up on return and the listener welcomes + migrates.
  const signInWithGoogle = useCallback(async () => {
    if (!supabase) return { error: { message: authError } };
    return await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  }, []);

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    try {
      localStorage.setItem(GUEST_KEY, "1");
    } catch {
      /* private browsing */
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isGuest,
      welcomed,
      authConfigured: !!supabase,
      continueAsGuest,
      getStarted,
      signInWithGoogle,
      markWelcomed,
      sendOtp,
      verifyOtp,
      signOut
    }),
    [
      user,
      loading,
      isGuest,
      welcomed,
      continueAsGuest,
      getStarted,
      signInWithGoogle,
      markWelcomed,
      sendOtp,
      verifyOtp,
      signOut
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
