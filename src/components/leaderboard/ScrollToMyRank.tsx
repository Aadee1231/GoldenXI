"use client";

import { useState } from "react";
import { ChevronDown, UserRound } from "lucide-react";

type Props = {
  currentUserId: string | null;
};

export default function ScrollToMyRank({ currentUserId }: Props) {
  const [status, setStatus] = useState<"idle" | "not-found">("idle");

  if (!currentUserId) return null;

  const handleClick = () => {
    const el = document.querySelector<HTMLElement>(
      `[data-user-id="${currentUserId}"]`
    );

    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.style.transition = "box-shadow 0.3s ease";
      el.style.boxShadow = "0 0 0 2px rgba(250, 204, 21, 0.7), 0 0 16px rgba(250, 204, 21, 0.25)";
      setTimeout(() => {
        el.style.boxShadow = "";
      }, 2200);
      setStatus("idle");
    } else {
      setStatus("not-found");
      setTimeout(() => setStatus("idle"), 2500);
    }
  };

  return (
    <button
      onClick={handleClick}
      aria-label="Scroll to my ranking"
      className={[
        "fixed bottom-6 right-4 z-50 flex items-center gap-2 rounded-full border px-4 py-2.5",
        "text-sm font-bold shadow-lg backdrop-blur-sm transition-all active:scale-95 sm:right-6",
        status === "not-found"
          ? "border-zinc-600/50 bg-zinc-800/80 text-zinc-400 shadow-zinc-900/20"
          : "border-yellow-400/40 bg-yellow-400/10 text-yellow-400 shadow-yellow-400/10 ring-1 ring-yellow-400/20 hover:bg-yellow-400/20 hover:shadow-yellow-400/20 hover:ring-yellow-400/40",
      ].join(" ")}
    >
      {status === "not-found" ? (
        <span className="text-xs">Not in list</span>
      ) : (
        <>
          <UserRound className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">My Rank</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0" />
        </>
      )}
    </button>
  );
}
