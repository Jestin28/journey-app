"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type AuthContextValue = {
  user: User | null;
  isAuthLoading: boolean;
  isSupabaseConfigured: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const AUTH_CALLBACK_PARAMS = [
  "code",
  "error",
  "error_code",
  "error_description",
  "sb",
  "access_token",
  "refresh_token",
  "expires_at",
  "expires_in",
  "token_type",
  "type",
];

type AuthProviderProps = {
  children: ReactNode;
};

function getOAuthCallbackParams() {
  const url = new URL(window.location.href);
  const hashParams = new URLSearchParams(url.hash.startsWith("#") ? url.hash.slice(1) : url.hash);

  return {
    code: url.searchParams.get("code") ?? hashParams.get("code"),
    error: url.searchParams.get("error") ?? hashParams.get("error"),
    errorCode: url.searchParams.get("error_code") ?? hashParams.get("error_code"),
    errorDescription: url.searchParams.get("error_description") ?? hashParams.get("error_description"),
  };
}

function clearOAuthCallbackParams() {
  const url = new URL(window.location.href);
  const hashParams = new URLSearchParams(url.hash.startsWith("#") ? url.hash.slice(1) : url.hash);
  let changed = false;
  let hashChanged = false;

  AUTH_CALLBACK_PARAMS.forEach((param) => {
    if (url.searchParams.has(param)) {
      url.searchParams.delete(param);
      changed = true;
    }

    if (hashParams.has(param)) {
      hashParams.delete(param);
      hashChanged = true;
    }
  });

  if (hashChanged) {
    const nextHash = hashParams.toString();
    url.hash = nextHash ? `#${nextHash}` : "";
    changed = true;
  }

  if (changed) {
    window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
  }
}

function hasPersistedSupabaseSession() {
  return Object.keys(window.localStorage).some((key) => key.startsWith("sb-") && key.endsWith("-auth-token"));
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      console.info("[auth] Supabase is not configured.");
      setIsAuthLoading(false);
      return;
    }

    const supabaseClient = supabase;
    let isMounted = true;

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((event, session) => {
      console.info("[auth] state changed", {
        event,
        userEmail: session?.user?.email ?? null,
      });

      if (!isMounted) {
        return;
      }

      setUser(session?.user ?? null);
      setIsAuthLoading(false);
    });

    async function loadSession() {
      console.info("[auth] loading initial session");

      const callbackParams = getOAuthCallbackParams();

      if (callbackParams.error || callbackParams.errorDescription) {
        console.error("[auth] OAuth callback returned an error", {
          error: callbackParams.error,
          errorCode: callbackParams.errorCode,
          errorDescription: callbackParams.errorDescription,
        });
        clearOAuthCallbackParams();
      }

      if (callbackParams.code) {
        console.info("[auth] callback code detected; waiting for Supabase URL session detection");
      }

      const { data, error } = await supabaseClient.auth.getUser();

      console.info("[auth] initial user loaded", {
        userEmail: data.user?.email ?? null,
        error: error?.message ?? null,
        persistedToLocalStorage: hasPersistedSupabaseSession(),
      });

      if (isMounted) {
        setUser(data.user);
        setIsAuthLoading(false);
      }
    }

    loadSession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) {
      console.info("[auth] Google sign-in skipped because Supabase is not configured.");
      return;
    }

    console.info("[auth] starting Google sign-in");

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      console.error("[auth] failed to start Google sign-in", {
        message: error.message,
        status: error.status,
      });
      return;
    }

    console.info("[auth] Google sign-in redirect created", {
      provider: data.provider,
      hasUrl: Boolean(data.url),
    });
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) {
      console.info("[auth] sign-out skipped because Supabase is not configured.");
      return;
    }

    console.info("[auth] signing out");
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthLoading,
      isSupabaseConfigured,
      signInWithGoogle,
      signOut,
    }),
    [isAuthLoading, signInWithGoogle, signOut, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
