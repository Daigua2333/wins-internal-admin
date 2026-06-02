import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type NotificationSettings = {
  reminderLeadDays: number;
};

export type OperationsPolicySettings = {
  defaultCurrency: string;
  targetGrossMarginRate: number;
  dailyTourDefaultStartTime: string;
  conflictStrictMode: boolean;
  autoMarkScheduledOnAssignment: boolean;
};

const fallbackNotificationSettings: NotificationSettings = {
  reminderLeadDays: 3,
};

const fallbackOperationsPolicy: OperationsPolicySettings = {
  defaultCurrency: "JPY",
  targetGrossMarginRate: 28,
  dailyTourDefaultStartTime: "08:30",
  conflictStrictMode: true,
  autoMarkScheduledOnAssignment: true,
};

export async function getNotificationSettings(): Promise<NotificationSettings> {
  if (!isSupabaseConfigured()) {
    return fallbackNotificationSettings;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("app_settings").select("content").eq("key", "notification_rules").maybeSingle();

  if (error || !data) {
    return fallbackNotificationSettings;
  }

  const content = (data as { content?: Record<string, unknown> | null }).content ?? {};
  return {
    reminderLeadDays:
      typeof content.reminderLeadDays === "number" && !Number.isNaN(content.reminderLeadDays)
        ? content.reminderLeadDays
        : fallbackNotificationSettings.reminderLeadDays,
  };
}

export async function getOperationsPolicySettings(): Promise<OperationsPolicySettings> {
  if (!isSupabaseConfigured()) {
    return fallbackOperationsPolicy;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("app_settings").select("content").eq("key", "operations_policy").maybeSingle();

  if (error || !data) {
    return fallbackOperationsPolicy;
  }

  const content = (data as { content?: Record<string, unknown> | null }).content ?? {};

  return {
    defaultCurrency:
      typeof content.defaultCurrency === "string" && content.defaultCurrency.trim()
        ? content.defaultCurrency
        : fallbackOperationsPolicy.defaultCurrency,
    targetGrossMarginRate:
      typeof content.targetGrossMarginRate === "number" && !Number.isNaN(content.targetGrossMarginRate)
        ? content.targetGrossMarginRate
        : fallbackOperationsPolicy.targetGrossMarginRate,
    dailyTourDefaultStartTime:
      typeof content.dailyTourDefaultStartTime === "string" && content.dailyTourDefaultStartTime.trim()
        ? content.dailyTourDefaultStartTime
        : fallbackOperationsPolicy.dailyTourDefaultStartTime,
    conflictStrictMode:
      typeof content.conflictStrictMode === "boolean" ? content.conflictStrictMode : fallbackOperationsPolicy.conflictStrictMode,
    autoMarkScheduledOnAssignment:
      typeof content.autoMarkScheduledOnAssignment === "boolean"
        ? content.autoMarkScheduledOnAssignment
        : fallbackOperationsPolicy.autoMarkScheduledOnAssignment,
  };
}
