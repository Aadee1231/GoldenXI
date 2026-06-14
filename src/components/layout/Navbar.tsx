import Link from "next/link";
import { Suspense } from "react";
import { Trophy } from "lucide-react";
import NavbarAuth from "@/src/components/layout/NavbarAuth";
import NavLinks from "@/src/components/layout/NavLinks";
import MobileMenu from "@/src/components/layout/MobileMenu";

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
      <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-1.5 sm:gap-2 group">
          <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400 group-hover:scale-110 transition-transform" />
          <span className="text-lg sm:text-xl font-bold tracking-tight text-white">
            Golden<span className="text-yellow-400">XI</span>
          </span>
        </Link>

        <div className="hidden items-center gap-6 sm:gap-8 md:flex">
          <NavLinks />
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <MobileMenu />
          <Suspense fallback={<NavbarAuthFallback />}>
            <NavbarAuth />
          </Suspense>
        </div>
      </div>
    </nav>
  );
}
