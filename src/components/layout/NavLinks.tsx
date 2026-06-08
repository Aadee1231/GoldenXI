"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/bracket", label: "Bracket", color: "gold" },
  { href: "/leaderboard", label: "Leaderboard", color: "blue" },
  { href: "/groups", label: "Groups", color: "green" },
];

export default function NavLinks() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href);
  };

  const getActiveClasses = (href: string, color: string) => {
    const active = isActive(href);
    
    if (!active) {
      return "text-zinc-400 hover:text-white";
    }

    const colorMap: Record<string, string> = {
      gold: "text-yellow-400 relative after:absolute after:bottom-[-20px] after:left-0 after:right-0 after:h-0.5 after:bg-yellow-400 after:shadow-[0_0_8px_rgba(250,204,21,0.5)]",
      blue: "text-blue-400 relative after:absolute after:bottom-[-20px] after:left-0 after:right-0 after:h-0.5 after:bg-blue-400 after:shadow-[0_0_8px_rgba(96,165,250,0.5)]",
      green: "text-green-400 relative after:absolute after:bottom-[-20px] after:left-0 after:right-0 after:h-0.5 after:bg-green-400 after:shadow-[0_0_8px_rgba(74,222,128,0.5)]",
    };

    return colorMap[color] || "text-white";
  };

  return (
    <>
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`text-sm font-medium transition-all ${getActiveClasses(link.href, link.color)}`}
        >
          {link.label}
        </Link>
      ))}
    </>
  );
}
