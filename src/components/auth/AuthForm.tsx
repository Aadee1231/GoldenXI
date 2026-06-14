"use client";

import { useState } from "react";
import { signIn, signUp } from "@/app/auth/actions";
import { createClient } from "@/src/lib/supabase/client";
import { Mail, Lock, Loader2 } from "lucide-react";

type Props = {
  defaultTab: string;
  error: string | null;
  message: string | null;
  redirect?: string | null;
};

export default function AuthForm({ defaultTab, error, message, redirect }: Props) {
  const [tab, setTab] = useState<"login" | "signup">(
    defaultTab === "signup" ? "signup" : "login"
  );
  const [pending, setPending] = useState(false);
  const [googlePending, setGooglePending] = useState(false);

  async function handleSubmit(
    action: (fd: FormData) => Promise<never>,
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();
    setPending(true);
    const fd = new FormData(e.currentTarget);
    try {
      await action(fd);
    } finally {
      setPending(false);
    }
  }

  async function handleGoogleSignIn() {
    setGooglePending(true);
    try {
      const supabase = createClient();
      const redirectTo = new URL("/auth/callback", window.location.origin);
      if (redirect) {
        redirectTo.searchParams.set("redirect", redirect);
      }
      
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo.toString()
        }
      });
    } catch (error) {
      console.error("Google sign-in error:", error);
      setGooglePending(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
      {/* Tabs */}
      <div className="mb-8 flex rounded-xl bg-white/5 p-1">
        {(["login", "signup"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${
              tab === t
                ? "bg-yellow-400 text-black shadow"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            {t === "login" ? "Sign In" : "Sign Up"}
          </button>
        ))}
      </div>

      {/* Error / Message banners */}
      {error && (
        <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      {message && (
        <div className="mb-5 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          {message}
        </div>
      )}

      {/* Login Form */}
      {tab === "login" && (
        <form onSubmit={(e) => handleSubmit(signIn, e)} className="space-y-5">
          {redirect && <input type="hidden" name="redirect" value={redirect} />}
          <div>
            <label
              htmlFor="login-email"
              className="mb-1.5 block text-sm font-medium text-zinc-300"
            >
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                id="login-email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-yellow-400/60 focus:ring-1 focus:ring-yellow-400/30"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="mb-1.5 block text-sm font-medium text-zinc-300"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                id="login-password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-yellow-400/60 focus:ring-1 focus:ring-yellow-400/30"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-400 py-3 text-sm font-bold text-black transition hover:bg-yellow-300 disabled:opacity-60"
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Sign In
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white/5 px-2 text-zinc-500">or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googlePending}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/20 bg-white/5 py-3 text-sm font-medium text-white transition hover:bg-white/10 hover:border-white/30 disabled:opacity-60"
          >
            {googlePending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            Continue with Google
          </button>

          <p className="text-center text-sm text-zinc-500">
            No account?{" "}
            <button
              type="button"
              onClick={() => setTab("signup")}
              className="font-medium text-yellow-400 hover:text-yellow-300"
            >
              Sign up
            </button>
          </p>
        </form>
      )}

      {/* Sign Up Form */}
      {tab === "signup" && (
        <form onSubmit={(e) => handleSubmit(signUp, e)} className="space-y-5">
          {redirect && <input type="hidden" name="redirect" value={redirect} />}
          <div>
            <label
              htmlFor="signup-email"
              className="mb-1.5 block text-sm font-medium text-zinc-300"
            >
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                id="signup-email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-yellow-400/60 focus:ring-1 focus:ring-yellow-400/30"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="signup-password"
              className="mb-1.5 block text-sm font-medium text-zinc-300"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                id="signup-password"
                name="password"
                type="password"
                required
                minLength={6}
                placeholder="At least 6 characters"
                className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-yellow-400/60 focus:ring-1 focus:ring-yellow-400/30"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-400 py-3 text-sm font-bold text-black transition hover:bg-yellow-300 disabled:opacity-60"
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Create Account
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white/5 px-2 text-zinc-500">or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googlePending}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/20 bg-white/5 py-3 text-sm font-medium text-white transition hover:bg-white/10 hover:border-white/30 disabled:opacity-60"
          >
            {googlePending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            Continue with Google
          </button>

          <p className="text-center text-sm text-zinc-500">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => setTab("login")}
              className="font-medium text-yellow-400 hover:text-yellow-300"
            >
              Sign in
            </button>
          </p>
        </form>
      )}
    </div>
  );
}
