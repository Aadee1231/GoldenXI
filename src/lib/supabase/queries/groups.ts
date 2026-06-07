"use server";

import { createClient } from "../server";
import type { Group, GroupMember, GroupWithDetails, Profile, Bracket } from "@/src/types";

// Generate a short random join code (6 characters, alphanumeric)
function generateJoinCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function createGroup(
  name: string
): Promise<{ success: boolean; group?: Group; error?: string }> {
  const supabase = await createClient();

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "You must be logged in to create a group" };
  }

  console.log("Current user ID:", user.id);

  // Generate unique join code
  let joinCode = generateJoinCode();
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    // Check if code already exists
    const { data: existing } = await supabase
      .from("groups")
      .select("id")
      .eq("join_code", joinCode)
      .single();

    if (!existing) break;

    joinCode = generateJoinCode();
    attempts++;
  }

  if (attempts >= maxAttempts) {
    return { success: false, error: "Failed to generate unique join code" };
  }

  // Build and log the create group payload (no tournament_id - uses DB default)
  const createGroupPayload = {
    name,
    join_code: joinCode,
    created_by: user.id,
  };
  console.log("Group insert payload:", createGroupPayload);

  // Create the group
  const { data: group, error: insertError } = await supabase
    .from("groups")
    .insert(createGroupPayload)
    .select()
    .single();

  console.log("Created group result:", group);

  if (insertError) {
    return { success: false, error: insertError.message };
  }

  // Add creator as first member (owner role)
  const groupMemberPayload = {
    group_id: group.id,
    user_id: user.id,
    role: "owner",
  };
  console.log("Group member insert payload:", groupMemberPayload);

  const { error: memberError } = await supabase
    .from("group_members")
    .insert(groupMemberPayload);

  if (memberError) {
    // Rollback group creation if member insertion fails
    await supabase.from("groups").delete().eq("id", group.id);
    return { success: false, error: memberError.message };
  }

  return { success: true, group };
}

export async function joinGroup(
  joinCode: string
): Promise<{ success: boolean; groupId?: string; error?: string }> {
  const supabase = await createClient();

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "You must be logged in to join a group" };
  }

  // Normalize join code (uppercase, trim)
  const normalizedCode = joinCode.trim().toUpperCase();

  // Find group by join code
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("id")
    .eq("join_code", normalizedCode)
    .single();

  if (groupError || !group) {
    return { success: false, error: "Invalid join code" };
  }

  // Check if user is already a member
  const { data: existingMember } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", group.id)
    .eq("user_id", user.id)
    .single();

  if (existingMember) {
    return { success: false, error: "You are already a member of this group" };
  }

  // Add user as member
  const { error: memberError } = await supabase
    .from("group_members")
    .insert({
      group_id: group.id,
      user_id: user.id,
      bracket_id: null,
    });

  if (memberError) {
    return { success: false, error: memberError.message };
  }

  return { success: true, groupId: group.id };
}

export async function getGroupById(
  groupId: string
): Promise<{ group: Group | null; error: string | null }> {
  const supabase = await createClient();

  // Get group with only basic fields - no complex joins
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("id, name, join_code, created_by, tournament_id, created_at, updated_at")
    .eq("id", groupId)
    .single();

  if (groupError) {
    return { group: null, error: groupError.message };
  }

  if (!group) {
    return { group: null, error: "Group not found" };
  }

  return { group, error: null };
}

export async function getGroupMembers(
  groupId: string
): Promise<{ members: GroupMember[]; error: string | null }> {
  const supabase = await createClient();

  // Get members separately - simple query without joins for now
  const { data: members, error: membersError } = await supabase
    .from("group_members")
    .select("id, group_id, user_id, bracket_id, joined_at")
    .eq("group_id", groupId);

  if (membersError) {
    return { members: [], error: membersError.message };
  }

  return { members: members || [], error: null };
}

export async function getUserGroups(): Promise<Group[]> {
  const supabase = await createClient();

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return [];
  }

  // Get groups where user is a member
  const { data: memberships } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", user.id);

  if (!memberships || memberships.length === 0) {
    return [];
  }

  const groupIds = memberships.map((m) => m.group_id);

  // Get full group details
  const { data: groups } = await supabase
    .from("groups")
    .select("*")
    .in("id", groupIds)
    .order("created_at", { ascending: false });

  return groups || [];
}

export async function leaveGroup(
  groupId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "You must be logged in" };
  }

  // Check if user is the creator
  const { data: group } = await supabase
    .from("groups")
    .select("created_by")
    .eq("id", groupId)
    .single();

  if (group?.created_by === user.id) {
    return { success: false, error: "Group creator cannot leave. Delete the group instead." };
  }

  // Remove membership
  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function deleteGroup(
  groupId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "You must be logged in" };
  }

  // Verify user is the creator
  const { data: group } = await supabase
    .from("groups")
    .select("created_by")
    .eq("id", groupId)
    .single();

  if (group?.created_by !== user.id) {
    return { success: false, error: "Only the group creator can delete the group" };
  }

  // Delete group (cascade will handle members)
  const { error } = await supabase
    .from("groups")
    .delete()
    .eq("id", groupId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
