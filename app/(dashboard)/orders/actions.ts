"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { writeAuditLog } from "@/lib/audit/log";
import { getCurrentUser, hasPermission } from "@/lib/auth/session";
import { getOperationsPolicySettings } from "@/lib/settings/runtime";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";
import type { OrderStatus } from "@/lib/types/domain";

export async function createOrder(formData: FormData) {
  const redirectTo = resolveOrderRedirectPath(formData);
  const canWriteOrders = await hasPermission("orders.write");

  if (!canWriteOrders) {
    redirect(`${redirectTo}?error=not_allowed`);
  }

  if (!isSupabaseConfigured()) {
    redirect(`${redirectTo}?error=preview_mode`);
  }

  const customerId = String(formData.get("customerId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const serviceDate = String(formData.get("serviceDate") ?? "").trim();
  const serviceStartTime = String(formData.get("serviceStartTime") ?? "").trim();
  const assigneeId = String(formData.get("assigneeId") ?? "").trim();
  const revenueInput = String(formData.get("revenueJpy") ?? "").trim();
  const status = String(formData.get("status") ?? "pending_confirmation").trim() as OrderStatus;
  const notes = String(formData.get("notes") ?? "").trim();
  const repeatMode = String(formData.get("repeatMode") ?? "none").trim();
  const repeatOccurrencesInput = String(formData.get("repeatOccurrences") ?? "1").trim();

  if (!customerId || !title || !serviceDate) {
    redirect(`${redirectTo}?error=missing_fields`);
  }

  if (serviceStartTime && !isValidClockTime(serviceStartTime)) {
    redirect(`${redirectTo}?error=invalid_start_time`);
  }

  const revenueJpy = revenueInput ? Number(revenueInput) : 0;

  if (Number.isNaN(revenueJpy) || revenueJpy < 0) {
    redirect(`${redirectTo}?error=invalid_amount`);
  }

  const repeatOccurrences = Number(repeatOccurrencesInput || "1");

  if (!["none", "daily", "weekly", "monthly"].includes(repeatMode)) {
    redirect(`${redirectTo}?error=invalid_repeat_mode`);
  }

  if (Number.isNaN(repeatOccurrences) || repeatOccurrences <= 0 || repeatOccurrences > 90) {
    redirect(`${redirectTo}?error=invalid_repeat_occurrences`);
  }

  const supabase = await createClient();
  const currentUser = await getCurrentUser();
  const { data: customerTasks, error: customerTaskError } = await supabase
    .from("customer_collaboration_tasks")
    .select("title,description,priority,due_on,status")
    .eq("customer_id", customerId)
    .not("status", "in", "(completed,cancelled)")
    .order("due_on", { ascending: true });

  if (customerTaskError) {
    console.error("[orders:create-customer-requirements]", customerTaskError.message);
  }
  const requirementSnapshot = buildCustomerRequirementSnapshot((customerTasks as Array<any> | null) ?? []);
  const orderNotes = [notes, requirementSnapshot].filter(Boolean).join("\n\n");

  const serviceDates = buildRecurringServiceDates({
    baseDate: serviceDate,
    repeatMode,
    occurrences: repeatMode === "none" ? 1 : repeatOccurrences,
  });
  const orderNos = await generateOrderNos(supabase, serviceDates.length);

  const payload = serviceDates.map((date, index) => ({
    order_no: orderNos[index],
    customer_id: customerId,
    title,
    service_date: date,
    status,
    assignee_profile_id: assigneeId || currentUser?.id || null,
    revenue_jpy: revenueJpy,
    total_cost_jpy: 0,
    notes: buildRecurringOrderNotes({
      notes: orderNotes,
      serviceStartTime,
      repeatMode,
      occurrenceIndex: index,
      totalOccurrences: serviceDates.length,
      serviceDate: date,
    }),
  })) satisfies Database["public"]["Tables"]["orders"]["Insert"][];

  const { error } = await supabase.from("orders").insert(payload as never);

  if (error) {
    console.error("[orders:create]", error.message);
    redirect(`${redirectTo}?error=create_failed&detail=${encodeURIComponent(error.message)}`);
  }

  await writeAuditLog(supabase, {
    actorId: currentUser?.id,
    action: "create",
    entityType: "order",
    summary: `创建 ${serviceDates.length} 张订单：${title}`,
    metadata: {
      customerId,
      orderNos,
      serviceDates,
      repeatMode,
      requirementCount: customerTasks?.length ?? 0,
    },
  });

  revalidatePath("/orders");
  revalidatePath("/dashboard");
  revalidatePath("/profit");
  redirect(`${redirectTo}?message=order_created&orderNo=${orderNos[0]}&count=${serviceDates.length}&repeatMode=${repeatMode}`);
}

export async function updateOrderBasics(formData: FormData) {
  const redirectTo = resolveOrderRedirectPath(formData);
  const canWriteOrders = await hasPermission("orders.write");

  if (!canWriteOrders) {
    redirect(`${redirectTo}?error=not_allowed`);
  }

  if (!isSupabaseConfigured()) {
    redirect(`${redirectTo}?error=preview_mode`);
  }

  const orderId = String(formData.get("orderId") ?? "").trim();
  const customerId = String(formData.get("customerId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const serviceDate = String(formData.get("serviceDate") ?? "").trim();
  const hasServiceStartTimeField = formData.has("serviceStartTime");
  const serviceStartTime = String(formData.get("serviceStartTime") ?? "").trim();
  const assigneeId = String(formData.get("assigneeId") ?? "").trim();
  const revenueInput = String(formData.get("revenueJpy") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!orderId || !customerId || !title || !serviceDate) {
    redirect(`${redirectTo}?error=missing_fields`);
  }

  if (serviceStartTime && !isValidClockTime(serviceStartTime)) {
    redirect(`${redirectTo}?error=invalid_start_time`);
  }

  const revenueJpy = Number(revenueInput);

  if (Number.isNaN(revenueJpy) || revenueJpy < 0) {
    redirect(`${redirectTo}?error=invalid_amount`);
  }

  const supabase = await createClient();
  await ensureOrderNotArchived(supabase, orderId, redirectTo);
  const payload: Database["public"]["Tables"]["orders"]["Update"] = {
    customer_id: customerId,
    title,
    service_date: serviceDate,
    assignee_profile_id: assigneeId || null,
    revenue_jpy: revenueJpy,
    notes: hasServiceStartTimeField ? buildOrderNotesWithStartTime(notes, serviceStartTime) : notes || null,
  };

  const { error } = await supabase.from("orders").update(payload as never).eq("id", orderId);

  if (error) {
    console.error("[orders:update-basics]", error.message);
    redirect(`${redirectTo}?error=update_failed&detail=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/orders");
  revalidatePath("/dashboard");
  revalidatePath("/profit");
  redirect(`${redirectTo}?message=order_updated`);
}

export async function updateOrderStatus(formData: FormData) {
  const redirectTo = resolveOrderRedirectPath(formData);
  const canWriteOrders = await hasPermission("orders.write");

  if (!canWriteOrders) {
    redirect(`${redirectTo}?error=not_allowed`);
  }

  if (!isSupabaseConfigured()) {
    redirect(`${redirectTo}?error=preview_mode`);
  }

  const orderId = String(formData.get("orderId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim() as OrderStatus;

  if (!orderId || !status) {
    redirect(`${redirectTo}?error=missing_fields`);
  }

  const supabase = await createClient();
  await ensureOrderNotArchived(supabase, orderId, redirectTo);
  const payload: Database["public"]["Tables"]["orders"]["Update"] = {
    status,
  };

  const { error } = await supabase.from("orders").update(payload as never).eq("id", orderId);

  if (error) {
    console.error("[orders:update-status]", error.message);
    redirect(`${redirectTo}?error=status_update_failed&detail=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/orders");
  revalidatePath("/dashboard");
  revalidatePath("/profit");
  redirect(`${redirectTo}?message=status_updated`);
}

export async function deleteOrder(formData: FormData) {
  const redirectTo = resolveOrderRedirectPath(formData);
  const canWriteOrders = await hasPermission("orders.write");

  if (!canWriteOrders) {
    redirect(`${redirectTo}?error=not_allowed`);
  }

  if (!isSupabaseConfigured()) {
    redirect(`${redirectTo}?error=preview_mode`);
  }

  const orderId = String(formData.get("orderId") ?? "").trim();

  if (!orderId) {
    redirect(`${redirectTo}?error=missing_fields`);
  }

  const supabase = await createClient();
  await ensureOrderNotArchived(supabase, orderId, redirectTo);
  const { error } = await supabase.from("orders").delete().eq("id", orderId);

  if (error) {
    console.error("[orders:delete]", error.message);
    redirect(`${redirectTo}?error=delete_failed&detail=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/calendar");
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  revalidatePath("/profit");
  revalidatePath("/finance");
  redirect(`${redirectTo}?message=order_deleted`);
}

export async function archiveOrder(formData: FormData) {
  const redirectTo = resolveOrderRedirectPath(formData);
  const canWriteOrders = await hasPermission("orders.write");

  if (!canWriteOrders) {
    redirect(`${redirectTo}?error=not_allowed`);
  }

  if (!isSupabaseConfigured()) {
    redirect(`${redirectTo}?error=preview_mode`);
  }

  const orderId = String(formData.get("orderId") ?? "").trim();
  const archiveSummary = String(formData.get("archiveSummary") ?? "").trim();
  const archiveKeywords = String(formData.get("archiveKeywords") ?? "").trim();

  if (!orderId) {
    redirect(`${redirectTo}?error=missing_fields`);
  }

  const supabase = await createClient();
  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("order_no,title,service_date,status,notes,customer:customers(company_name)")
    .eq("id", orderId)
    .maybeSingle();

  if (fetchError || !order) {
    const message = fetchError?.message ?? "订单不存在。";
    console.error("[orders:archive-fetch]", message);
    redirect(`${redirectTo}?error=archive_failed&detail=${encodeURIComponent(message)}`);
  }

  const orderRow = order as {
    order_no: string;
    title: string;
    service_date: string | null;
    status: OrderStatus;
    notes: string | null;
    customer: { company_name: string } | null;
  };

  if (!["completed", "cancelled"].includes(orderRow.status)) {
    redirect(`${redirectTo}?error=archive_not_closed`);
  }

  const fallbackSummary = [
    orderRow.customer?.company_name ?? "未关联客户",
    orderRow.title,
    orderRow.service_date ? `服务日期 ${orderRow.service_date}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
  const fallbackKeywords = [orderRow.order_no, orderRow.title, orderRow.customer?.company_name, orderRow.service_date, orderRow.notes]
    .filter(Boolean)
    .join(" ");
  const payload: Database["public"]["Tables"]["orders"]["Update"] = {
    archived_at: new Date().toISOString(),
    archive_code: buildArchiveCode(orderRow.order_no),
    archive_summary: archiveSummary || fallbackSummary,
    archive_keywords: archiveKeywords || fallbackKeywords,
  };

  const { error } = await supabase.from("orders").update(payload as never).eq("id", orderId);

  if (error) {
    console.error("[orders:archive]", error.message);
    redirect(`${redirectTo}?error=archive_failed&detail=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/orders");
  revalidatePath("/dashboard");
  redirect(`${redirectTo}?message=order_archived`);
}

export async function restoreArchivedOrder(formData: FormData) {
  const redirectTo = resolveOrderRedirectPath(formData);
  const canWriteOrders = await hasPermission("orders.write");

  if (!canWriteOrders) {
    redirect(`${redirectTo}?error=not_allowed`);
  }

  if (!isSupabaseConfigured()) {
    redirect(`${redirectTo}?error=preview_mode`);
  }

  const orderId = String(formData.get("orderId") ?? "").trim();

  if (!orderId) {
    redirect(`${redirectTo}?error=missing_fields`);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({
      archived_at: null,
      archive_code: null,
      archive_summary: null,
      archive_keywords: null,
    } as never)
    .eq("id", orderId);

  if (error) {
    console.error("[orders:restore-archive]", error.message);
    redirect(`${redirectTo}?error=archive_restore_failed&detail=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/orders");
  revalidatePath("/dashboard");
  redirect(`${redirectTo}?message=archive_restored`);
}

export async function appendOrderOperationsLog(formData: FormData) {
  const redirectTo = resolveOrderRedirectPath(formData);
  const canWriteOrders = await hasPermission("orders.write");

  if (!canWriteOrders) {
    redirect(`${redirectTo}?error=not_allowed`);
  }

  if (!isSupabaseConfigured()) {
    redirect(`${redirectTo}?error=preview_mode`);
  }

  const orderId = String(formData.get("orderId") ?? "").trim();
  const logType = String(formData.get("logType") ?? "").trim();
  const detail = String(formData.get("detail") ?? "").trim();

  if (!orderId || !logType || !detail) {
    redirect(`${redirectTo}?error=missing_log_fields`);
  }

  if (!["completion", "incident"].includes(logType)) {
    redirect(`${redirectTo}?error=invalid_log_type`);
  }

  const supabase = await createClient();
  await ensureOrderNotArchived(supabase, orderId, redirectTo);
  const currentUser = await getCurrentUser();
  const { data: order, error: fetchError } = await supabase.from("orders").select("notes").eq("id", orderId).maybeSingle();

  if (fetchError) {
    console.error("[orders:fetch-log-notes]", fetchError.message);
    redirect(`${redirectTo}?error=ops_log_failed&detail=${encodeURIComponent(fetchError.message)}`);
  }

  const currentDate = new Date().toISOString().slice(0, 10);
  const actor = currentUser?.email ?? currentUser?.id ?? "system";
  const newLine = `[ops][${currentDate}][${logType}][by:${actor}] ${detail}`;
  const existingNotes = String((order as { notes: string | null } | null)?.notes ?? "").trim();
  const mergedNotes = existingNotes ? `${newLine}\n${existingNotes}` : newLine;

  const { error } = await supabase.from("orders").update({ notes: mergedNotes } as never).eq("id", orderId);

  if (error) {
    console.error("[orders:append-ops-log]", error.message);
    redirect(`${redirectTo}?error=ops_log_failed&detail=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/calendar");
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  redirect(`${redirectTo}?message=ops_log_added`);
}

export async function updateOrderDispatch(formData: FormData) {
  const redirectTo = resolveOrderRedirectPath(formData);
  const canWriteOrders = await hasPermission("orders.write");

  if (!canWriteOrders) {
    redirect(`${redirectTo}?error=not_allowed`);
  }

  if (!isSupabaseConfigured()) {
    redirect(`${redirectTo}?error=preview_mode`);
  }

  const orderId = String(formData.get("orderId") ?? "").trim();
  const vehicleId = String(formData.get("vehicleId") ?? "").trim();
  const driverId = String(formData.get("driverId") ?? "").trim();
  const guideId = String(formData.get("guideId") ?? "").trim();

  if (!orderId) {
    redirect(`${redirectTo}?error=missing_fields`);
  }

  const supabase = await createClient();
  await ensureOrderNotArchived(supabase, orderId, redirectTo);
  const operationsPolicy = await getOperationsPolicySettings();
  const dispatchConflict = await findDispatchConflictMessage(supabase, {
    orderId,
    vehicleId: vehicleId || null,
    driverId: driverId || null,
    guideId: guideId || null,
  });

  if (dispatchConflict && operationsPolicy.conflictStrictMode) {
    redirect(`${redirectTo}?error=dispatch_conflict&detail=${encodeURIComponent(dispatchConflict)}`);
  }

  const { data: currentOrder } = await supabase.from("orders").select("status").eq("id", orderId).maybeSingle();
  const currentOrderRow = currentOrder as { status: OrderStatus } | null;
  const nextStatus =
    operationsPolicy.autoMarkScheduledOnAssignment &&
    (currentOrderRow?.status === "pending_confirmation" || currentOrderRow?.status === "draft") &&
    (vehicleId || driverId || guideId)
      ? "scheduled"
      : undefined;

  const payload: Database["public"]["Tables"]["orders"]["Update"] = {
    vehicle_id: vehicleId || null,
    driver_id: driverId || null,
    guide_id: guideId || null,
    ...(nextStatus ? { status: nextStatus } : {}),
  };

  const { error } = await supabase.from("orders").update(payload as never).eq("id", orderId);

  if (error) {
    console.error("[orders:update-dispatch]", error.message);
    redirect(`${redirectTo}?error=dispatch_update_failed&detail=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/orders");
  revalidatePath("/dashboard");
  const detail = dispatchConflict && !operationsPolicy.conflictStrictMode
    ? "当前处于宽松冲突模式，系统已允许保存调度，但请尽快人工复核资源冲突。"
    : operationsPolicy.autoMarkScheduledOnAssignment && nextStatus === "scheduled"
      ? "车辆、司机、导游分配已经写回订单，并已按系统设置自动切换为已排车。"
      : undefined;
  redirect(`${redirectTo}?message=dispatch_updated${detail ? `&detail=${encodeURIComponent(detail)}` : ""}`);
}

export async function addOrderCost(formData: FormData) {
  const redirectTo = resolveOrderRedirectPath(formData);
  const canWriteOrders = await hasPermission("orders.write");

  if (!canWriteOrders) {
    redirect(`${redirectTo}?error=not_allowed`);
  }

  if (!isSupabaseConfigured()) {
    redirect(`${redirectTo}?error=preview_mode`);
  }

  const orderId = String(formData.get("orderId") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  const amountInput = String(formData.get("amountJpy") ?? "").trim();
  const supplierName = String(formData.get("supplierName") ?? "").trim();
  const notes = String(formData.get("costNotes") ?? "").trim();

  if (!orderId || !category || !label) {
    redirect(`${redirectTo}?error=missing_fields`);
  }

  const amountJpy = Number(amountInput);
  if (Number.isNaN(amountJpy) || amountJpy < 0) {
    redirect(`${redirectTo}?error=invalid_amount`);
  }

  const supabase = await createClient();
  await ensureOrderNotArchived(supabase, orderId, redirectTo);
  const costPayload: Database["public"]["Tables"]["trip_costs"]["Insert"] = {
    order_id: orderId,
    category: category as Database["public"]["Tables"]["trip_costs"]["Insert"]["category"],
    label,
    amount_jpy: amountJpy,
    supplier_name: supplierName || null,
    notes: notes || null,
  };

  const { error: costError } = await supabase.from("trip_costs").insert(costPayload as never);

  if (costError) {
    console.error("[orders:add-cost]", costError.message);
    redirect(`${redirectTo}?error=cost_create_failed&detail=${encodeURIComponent(costError.message)}`);
  }

  const updateError = await syncOrderTotalCost(supabase, orderId);

  if (updateError) {
    console.error("[orders:sync-total-cost]", updateError.message);
    redirect(`${redirectTo}?error=cost_sync_failed&detail=${encodeURIComponent(updateError.message)}`);
  }

  revalidatePath("/orders");
  revalidatePath("/dashboard");
  revalidatePath("/profit");
  redirect(`${redirectTo}?message=cost_added`);
}

export async function updateOrderCost(formData: FormData) {
  const redirectTo = resolveOrderRedirectPath(formData);
  const canWriteOrders = await hasPermission("orders.write");

  if (!canWriteOrders) {
    redirect(`${redirectTo}?error=not_allowed`);
  }

  if (!isSupabaseConfigured()) {
    redirect(`${redirectTo}?error=preview_mode`);
  }

  const costId = String(formData.get("costId") ?? "").trim();
  const orderId = String(formData.get("orderId") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  const amountInput = String(formData.get("amountJpy") ?? "").trim();
  const supplierName = String(formData.get("supplierName") ?? "").trim();
  const notes = String(formData.get("costNotes") ?? "").trim();

  if (!costId || !orderId || !category || !label) {
    redirect(`${redirectTo}?error=missing_fields`);
  }

  const amountJpy = Number(amountInput);
  if (Number.isNaN(amountJpy) || amountJpy < 0) {
    redirect(`${redirectTo}?error=invalid_amount`);
  }

  const supabase = await createClient();
  await ensureOrderNotArchived(supabase, orderId, redirectTo);
  const payload: Database["public"]["Tables"]["trip_costs"]["Update"] = {
    category: category as Database["public"]["Tables"]["trip_costs"]["Update"]["category"],
    label,
    amount_jpy: amountJpy,
    supplier_name: supplierName || null,
    notes: notes || null,
  };

  const { error: updateCostError } = await supabase.from("trip_costs").update(payload as never).eq("id", costId);

  if (updateCostError) {
    console.error("[orders:update-cost]", updateCostError.message);
    redirect(`${redirectTo}?error=cost_update_failed&detail=${encodeURIComponent(updateCostError.message)}`);
  }

  const updateError = await syncOrderTotalCost(supabase, orderId);

  if (updateError) {
    console.error("[orders:sync-total-cost-after-update]", updateError.message);
    redirect(`${redirectTo}?error=cost_sync_failed&detail=${encodeURIComponent(updateError.message)}`);
  }

  revalidatePath("/orders");
  revalidatePath("/dashboard");
  revalidatePath("/profit");
  redirect(`${redirectTo}?message=cost_updated`);
}

export async function deleteOrderCost(formData: FormData) {
  const redirectTo = resolveOrderRedirectPath(formData);
  const canWriteOrders = await hasPermission("orders.write");

  if (!canWriteOrders) {
    redirect(`${redirectTo}?error=not_allowed`);
  }

  if (!isSupabaseConfigured()) {
    redirect(`${redirectTo}?error=preview_mode`);
  }

  const costId = String(formData.get("costId") ?? "").trim();
  const orderId = String(formData.get("orderId") ?? "").trim();

  if (!costId || !orderId) {
    redirect(`${redirectTo}?error=missing_fields`);
  }

  const supabase = await createClient();
  await ensureOrderNotArchived(supabase, orderId, redirectTo);
  const { error: deleteError } = await supabase.from("trip_costs").delete().eq("id", costId);

  if (deleteError) {
    console.error("[orders:delete-cost]", deleteError.message);
    redirect(`${redirectTo}?error=cost_delete_failed&detail=${encodeURIComponent(deleteError.message)}`);
  }

  const updateError = await syncOrderTotalCost(supabase, orderId);

  if (updateError) {
    console.error("[orders:sync-total-cost-after-delete]", updateError.message);
    redirect(`${redirectTo}?error=cost_sync_failed&detail=${encodeURIComponent(updateError.message)}`);
  }

  revalidatePath("/orders");
  revalidatePath("/dashboard");
  revalidatePath("/profit");
  redirect(`${redirectTo}?message=cost_deleted`);
}

async function syncOrderTotalCost(supabase: Awaited<ReturnType<typeof createClient>>, orderId: string) {
  const { data: totals, error: totalsError } = await supabase.from("trip_costs").select("amount_jpy").eq("order_id", orderId);

  if (totalsError) {
    return totalsError;
  }

  const totalCostJpy = (totals as Array<{ amount_jpy: number }> | null)?.reduce((sum, item) => sum + Number(item.amount_jpy ?? 0), 0) ?? 0;

  const { error: updateError } = await supabase
    .from("orders")
    .update({ total_cost_jpy: totalCostJpy } as never)
    .eq("id", orderId);

  return updateError ?? null;
}

async function ensureOrderNotArchived(supabase: Awaited<ReturnType<typeof createClient>>, orderId: string, redirectTo: string) {
  const { data, error } = await supabase.from("orders").select("archived_at").eq("id", orderId).maybeSingle();

  if (error) {
    if (/archive_|archived_at/.test(error.message)) {
      return;
    }

    console.error("[orders:archive-readonly-check]", error.message);
    redirect(`${redirectTo}?error=update_failed&detail=${encodeURIComponent(error.message)}`);
  }

  const order = data as { archived_at: string | null } | null;

  if (order?.archived_at) {
    redirect(`${redirectTo}?error=archive_readonly`);
  }
}

async function findDispatchConflictMessage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: {
    orderId: string;
    vehicleId: string | null;
    driverId: string | null;
    guideId: string | null;
  },
) {
  if (!input.vehicleId && !input.driverId && !input.guideId) {
    return null;
  }

  const { data: currentOrder, error: currentOrderError } = await supabase
    .from("orders")
    .select("service_date")
    .eq("id", input.orderId)
    .maybeSingle();
  const currentOrderRow = currentOrder as { service_date: string | null } | null;

  if (currentOrderError) {
    return currentOrderError.message;
  }

  if (!currentOrderRow?.service_date) {
    return "请先在订单基础信息里设置服务日期，再进行排车和人员指派。";
  }

  const { data: sameDayOrders, error: sameDayOrdersError } = await supabase
    .from("orders")
    .select("order_no, title, vehicle_id, driver_id, guide_id")
    .eq("service_date", currentOrderRow.service_date)
    .neq("id", input.orderId)
    .neq("status", "cancelled");

  if (sameDayOrdersError) {
    return sameDayOrdersError.message;
  }

  const conflicts: string[] = [];

  for (const order of (sameDayOrders as Array<{
    order_no: string;
    title: string;
    vehicle_id: string | null;
    driver_id: string | null;
    guide_id: string | null;
  }> | null) ?? []) {
    if (input.vehicleId && order.vehicle_id === input.vehicleId) {
      conflicts.push(`车辆已被订单 ${order.order_no}（${order.title}）占用`);
    }

    if (input.driverId && order.driver_id === input.driverId) {
      conflicts.push(`司机已被订单 ${order.order_no}（${order.title}）占用`);
    }

    if (input.guideId && order.guide_id === input.guideId) {
      conflicts.push(`导游已被订单 ${order.order_no}（${order.title}）占用`);
    }
  }

  return conflicts.length ? `${currentOrderRow.service_date} 存在资源冲突：${conflicts.join("；")}。` : null;
}

async function generateOrderNos(supabase: Awaited<ReturnType<typeof createClient>>, count: number) {
  const now = new Date();
  const yyyy = now.getFullYear().toString();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const datePart = `${yyyy}${mm}${dd}`;
  const prefix = `WIN-${datePart}-`;

  const { data } = await supabase
    .from("orders")
    .select("order_no")
    .ilike("order_no", `${prefix}%`)
    .order("order_no", { ascending: false })
    .limit(1);

  const lastOrderNo = (data as Array<{ order_no: string }> | null)?.[0]?.order_no;
  const lastSequence = lastOrderNo ? Number(lastOrderNo.split("-").pop()) : 0;
  const startSequence = Number.isNaN(lastSequence) ? 1 : lastSequence + 1;

  return Array.from({ length: count }, (_, index) => {
    const nextSequence = String(startSequence + index).padStart(3, "0");
    return `${prefix}${nextSequence}`;
  });
}

function buildRecurringServiceDates(input: {
  baseDate: string;
  repeatMode: string;
  occurrences: number;
}) {
  const dates: string[] = [];
  const baseDate = new Date(`${input.baseDate}T00:00:00`);

  if (Number.isNaN(baseDate.getTime())) {
    return [input.baseDate];
  }

  for (let index = 0; index < input.occurrences; index += 1) {
    const nextDate = new Date(baseDate);

    if (input.repeatMode === "daily") {
      nextDate.setDate(baseDate.getDate() + index);
    } else if (input.repeatMode === "weekly") {
      nextDate.setDate(baseDate.getDate() + index * 7);
    } else if (input.repeatMode === "monthly") {
      nextDate.setMonth(baseDate.getMonth() + index);
    }

    dates.push(nextDate.toISOString().slice(0, 10));
  }

  return dates;
}

function buildRecurringOrderNotes(input: {
  notes: string;
  serviceStartTime: string;
  repeatMode: string;
  occurrenceIndex: number;
  totalOccurrences: number;
  serviceDate: string;
}) {
  const scheduleMetadata = input.serviceStartTime ? `[schedule][start_time:${input.serviceStartTime}]` : "";
  const recurringMetadata =
    input.repeatMode === "none"
      ? ""
      : `[recurring][mode:${input.repeatMode}][${input.occurrenceIndex + 1}/${input.totalOccurrences}][date:${input.serviceDate}]`;

  return [scheduleMetadata, recurringMetadata, input.notes].filter(Boolean).join("\n") || null;
}

function buildCustomerRequirementSnapshot(
  tasks: Array<{ title: string; description: string | null; priority: string; due_on: string | null }>,
) {
  if (!tasks.length) {
    return "";
  }

  const lines = tasks.map((task) => {
    const meta = [task.priority ? `优先级:${task.priority}` : "", task.due_on ? `截止:${task.due_on}` : ""].filter(Boolean).join(" · ");
    return `- ${task.title}${meta ? ` (${meta})` : ""}${task.description ? `：${task.description}` : ""}`;
  });

  return `[customer-requirements]\n${lines.join("\n")}`;
}

function buildOrderNotesWithStartTime(notes: string, serviceStartTime: string) {
  const cleanedNotes = notes
    .split("\n")
    .filter((line) => !line.startsWith("[schedule][start_time:"))
    .join("\n")
    .trim();
  const scheduleMetadata = serviceStartTime ? `[schedule][start_time:${serviceStartTime}]` : "";

  return [scheduleMetadata, cleanedNotes].filter(Boolean).join("\n") || null;
}

function isValidClockTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function resolveOrderRedirectPath(formData: FormData) {
  const redirectTo = String(formData.get("redirectTo") ?? "/orders").trim();
  return redirectTo.startsWith("/") ? redirectTo : "/orders";
}

function buildArchiveCode(orderNo: string) {
  return `ARC-${orderNo}`;
}
