"use client";

import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/src/types";
import { signOut } from "@/app/auth/actions";
import { LogOut, User as UserIcon } from "lucide-react";

type Props = {
  user: User | null;
  profile: Profile | null;
};

export default function AuthButton({ user, profile }: Props) {
  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/auth"
          className="hidden rounded-md px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:text-white sm:block"
        >
          Sign in
        </Link>
        <Link
          href="/auth?tab=signup"
          className="rounded-md bg-yellow-400 px-4 py-2 text-sm font-bold text-black transition-colors hover:bg-yellow-300"
        >
          Get Started
        </Link>
      </div>
    );
  }

  const displayName =
    profile?.display_name ||
    profile?.username ||
    user.user_metadata?.username ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Profile";

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/profile"
        className="hidden items-center gap-2 transition-opacity hover:opacity-80 sm:flex"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400/20 ring-1 ring-yellow-400/40">
          <UserIcon className="h-4 w-4 text-yellow-400" />
        </div>
        <span className="max-w-[120px] truncate text-sm font-medium text-zinc-300">
          {displayName}
        </span>
      </Link>
      <form action={signOut}>
        <button
          type="submit"
          className="flex items-center gap-1.5 rounded-md border border-white/10 px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:border-white/30 hover:text-white"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </form>
    </div>
  );
}
