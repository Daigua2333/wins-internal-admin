"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { writeAuditLog } from "@/lib/audit/log";
import { getCurrentUser, hasPermission } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";

const VALID_PAYMENT_METHODS = ["bank_transfer", "cash", "credit_card", "other"] as const;
const VALID_RECEIPT_STATUSES = ["pending", "received", "reconciled"] as const;
const VALID_SUPPLIER_PAYMENT_STATUSES = ["pending", "paid", "reconciled"] as const;
const VALID_COST_CATEGORIES = ["vehicle", "driver", "guide", "hotel", "meal", "ticket", "misc"] as const;

export async function createPaymentReceipt(formData: FormData) {
  const canWriteFinance = await hasPermission("finance.write");
  const orderId = String(formData.get("orderId") ?? "").trim();

  if (!canWriteFinance) {
    redirect("/finance?error=not_allowed");
  }

  if (!isSupabaseConfigured()) {
    redirect("/finance?error=preview_mode");
  }

  const payload = readPaymentReceiptPayload(formData);
  if ("error" in payload) {
    redirect(`/finance?error=${payload.error}`);
  }

  const supabase = await createClient();
  const { data: order, error: orderError } = await supabase.from("orders").select("customer_id").eq("id", orderId).maybeSingle();

  if (orderError || !order) {
    redirect(`/finance?error=order_not_found&detail=${encodeURIComponent(orderError?.message ?? "找不到关联订单。")}`);
  }

  const { data, error } = await supabase
    .from("payment_receipts")
    .insert({
      ...(payload as Database["public"]["Tables"]["payment_receipts"]["Insert"]),
      customer_id: (order as { customer_id: string }).customer_id,
    } as never)
    .select("id")
    .single();

  if (error) {
    console.error("[finance:create-receipt]", error.message);
    redirect(`/finance?error=create_failed&detail=${encodeURIComponent(error.message)}`);
  }

  const currentUser = await getCurrentUser();
  await writeAuditLog(supabase, {
    actorId: currentUser?.id,
    action: "create",
    entityType: "payment_receipt",
    entityId: (data as { id: string }).id,
    summary: `登记订单回款 ${String(payload.amount_jpy ?? 0)} JPY`,
    metadata: { orderId },
  });

  revalidateFinance();
  redirect("/finance?message=receipt_created");
}

export async function updatePaymentReceipt(formData: FormData) {
  const canWriteFinance = await hasPermission("finance.write");
  const orderId = String(formData.get("orderId") ?? "").trim();

  if (!canWriteFinance) {
    redirect("/finance?error=not_allowed");
  }

  if (!isSupabaseConfigured()) {
    redirect("/finance?error=preview_mode");
  }

  const receiptId = String(formData.get("receiptId") ?? "").trim();
  if (!receiptId) {
    redirect("/finance?error=missing_fields");
  }

  const payload = readPaymentReceiptPayload(formData);
  if ("error" in payload) {
    redirect(`/finance?error=${payload.error}`);
  }

  const supabase = await createClient();
  const { data: order, error: orderError } = await supabase.from("orders").select("customer_id").eq("id", orderId).maybeSingle();

  if (orderError || !order) {
    redirect(`/finance?error=order_not_found&detail=${encodeURIComponent(orderError?.message ?? "找不到关联订单。")}`);
  }

  const { data, error } = await supabase
    .from("payment_receipts")
    .update({
      ...(payload as Database["public"]["Tables"]["payment_receipts"]["Update"]),
      customer_id: (order as { customer_id: string }).customer_id,
    } as never)
    .eq("id", receiptId)
    .eq("is_voided", false)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    if (!error) redirect("/finance?error=record_voided");
    console.error("[finance:update-receipt]", error.message);
    redirect(`/finance?error=update_failed&detail=${encodeURIComponent(error.message)}`);
  }

  const currentUser = await getCurrentUser();
  await writeAuditLog(supabase, {
    actorId: currentUser?.id,
    action: "update",
    entityType: "payment_receipt",
    entityId: receiptId,
    summary: `更新订单回款 ${String(payload.amount_jpy ?? 0)} JPY`,
    metadata: { orderId },
  });

  revalidateFinance();
  redirect("/finance?message=receipt_updated");
}

