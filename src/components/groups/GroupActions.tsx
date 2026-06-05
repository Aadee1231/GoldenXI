"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { leaveGroup, deleteGroup } from "@/src/lib/supabase/queries/groups";

interface GroupActionsProps {
  groupId: string;
  isCreator: boolean;
  memberCount: number;
}

export default function GroupActions({ 
  groupId, 
  isCreator, 
  memberCount 
}: GroupActionsProps) {
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLeave() {
    setLoading(true);
    setError(null);

    const result = await leaveGroup(groupId);

    if (result.success) {
      router.push("/groups");
    } else {
      setError(result.error || "Failed to leave group");
      setLoading(false);
    }
  }

  async function handleDelete() {
    setLoading(true);
    setError(null);

    const result = await deleteGroup(groupId);

    if (result.success) {
      router.push("/groups");
    } else {
      setError(result.error || "Failed to delete group");
      setLoading(false);
    }
  }

  if (showDeleteConfirm) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5">
        <div className="mb-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-400" />
          <div>
            <h4 className="font-medium text-white">Delete Group?</h4>
            <p className="text-sm text-zinc-400">
              This will remove all {memberCount} members and cannot be undone.
            </p>
          </div>
        </div>

        {error && (
          <p className="mb-3 text-sm text-red-400">{error}</p>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => setShowDeleteConfirm(false)}
            disabled={loading}
            className="flex-1 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Delete
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      {!isCreator && (
        <button
          onClick={handleLeave}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:border-red-500/50 hover:text-red-400 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
          Leave Group
        </button>
      )}

      {isCreator && (
        <button
          onClick={() => setShowDeleteConfirm(true)}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
          Delete Group
        </button>
      )}
    </div>
  );
}
