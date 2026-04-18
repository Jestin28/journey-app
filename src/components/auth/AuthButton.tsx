"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";

export function AuthButton() {
  const { isAuthLoading, isSupabaseConfigured, signInWithGoogle, signOut, user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSignIn() {
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSignOut() {
    setIsSubmitting(true);
    try {
      await signOut();
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isAuthLoading) {
    return (
      <div className="h-9 w-24 animate-pulse rounded-lg bg-slate-100" aria-label="Loading auth state" />
    );
  }

  if (!isSupabaseConfigured) {
    return (
      <span className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
        Supabase env missing
      </span>
    );
  }

  if (!user) {
    return (
      <button
        type="button"
        onClick={handleSignIn}
        disabled={isSubmitting}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Opening..." : "Sign in with Google"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="hidden max-w-[12rem] truncate text-sm font-medium text-slate-600 sm:inline">
        {user.email}
      </span>
      <button
        type="button"
        onClick={handleSignOut}
        disabled={isSubmitting}
        className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Signing out..." : "Logout"}
      </button>
    </div>
  );
}
