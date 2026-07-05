import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "../db/supabase";
import { migrateGuestData } from "./migrate";
import { withTimeout } from "../utils/withTimeout.js";
import { classifyAuthError } from "./authErrors.js";

import { AuthCtx } from "./useAuth.js";
const Ctx = AuthCtx;

const GUEST_KEY = "fd_guest";
const WELCOME_KEY = "fd_welcomed";

// Rural connections stall; a hard cap turns an infinite hang into a clear,
// retryable error. Generous enough not to trip a slow-but-working network.
const AUTH_TIMEOUT_MS = 15_000;
// Startup session read is shorter — the app is blank until it resolves, so we
// fall through to the offline-capable Welcome screen quickly if it stalls.
const SESSION_INIT_TIMEOUT_MS = 8_000;

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
      if (!supabase) {
        setLoading(false);
        return;
      }
      // Never let a slow/unreachable Supabase (paused project, no network)
      // hang startup: WelcomeGate renders nothing while `loading` is true, so
      // a stuck getSession would look like a dead app. Time it out and fall
      // through to the (offline-capable) Welcome screen regardless.
      try {
        const { data } = await withTimeout(
          supabase.auth.getSession(),
          SESSION_INIT_TIMEOUT_MS,
          "get session"
        );
        if (!cancelled) setUser(data?.session?.user ?? null);
      } catch (err) {
        if (!cancelled) console.warn("Session init failed:", err?.message || err);
      } finally {
        if (!cancelled) setLoading(false);
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

  // Auth methods return a normalized { error: { kind } | null } (plus data
  // where relevant), so every caller shows a consistent, translatable message.

  const sendOtp = useCallback(async (phone) => {
    if (!supabase) return { error: { kind: "config" } };
    if (!navigator.onLine) return { error: { kind: "offline" } };
    try {
      const { error } = await withTimeout(
        supabase.auth.signInWithOtp({ phone }),
        AUTH_TIMEOUT_MS,
        "send code"
      );
      return error ? { error: { kind: classifyAuthError(error) } } : { error: null };
    } catch (err) {
      return { error: { kind: classifyAuthError(err) } };
    }
  }, []);

  const verifyOtp = useCallback(async (phone, token) => {
    if (!supabase) return { error: { kind: "config" } };
    if (!navigator.onLine) return { error: { kind: "offline" } };
    try {
      const { data, error } = await withTimeout(
        supabase.auth.verifyOtp({ phone, token, type: "sms" }),
        AUTH_TIMEOUT_MS,
        "verify code"
      );
      if (error) return { error: { kind: classifyAuthError(error) } };
      if (data?.user) {
        try {
          localStorage.removeItem(GUEST_KEY);
          localStorage.setItem(WELCOME_KEY, "1");
        } catch {
          /* private browsing */
        }
        setWelcomed(true);
      }
      return { data, error: null };
    } catch (err) {
      return { error: { kind: classifyAuthError(err) } };
    }
  }, []);

  // Frictionless entry: mark them in immediately (offline-safe guest state)
  // and, when online, upgrade to a real anonymous backend identity. The
  // auth-change listener migrates the just-created guest data onto that id.
  const getStarted = useCallback(() => {
    continueAsGuest();
    // Best-effort upgrade to a real anonymous identity. Fire-and-forget — the
    // farmer is already in as a guest, so this never blocks the UI — but a
    // timeout stops a stalled request from lingering, and any failure is
    // swallowed (they simply stay a guest, still fully usable).
    if (supabase && navigator.onLine) {
      withTimeout(supabase.auth.signInAnonymously(), AUTH_TIMEOUT_MS, "anonymous sign-in")
        .then((res) => {
          if (res?.error) console.warn("Anonymous sign-in error:", res.error.message);
        })
        .catch((err) => console.warn("Anonymous sign-in failed:", err?.message || err));
    }
  }, [continueAsGuest]);

  // Google OAuth: free, cross-device identity. On success the browser redirects
  // away (the listener welcomes + migrates on return); we only return here on a
  // pre-redirect failure, normalized to a translatable kind.
  const signInWithGoogle = useCallback(async () => {
    if (!supabase) return { error: { kind: "config" } };
    if (!navigator.onLine) return { error: { kind: "offline" } };
    try {
      const { error } = await withTimeout(
        supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: window.location.origin },
        }),
        AUTH_TIMEOUT_MS,
        "Google sign-in"
      );
      return error ? { error: { kind: classifyAuthError(error) } } : { error: null };
    } catch (err) {
      return { error: { kind: classifyAuthError(err) } };
    }
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