export async function voidPaymentReceipt(formData: FormData) {
  const canWriteFinance = await hasPermission("finance.write");
  if (!canWriteFinance) redirect("/finance?error=not_allowed");
  if (!isSupabaseConfigured()) redirect("/finance?error=preview_mode");

  const receiptId = String(formData.get("receiptId") ?? "").trim();
  const voidReason = String(formData.get("voidReason") ?? "").trim();
  if (!receiptId || !voidReason) redirect("/finance?error=missing_void_reason");

  const supabase = await createClient();
  const currentUser = await getCurrentUser();
  const { data, error } = await supabase
    .from("payment_receipts")
    .update({
      is_voided: true,
      voided_at: new Date().toISOString(),
      voided_by: currentUser?.id ?? null,
      void_reason: voidReason,
    } as never)
    .eq("id", receiptId)
    .eq("is_voided", false)
    .select("id,order_id,amount_jpy")
    .maybeSingle();
  if (error || !data) {
    const message = error?.message ?? "该回款已经作废。";
    redirect(`/finance?error=void_failed&detail=${encodeURIComponent(message)}`);
  }

  await writeAuditLog(supabase, {
    actorId: currentUser?.id,
    action: "void",
    entityType: "payment_receipt",
    entityId: receiptId,
    summary: `作废订单回款 ${String((data as { amount_jpy: number }).amount_jpy)} JPY`,
    metadata: { orderId: (data as { order_id: string }).order_id, reason: voidReason },
  });

  revalidateFinance();
  redirect("/finance?message=receipt_voided");
}

