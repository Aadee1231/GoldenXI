"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Profile } from "@/src/types";
import { updateProfile, isUsernameAvailable } from "@/src/lib/supabase/queries/profiles";
import { User, AtSign, CheckCircle } from "lucide-react";

type Props = {
  profile: Profile;
};

export default function ProfileEditForm({ profile }: Props) {
  const router = useRouter();
  const [username, setUsername] = useState(profile.username || "");
  const [displayName, setDisplayName] = useState(profile.display_name || "");
  const [usernameError, setUsernameError] = useState("");
  const [displayNameError, setDisplayNameError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const hasChanges =
    username !== (profile.username || "") ||
    displayName !== (profile.display_name || "");

  const validateUsername = (value: string) => {
    if (!value) {
      return "Username is required";
    }
    if (value.length < 3 || value.length > 20) {
      return "Username must be 3-20 characters";
    }
    if (!/^[a-z0-9_]+$/.test(value)) {
      return "Only lowercase letters, numbers, and underscores allowed";
    }
    return "";
  };

  const validateDisplayName = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return "Display name is required";
    }
    if (trimmed.length < 1 || trimmed.length > 30) {
      return "Display name must be 1-30 characters";
    }
    return "";
  };

  const handleUsernameChange = async (value: string) => {
    const lowercased = value.toLowerCase();
    setUsername(lowercased);
    setSuccessMessage("");

    const error = validateUsername(lowercased);
    setUsernameError(error);

    // Only check availability if username changed and is valid
    if (!error && lowercased.length >= 3 && lowercased !== profile.username) {
      setIsCheckingUsername(true);
      const { available, error: availError } = await isUsernameAvailable(
        lowercased,
        profile.id
      );
      setIsCheckingUsername(false);

      if (availError) {
        setUsernameError(availError);
      } else if (!available) {
        setUsernameError("That username is already taken");
      }
    }
  };

  const handleDisplayNameChange = (value: string) => {
    setDisplayName(value);
    setSuccessMessage("");
    const error = validateDisplayName(value);
    setDisplayNameError(error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const usernameValidation = validateUsername(username);
    const displayNameValidation = validateDisplayName(displayName);

    if (usernameValidation) {
      setUsernameError(usernameValidation);
      return;
    }

    if (displayNameValidation) {
      setDisplayNameError(displayNameValidation);
      return;
    }

    setIsSubmitting(true);

    const updates: { username?: string; display_name?: string } = {};

    if (username !== profile.username) {
      updates.username = username;
    }

    if (displayName.trim() !== profile.display_name) {
      updates.display_name = displayName.trim();
    }

    const { success, error } = await updateProfile(updates);

    if (error) {
      if (error.includes("username")) {
        setUsernameError(error);
      } else if (error.includes("display")) {
        setDisplayNameError(error);
      } else {
        setUsernameError(error);
      }
      setIsSubmitting(false);
      return;
    }

    if (success) {
      setSuccessMessage("Profile updated successfully!");
      setIsSubmitting(false);
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {successMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          <CheckCircle className="h-4 w-4" />
          {successMessage}
        </div>
      )}

      <div className="rounded-lg border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        <div className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300"
            >
              <AtSign className="h-4 w-4 text-yellow-400" />
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              placeholder="johndoe"
              className="w-full rounded-md border border-white/10 bg-black/50 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-yellow-400/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/20"
              disabled={isSubmitting}
              autoComplete="off"
            />
            {isCheckingUsername && (
              <p className="mt-1 text-xs text-zinc-400">Checking availability...</p>
            )}
            {usernameError && (
              <p className="mt-1 text-xs text-red-400">{usernameError}</p>
            )}
            {!usernameError &&
              username &&
              username !== profile.username &&
              !isCheckingUsername && (
                <p className="mt-1 text-xs text-green-400">Username available!</p>
              )}
            <p className="mt-1 text-xs text-zinc-500">
              3-20 characters, lowercase letters, numbers, and underscores only
            </p>
          </div>

          <div>
            <label
              htmlFor="displayName"
              className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300"
            >
              <User className="h-4 w-4 text-yellow-400" />
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => handleDisplayNameChange(e.target.value)}
              placeholder="John Doe"
              className="w-full rounded-md border border-white/10 bg-black/50 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-yellow-400/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/20"
              disabled={isSubmitting}
            />
            {displayNameError && (
              <p className="mt-1 text-xs text-red-400">{displayNameError}</p>
            )}
            <p className="mt-1 text-xs text-zinc-500">
              1-30 characters, this is how you'll appear in leaderboards
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={
            isSubmitting ||
            isCheckingUsername ||
            !!usernameError ||
            !!displayNameError ||
            !username ||
            !displayName ||
            !hasChanges
          }
          className="flex-1 rounded-md bg-yellow-400 px-4 py-3 font-bold text-black transition-colors hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/bracket")}
          className="rounded-md border border-white/10 px-4 py-3 font-medium text-zinc-300 transition-colors hover:border-white/30 hover:text-white"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
