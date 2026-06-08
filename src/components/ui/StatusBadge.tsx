import { LucideIcon } from "lucide-react";

interface StatusBadgeProps {
  label: string;
  variant?: "coming-soon" | "ai" | "locked" | "submitted" | "default";
  icon?: LucideIcon;
}

export default function StatusBadge({ label, variant = "default", icon: Icon }: StatusBadgeProps) {
  const variants = {
    "coming-soon": "bg-blue-400/10 text-blue-400 ring-blue-400/20",
    "ai": "bg-yellow-400/10 text-yellow-400 ring-yellow-400/20",
    "locked": "bg-yellow-400/20 text-yellow-400 ring-yellow-400/30",
    "submitted": "bg-green-400/20 text-green-400 ring-green-400/30",
    "default": "bg-white/10 text-white ring-white/20",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${variants[variant]}`}>
      {Icon && <Icon className="h-3 w-3" />}
      {label}
    </span>
  );
}
