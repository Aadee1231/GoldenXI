export default function TournamentDivider({ color = "gold" }: { color?: "gold" | "blue" | "green" | "red" }) {
  const colorMap = {
    gold: "from-yellow-400/20 via-yellow-400/40 to-yellow-400/20",
    blue: "from-blue-400/20 via-blue-400/40 to-blue-400/20",
    green: "from-green-400/20 via-green-400/40 to-green-400/20",
    red: "from-red-400/20 via-red-400/40 to-red-400/20",
  };

  return (
    <div className="relative py-8">
      <div className={`h-px w-full bg-gradient-to-r ${colorMap[color]}`} />
      <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/20" />
    </div>
  );
}
