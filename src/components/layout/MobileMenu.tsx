"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Trophy, BarChart2, Users, Shield } from "lucide-react";

const navLinks = [
  { href: "/bracket", label: "Bracket", icon: Trophy, color: "text-red-400" },
  { href: "/leaderboard", label: "Leaderboard", icon: BarChart2, color: "text-blue-400" },
  { href: "/groups", label: "Groups", icon: Users, color: "text-green-400" },
  { href: "/goalie", label: "Goalie", icon: Shield, color: "text-yellow-400" },
];

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <div className="sm:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
        aria-label="Toggle navigation menu"
        aria-expanded={isOpen}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 top-16 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed left-0 right-0 top-16 z-50 border-b border-white/10 bg-black/95 backdrop-blur-md">
            <nav className="mx-auto max-w-7xl px-4 py-3">
              <div className="flex flex-col gap-1">
                {navLinks.map(({ href, label, icon: Icon, color }) => {
                  const isActive = pathname?.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold transition-colors ${
                        isActive
                          ? "bg-white/8 text-white"
                          : "text-zinc-400 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${isActive ? color : "text-zinc-500"}`} />
                      {label}
                      {isActive && (
                        <span className={`ml-auto h-1.5 w-1.5 rounded-full ${color.replace("text-", "bg-")}`} />
                      )}
                    </Link>
                  );
                })}
              </div>
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
