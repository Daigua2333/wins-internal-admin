"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { hasPermission } from "@/lib/auth/session";
import { getOperationsPolicySettings } from "@/lib/settings/runtime";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";

export async function createGuide(formData: FormData) {
  const canWriteGuides = await hasPermission("guides.write");

  if (!canWriteGuides) {
    redirect("/guides?error=not_allowed");
  }

  if (!isSupabaseConfigured()) {
    redirect("/guides?error=preview_mode");
  }

  const payload = readGuidePayload(formData);
  if ("error" in payload) {
    redirect(`/guides?error=${payload.error}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("guides").insert(payload as never);

  if (error) {
    console.error("[guides:create]", error.message);
    redirect(`/guides?error=create_failed&detail=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/guides");
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  redirect("/guides?message=guide_created");
}

export async function updateGuideBasics(formData: FormData) {
  const canWriteGuides = await hasPermission("guides.write");

  if (!canWriteGuides) {
    redirect("/guides?error=not_allowed");
  }

  if (!isSupabaseConfigured()) {
    redirect("/guides?error=preview_mode");
  }

  const guideId = String(formData.get("guideId") ?? "").trim();
  if (!guideId) {
    redirect("/guides?error=missing_fields");
  }

  const payload = readGuidePayload(formData);
  if ("error" in payload) {
    redirect(`/guides?error=${payload.error}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("guides").update(payload as never).eq("id", guideId);

  if (error) {
    console.error("[guides:update-basics]", error.message);
    redirect(`/guides?error=update_failed&detail=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/guides");
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  redirect("/guides?message=guide_updated");
}

export async function updateGuideStatus(formData: FormData) {
  const canWriteGuides = await hasPermission("guides.write");

  if (!canWriteGuides) {
    redirect("/guides?error=not_allowed");
  }

  if (!isSupabaseConfigured()) {
    redirect("/guides?error=preview_mode");
  }

  const guideId = String(formData.get("guideId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();

  if (!guideId || !status) {
    redirect("/guides?error=missing_fields");
  }

  if (!["available", "assigned", "off_duty", "inactive"].includes(status)) {
    redirect("/guides?error=invalid_status");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("guides")
    .update({ status: status as Database["public"]["Tables"]["guides"]["Update"]["status"] } as never)
    .eq("id", guideId);

  if (error) {
    console.error("[guides:update-status]", error.message);
    redirect(`/guides?error=status_update_failed&detail=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/guides");
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  redirect("/guides?message=guide_status_updated");
}

export async function recordGuideServiceLog(formData: FormData) {
  const canWriteGuides = await hasPermission("guides.write");

  if (!canWriteGuides) {
    redirect("/guides?error=not_allowed");
  }

  if (!isSupabaseConfigured()) {
    redirect("/guides?error=preview_mode");
  }

  const guideId = String(formData.get("guideId") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  if (!guideId || !note) {
    redirect("/guides?error=missing_service_fields");
  }

  const supabase = await createClient();
  const { data: existingGuide, error: fetchError } = await supabase.from("guides").select("notes").eq("id", guideId).maybeSingle();

  if (fetchError) {
    console.error("[guides:fetch-service]", fetchError.message);
    redirect(`/guides?error=service_record_failed&detail=${encodeURIComponent(fetchError.message)}`);
  }

  const currentDate = new Date().toISOString().slice(0, 10);
  const newLine = `[service][${currentDate}] ${note}`;
  const existingNotes = String((existingGuide as { notes: string | null } | null)?.notes ?? "").trim();
  const mergedNotes = existingNotes ? `${newLine}\n${existingNotes}` : newLine;

  const { error } = await supabase.from("guides").update({ notes: mergedNotes } as never).eq("id", guideId);

  if (error) {
    console.error("[guides:record-service]", error.message);
    redirect(`/guides?error=service_record_failed&detail=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/guides");
  revalidatePath("/dashboard");
  redirect("/guides?message=service_recorded");
}

export async function assignGuideSchedule(formData: FormData) {
  const canWriteGuides = await hasPermission("guides.write");

  if (!canWriteGuides) {
    redirect("/guides?error=not_allowed");
  }

  if (!isSupabaseConfigured()) {
    redirect("/guides?error=preview_mode");
  }

  const guideId = String(formData.get("guideId") ?? "").trim();
  const orderId = String(formData.get("orderId") ?? "").trim();

  if (!guideId || !orderId) {
    redirect("/guides?error=missing_schedule_fields");
  }

  const supabase = await createClient();
  const operationsPolicy = await getOperationsPolicySettings();
  const conflictMessage = await findGuideScheduleConflict(supabase, { guideId, orderId });

  if (conflictMessage && operationsPolicy.conflictStrictMode) {
    redirect(`/guides?error=guide_schedule_conflict&detail=${encodeURIComponent(conflictMessage)}`);
  }

  const { data: currentOrder } = await supabase.from("orders").select("status").eq("id", orderId).maybeSingle();
  const currentStatus = (currentOrder as { status: string } | null)?.status;
  const nextStatus =
    operationsPolicy.autoMarkScheduledOnAssignment && (currentStatus === "pending_confirmation" || currentStatus === "draft")
      ? "scheduled"
      : undefined;

  const payload: Database["public"]["Tables"]["orders"]["Update"] = {
    guide_id: guideId,
    ...(nextStatus ? { status: nextStatus as Database["public"]["Tables"]["orders"]["Update"]["status"] } : {}),
  };

  const { error } = await supabase.from("orders").update(payload as never).eq("id", orderId);

  if (error) {
    console.error("[guides:assign-schedule]", error.message);
    redirect(`/guides?error=schedule_assign_failed&detail=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/guides");
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  redirect("/guides?message=guide_schedule_assigned");
}

export async function deleteGuide(formData: FormData) {
  const canWriteGuides = await hasPermission("guides.write");

  if (!canWriteGuides) {
    redirect("/guides?error=not_allowed");
  }

  if (!isSupabaseConfigured()) {
    redirect("/guides?error=preview_mode");
  }

  const guideId = String(formData.get("guideId") ?? "").trim();

  if (!guideId) {
    redirect("/guides?error=missing_fields");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("guides").delete().eq("id", guideId);

  if (error) {
    console.error("[guides:delete]", error.message);
    redirect(`/guides?error=delete_failed&detail=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/guides");
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  redirect("/guides?message=guide_deleted");
}

function readGuidePayload(formData: FormData):
  | Database["public"]["Tables"]["guides"]["Insert"]
  | Database["public"]["Tables"]["guides"]["Update"]
  | { error: string } {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const languagesInput = String(formData.get("languages") ?? "").trim();
  const specialtiesInput = String(formData.get("specialties") ?? "").trim();
  const licenseType = String(formData.get("licenseType") ?? "").trim();
  const ratingInput = String(formData.get("rating") ?? "").trim();
  const status = String(formData.get("status") ?? "available").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!fullName || !languagesInput || !specialtiesInput || !ratingInput || !status) {
    return { error: "missing_fields" };
  }

  const rating = Number(ratingInput);
  if (Number.isNaN(rating) || rating < 0 || rating > 5) {
    return { error: "invalid_rating" };
  }

  if (!["available", "assigned", "off_duty", "inactive"].includes(status)) {
    return { error: "invalid_status" };
  }

  const languages = languagesInput
    .split(/[、,/]/)
    .map((item) => item.trim())
    .filter(Boolean);
  const specialties = specialtiesInput
    .split(/[、,/]/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (!languages.length || !specialties.length) {
    return { error: "missing_fields" };
  }

  return {
    full_name: fullName,
    languages,
    specialties,
    license_type: licenseType || null,
    rating,
    status: status as Database["public"]["Tables"]["guides"]["Insert"]["status"],
    notes: notes || null,
  };
}

async function findGuideScheduleConflict(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: { guideId: string; orderId: string },
) {
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("service_date")
    .eq("id", input.orderId)
    .maybeSingle();

  if (orderError) {
    return orderError.message;
  }

  const orderRow = order as { service_date: string | null } | null;

  if (!orderRow?.service_date) {
    return "请先为订单设置服务日期，再安排导游排班。";
  }

  const { data: conflicts, error: conflictError } = await supabase
    .from("orders")
    .select("order_no, title")
    .eq("service_date", orderRow.service_date)
    .eq("guide_id", input.guideId)
    .neq("id", input.orderId)
    .neq("status", "cancelled")
    .limit(1);

  if (conflictError) {
    return conflictError.message;
  }

  const conflict = (conflicts as Array<{ order_no: string; title: string }> | null)?.[0];

  return conflict ? `${orderRow.service_date} 这天该导游已被订单 ${conflict.order_no}（${conflict.title}）占用。` : null;
}
