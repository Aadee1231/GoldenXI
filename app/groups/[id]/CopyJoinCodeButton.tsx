"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

type CopyJoinCodeButtonProps = {
  joinCode: string;
};

export default function CopyJoinCodeButton({ joinCode }: CopyJoinCodeButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(joinCode);
    setCopied(true);

    window.setTimeout(() => {
      setCopied(false);
    }, 1500);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-2 rounded-lg border border-yellow-500/40 px-3 py-2 text-sm font-medium text-yellow-400 hover:bg-yellow-500/10"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          Copy Code
        </>
      )}
    </button>
  );
}