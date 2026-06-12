"use server";

import { createClient } from "../server";
import type { InvitePreview } from "@/src/types";

export async function getInvitePreview(
  joinCode: string
): Promise<{ preview: InvitePreview | null; error: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_invite_preview", {
    join_code_param: joinCode.trim().toUpperCase(),
  });

  if (error) {
    console.error("Error fetching invite preview:", error);
    return { preview: null, error: error.message };
  }

  if (!data || data.length === 0) {
    return { preview: null, error: "Invalid join code" };
  }

  return { preview: data[0] as InvitePreview, error: null };
}

export async function joinGroupByCode(
  joinCode: string
): Promise<{
  success: boolean;
  groupId?: string;
  errorCode?: string;
  errorMessage?: string;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("join_group_by_code", {
    join_code_param: joinCode.trim().toUpperCase(),
  });

  if (error) {
    console.error("[joinGroupByCode] Supabase RPC error:", error.code, error.message, error.details, error.hint);
    return {
      success: false,
      errorCode: "rpc_error",
      errorMessage: error.message,
    };
  }

  if (!data) {
    console.error("[joinGroupByCode] RPC returned no data");
    return {
      success: false,
      errorCode: "unknown_error",
      errorMessage: "Failed to join group",
    };
  }

  const result = data as { success: boolean; group_id?: string; error_code?: string; error_message?: string };
  console.log("[joinGroupByCode] RPC result:", result);

  if (!result.success) {
    return {
      success: false,
      groupId: result.group_id,
      errorCode: result.error_code,
      errorMessage: result.error_message,
    };
  }

  return {
    success: true,
    groupId: result.group_id,
  };
}

export async function checkGroupMembership(
  groupId: string
): Promise<{ isMember: boolean; error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { isMember: false, error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    return { isMember: false, error: error.message };
  }

  return { isMember: !!data, error: null };
}
