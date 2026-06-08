import type { LucideIcon } from "lucide-react";

type FeatureCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
  color?: "gold" | "green" | "blue" | "red";
};

export default function FeatureCard({
  icon: Icon,
  title,
  description,
  badge,
  color = "gold",
}: FeatureCardProps) {
  const isComingSoon = badge === "Coming Soon";
  
  const colorStyles = {
    gold: {
      border: "hover:border-yellow-400/50 hover:shadow-yellow-400/10",
      icon: "bg-yellow-400/10 ring-yellow-400/20 group-hover:bg-yellow-400/20 group-hover:ring-yellow-400/30",
      iconColor: "text-yellow-400",
    },
    green: {
      border: "hover:border-green-400/50 hover:shadow-green-400/10",
      icon: "bg-green-400/10 ring-green-400/20 group-hover:bg-green-400/20 group-hover:ring-green-400/30",
      iconColor: "text-green-400",
    },
    blue: {
      border: "hover:border-blue-400/50 hover:shadow-blue-400/10",
      icon: "bg-blue-400/10 ring-blue-400/20 group-hover:bg-blue-400/20 group-hover:ring-blue-400/30",
      iconColor: "text-blue-400",
    },
    red: {
      border: "hover:border-red-400/50 hover:shadow-red-400/10",
      icon: "bg-red-400/10 ring-red-400/20 group-hover:bg-red-400/20 group-hover:ring-red-400/30",
      iconColor: "text-red-400",
    },
  };
  
  const style = colorStyles[color];
  
  return (
    <div className={`group relative rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg transition-all duration-300 hover:bg-white/8 hover:scale-105 ${style.border}`}>
      <div className="mb-4 flex items-start justify-between">
        <div className={`flex h-14 w-14 items-center justify-center rounded-xl ring-2 transition-all ${style.icon}`}>
          <Icon className={`h-7 w-7 ${style.iconColor}`} />
        </div>
        {badge && (
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider ring-1 ${
            isComingSoon 
              ? "bg-blue-400/15 text-blue-400 ring-blue-400/30" 
              : "bg-yellow-400/15 text-yellow-400 ring-yellow-400/30"
          }`}>
            {badge}
          </span>
        )}
      </div>
      <h3 className="mb-2.5 text-lg font-bold text-white">{title}</h3>
      <p className="text-sm leading-relaxed text-zinc-400">{description}</p>
    </div>
  );
}
