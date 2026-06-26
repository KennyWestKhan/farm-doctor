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
          if (u) migrateGuestData(u.id);
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
    console.log("[AUTH] sendOtp called, phone:", phone, "supabase:", !!supabase);
    if (!supabase) return { error: { message: authError } };
    const { error } = await supabase.auth.signInWithOtp({ phone });
    console.log("[AUTH] sendOtp result:", error ? error.message : "success");
    return { error };
  }, []);

  const verifyOtp = useCallback(async (phone, token) => {
    console.log("[AUTH] verifyOtp called, phone:", phone, "token:", token, "supabase:", !!supabase);
    if (!supabase) return { error: { message: authError } };
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: "sms"
    });
    console.log("[AUTH] verifyOtp result:", { error: error?.message, user: !!data?.user, session: !!data?.session });
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
      continueAsGuest,
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
      markWelcomed,
      sendOtp,
      verifyOtp,
      signOut
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
