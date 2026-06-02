"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { hasPermission } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";

export async function createCustomer(formData: FormData) {
  const canWriteCustomers = await hasPermission("customers.write");

  if (!canWriteCustomers) {
    redirect("/customers?error=not_allowed");
  }

  if (!isSupabaseConfigured()) {
    redirect("/customers?error=preview_mode");
  }

  const payload = readCustomerPayload(formData);
  if ("error" in payload) {
    redirect(`/customers?error=${payload.error}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("customers").insert(payload as never);

  if (error) {
    console.error("[customers:create]", error.message);
    redirect(`/customers?error=create_failed&detail=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/customers");
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  redirect("/customers?message=customer_created");
}

export async function updateCustomerBasics(formData: FormData) {
  const canWriteCustomers = await hasPermission("customers.write");

  if (!canWriteCustomers) {
    redirect("/customers?error=not_allowed");
  }

  if (!isSupabaseConfigured()) {
    redirect("/customers?error=preview_mode");
  }

  const customerId = String(formData.get("customerId") ?? "").trim();
  if (!customerId) {
    redirect("/customers?error=missing_fields");
  }

  const payload = readCustomerPayload(formData);
  if ("error" in payload) {
    redirect(`/customers?error=${payload.error}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("customers").update(payload as never).eq("id", customerId);

  if (error) {
    console.error("[customers:update-basics]", error.message);
    redirect(`/customers?error=update_failed&detail=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/customers");
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  redirect("/customers?message=customer_updated");
}

export async function updateCustomerStatus(formData: FormData) {
  const canWriteCustomers = await hasPermission("customers.write");

  if (!canWriteCustomers) {
    redirect("/customers?error=not_allowed");
  }

  if (!isSupabaseConfigured()) {
    redirect("/customers?error=preview_mode");
  }

  const customerId = String(formData.get("customerId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();

  if (!customerId || !status) {
    redirect("/customers?error=missing_fields");
  }

  if (!["active", "nurturing", "settled", "inactive"].includes(status)) {
    redirect("/customers?error=invalid_status");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("customers")
    .update({ status: status as Database["public"]["Tables"]["customers"]["Update"]["status"] } as never)
    .eq("id", customerId);

  if (error) {
    console.error("[customers:update-status]", error.message);
    redirect(`/customers?error=status_update_failed&detail=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/customers");
  revalidatePath("/dashboard");
  redirect("/customers?message=customer_status_updated");
}

export async function appendCustomerFollowLog(formData: FormData) {
  const canWriteCustomers = await hasPermission("customers.write");

  if (!canWriteCustomers) {
    redirect("/customers?error=not_allowed");
  }

  if (!isSupabaseConfigured()) {
    redirect("/customers?error=preview_mode");
  }

  const customerId = String(formData.get("customerId") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  if (!customerId || !note) {
    redirect("/customers?error=missing_follow_fields");
  }

  const supabase = await createClient();
  const { data: customer, error: fetchError } = await supabase.from("customers").select("notes").eq("id", customerId).maybeSingle();

  if (fetchError) {
    console.error("[customers:fetch-follow]", fetchError.message);
    redirect(`/customers?error=follow_record_failed&detail=${encodeURIComponent(fetchError.message)}`);
  }

  const currentDate = new Date().toISOString().slice(0, 10);
  const newLine = `[follow][${currentDate}] ${note}`;
  const existingNotes = String((customer as { notes: string | null } | null)?.notes ?? "").trim();
  const mergedNotes = existingNotes ? `${newLine}\n${existingNotes}` : newLine;

  const { error } = await supabase.from("customers").update({ notes: mergedNotes } as never).eq("id", customerId);

  if (error) {
    console.error("[customers:append-follow]", error.message);
    redirect(`/customers?error=follow_record_failed&detail=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/customers");
  revalidatePath("/dashboard");
  redirect("/customers?message=customer_follow_recorded");
}

function readCustomerPayload(formData: FormData):
  | Database["public"]["Tables"]["customers"]["Insert"]
  | Database["public"]["Tables"]["customers"]["Update"]
  | { error: string } {
  const companyName = String(formData.get("companyName") ?? "").trim();
  const contactName = String(formData.get("contactName") ?? "").trim();
  const contactEmail = String(formData.get("contactEmail") ?? "").trim();
  const contactPhone = String(formData.get("contactPhone") ?? "").trim();
  const marketSegment = String(formData.get("marketSegment") ?? "").trim();
  const billingTerms = String(formData.get("billingTerms") ?? "").trim();
  const creditLimitInput = String(formData.get("creditLimitJpy") ?? "").trim();
  const status = String(formData.get("status") ?? "active").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!companyName || !contactName || !marketSegment || !status) {
    return { error: "missing_fields" };
  }

  const creditLimitJpy = creditLimitInput ? Number(creditLimitInput) : 0;
  if (Number.isNaN(creditLimitJpy) || creditLimitJpy < 0) {
    return { error: "invalid_credit_limit" };
  }

  if (!["active", "nurturing", "settled", "inactive"].includes(status)) {
    return { error: "invalid_status" };
  }

  return {
    company_name: companyName,
    contact_name: contactName,
    contact_email: contactEmail || null,
    contact_phone: contactPhone || null,
    market_segment: marketSegment,
    billing_terms: billingTerms || null,
    credit_limit_jpy: creditLimitJpy,
    status: status as Database["public"]["Tables"]["customers"]["Insert"]["status"],
    notes: notes || null,
  };
}
