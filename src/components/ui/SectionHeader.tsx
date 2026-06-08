import { LucideIcon } from "lucide-react";

interface SectionHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  color?: "gold" | "blue" | "green" | "red";
}

export default function SectionHeader({ icon: Icon, title, subtitle, color = "gold" }: SectionHeaderProps) {
  const colorMap = {
    gold: { icon: "bg-yellow-400/10 ring-yellow-400/20 text-yellow-400", glow: "from-yellow-400/5 to-transparent" },
    blue: { icon: "bg-blue-400/10 ring-blue-400/20 text-blue-400", glow: "from-blue-400/5 to-transparent" },
    green: { icon: "bg-green-400/10 ring-green-400/20 text-green-400", glow: "from-green-400/5 to-transparent" },
    red: { icon: "bg-red-400/10 ring-red-400/20 text-red-400", glow: "from-red-400/5 to-transparent" },
  };

  const c = colorMap[color];

  return (
    <div className="relative mb-8">
      {/* Background glow */}
      <div className={`pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r ${c.glow} blur-2xl`} aria-hidden="true" />
      
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${c.icon} ring-2 shadow-lg`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-white sm:text-4xl">{title}</h1>
          {subtitle && <p className="mt-2 text-base text-zinc-400 sm:text-lg">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}
