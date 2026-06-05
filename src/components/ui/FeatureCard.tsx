import type { LucideIcon } from "lucide-react";

type FeatureCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
};

export default function FeatureCard({
  icon: Icon,
  title,
  description,
  badge,
}: FeatureCardProps) {
  return (
    <div className="group relative rounded-2xl border border-white/10 bg-white/5 p-6 transition-all duration-300 hover:border-yellow-400/40 hover:bg-white/8">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-400/10 ring-1 ring-yellow-400/20 transition-colors group-hover:bg-yellow-400/20">
          <Icon className="h-6 w-6 text-yellow-400" />
        </div>
        {badge && (
          <span className="rounded-full bg-yellow-400/10 px-2.5 py-0.5 text-xs font-semibold text-yellow-400 ring-1 ring-yellow-400/20">
            {badge}
          </span>
        )}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
      <p className="text-sm leading-relaxed text-zinc-400">{description}</p>
    </div>
  );
}
