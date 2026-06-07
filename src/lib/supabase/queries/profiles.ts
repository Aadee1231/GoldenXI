"use server";

import { createClient } from "@/src/lib/supabase/server";
import type { Profile } from "@/src/types";

/**
 * Get the current user's profile
 */
export async function getCurrentUserProfile(): Promise<{
  profile: Profile | null;
  error: string | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { profile: null, error: "Not authenticated" };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError) {
    return { profile: null, error: profileError.message };
  }

  return { profile: profile as Profile, error: null };
}

/**
 * Ensure a profile exists for the current user
 * Creates one if it doesn't exist
 */
export async function ensureProfile(): Promise<{
  profile: Profile | null;
  error: string | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { profile: null, error: "Not authenticated" };
  }

  // Try to get existing profile
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (existingProfile) {
    return { profile: existingProfile as Profile, error: null };
  }

  // Create profile if it doesn't exist
  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "User";

  const { data: newProfile, error: insertError } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      display_name: displayName,
      username: null,
    })
    .select()
    .single();

  if (insertError) {
    return { profile: null, error: insertError.message };
  }

  return { profile: newProfile as Profile, error: null };
}

/**
 * Check if a username is available
 */
export async function isUsernameAvailable(
  username: string,
  currentUserId?: string
): Promise<{ available: boolean; error: string | null }> {
  const supabase = await createClient();

  // Validate format
  if (!username || username.length < 3 || username.length > 20) {
    return { available: false, error: "Username must be 3-20 characters" };
  }

  if (!/^[a-z0-9_]+$/.test(username)) {
    return {
      available: false,
      error: "Username can only contain lowercase letters, numbers, and underscores",
    };
  }

  // Check if username exists
  let query = supabase
    .from("profiles")
    .select("id")
    .eq("username", username.toLowerCase());

  // If checking for current user, exclude their own profile
  if (currentUserId) {
    query = query.neq("id", currentUserId);
  }

  const { data, error } = await query.single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 is "not found" which means available
    return { available: false, error: error.message };
  }

  return { available: !data, error: null };
}

/**
 * Update the current user's profile
 */
export async function updateProfile(updates: {
  username?: string;
  display_name?: string;
  avatar_url?: string;
}): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Not authenticated" };
  }

  // Validate username if provided
  if (updates.username !== undefined) {
    const username = updates.username.toLowerCase().trim();
    
    if (username.length < 3 || username.length > 20) {
      return { success: false, error: "Username must be 3-20 characters" };
    }

    if (!/^[a-z0-9_]+$/.test(username)) {
      return {
        success: false,
        error: "Username can only contain lowercase letters, numbers, and underscores",
      };
    }

    // Check availability
    const { available, error: availError } = await isUsernameAvailable(username, user.id);
    if (availError) {
      return { success: false, error: availError };
    }
    if (!available) {
      return { success: false, error: "That username is already taken" };
    }

    updates.username = username;
  }

  // Validate display_name if provided
  if (updates.display_name !== undefined) {
    const displayName = updates.display_name.trim();
    
    if (displayName.length < 1 || displayName.length > 30) {
      return { success: false, error: "Display name must be 1-30 characters" };
    }

    updates.display_name = displayName;
  }

  // Update profile
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true, error: null };
}

/**
 * Check if current user needs to complete profile setup
 * Returns true if user is missing username
 */
export async function needsProfileSetup(): Promise<boolean> {
  const { profile } = await getCurrentUserProfile();
  return !profile?.username;
}
