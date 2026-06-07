"use client";

import { useState } from "react";
import { Copy, Check, Share2 } from "lucide-react";
import { copyToClipboard, nativeShare, canUseNativeShare } from "@/src/lib/utils/share";

interface ShareButtonProps {
  url: string;
  title: string;
  text: string;
  label?: string;
  variant?: "primary" | "secondary";
}

export default function ShareButton({
  url,
  title,
  text,
  label = "Share",
  variant = "secondary",
}: ShareButtonProps) {
  const [showNativeShare] = useState(canUseNativeShare());
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    setIsSharing(true);

    const shared = await nativeShare({ title, text, url });

    if (!shared) {
      await copyToClipboard(url);
    }

    setTimeout(() => setIsSharing(false), 2000);
  };

  const baseClasses =
    "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition";

  const variantClasses =
    variant === "primary"
      ? "bg-yellow-400 text-black hover:bg-yellow-500"
      : "border border-white/15 text-zinc-300 hover:border-white/30 hover:text-white";

  return (
    <button
      onClick={handleShare}
      disabled={isSharing}
      className={`${baseClasses} ${variantClasses}`}
    >
      {isSharing ? (
        <>
          <Check className="h-4 w-4" />
          {showNativeShare ? "Shared!" : "Copied!"}
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" />
          {label}
        </>
      )}
    </button>
  );
}
