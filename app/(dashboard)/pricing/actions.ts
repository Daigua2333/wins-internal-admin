"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { hasPermission } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";

const VALID_QUOTE_STATUSES = ["draft", "sent", "accepted", "expired", "rejected"] as const;

export async function createQuotation(formData: FormData) {
  const canWriteQuotations = await hasPermission("quotations.write");

  if (!canWriteQuotations) {
    redirect("/pricing?error=not_allowed");
  }

  if (!isSupabaseConfigured()) {
    redirect("/pricing?error=preview_mode");
  }

  const payload = readQuotationPayload(formData);
  if ("error" in payload) {
    redirect(`/pricing?error=${payload.error}`);
  }

  const supabase = await createClient();
  const quoteNo = await generateQuoteNo(supabase);

  const { error } = await supabase.from("quotations").insert({
    ...(payload as Database["public"]["Tables"]["quotations"]["Insert"]),
    quote_no: quoteNo,
  } as never);

  if (error) {
    console.error("[pricing:create]", error.message);
    redirect(`/pricing?error=create_failed&detail=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/pricing");
  revalidatePath("/customers");
  revalidatePath("/dashboard");
  redirect(`/pricing?message=quotation_created&quoteNo=${encodeURIComponent(quoteNo)}`);
}

export async function updateQuotationBasics(formData: FormData) {
  const canWriteQuotations = await hasPermission("quotations.write");

  if (!canWriteQuotations) {
    redirect("/pricing?error=not_allowed");
  }

  if (!isSupabaseConfigured()) {
    redirect("/pricing?error=preview_mode");
  }

  const quotationId = String(formData.get("quotationId") ?? "").trim();
  if (!quotationId) {
    redirect("/pricing?error=missing_fields");
  }

  const payload = readQuotationPayload(formData);
  if ("error" in payload) {
    redirect(`/pricing?error=${payload.error}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("quotations").update(payload as never).eq("id", quotationId);

  if (error) {
    console.error("[pricing:update-basics]", error.message);
    redirect(`/pricing?error=update_failed&detail=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/pricing");
  revalidatePath("/customers");
  revalidatePath("/dashboard");
  redirect("/pricing?message=quotation_updated");
}

export async function updateQuotationStatus(formData: FormData) {
  const canWriteQuotations = await hasPermission("quotations.write");

  if (!canWriteQuotations) {
    redirect("/pricing?error=not_allowed");
  }

  if (!isSupabaseConfigured()) {
    redirect("/pricing?error=preview_mode");
  }

  const quotationId = String(formData.get("quotationId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();

  if (!quotationId || !status) {
    redirect("/pricing?error=missing_fields");
  }

  if (!VALID_QUOTE_STATUSES.includes(status as (typeof VALID_QUOTE_STATUSES)[number])) {
    redirect("/pricing?error=invalid_status");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("quotations")
    .update({ status: status as Database["public"]["Tables"]["quotations"]["Update"]["status"] } as never)
    .eq("id", quotationId);

  if (error) {
    console.error("[pricing:update-status]", error.message);
    redirect(`/pricing?error=status_update_failed&detail=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/pricing");
  revalidatePath("/customers");
  revalidatePath("/dashboard");
  redirect("/pricing?message=quotation_status_updated");
}

export async function convertQuotationToOrder(formData: FormData) {
  const canWriteOrders = await hasPermission("orders.write");

  if (!canWriteOrders) {
    redirect("/pricing?error=not_allowed_to_convert");
  }

  if (!isSupabaseConfigured()) {
    redirect("/pricing?error=preview_mode");
  }

  const quotationId = String(formData.get("quotationId") ?? "").trim();
  if (!quotationId) {
    redirect("/pricing?error=missing_fields");
  }

  const supabase = await createClient();
  const { data: quotation, error: fetchError } = await supabase
    .from("quotations")
    .select("id, quote_no, customer_id, title, service_date, subtotal_jpy, total_cost_jpy, notes")
    .eq("id", quotationId)
    .maybeSingle();
  const quotationRow = quotation as {
    id: string;
    quote_no: string;
    customer_id: string;
    title: string;
    service_date: string | null;
    subtotal_jpy: number | null;
    total_cost_jpy: number | null;
    notes: string | null;
  } | null;

  if (fetchError || !quotationRow) {
    console.error("[pricing:convert-fetch-quote]", fetchError?.message ?? "quotation not found");
    redirect(`/pricing?error=convert_failed&detail=${encodeURIComponent(fetchError?.message ?? "找不到要转单的报价。")}`);
  }

  const { data: existingOrder, error: existingOrderError } = await supabase
    .from("orders")
    .select("id, order_no")
    .eq("quote_id", quotationId)
    .maybeSingle();
  const existingOrderRow = existingOrder as { id: string; order_no: string } | null;

  if (existingOrderError) {
    console.error("[pricing:convert-fetch-order]", existingOrderError.message);
    redirect(`/pricing?error=convert_failed&detail=${encodeURIComponent(existingOrderError.message)}`);
  }

  if (existingOrderRow) {
    redirect(`/orders?message=order_created&orderNo=${encodeURIComponent(existingOrderRow.order_no)}&focus=${existingOrderRow.id}&detail=${encodeURIComponent("这份报价已经转成订单，已为你定位到原订单。")}`);
  }

  const orderNo = (await generateOrderNos(supabase, 1))[0];
  const quoteNotes = String(quotationRow.notes ?? "").trim();
  const orderNotes = [`[quote-converted][${quotationRow.quote_no}]`];
  if (quoteNotes) {
    orderNotes.push(quoteNotes);
  }

  const { data: insertedOrder, error: insertError } = await supabase
    .from("orders")
    .insert({
      order_no: orderNo,
      customer_id: quotationRow.customer_id,
      quote_id: quotationRow.id,
      title: quotationRow.title,
      service_date: quotationRow.service_date,
      status: "pending_confirmation",
      revenue_jpy: Number(quotationRow.subtotal_jpy ?? 0),
      total_cost_jpy: Number(quotationRow.total_cost_jpy ?? 0),
      notes: orderNotes.join("\n"),
    } as never)
    .select("id")
    .single();
  const insertedOrderRow = insertedOrder as { id: string } | null;

  if (insertError || !insertedOrderRow) {
    console.error("[pricing:convert-insert-order]", insertError?.message ?? "order insert failed");
    redirect(`/pricing?error=convert_failed&detail=${encodeURIComponent(insertError?.message ?? "报价转订单失败。")}`);
  }

  const { error: quotationUpdateError } = await supabase
    .from("quotations")
    .update({ status: "accepted" } as never)
    .eq("id", quotationRow.id);

  if (quotationUpdateError) {
    console.error("[pricing:convert-update-quote]", quotationUpdateError.message);
    redirect(`/pricing?error=convert_failed&detail=${encodeURIComponent(quotationUpdateError.message)}`);
  }

  revalidatePath("/pricing");
  revalidatePath("/orders");
  revalidatePath("/customers");
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  revalidatePath("/profit");
  redirect(`/orders?message=order_created&orderNo=${encodeURIComponent(orderNo)}&focus=${insertedOrderRow.id}&detail=${encodeURIComponent("已从报价单自动生成订单，并带入客户、标题、服务日期与金额。")}`);
}

function readQuotationPayload(formData: FormData):
  | Database["public"]["Tables"]["quotations"]["Insert"]
  | Database["public"]["Tables"]["quotations"]["Update"]
  | { error: string } {
  const customerId = String(formData.get("customerId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const serviceDate = String(formData.get("serviceDate") ?? "").trim();
  const validUntil = String(formData.get("validUntil") ?? "").trim();
  const status = String(formData.get("status") ?? "draft").trim();
  const subtotalInput = String(formData.get("subtotalJpy") ?? "").trim();
  const totalCostInput = String(formData.get("totalCostJpy") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!customerId || !title || !status) {
    return { error: "missing_fields" };
  }

  if (!VALID_QUOTE_STATUSES.includes(status as (typeof VALID_QUOTE_STATUSES)[number])) {
    return { error: "invalid_status" };
  }

  const subtotalJpy = subtotalInput ? Number(subtotalInput) : 0;
  const totalCostJpy = totalCostInput ? Number(totalCostInput) : 0;

  if (Number.isNaN(subtotalJpy) || subtotalJpy < 0 || Number.isNaN(totalCostJpy) || totalCostJpy < 0) {
    return { error: "invalid_amount" };
  }

  return {
    customer_id: customerId,
    title,
    service_date: serviceDate || null,
    valid_until: validUntil || null,
    status: status as Database["public"]["Tables"]["quotations"]["Insert"]["status"],
    subtotal_jpy: subtotalJpy,
    total_cost_jpy: totalCostJpy,
    notes: notes || null,
  };
}

async function generateQuoteNo(supabase: Awaited<ReturnType<typeof createClient>>) {
  const now = new Date();
  const prefix = `Q-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const { data } = await supabase.from("quotations").select("quote_no").ilike("quote_no", `${prefix}%`);
  const nextNumber = String((data?.length ?? 0) + 1).padStart(2, "0");
  return `${prefix}-${nextNumber}`;
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
