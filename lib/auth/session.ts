import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types/domain";

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
});

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as Profile;
});

export async function ensureCurrentUserProfile() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

  if (error) {
    console.error("[auth:ensure-profile]", error.message);
    return null;
  }

  if (!data) {
    console.error("[auth:ensure-profile] Profile missing. Confirm the auth.users profile trigger is installed.");
    return null;
  }

  return data as Profile | null;
}

export async function hasPermission(permission: string) {
  const profile = await getCurrentProfile();

  if (!profile || !profile.active) {
    return false;
  }

  const { roleHasPermission } = await import("@/lib/auth/roles");
  return roleHasPermission(profile.role, permission);
}
