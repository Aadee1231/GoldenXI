"use server";

import { createClient } from "../server";
import type { Group, GroupSettings } from "@/src/types";

/**
 * Get group settings
 */
export async function getGroupSettings(
  groupId: string
): Promise<{ settings: GroupSettings | null; error: string | null }> {
  const supabase = await createClient();

  const { data: group, error } = await supabase
    .from("groups")
    .select("invite_policy, leaderboard_visibility, bracket_visibility, lock_at, allow_late_join, description")
    .eq("id", groupId)
    .single();

  if (error) {
    return { settings: null, error: error.message };
  }

  if (!group) {
    return { settings: null, error: "Group not found" };
  }

  return { settings: group as GroupSettings, error: null };
}

/**
 * Update group settings (only group creator can do this)
 */
export async function updateGroupSettings(
  groupId: string,
  settings: Partial<GroupSettings>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "You must be logged in" };
  }

  const { data: isCreator } = await supabase
    .rpc("is_group_creator", {
      group_id_param: groupId,
      user_id_param: user.id,
    });

  if (!isCreator) {
    return { success: false, error: "Only the group creator can update settings" };
  }

  const { error: updateError } = await supabase
    .from("groups")
    .update(settings)
    .eq("id", groupId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true };
}

/**
 * Update group name and description
 */
export async function updateGroupInfo(
  groupId: string,
  name: string,
  description: string | null
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "You must be logged in" };
  }

  const { data: isCreator } = await supabase
    .rpc("is_group_creator", {
      group_id_param: groupId,
      user_id_param: user.id,
    });

  if (!isCreator) {
    return { success: false, error: "Only the group creator can update group info" };
  }

  const { error: updateError } = await supabase
    .from("groups")
    .update({ name, description })
    .eq("id", groupId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true };
}

/**
 * Check if current user can edit group settings
 */
export async function canEditGroupSettings(
  groupId: string
): Promise<{ canEdit: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { canEdit: false, error: "You must be logged in" };
  }

  const { data: isCreator, error: rpcError } = await supabase
    .rpc("is_group_creator", {
      group_id_param: groupId,
      user_id_param: user.id,
    });

  if (rpcError) {
    return { canEdit: false, error: rpcError.message };
  }

  return { canEdit: !!isCreator };
}

/**
 * Check if group is locked (lock_at has passed)
 */
export async function isGroupLocked(
  groupId: string
): Promise<{ isLocked: boolean; lockAt: string | null; error?: string }> {
  const supabase = await createClient();

  const { data: group, error } = await supabase
    .from("groups")
    .select("lock_at")
    .eq("id", groupId)
    .single();

  if (error) {
    return { isLocked: false, lockAt: null, error: error.message };
  }

  if (!group || !group.lock_at) {
    return { isLocked: false, lockAt: null };
  }

  const lockTime = new Date(group.lock_at).getTime();
  const now = new Date().getTime();

  return {
    isLocked: now >= lockTime,
    lockAt: group.lock_at,
  };
}