export async function createSupplierPayment(formData: FormData) {
  const canWriteFinance = await hasPermission("finance.write");

  if (!canWriteFinance) {
    redirect("/finance?error=not_allowed");
  }

  if (!isSupabaseConfigured()) {
    redirect("/finance?error=preview_mode");
  }

  const payload = readSupplierPaymentPayload(formData);
  if ("error" in payload) {
    redirect(`/finance?error=${payload.error}`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("supplier_payments").insert(payload as never).select("id").single();

  if (error) {
    console.error("[finance:create-supplier-payment]", error.message);
    redirect(`/finance?error=supplier_create_failed&detail=${encodeURIComponent(error.message)}`);
  }

  const currentUser = await getCurrentUser();
  await writeAuditLog(supabase, {
    actorId: currentUser?.id,
    action: "create",
    entityType: "supplier_payment",
    entityId: (data as { id: string }).id,
    summary: `登记供应商付款 ${String(payload.amount_jpy ?? 0)} JPY`,
    metadata: { orderId: payload.order_id, supplierName: payload.supplier_name },
  });

  revalidateFinance();
  redirect("/finance?message=supplier_payment_created");
}

export async function updateSupplierPayment(formData: FormData) {
  const canWriteFinance = await hasPermission("finance.write");

  if (!canWriteFinance) {
    redirect("/finance?error=not_allowed");
  }

  if (!isSupabaseConfigured()) {
    redirect("/finance?error=preview_mode");
  }

  const paymentId = String(formData.get("paymentId") ?? "").trim();
  if (!paymentId) {
    redirect("/finance?error=missing_fields");
  }

  const payload = readSupplierPaymentPayload(formData);
  if ("error" in payload) {
    redirect(`/finance?error=${payload.error}`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("supplier_payments")
    .update(payload as never)
    .eq("id", paymentId)
    .eq("is_voided", false)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    if (!error) redirect("/finance?error=record_voided");
    console.error("[finance:update-supplier-payment]", error.message);
    redirect(`/finance?error=supplier_update_failed&detail=${encodeURIComponent(error.message)}`);
  }

  const currentUser = await getCurrentUser();
  await writeAuditLog(supabase, {
    actorId: currentUser?.id,
    action: "update",
    entityType: "supplier_payment",
    entityId: paymentId,
    summary: `更新供应商付款 ${String(payload.amount_jpy ?? 0)} JPY`,
    metadata: { orderId: payload.order_id, supplierName: payload.supplier_name },
  });

  revalidateFinance();
  redirect("/finance?message=supplier_payment_updated");
}

export async function voidSupplierPayment(formData: FormData) {
  const canWriteFinance = await hasPermission("finance.write");
  if (!canWriteFinance) redirect("/finance?error=not_allowed");
  if (!isSupabaseConfigured()) redirect("/finance?error=preview_mode");

  const paymentId = String(formData.get("paymentId") ?? "").trim();
  const voidReason = String(formData.get("voidReason") ?? "").trim();
  if (!paymentId || !voidReason) redirect("/finance?error=missing_void_reason");

  const supabase = await createClient();
  const currentUser = await getCurrentUser();
  const { data, error } = await supabase
    .from("supplier_payments")
    .update({
      is_voided: true,
      voided_at: new Date().toISOString(),
      voided_by: currentUser?.id ?? null,
      void_reason: voidReason,
    } as never)
    .eq("id", paymentId)
    .eq("is_voided", false)
    .select("id,order_id,amount_jpy,supplier_name")
    .maybeSingle();
  if (error || !data) {
    const message = error?.message ?? "该供应商付款已经作废。";
    redirect(`/finance?error=supplier_void_failed&detail=${encodeURIComponent(message)}`);
  }

  await writeAuditLog(supabase, {
    actorId: currentUser?.id,
    action: "void",
    entityType: "supplier_payment",
    entityId: paymentId,
    summary: `作废供应商付款 ${String((data as { amount_jpy: number }).amount_jpy)} JPY`,
    metadata: {
      orderId: (data as { order_id: string }).order_id,
      supplierName: (data as { supplier_name: string }).supplier_name,
      reason: voidReason,
    },
  });

  revalidateFinance();
  redirect("/finance?message=supplier_payment_voided");
}

function readPaymentReceiptPayload(formData: FormData):
  | Database["public"]["Tables"]["payment_receipts"]["Insert"]
  | Database["public"]["Tables"]["payment_receipts"]["Update"]
  | { error: string } {
  const orderId = String(formData.get("orderId") ?? "").trim();
  const receivedOn = String(formData.get("receivedOn") ?? "").trim();
  const amountInput = String(formData.get("amountJpy") ?? "").trim();
  const method = String(formData.get("method") ?? "bank_transfer").trim();
  const status = String(formData.get("status") ?? "received").trim();
  const referenceNo = String(formData.get("referenceNo") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!orderId || !receivedOn || !amountInput || !method || !status) {
    return { error: "missing_fields" };
  }

  const amountJpy = Number(amountInput);
  if (Number.isNaN(amountJpy) || amountJpy <= 0) {
    return { error: "invalid_amount" };
  }

  if (!VALID_PAYMENT_METHODS.includes(method as (typeof VALID_PAYMENT_METHODS)[number])) {
    return { error: "invalid_method" };
  }

  if (!VALID_RECEIPT_STATUSES.includes(status as (typeof VALID_RECEIPT_STATUSES)[number])) {
    return { error: "invalid_status" };
  }

  return {
    order_id: orderId,
    received_on: receivedOn,
    amount_jpy: amountJpy,
    method: method as Database["public"]["Tables"]["payment_receipts"]["Insert"]["method"],
    status: status as Database["public"]["Tables"]["payment_receipts"]["Insert"]["status"],
    reference_no: referenceNo || null,
    notes: notes || null,
  };
}

function readSupplierPaymentPayload(formData: FormData):
  | Database["public"]["Tables"]["supplier_payments"]["Insert"]
  | Database["public"]["Tables"]["supplier_payments"]["Update"]
  | { error: string } {
  const orderId = String(formData.get("orderId") ?? "").trim();
  const supplierName = String(formData.get("supplierName") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const paidOn = String(formData.get("paidOn") ?? "").trim();
  const amountInput = String(formData.get("amountJpy") ?? "").trim();
  const method = String(formData.get("method") ?? "bank_transfer").trim();
  const status = String(formData.get("status") ?? "paid").trim();
  const referenceNo = String(formData.get("referenceNo") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!orderId || !supplierName || !category || !paidOn || !amountInput || !method || !status) {
    return { error: "missing_fields" };
  }

  const amountJpy = Number(amountInput);
  if (Number.isNaN(amountJpy) || amountJpy <= 0) {
    return { error: "invalid_amount" };
  }

  if (!VALID_COST_CATEGORIES.includes(category as (typeof VALID_COST_CATEGORIES)[number])) {
    return { error: "invalid_category" };
  }

  if (!VALID_PAYMENT_METHODS.includes(method as (typeof VALID_PAYMENT_METHODS)[number])) {
    return { error: "invalid_method" };
  }

  if (!VALID_SUPPLIER_PAYMENT_STATUSES.includes(status as (typeof VALID_SUPPLIER_PAYMENT_STATUSES)[number])) {
    return { error: "invalid_supplier_status" };
  }

  return {
    order_id: orderId,
    supplier_name: supplierName,
    category: category as Database["public"]["Tables"]["supplier_payments"]["Insert"]["category"],
    paid_on: paidOn,
    amount_jpy: amountJpy,
    method: method as Database["public"]["Tables"]["supplier_payments"]["Insert"]["method"],
    status: status as Database["public"]["Tables"]["supplier_payments"]["Insert"]["status"],
    reference_no: referenceNo || null,
    notes: notes || null,
  };
}

function revalidateFinance() {
  revalidatePath("/finance");
  revalidatePath("/customers");
  revalidatePath("/orders");
  revalidatePath("/profit");
  revalidatePath("/dashboard");
}
