"use server";

import { createClient } from "../server";
import type { Group, GroupMember, GroupWithDetails, Profile, Bracket } from "@/src/types";

export type GroupMemberWithBracket = {
  id: string;
  group_id: string;
  user_id: string;
  joined_at: string;
  profile: Profile | null;
  bracket: Bracket | null;
};

// Generate a short random join code (6 characters, alphanumeric)
function generateJoinCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Get the active tournament ID
 */
async function getActiveTournamentId(): Promise<{ id: string | null; error: string | null }> {
  const supabase = await createClient();

  const { data: tournaments, error } = await supabase
    .from("tournaments")
    .select("id")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    return { id: null, error: error.message };
  }

  if (!tournaments || tournaments.length === 0) {
    return { id: null, error: "No active tournament found" };
  }

  return { id: tournaments[0].id, error: null };
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
  // Note: This query needs to work even if user is not a member yet
  // The RLS policy should allow reading groups by join_code for joining
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("id")
    .eq("join_code", normalizedCode)
    .single();

  if (groupError) {
    console.error("Error finding group by join code:", groupError);
    return { success: false, error: "Invalid join code or unable to access group" };
  }

  if (!group) {
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

  // Get group with all fields
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("*")
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

/**
 * Get group members with their profiles and bracket status for the active tournament
 */
export async function getGroupMembersWithBrackets(
  groupId: string
): Promise<{ members: GroupMemberWithBracket[]; error: string | null }> {
  const supabase = await createClient();

  // Get active tournament
  const { id: tournamentId, error: tournamentError } = await getActiveTournamentId();
  if (tournamentError || !tournamentId) {
    return { members: [], error: tournamentError || "No active tournament found" };
  }

  // Get members
  const { data: members, error: membersError } = await supabase
    .from("group_members")
    .select("id, group_id, user_id, joined_at")
    .eq("group_id", groupId);

  if (membersError) {
    return { members: [], error: membersError.message };
  }

  if (!members || members.length === 0) {
    return { members: [], error: null };
  }

  // Get user IDs
  const userIds = members.map((m) => m.user_id);

  // Fetch profiles for all members
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, points, created_at, updated_at")
    .in("id", userIds);

  if (profilesError) {
    console.error("Error fetching profiles:", profilesError);
  }

  // Fetch brackets for all members for the active tournament
  const { data: brackets, error: bracketsError } = await supabase
    .from("brackets")
    .select("id, user_id, tournament_id, name, points_earned, is_locked, status, created_at, updated_at")
    .in("user_id", userIds)
    .eq("tournament_id", tournamentId);

  if (bracketsError) {
    console.error("Error fetching brackets:", bracketsError);
  }

  // Create maps for quick lookup
  const profilesMap = new Map<string, Profile>();
  (profiles || []).forEach((p) => {
    profilesMap.set(p.id, p as Profile);
  });

  const bracketsMap = new Map<string, Bracket>();
  (brackets || []).forEach((b) => {
    bracketsMap.set(b.user_id, b as Bracket);
  });

  // Combine data
  const membersWithBrackets: GroupMemberWithBracket[] = members.map((member) => ({
    id: member.id,
    group_id: member.group_id,
    user_id: member.user_id,
    joined_at: member.joined_at,
    profile: profilesMap.get(member.user_id) || null,
    bracket: bracketsMap.get(member.user_id) || null,
  }));

  return { members: membersWithBrackets, error: null };
}

/**
 * Get the current user's bracket for the active tournament
 */
export async function getCurrentUserBracket(): Promise<{
  bracket: Bracket | null;
  error: string | null;
}> {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { bracket: null, error: "You must be logged in" };
  }

  const { id: tournamentId, error: tournamentError } = await getActiveTournamentId();
  if (tournamentError || !tournamentId) {
    return { bracket: null, error: tournamentError || "No active tournament found" };
  }

  const { data: brackets, error: bracketError } = await supabase
    .from("brackets")
    .select("*")
    .eq("user_id", user.id)
    .eq("tournament_id", tournamentId)
    .order("created_at", { ascending: false });

  if (bracketError) {
    return { bracket: null, error: bracketError.message };
  }

  if (!brackets || brackets.length === 0) {
    return { bracket: null, error: null };
  }

  return { bracket: brackets[0] as Bracket, error: null };
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
