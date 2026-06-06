"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createGroup } from "@/src/lib/supabase/queries/groups";

export default function CreateGroupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await createGroup(name);

    if (result.success && result.group) {
      router.push(`/groups/${result.group.id}`);
    } else {
      setError(result.error || "Failed to create group");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="group-name" className="mb-1.5 block text-sm text-zinc-400">
          Group Name
        </label>
        <input
          id="group-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Office Pool 2026"
          required
          minLength={2}
          maxLength={50}
          className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-yellow-400 focus:outline-none"
        />
      </div>

      <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
        <p className="text-sm text-zinc-400">Tournament</p>
        <p className="font-medium text-white">World Cup 2026</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-yellow-400 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating...
          </>
        ) : (
          "Create Group"
        )}
      </button>
    </form>
  );
}
