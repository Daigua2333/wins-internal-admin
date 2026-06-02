import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";
import type { AppRole, Profile } from "@/lib/types/domain";

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

  const fullName =
    (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name) ||
    (typeof user.user_metadata?.name === "string" && user.user_metadata.name) ||
    user.email?.split("@")[0] ||
    "New User";

  const payload: Database["public"]["Tables"]["profiles"]["Insert"] = {
    id: user.id,
    email: user.email ?? "",
    full_name: fullName,
    role: "operations" as AppRole,
    active: true,
  };

  const { data, error } = await supabase
    .from("profiles")
    .upsert([payload] as never, {
      onConflict: "id",
      ignoreDuplicates: false,
    })
    .select("*")
    .single();

  if (error) {
    console.error("[auth:ensure-profile]", error.message);
    return null;
  }

  return data as Profile | null;
}

export async function hasPermission(permission: string) {
  const profile = await getCurrentProfile();

  if (!profile || !profile.active) {
    return false;
  }

  const { ROLE_PERMISSIONS } = await import("@/lib/auth/roles");
  const permissions = ROLE_PERMISSIONS[profile.role] ?? [];

  return permissions.includes("*") || permissions.includes(permission);
}
