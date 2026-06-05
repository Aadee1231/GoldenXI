"use client";

import { useState } from "react";
import { signIn, signUp } from "@/app/auth/actions";
import { Mail, Lock, Loader2 } from "lucide-react";

type Props = {
  defaultTab: string;
  error: string | null;
  message: string | null;
};

export default function AuthForm({ defaultTab, error, message }: Props) {
  const [tab, setTab] = useState<"login" | "signup">(
    defaultTab === "signup" ? "signup" : "login"
  );
  const [pending, setPending] = useState(false);

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
