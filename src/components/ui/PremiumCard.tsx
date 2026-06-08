import { ReactNode } from "react";

interface PremiumCardProps {
  children: ReactNode;
  variant?: "default" | "gold" | "green" | "blue";
  className?: string;
  hover?: boolean;
}

export default function PremiumCard({ 
  children, 
  variant = "default", 
  className = "",
  hover = true 
}: PremiumCardProps) {
  const variants = {
    default: "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8",
    gold: "border-yellow-400/20 bg-yellow-400/5 hover:border-yellow-400/40 hover:bg-yellow-400/10 hover:shadow-lg hover:shadow-yellow-400/10",
    green: "border-green-400/20 bg-green-400/5 hover:border-green-400/40 hover:bg-green-400/10 hover:shadow-lg hover:shadow-green-400/10",
    blue: "border-blue-400/20 bg-blue-400/5 hover:border-blue-400/40 hover:bg-blue-400/10 hover:shadow-lg hover:shadow-blue-400/10",
  };

  const hoverClass = hover ? "transition-all duration-300" : "";

  return (
    <div className={`rounded-xl border p-6 ${variants[variant]} ${hoverClass} ${className}`}>
      {children}
    </div>
  );
}
