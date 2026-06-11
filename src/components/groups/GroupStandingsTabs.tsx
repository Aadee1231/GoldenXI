"use client";

import Link from "next/link";
import { Trophy, Shield } from "lucide-react";

type StandingsTab = "bracket" | "goalie";

export default function GroupStandingsTabs({
  activeTab,
  groupId,
}: {
  activeTab: StandingsTab;
  groupId: string;
}) {
  const tabs: { id: StandingsTab; label: string; icon: typeof Trophy }[] = [
    { id: "bracket", label: "Bracket Standings", icon: Trophy },
    { id: "goalie",  label: "Goalie Standings",  icon: Shield },
  ];

  return (
    <div className="mb-5 flex gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
      {tabs.map(({ id, label, icon: Icon }) => {
        const isActive = activeTab === id;
        return (
          <Link
            key={id}
            href={`/groups/${groupId}?standings=${id}`}
            className={[
              "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all",
              isActive
                ? id === "goalie"
                  ? "bg-yellow-400/15 text-yellow-300 ring-1 ring-yellow-400/30"
                  : "bg-blue-400/15 text-blue-300 ring-1 ring-blue-400/30"
                : "text-zinc-500 hover:text-zinc-300",
            ].join(" ")}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
