"use client";

import Link from "next/link";
import { Trophy, Shield } from "lucide-react";

type Tab = "bracket" | "goalie";

export default function LeaderboardTabs({ activeTab }: { activeTab: Tab }) {
  const tabs: { id: Tab; label: string; icon: typeof Trophy; href: string }[] = [
    {
      id: "bracket",
      label: "Bracket Rankings",
      icon: Trophy,
      href: "/leaderboard?tab=bracket",
    },
    {
      id: "goalie",
      label: "Goalie Reaction",
      icon: Shield,
      href: "/leaderboard?tab=goalie",
    },
  ];

  return (
    <div className="mb-10 flex justify-center">
      <div className="inline-flex rounded-2xl border border-white/10 bg-white/[0.04] p-1 gap-1">
        {tabs.map(({ id, label, icon: Icon, href }) => {
          const isActive = activeTab === id;
          return (
            <Link
              key={id}
              href={href}
              className={[
                "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all",
                isActive
                  ? id === "goalie"
                    ? "bg-gradient-to-r from-yellow-400/20 to-yellow-500/10 text-yellow-300 shadow-inner ring-1 ring-yellow-400/30"
                    : "bg-gradient-to-r from-blue-400/20 to-blue-500/10 text-blue-300 shadow-inner ring-1 ring-blue-400/30"
                  : "text-zinc-500 hover:text-zinc-300",
              ].join(" ")}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
