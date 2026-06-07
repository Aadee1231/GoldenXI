"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { copyToClipboard } from "@/src/lib/utils/share";

interface CopyButtonProps {
  text: string;
  label?: string;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
}

export default function CopyButton({
  text,
  label = "Copy",
  variant = "secondary",
  size = "md",
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const baseClasses = "inline-flex items-center gap-2 rounded-lg font-medium transition";

  const sizeClasses = size === "sm" ? "px-2 py-1 text-xs" : "px-4 py-2 text-sm";

  const variantClasses =
    variant === "primary"
      ? "bg-yellow-400 text-black hover:bg-yellow-500"
      : variant === "ghost"
      ? "text-zinc-400 hover:text-white"
      : "border border-white/15 text-zinc-300 hover:border-white/30 hover:text-white";

  return (
    <button
      onClick={handleCopy}
      disabled={copied}
      className={`${baseClasses} ${sizeClasses} ${variantClasses}`}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          {label}
        </>
      )}
    </button>
  );
}
