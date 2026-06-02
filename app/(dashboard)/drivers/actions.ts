"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { hasPermission } from "@/lib/auth/session";
import { getOperationsPolicySettings } from "@/lib/settings/runtime";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";

export async function createDriver(formData: FormData) {
  const canWriteDrivers = await hasPermission("drivers.write");

  if (!canWriteDrivers) {
    redirect("/drivers?error=not_allowed");
  }

  if (!isSupabaseConfigured()) {
    redirect("/drivers?error=preview_mode");
  }

  const payload = readDriverPayload(formData);
  if ("error" in payload) {
    redirect(`/drivers?error=${payload.error}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("drivers").insert(payload as never);

  if (error) {
    console.error("[drivers:create]", error.message);
    redirect(`/drivers?error=create_failed&detail=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/drivers");
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  redirect("/drivers?message=driver_created");
}

export async function updateDriverBasics(formData: FormData) {
  const canWriteDrivers = await hasPermission("drivers.write");

  if (!canWriteDrivers) {
    redirect("/drivers?error=not_allowed");
  }

  if (!isSupabaseConfigured()) {
    redirect("/drivers?error=preview_mode");
  }

  const driverId = String(formData.get("driverId") ?? "").trim();
  if (!driverId) {
    redirect("/drivers?error=missing_fields");
  }

  const payload = readDriverPayload(formData);
  if ("error" in payload) {
    redirect(`/drivers?error=${payload.error}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("drivers").update(payload as never).eq("id", driverId);

  if (error) {
    console.error("[drivers:update-basics]", error.message);
    redirect(`/drivers?error=update_failed&detail=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/drivers");
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  redirect("/drivers?message=driver_updated");
}

export async function updateDriverStatus(formData: FormData) {
  const canWriteDrivers = await hasPermission("drivers.write");

  if (!canWriteDrivers) {
    redirect("/drivers?error=not_allowed");
  }

  if (!isSupabaseConfigured()) {
    redirect("/drivers?error=preview_mode");
  }

  const driverId = String(formData.get("driverId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();

  if (!driverId || !status) {
    redirect("/drivers?error=missing_fields");
  }

  if (!["available", "assigned", "off_duty", "inactive"].includes(status)) {
    redirect("/drivers?error=invalid_status");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("drivers")
    .update({ status: status as Database["public"]["Tables"]["drivers"]["Update"]["status"] } as never)
    .eq("id", driverId);

  if (error) {
    console.error("[drivers:update-status]", error.message);
    redirect(`/drivers?error=status_update_failed&detail=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/drivers");
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  redirect("/drivers?message=driver_status_updated");
}

export async function recordDriverSafetyScore(formData: FormData) {
  const canWriteDrivers = await hasPermission("drivers.write");

  if (!canWriteDrivers) {
    redirect("/drivers?error=not_allowed");
  }

  if (!isSupabaseConfigured()) {
    redirect("/drivers?error=preview_mode");
  }

  const driverId = String(formData.get("driverId") ?? "").trim();
  const scoreInput = String(formData.get("score") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  if (!driverId || !scoreInput || !note) {
    redirect("/drivers?error=missing_safety_fields");
  }

  const score = Number(scoreInput);
  if (Number.isNaN(score) || score < 0 || score > 100) {
    redirect("/drivers?error=invalid_safety_score");
  }

  const supabase = await createClient();
  const { data: existingDriver, error: fetchError } = await supabase
    .from("drivers")
    .select("notes")
    .eq("id", driverId)
    .maybeSingle();

  if (fetchError) {
    console.error("[drivers:fetch-safety]", fetchError.message);
    redirect(`/drivers?error=safety_record_failed&detail=${encodeURIComponent(fetchError.message)}`);
  }

  const currentDate = new Date().toISOString().slice(0, 10);
  const newLine = `[safety][${currentDate}][score:${score}] ${note}`;
  const existingNotes = String((existingDriver as { notes: string | null } | null)?.notes ?? "").trim();
  const mergedNotes = existingNotes ? `${newLine}\n${existingNotes}` : newLine;

  const { error } = await supabase
    .from("drivers")
    .update({
      safety_score: score,
      notes: mergedNotes,
    } as never)
    .eq("id", driverId);

  if (error) {
    console.error("[drivers:record-safety]", error.message);
    redirect(`/drivers?error=safety_record_failed&detail=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/drivers");
  revalidatePath("/dashboard");
  redirect("/drivers?message=safety_recorded");
}

export async function assignDriverSchedule(formData: FormData) {
  const canWriteDrivers = await hasPermission("drivers.write");

  if (!canWriteDrivers) {
    redirect("/drivers?error=not_allowed");
  }

  if (!isSupabaseConfigured()) {
    redirect("/drivers?error=preview_mode");
  }

  const driverId = String(formData.get("driverId") ?? "").trim();
  const orderId = String(formData.get("orderId") ?? "").trim();

  if (!driverId || !orderId) {
    redirect("/drivers?error=missing_schedule_fields");
  }

  const supabase = await createClient();
  const operationsPolicy = await getOperationsPolicySettings();
  const conflictMessage = await findDriverScheduleConflict(supabase, { driverId, orderId });

  if (conflictMessage && operationsPolicy.conflictStrictMode) {
    redirect(`/drivers?error=driver_schedule_conflict&detail=${encodeURIComponent(conflictMessage)}`);
  }

  const { data: currentOrder } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .maybeSingle();

  const currentStatus = (currentOrder as { status: string } | null)?.status;
  const nextStatus =
    operationsPolicy.autoMarkScheduledOnAssignment && (currentStatus === "pending_confirmation" || currentStatus === "draft")
      ? "scheduled"
      : undefined;

  const payload: Database["public"]["Tables"]["orders"]["Update"] = {
    driver_id: driverId,
    ...(nextStatus ? { status: nextStatus as Database["public"]["Tables"]["orders"]["Update"]["status"] } : {}),
  };

  const { error } = await supabase.from("orders").update(payload as never).eq("id", orderId);

  if (error) {
    console.error("[drivers:assign-schedule]", error.message);
    redirect(`/drivers?error=schedule_assign_failed&detail=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/drivers");
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  redirect("/drivers?message=driver_schedule_assigned");
}

export async function deleteDriver(formData: FormData) {
  const canWriteDrivers = await hasPermission("drivers.write");

  if (!canWriteDrivers) {
    redirect("/drivers?error=not_allowed");
  }

  if (!isSupabaseConfigured()) {
    redirect("/drivers?error=preview_mode");
  }

  const driverId = String(formData.get("driverId") ?? "").trim();

  if (!driverId) {
    redirect("/drivers?error=missing_fields");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("drivers").delete().eq("id", driverId);

  if (error) {
    console.error("[drivers:delete]", error.message);
    redirect(`/drivers?error=delete_failed&detail=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/drivers");
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  redirect("/drivers?message=driver_deleted");
}

function readDriverPayload(formData: FormData):
  | Database["public"]["Tables"]["drivers"]["Insert"]
  | Database["public"]["Tables"]["drivers"]["Update"]
  | { error: string } {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const languagesInput = String(formData.get("languages") ?? "").trim();
  const contractType = String(formData.get("contractType") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const dutyHoursInput = String(formData.get("dutyHoursMonthly") ?? "").trim();
  const safetyScoreInput = String(formData.get("safetyScore") ?? "").trim();
  const status = String(formData.get("status") ?? "available").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!fullName || !languagesInput || !contractType || !dutyHoursInput || !safetyScoreInput || !status) {
    return { error: "missing_fields" };
  }

  const dutyHoursMonthly = Number(dutyHoursInput);
  const safetyScore = Number(safetyScoreInput);

  if (Number.isNaN(dutyHoursMonthly) || dutyHoursMonthly < 0) {
    return { error: "invalid_duty_hours" };
  }

  if (Number.isNaN(safetyScore) || safetyScore < 0 || safetyScore > 100) {
    return { error: "invalid_safety_score" };
  }

  if (!["full_time", "part_time", "partner"].includes(contractType)) {
    return { error: "invalid_contract_type" };
  }

  if (!["available", "assigned", "off_duty", "inactive"].includes(status)) {
    return { error: "invalid_status" };
  }

  const languages = languagesInput
    .split(/[、,/]/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (!languages.length) {
    return { error: "missing_fields" };
  }

  return {
    full_name: fullName,
    languages,
    contract_type: contractType as Database["public"]["Tables"]["drivers"]["Insert"]["contract_type"],
    phone: phone || null,
    duty_hours_monthly: dutyHoursMonthly,
    safety_score: safetyScore,
    status: status as Database["public"]["Tables"]["drivers"]["Insert"]["status"],
    notes: notes || null,
  };
}

async function findDriverScheduleConflict(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: { driverId: string; orderId: string },
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
    return "请先为订单设置服务日期，再安排司机排班。";
  }

  const { data: conflicts, error: conflictError } = await supabase
    .from("orders")
    .select("order_no, title")
    .eq("service_date", orderRow.service_date)
    .eq("driver_id", input.driverId)
    .neq("id", input.orderId)
    .neq("status", "cancelled")
    .limit(1);

  if (conflictError) {
    return conflictError.message;
  }

  const conflict = (conflicts as Array<{ order_no: string; title: string }> | null)?.[0];

  return conflict ? `${orderRow.service_date} 这天该司机已被订单 ${conflict.order_no}（${conflict.title}）占用。` : null;
}
