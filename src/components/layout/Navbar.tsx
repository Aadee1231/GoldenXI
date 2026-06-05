import Link from "next/link";
import { Suspense } from "react";
import { Trophy } from "lucide-react";
import NavbarAuth from "@/src/components/layout/NavbarAuth";

function NavbarAuthFallback() {
  return (
    <div className="flex items-center gap-3">
      <div className="hidden h-8 w-16 animate-pulse rounded-md bg-white/10 sm:block" />
      <div className="h-8 w-24 animate-pulse rounded-md bg-yellow-400/20" />
    </div>
  );
}

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-yellow-400" />
          <span className="text-xl font-bold tracking-tight text-white">
            Golden<span className="text-yellow-400">XI</span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 sm:flex">
          <Link
            href="/bracket"
            className="text-sm font-medium text-zinc-400 transition-colors hover:text-white"
          >
            Bracket
          </Link>
          <Link
            href="/leaderboard"
            className="text-sm font-medium text-zinc-400 transition-colors hover:text-white"
          >
            Leaderboard
          </Link>
          <Link
            href="/groups"
            className="text-sm font-medium text-zinc-400 transition-colors hover:text-white"
          >
            Groups
          </Link>
        </div>

        <Suspense fallback={<NavbarAuthFallback />}>
          <NavbarAuth />
        </Suspense>
      </div>
    </nav>
  );
}
