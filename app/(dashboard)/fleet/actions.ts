"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { hasPermission } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";

export async function createVehicle(formData: FormData) {
  const canWriteVehicles = await hasPermission("vehicles.write");

  if (!canWriteVehicles) {
    redirect("/fleet?error=not_allowed");
  }

  if (!isSupabaseConfigured()) {
    redirect("/fleet?error=preview_mode");
  }

  const payload = readVehiclePayload(formData);

  if ("error" in payload) {
    redirect(`/fleet?error=${payload.error}`);
  }

  const supabase = await createClient();
  const plateNumber = payload.plate_number;

  if (!plateNumber) {
    redirect("/fleet?error=missing_fields");
  }

  const duplicatePlate = await findVehicleByPlateNumber(supabase, plateNumber);

  if (duplicatePlate) {
    redirect("/fleet?error=duplicate_plate");
  }

  const { error } = await supabase.from("vehicles").insert(payload as never);

  if (error) {
    console.error("[fleet:create]", error.message);
    if (error.message.includes("vehicles_plate_number_key")) {
      redirect("/fleet?error=duplicate_plate");
    }
    redirect(`/fleet?error=create_failed&detail=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/fleet");
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  redirect("/fleet?message=vehicle_created");
}

export async function updateVehicleBasics(formData: FormData) {
  const canWriteVehicles = await hasPermission("vehicles.write");

  if (!canWriteVehicles) {
    redirect("/fleet?error=not_allowed");
  }

  if (!isSupabaseConfigured()) {
    redirect("/fleet?error=preview_mode");
  }

  const vehicleId = String(formData.get("vehicleId") ?? "").trim();

  if (!vehicleId) {
    redirect("/fleet?error=missing_fields");
  }

  const payload = readVehiclePayload(formData);

  if ("error" in payload) {
    redirect(`/fleet?error=${payload.error}`);
  }

  const supabase = await createClient();
  const plateNumber = payload.plate_number;

  if (!plateNumber) {
    redirect("/fleet?error=missing_fields");
  }

  const duplicatePlate = await findVehicleByPlateNumber(supabase, plateNumber, vehicleId);

  if (duplicatePlate) {
    redirect("/fleet?error=duplicate_plate");
  }

  const { error } = await supabase.from("vehicles").update(payload as never).eq("id", vehicleId);

  if (error) {
    console.error("[fleet:update-basics]", error.message);
    if (error.message.includes("vehicles_plate_number_key")) {
      redirect("/fleet?error=duplicate_plate");
    }
    redirect(`/fleet?error=update_failed&detail=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/fleet");
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  redirect("/fleet?message=vehicle_updated");
}

export async function updateVehicleStatus(formData: FormData) {
  const canWriteVehicles = await hasPermission("vehicles.write");

  if (!canWriteVehicles) {
    redirect("/fleet?error=not_allowed");
  }

  if (!isSupabaseConfigured()) {
    redirect("/fleet?error=preview_mode");
  }

  const vehicleId = String(formData.get("vehicleId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();

  if (!vehicleId || !status) {
    redirect("/fleet?error=missing_fields");
  }

  const validStatuses = new Set(["available", "maintenance", "assigned", "inactive"]);
  if (!validStatuses.has(status)) {
    redirect("/fleet?error=invalid_status");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("vehicles")
    .update({ status: status as Database["public"]["Tables"]["vehicles"]["Update"]["status"] } as never)
    .eq("id", vehicleId);

  if (error) {
    console.error("[fleet:update-status]", error.message);
    redirect(`/fleet?error=status_update_failed&detail=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/fleet");
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  redirect("/fleet?message=vehicle_status_updated");
}

export async function deleteVehicle(formData: FormData) {
  const canWriteVehicles = await hasPermission("vehicles.write");

  if (!canWriteVehicles) {
    redirect("/fleet?error=not_allowed");
  }

  if (!isSupabaseConfigured()) {
    redirect("/fleet?error=preview_mode");
  }

  const vehicleId = String(formData.get("vehicleId") ?? "").trim();

  if (!vehicleId) {
    redirect("/fleet?error=missing_fields");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("vehicles").delete().eq("id", vehicleId);

  if (error) {
    console.error("[fleet:delete]", error.message);
    redirect(`/fleet?error=delete_failed&detail=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/fleet");
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  redirect("/fleet?message=vehicle_deleted");
}

function readVehiclePayload(formData: FormData):
  | Database["public"]["Tables"]["vehicles"]["Insert"]
  | Database["public"]["Tables"]["vehicles"]["Update"]
  | { error: string } {
  const plateNumber = String(formData.get("plateNumber") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  const vehicleType = String(formData.get("vehicleType") ?? "").trim();
  const seatInput = String(formData.get("seatCapacity") ?? "").trim();
  const ownerType = String(formData.get("ownerType") ?? "").trim();
  const inspectionDueOn = String(formData.get("inspectionDueOn") ?? "").trim();
  const status = String(formData.get("status") ?? "available").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!plateNumber || !label || !vehicleType || !seatInput || !ownerType || !status) {
    return { error: "missing_fields" };
  }

  const seatCapacity = Number(seatInput);
  if (Number.isNaN(seatCapacity) || seatCapacity <= 0) {
    return { error: "invalid_seat_capacity" };
  }

  if (!["owned", "partner"].includes(ownerType)) {
    return { error: "invalid_owner_type" };
  }

  if (!["available", "maintenance", "assigned", "inactive"].includes(status)) {
    return { error: "invalid_status" };
  }

  return {
    plate_number: plateNumber,
    label,
    vehicle_type: vehicleType,
    seat_capacity: seatCapacity,
    owner_type: ownerType as Database["public"]["Tables"]["vehicles"]["Insert"]["owner_type"],
    inspection_due_on: inspectionDueOn || null,
    status: status as Database["public"]["Tables"]["vehicles"]["Insert"]["status"],
    notes: notes || null,
  };
}

async function findVehicleByPlateNumber(
  supabase: Awaited<ReturnType<typeof createClient>>,
  plateNumber: string,
  excludeVehicleId?: string,
) {
  const query = supabase.from("vehicles").select("id").eq("plate_number", plateNumber).limit(1);
  const { data, error } = excludeVehicleId ? await query.neq("id", excludeVehicleId) : await query;

  if (error) {
    console.error("[fleet:check-duplicate-plate]", error.message);
    return false;
  }

  return Boolean((data as Array<{ id: string }> | null)?.length);
}
