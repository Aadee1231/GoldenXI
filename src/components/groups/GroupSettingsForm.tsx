"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, CheckCircle, AlertCircle, Trash2 } from "lucide-react";
import { updateGroupSettings, updateGroupInfo } from "@/src/lib/supabase/queries/group-settings";
import { deleteGroup } from "@/src/lib/supabase/queries/groups";
import type { GroupSettings } from "@/src/types";

interface GroupSettingsFormProps {
  groupId: string;
  groupName: string;
  initialSettings: GroupSettings;
}

export default function GroupSettingsForm({
  groupId,
  groupName: initialGroupName,
  initialSettings,
}: GroupSettingsFormProps) {
  const router = useRouter();
  const [groupName, setGroupName] = useState(initialGroupName);
  const [description, setDescription] = useState(initialSettings.description || "");
  const [invitePolicy, setInvitePolicy] = useState(initialSettings.invite_policy);
  const [leaderboardVisibility, setLeaderboardVisibility] = useState(initialSettings.leaderboard_visibility);
  const [bracketVisibility, setBracketVisibility] = useState(initialSettings.bracket_visibility);
  const [lockAt, setLockAt] = useState(initialSettings.lock_at || "");
  const [allowLateJoin, setAllowLateJoin] = useState(initialSettings.allow_late_join);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const infoResult = await updateGroupInfo(groupId, groupName, description || null);

    if (!infoResult.success) {
      setMessage({ type: "error", text: infoResult.error || "Failed to update group info" });
      setIsLoading(false);
      return;
    }

    const settingsResult = await updateGroupSettings(groupId, {
      invite_policy: invitePolicy,
      leaderboard_visibility: leaderboardVisibility,
      bracket_visibility: bracketVisibility,
      lock_at: lockAt || null,
      allow_late_join: allowLateJoin,
      description: description || null,
    });

    if (settingsResult.success) {
      setMessage({ type: "success", text: "Settings saved successfully!" });
    } else {
      setMessage({ type: "error", text: settingsResult.error || "Failed to save settings" });
    }

    setIsLoading(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setMessage(null);

    const result = await deleteGroup(groupId);

    if (result.success) {
      router.push("/groups");
    } else {
      setMessage({ type: "error", text: result.error || "Failed to delete group" });
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <div
          className={`rounded-lg border px-4 py-3 ${
            message.type === "success"
              ? "border-green-500/30 bg-green-500/10 text-green-400"
              : "border-red-500/30 bg-red-500/10 text-red-400"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "success" ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            {message.text}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-5">
        <h2 className="text-lg font-semibold text-white">Basic Information</h2>

        <div>
          <label htmlFor="groupName" className="block text-sm font-medium text-zinc-300 mb-2">
            Group Name
          </label>
          <input
            type="text"
            id="groupName"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            required
            className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-2 text-white placeholder-zinc-500 focus:border-yellow-400 focus:outline-none focus:ring-1 focus:ring-yellow-400"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-zinc-300 mb-2">
            Description <span className="text-zinc-500">(optional)</span>
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Add a description for your group..."
            className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-2 text-white placeholder-zinc-500 focus:border-yellow-400 focus:outline-none focus:ring-1 focus:ring-yellow-400"
          />
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-5">
        <h2 className="text-lg font-semibold text-white">Competition Settings</h2>

        <div>
          <label htmlFor="lockAt" className="block text-sm font-medium text-zinc-300 mb-2">
            Lock Time <span className="text-zinc-500">(optional)</span>
          </label>
          <input
            type="datetime-local"
            id="lockAt"
            value={lockAt}
            onChange={(e) => setLockAt(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-2 text-white focus:border-yellow-400 focus:outline-none focus:ring-1 focus:ring-yellow-400"
          />
          <p className="mt-1 text-xs text-zinc-500">
            Deadline for bracket submissions/edits. Leave empty for no deadline.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Allow Late Joins
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setAllowLateJoin(true)}
              className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                allowLateJoin
                  ? "border-yellow-400 bg-yellow-400/10 text-yellow-400"
                  : "border-white/10 bg-black/30 text-zinc-400 hover:border-white/20"
              }`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => setAllowLateJoin(false)}
              className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                !allowLateJoin
                  ? "border-yellow-400 bg-yellow-400/10 text-yellow-400"
                  : "border-white/10 bg-black/30 text-zinc-400 hover:border-white/20"
              }`}
            >
              No
            </button>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Whether users can join after the lock time
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-5">
        <h2 className="text-lg font-semibold text-white">Privacy Settings</h2>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Who Can Invite
          </label>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setInvitePolicy("members")}
              className={`w-full rounded-lg border px-4 py-3 text-left transition ${
                invitePolicy === "members"
                  ? "border-yellow-400 bg-yellow-400/10"
                  : "border-white/10 bg-black/30 hover:border-white/20"
              }`}
            >
              <div className="font-medium text-white">All Members</div>
              <div className="text-xs text-zinc-400">Any member can share the join code</div>
            </button>
            <button
              type="button"
              onClick={() => setInvitePolicy("admin_only")}
              className={`w-full rounded-lg border px-4 py-3 text-left transition ${
                invitePolicy === "admin_only"
                  ? "border-yellow-400 bg-yellow-400/10"
                  : "border-white/10 bg-black/30 hover:border-white/20"
              }`}
            >
              <div className="font-medium text-white">Admin Only</div>
              <div className="text-xs text-zinc-400">Only you can see and share the join code</div>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Leaderboard Visibility
          </label>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setLeaderboardVisibility("always")}
              className={`w-full rounded-lg border px-4 py-3 text-left transition ${
                leaderboardVisibility === "always"
                  ? "border-yellow-400 bg-yellow-400/10"
                  : "border-white/10 bg-black/30 hover:border-white/20"
              }`}
            >
              <div className="font-medium text-white">Always Visible</div>
              <div className="text-xs text-zinc-400">Scores are always visible to members</div>
            </button>
            <button
              type="button"
              onClick={() => setLeaderboardVisibility("after_lock")}
              className={`w-full rounded-lg border px-4 py-3 text-left transition ${
                leaderboardVisibility === "after_lock"
                  ? "border-yellow-400 bg-yellow-400/10"
                  : "border-white/10 bg-black/30 hover:border-white/20"
              }`}
            >
              <div className="font-medium text-white">After Lock Time</div>
              <div className="text-xs text-zinc-400">Scores hidden until lock time passes</div>
            </button>
            <button
              type="button"
              onClick={() => setLeaderboardVisibility("after_first_result")}
              className={`w-full rounded-lg border px-4 py-3 text-left transition ${
                leaderboardVisibility === "after_first_result"
                  ? "border-yellow-400 bg-yellow-400/10"
                  : "border-white/10 bg-black/30 hover:border-white/20"
              }`}
            >
              <div className="font-medium text-white">After First Result</div>
              <div className="text-xs text-zinc-400">Scores hidden until first match completes</div>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Bracket Visibility
          </label>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setBracketVisibility("status_only")}
              className={`w-full rounded-lg border px-4 py-3 text-left transition ${
                bracketVisibility === "status_only"
                  ? "border-yellow-400 bg-yellow-400/10"
                  : "border-white/10 bg-black/30 hover:border-white/20"
              }`}
            >
              <div className="font-medium text-white">Status Only</div>
              <div className="text-xs text-zinc-400">Only show if members submitted or not</div>
            </button>
            <button
              type="button"
              onClick={() => setBracketVisibility("after_lock")}
              className={`w-full rounded-lg border px-4 py-3 text-left transition ${
                bracketVisibility === "after_lock"
                  ? "border-yellow-400 bg-yellow-400/10"
                  : "border-white/10 bg-black/30 hover:border-white/20"
              }`}
            >
              <div className="font-medium text-white">After Lock Time</div>
              <div className="text-xs text-zinc-400">Show picks after lock time passes</div>
            </button>
            <button
              type="button"
              onClick={() => setBracketVisibility("always")}
              className={`w-full rounded-lg border px-4 py-3 text-left transition ${
                bracketVisibility === "always"
                  ? "border-yellow-400 bg-yellow-400/10"
                  : "border-white/10 bg-black/30 hover:border-white/20"
              }`}
            >
              <div className="font-medium text-white">Always Visible</div>
              <div className="text-xs text-zinc-400">Members can always view each other's picks</div>
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-6">
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={isDeleting}
          className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-3 font-bold text-red-400 transition hover:border-red-500/50 hover:bg-red-500/20 disabled:opacity-50"
        >
          <Trash2 className="h-5 w-5" />
          Delete Group
        </button>

        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 rounded-xl bg-yellow-400 px-6 py-3 font-bold text-black transition hover:bg-yellow-300 disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Save className="h-5 w-5" />
          )}
          Save Settings
        </button>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#080808] p-6">
            <h3 className="mb-2 text-xl font-bold text-white">Delete Group?</h3>
            <p className="mb-6 text-zinc-400">
              Are you sure you want to delete <span className="font-semibold text-white">{groupName}</span>? 
              This action cannot be undone. All members will lose access to this group.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2 font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 rounded-lg bg-red-500 px-4 py-2 font-bold text-white transition hover:bg-red-600 disabled:opacity-50"
              >
                {isDeleting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </span>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
