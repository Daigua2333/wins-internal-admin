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
    if (isDefaultVehicleConflict(error.message)) {
      redirect("/drivers?error=default_vehicle_in_use");
    }
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
    if (isDefaultVehicleConflict(error.message)) {
      redirect("/drivers?error=default_vehicle_in_use");
    }
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

export async function recordDriverIncident(formData: FormData) {
  const canWriteDrivers = await hasPermission("drivers.write");

  if (!canWriteDrivers) {
    redirect("/drivers?error=not_allowed");
  }

  if (!isSupabaseConfigured()) {
    redirect("/drivers?error=preview_mode");
  }

  const driverId = String(formData.get("driverId") ?? "").trim();
  const orderId = String(formData.get("orderId") ?? "").trim();
  const occurredOn = String(formData.get("occurredOn") ?? "").trim();
  const severity = String(formData.get("severity") ?? "minor").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!driverId || !occurredOn || !title || !description) {
    redirect("/drivers?error=missing_incident_fields");
  }

  if (!["minor", "major", "critical"].includes(severity)) {
    redirect("/drivers?error=invalid_incident_severity");
  }

  const supabase = await createClient();
  const payload: Database["public"]["Tables"]["driver_incidents"]["Insert"] = {
    driver_id: driverId,
    order_id: orderId || null,
    occurred_on: occurredOn,
    severity: severity as Database["public"]["Tables"]["driver_incidents"]["Insert"]["severity"],
    title,
    description,
    status: "open",
  };
  const { error } = await supabase.from("driver_incidents").insert(payload as never);

  if (error) {
    console.error("[drivers:record-incident]", error.message);
    redirect(`/drivers?error=incident_record_failed&detail=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/drivers");
  revalidatePath("/dashboard");
  redirect("/drivers?message=incident_recorded");
}

export async function updateDriverVehicleMatch(formData: FormData) {
  const canWriteOrders = await hasPermission("orders.write");
  const redirectTo = resolveRedirectPath(formData);

  if (!canWriteOrders) {
    redirect(addRedirectParams(redirectTo, "error=not_allowed"));
  }

  if (!isSupabaseConfigured()) {
    redirect(addRedirectParams(redirectTo, "error=preview_mode"));
  }

  const orderId = String(formData.get("orderId") ?? "").trim();
  const driverId = String(formData.get("driverId") ?? "").trim();
  let vehicleId = String(formData.get("vehicleId") ?? "").trim();

  if (!orderId) {
    redirect(addRedirectParams(redirectTo, "error=missing_match_fields"));
  }

  const supabase = await createClient();

  if (driverId && !vehicleId) {
    const { data: driver } = await supabase.from("drivers").select("default_vehicle_id").eq("id", driverId).maybeSingle();
    vehicleId = String((driver as { default_vehicle_id: string | null } | null)?.default_vehicle_id ?? "");
  }

  const conflictMessage = await findDriverVehicleConflict(supabase, { orderId, driverId: driverId || null, vehicleId: vehicleId || null });
  const operationsPolicy = await getOperationsPolicySettings();

  if (conflictMessage && operationsPolicy.conflictStrictMode) {
    redirect(addRedirectParams(redirectTo, `error=driver_vehicle_conflict&detail=${encodeURIComponent(conflictMessage)}`));
  }

  const { data: currentOrder } = await supabase.from("orders").select("status").eq("id", orderId).maybeSingle();
  const currentStatus = (currentOrder as { status: string } | null)?.status;
  const nextStatus =
    operationsPolicy.autoMarkScheduledOnAssignment &&
    (currentStatus === "pending_confirmation" || currentStatus === "draft") &&
    (driverId || vehicleId)
      ? "scheduled"
      : undefined;
  const { error } = await supabase
    .from("orders")
    .update({ driver_id: driverId || null, vehicle_id: vehicleId || null, ...(nextStatus ? { status: nextStatus } : {}) } as never)
    .eq("id", orderId);

  if (error) {
    console.error("[drivers:update-driver-vehicle-match]", error.message);
    redirect(addRedirectParams(redirectTo, `error=match_update_failed&detail=${encodeURIComponent(error.message)}`));
  }

  revalidatePath("/drivers");
  revalidatePath("/fleet");
  revalidatePath("/orders");
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  redirect(addRedirectParams(redirectTo, "message=driver_vehicle_matched"));
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
  const wechatId = String(formData.get("wechatId") ?? "").trim();
  const lineId = String(formData.get("lineId") ?? "").trim();
  const attendanceDaysInput = String(formData.get("attendanceDaysMonthly") ?? "").trim();
  const displayColor = String(formData.get("displayColor") ?? "#0f766e").trim();
  const defaultVehicleId = String(formData.get("defaultVehicleId") ?? "").trim();
  const status = String(formData.get("status") ?? "available").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!fullName || !languagesInput || !contractType || !attendanceDaysInput || !status) {
    return { error: "missing_fields" };
  }

  const attendanceDaysMonthly = Number(attendanceDaysInput);

  if (Number.isNaN(attendanceDaysMonthly) || attendanceDaysMonthly < 0 || !Number.isInteger(attendanceDaysMonthly)) {
    return { error: "invalid_attendance_days" };
  }

  if (!/^#[0-9a-fA-F]{6}$/.test(displayColor)) {
    return { error: "invalid_display_color" };
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
    wechat_id: wechatId || null,
    line_id: lineId || null,
    attendance_days_monthly: attendanceDaysMonthly,
    display_color: displayColor,
    default_vehicle_id: defaultVehicleId || null,
    status: status as Database["public"]["Tables"]["drivers"]["Insert"]["status"],
    notes: notes || null,
  };
}

async function findDriverVehicleConflict(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: { orderId: string; driverId: string | null; vehicleId: string | null },
) {
  const { data: order, error } = await supabase.from("orders").select("service_date").eq("id", input.orderId).maybeSingle();

  if (error) return error.message;

  const serviceDate = (order as { service_date: string | null } | null)?.service_date;
  if (!serviceDate) return "请先为订单设置服务日期，再匹配司机和车辆。";

  const { data: matches, error: matchError } = await supabase
    .from("orders")
    .select("order_no,title,driver_id,vehicle_id")
    .eq("service_date", serviceDate)
    .neq("id", input.orderId)
    .neq("status", "cancelled");

  if (matchError) return matchError.message;

  const conflicts: string[] = [];
  for (const match of (matches as Array<{ order_no: string; title: string; driver_id: string | null; vehicle_id: string | null }> | null) ?? []) {
    if (input.driverId && match.driver_id === input.driverId) conflicts.push(`司机已安排到 ${match.order_no}（${match.title}）`);
    if (input.vehicleId && match.vehicle_id === input.vehicleId) conflicts.push(`车辆已安排到 ${match.order_no}（${match.title}）`);
  }

  return conflicts.length ? `${serviceDate} 存在匹配冲突：${conflicts.join("；")}。` : null;
}

function resolveRedirectPath(formData: FormData) {
  const redirectTo = String(formData.get("redirectTo") ?? "/drivers").trim();
  return redirectTo.startsWith("/") ? redirectTo : "/drivers";
}

function addRedirectParams(path: string, params: string) {
  return `${path}${path.includes("?") ? "&" : "?"}${params}`;
}

function isDefaultVehicleConflict(message: string) {
  return message.includes("idx_drivers_unique_default_vehicle_id") || message.includes("drivers_default_vehicle_id");
}
