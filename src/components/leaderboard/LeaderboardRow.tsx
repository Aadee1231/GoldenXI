import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { LeaderboardEntry } from "@/src/types";
import TeamFlag from "@/src/components/ui/TeamFlag";

type Props = {
  entry: LeaderboardEntry;
};

const MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

export default function LeaderboardRow({ entry }: Props) {
  const displayName = entry.display_name || entry.username || "Unknown Player";
  const initial = displayName.slice(0, 1).toUpperCase();
  const isTop3 = entry.rank <= 3;
  // A row is linkable only when the user has a valid public bracket URL.
  // After privacy filtering, all visible users are public — the only remaining
  // question is whether they have a username (needed for /u/:username/bracket).
  const isLinkable = Boolean(entry.username);

  const content = (
    <>
      {/* Rank */}
      <div className="w-8 shrink-0 text-center">
        {MEDAL[entry.rank] ? (
          <span className="text-xl">{MEDAL[entry.rank]}</span>
        ) : (
          <span className="text-sm font-bold text-zinc-500">
            #{entry.rank}
          </span>
        )}
      </div>

      {/* Avatar */}
      <div
        className={[
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold",
          isTop3
            ? "bg-yellow-400/20 text-yellow-300 ring-1 ring-yellow-400/40"
            : "bg-white/10 text-zinc-300",
        ].join(" ")}
      >
        {entry.avatar_url ? (
          <img
            src={entry.avatar_url}
            alt={displayName}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          initial
        )}
      </div>

      {/* Name + bracket */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">
          {displayName}
          {/* Always reserve space so all rows align; dim when not clickable */}
          <span
            className={[
              "ml-1.5 text-xs font-normal transition-colors",
              isLinkable
                ? "text-yellow-400/70 group-hover:text-yellow-400"
                : "invisible select-none",
            ].join(" ")}
            aria-hidden={!isLinkable}
          >
            View bracket
          </span>
        </p>
        <p className="truncate text-xs text-zinc-500">{entry.bracket_name}</p>
      </div>

      {/* Champion pick */}
      <div className="hidden min-w-[110px] sm:block">
        {entry.champion_name ? (
          <div className="flex items-center gap-2">
            <TeamFlag
              name={entry.champion_name}
              code={entry.champion_code || ""}
              flag_emoji={entry.champion_flag}
              flag_code={entry.champion_code}
              size="sm"
            />
            <span className="text-xs font-medium text-zinc-300">
              {entry.champion_name}
            </span>
          </div>
        ) : (
          <span className="text-xs italic text-zinc-600">No pick</span>
        )}
      </div>

      {/* Points */}
      <div className="shrink-0 text-right">
        <p
          className={[
            "text-lg font-extrabold tabular-nums",
            isTop3 ? "text-yellow-400" : "text-white",
          ].join(" ")}
        >
          {entry.total_score}
        </p>
        <p className="text-[10px] uppercase tracking-wider text-zinc-600">
          pts
        </p>
      </div>

      {/* Date — hidden on small */}
      <div className="hidden w-16 shrink-0 text-right lg:block">
        <p className="text-xs text-zinc-600">{timeAgo(entry.submitted_at)}</p>
      </div>

      {/* Chevron: always reserve the slot; only visible when linkable */}
      <ChevronRight
        className={[
          "hidden h-4 w-4 shrink-0 transition-colors sm:block",
          isLinkable ? "text-zinc-600 group-hover:text-yellow-400" : "invisible",
        ].join(" ")}
      />
    </>
  );

  const baseClass = [
    "group flex items-center gap-4 rounded-xl border px-5 py-4 transition-all",
    isTop3
      ? "border-yellow-400/30 bg-yellow-400/5 hover:bg-yellow-400/10"
      : "border-white/8 bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.06]",
  ].join(" ");

  if (isLinkable) {
    return (
      <Link
        href={`/u/${entry.username}/bracket`}
        className={`${baseClass} cursor-pointer hover:border-yellow-400/40 hover:ring-1 hover:ring-yellow-400/20`}
      >
        {content}
      </Link>
    );
  }

  return <div className={baseClass}>{content}</div>;
}
