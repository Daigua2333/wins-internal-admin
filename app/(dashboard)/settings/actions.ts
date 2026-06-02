"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { APP_ROLES } from "@/lib/auth/roles";
import { hasPermission } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";
import type { AppRole } from "@/lib/types/domain";

export async function signOut() {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const supabase = await createClient();
  await supabase.auth.signOut();

  redirect("/login");
}

export async function updateProfileRole(formData: FormData) {
  const canManageSettings = await hasPermission("settings.read");

  if (!canManageSettings) {
    redirect("/settings?error=not_allowed");
  }

  const profileId = String(formData.get("profileId") ?? "");
  const role = String(formData.get("role") ?? "");

  if (!profileId || !APP_ROLES.includes(role as AppRole)) {
    redirect("/settings?error=invalid_role");
  }

  if (!isSupabaseConfigured()) {
    redirect("/settings?error=supabase_not_configured");
  }

  const supabase = await createClient();
  const payload: Database["public"]["Tables"]["profiles"]["Update"] = {
    role: role as AppRole,
  };

  const { error } = await supabase.from("profiles").update(payload as never).eq("id", profileId);

  if (error) {
    console.error("[settings:update-profile-role]", error.message);
    redirect("/settings?error=role_update_failed");
  }

  revalidatePath("/settings");
  redirect("/settings?message=role_updated");
}

export async function updateProfileActive(formData: FormData) {
  const canManageSettings = await hasPermission("settings.read");

  if (!canManageSettings) {
    redirect("/settings?error=not_allowed");
  }

  const profileId = String(formData.get("profileId") ?? "");
  const nextActive = String(formData.get("active") ?? "") === "true";
  const currentUser = await createClient().then((supabase) => supabase.auth.getUser());
  const currentUserId = currentUser.data.user?.id;

  if (!profileId) {
    redirect("/settings?error=invalid_profile");
  }

  if (!nextActive && currentUserId && currentUserId === profileId) {
    redirect("/settings?error=self_disable_forbidden");
  }

  if (!isSupabaseConfigured()) {
    redirect("/settings?error=supabase_not_configured");
  }

  const supabase = await createClient();
  const payload: Database["public"]["Tables"]["profiles"]["Update"] = {
    active: nextActive,
  };

  const { error } = await supabase.from("profiles").update(payload as never).eq("id", profileId);

  if (error) {
    console.error("[settings:update-profile-active]", error.message);
    redirect("/settings?error=profile_status_update_failed");
  }

  revalidatePath("/settings");
  redirect(`/settings?message=${nextActive ? "account_enabled" : "account_disabled"}`);
}

export async function updateCompanyProfile(formData: FormData) {
  const canManageSettings = await hasPermission("settings.read");

  if (!canManageSettings) {
    redirect("/settings?error=not_allowed");
  }

  if (!isSupabaseConfigured()) {
    redirect("/settings?error=supabase_not_configured");
  }

  const companyName = String(formData.get("companyName") ?? "").trim();
  const brandName = String(formData.get("brandName") ?? "").trim();
  const officeAddress = String(formData.get("officeAddress") ?? "").trim();
  const settlementEntity = String(formData.get("settlementEntity") ?? "").trim();
  const supportEmail = String(formData.get("supportEmail") ?? "").trim();
  const supportPhone = String(formData.get("supportPhone") ?? "").trim();

  if (!companyName || !brandName || !officeAddress || !settlementEntity || !supportEmail) {
    redirect("/settings?error=missing_company_fields");
  }

  await upsertAppSetting({
    key: "company_profile",
    category: "company",
    label: "公司信息",
    content: {
      companyName,
      brandName,
      officeAddress,
      settlementEntity,
      supportEmail,
      supportPhone,
    },
  });

  revalidatePath("/settings");
  redirect("/settings?message=company_profile_updated");
}

export async function updateNotificationRules(formData: FormData) {
  const canManageSettings = await hasPermission("settings.read");

  if (!canManageSettings) {
    redirect("/settings?error=not_allowed");
  }

  if (!isSupabaseConfigured()) {
    redirect("/settings?error=supabase_not_configured");
  }

  const reminderLeadDays = Number(String(formData.get("reminderLeadDays") ?? "").trim() || "0");
  if (Number.isNaN(reminderLeadDays) || reminderLeadDays < 0 || reminderLeadDays > 30) {
    redirect("/settings?error=invalid_reminder_days");
  }

  await upsertAppSetting({
    key: "notification_rules",
    category: "notifications",
    label: "通知规则",
    content: {
      orderStatusAlerts: formData.get("orderStatusAlerts") === "on",
      vehicleInspectionAlerts: formData.get("vehicleInspectionAlerts") === "on",
      quoteExpiryAlerts: formData.get("quoteExpiryAlerts") === "on",
      customerCreditAlerts: formData.get("customerCreditAlerts") === "on",
      reminderLeadDays,
    },
  });

  revalidatePath("/settings");
  redirect("/settings?message=notification_rules_updated");
}

export async function updateOperationsPolicy(formData: FormData) {
  const canManageSettings = await hasPermission("settings.read");

  if (!canManageSettings) {
    redirect("/settings?error=not_allowed");
  }

  if (!isSupabaseConfigured()) {
    redirect("/settings?error=supabase_not_configured");
  }

  const defaultCurrency = String(formData.get("defaultCurrency") ?? "").trim();
  const targetGrossMarginRate = Number(String(formData.get("targetGrossMarginRate") ?? "").trim() || "0");
  const dailyTourDefaultStartTime = String(formData.get("dailyTourDefaultStartTime") ?? "").trim();

  if (!defaultCurrency || !dailyTourDefaultStartTime) {
    redirect("/settings?error=missing_operations_fields");
  }

  if (Number.isNaN(targetGrossMarginRate) || targetGrossMarginRate < 0 || targetGrossMarginRate > 100) {
    redirect("/settings?error=invalid_margin_target");
  }

  await upsertAppSetting({
    key: "operations_policy",
    category: "operations",
    label: "运营参数",
    content: {
      defaultCurrency,
      targetGrossMarginRate,
      dailyTourDefaultStartTime,
      conflictStrictMode: formData.get("conflictStrictMode") === "on",
      autoMarkScheduledOnAssignment: formData.get("autoMarkScheduledOnAssignment") === "on",
    },
  });

  revalidatePath("/settings");
  redirect("/settings?message=operations_policy_updated");
}

async function upsertAppSetting(input: {
  key: string;
  category: string;
  label: string;
  content: Database["public"]["Tables"]["app_settings"]["Insert"]["content"];
}) {
  const supabase = await createClient();
  const payload: Database["public"]["Tables"]["app_settings"]["Insert"] = {
    key: input.key,
    category: input.category,
    label: input.label,
    content: input.content,
    active: true,
  };

  const { error } = await supabase.from("app_settings").upsert(payload as never, { onConflict: "key" });

  if (error) {
    console.error("[settings:upsert-app-setting]", error.message);
    redirect(`/settings?error=settings_update_failed&detail=${encodeURIComponent(error.message)}`);
  }
}
