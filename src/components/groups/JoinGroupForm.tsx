"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { joinGroup } from "@/src/lib/supabase/queries/groups";

export default function JoinGroupForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await joinGroup(code);

    if (result.success && result.groupId) {
      router.push(`/groups/${result.groupId}`);
    } else {
      setError(result.error || "Failed to join group");
      setLoading(false);
    }
  }

  // Auto-uppercase and limit to 6 chars
  function handleCodeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    setCode(value);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="join-code" className="mb-1.5 block text-sm text-zinc-400">
          Join Code
        </label>
        <input
          id="join-code"
          type="text"
          value={code}
          onChange={handleCodeChange}
          placeholder="ABC123"
          required
          maxLength={6}
          className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-center text-sm font-mono uppercase tracking-widest text-white placeholder-zinc-600 focus:border-yellow-400 focus:outline-none"
        />
        <p className="mt-1 text-xs text-zinc-500">
          Enter the 6-character code from the group creator
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || code.length !== 6}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Joining...
          </>
        ) : (
          "Join Group"
        )}
      </button>
    </form>
  );
}
