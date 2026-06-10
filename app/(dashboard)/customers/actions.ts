"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { writeAuditLog } from "@/lib/audit/log";
import { getCurrentUser, hasPermission } from "@/lib/auth/session";
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
  const { data, error } = await supabase.from("customers").insert(payload as never).select("id").single();

  if (error || !data) {
    const message = error?.message ?? "客户创建后没有返回档案编号。";
    console.error("[customers:create]", message);
    redirect(`/customers?error=create_failed&detail=${encodeURIComponent(message)}`);
  }

  const currentUser = await getCurrentUser();
  await writeAuditLog(supabase, {
    actorId: currentUser?.id,
    action: "create",
    entityType: "customer",
    entityId: (data as { id: string }).id,
    summary: `建立客户档案：${String(payload.company_name ?? "")}`,
  });

  revalidatePath("/customers");
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  redirect(`/customers/${(data as { id: string }).id}?message=customer_created`);
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
    redirect(`/customers/${customerId}?error=${payload.error}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("customers").update(payload as never).eq("id", customerId);

  if (error) {
    console.error("[customers:update-basics]", error.message);
    redirect(`/customers/${customerId}?error=update_failed&detail=${encodeURIComponent(error.message)}`);
  }

  const currentUser = await getCurrentUser();
  await writeAuditLog(supabase, {
    actorId: currentUser?.id,
    action: "update",
    entityType: "customer",
    entityId: customerId,
    summary: `更新客户档案：${String(payload.company_name ?? "")}`,
  });

  revalidatePath("/customers");
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  redirect(`/customers/${customerId}?message=customer_updated`);
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
    redirect(`/customers/${customerId}?error=invalid_status`);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("customers")
    .update({ status: status as Database["public"]["Tables"]["customers"]["Update"]["status"] } as never)
    .eq("id", customerId);

  if (error) {
    console.error("[customers:update-status]", error.message);
    redirect(`/customers/${customerId}?error=status_update_failed&detail=${encodeURIComponent(error.message)}`);
  }

  const currentUser = await getCurrentUser();
  await writeAuditLog(supabase, {
    actorId: currentUser?.id,
    action: "update",
    entityType: "customer",
    entityId: customerId,
    summary: `更新客户合作状态为 ${status}`,
    metadata: { status },
  });

  revalidatePath("/customers");
  revalidatePath("/dashboard");
  redirect(`/customers/${customerId}?message=customer_status_updated`);
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
    redirect(`/customers/${customerId}?error=missing_follow_fields`);
  }

  const supabase = await createClient();
  const { data: customer, error: fetchError } = await supabase.from("customers").select("notes").eq("id", customerId).maybeSingle();

  if (fetchError) {
    console.error("[customers:fetch-follow]", fetchError.message);
    redirect(`/customers/${customerId}?error=follow_record_failed&detail=${encodeURIComponent(fetchError.message)}`);
  }

  const currentDate = new Date().toISOString().slice(0, 10);
  const newLine = `[follow][${currentDate}] ${note}`;
  const existingNotes = String((customer as { notes: string | null } | null)?.notes ?? "").trim();
  const mergedNotes = existingNotes ? `${newLine}\n${existingNotes}` : newLine;

  const { error } = await supabase.from("customers").update({ notes: mergedNotes } as never).eq("id", customerId);

  if (error) {
    console.error("[customers:append-follow]", error.message);
    redirect(`/customers/${customerId}?error=follow_record_failed&detail=${encodeURIComponent(error.message)}`);
  }

  const currentUser = await getCurrentUser();
  await writeAuditLog(supabase, {
    actorId: currentUser?.id,
    action: "update",
    entityType: "customer",
    entityId: customerId,
    summary: "新增客户跟进记录",
  });

  revalidatePath("/customers");
  revalidatePath("/dashboard");
  redirect(`/customers/${customerId}?message=customer_follow_recorded`);
}

export async function createCustomerCollaborationTask(formData: FormData) {
  const canWriteCustomers = await hasPermission("customers.write");
  const customerId = String(formData.get("customerId") ?? "").trim();

  if (!canWriteCustomers) redirect("/customers?error=not_allowed");
  if (!isSupabaseConfigured()) redirect("/customers?error=preview_mode");

  const payload = readCollaborationTaskPayload(formData);
  if ("error" in payload || !customerId) {
    redirect(`/customers/${customerId}?error=${"error" in payload ? payload.error : "missing_task_fields"}`);
  }

  const supabase = await createClient();
  const currentUser = await getCurrentUser();
  const taskPayload = applyTaskCompletionFields(payload, currentUser?.id);
  const { data, error } = await supabase
    .from("customer_collaboration_tasks")
    .insert({ ...taskPayload, customer_id: customerId } as never)
    .select("id")
    .single();

  if (error) {
    console.error("[customers:create-collaboration-task]", error.message);
    redirect(`/customers/${customerId}?error=task_create_failed&detail=${encodeURIComponent(error.message)}`);
  }

  await writeAuditLog(supabase, {
    actorId: currentUser?.id,
    action: "create",
    entityType: "customer_collaboration_task",
    entityId: (data as { id: string }).id,
    summary: `新增客户合作事项：${String(payload.title ?? "")}`,
    metadata: {
      customerId,
      assigneeId: payload.assignee_profile_id ?? null,
      priority: payload.priority ?? "normal",
      dueOn: payload.due_on ?? null,
    },
  });

  revalidateCustomer(customerId);
  redirect(`/customers/${customerId}?message=task_created`);
}

export async function updateCustomerCollaborationTask(formData: FormData) {
  const canWriteCustomers = await hasPermission("customers.write");
  const customerId = String(formData.get("customerId") ?? "").trim();
  const taskId = String(formData.get("taskId") ?? "").trim();

  if (!canWriteCustomers) redirect("/customers?error=not_allowed");
  if (!isSupabaseConfigured()) redirect("/customers?error=preview_mode");

  const payload = readCollaborationTaskPayload(formData);
  if ("error" in payload || !customerId || !taskId) {
    redirect(`/customers/${customerId}?error=${"error" in payload ? payload.error : "missing_task_fields"}`);
  }

  const supabase = await createClient();
  const currentUser = await getCurrentUser();
  const { data: existingTask } = await supabase
    .from("customer_collaboration_tasks")
    .select("status,completed_at,completed_by")
    .eq("id", taskId)
    .eq("customer_id", customerId)
    .maybeSingle();
  const taskPayload = applyTaskCompletionFields(
    payload,
    currentUser?.id,
    existingTask as { status: string; completed_at: string | null; completed_by: string | null } | null,
  );
  const { error } = await supabase.from("customer_collaboration_tasks").update(taskPayload as never).eq("id", taskId).eq("customer_id", customerId);

  if (error) {
    console.error("[customers:update-collaboration-task]", error.message);
    redirect(`/customers/${customerId}?error=task_update_failed&detail=${encodeURIComponent(error.message)}`);
  }

  await writeAuditLog(supabase, {
    actorId: currentUser?.id,
    action: "update",
    entityType: "customer_collaboration_task",
    entityId: taskId,
    summary: `更新客户合作事项：${String(payload.title ?? "")}`,
    metadata: {
      customerId,
      assigneeId: payload.assignee_profile_id ?? null,
      status: payload.status ?? "todo",
      priority: payload.priority ?? "normal",
    },
  });

  revalidateCustomer(customerId);
  redirect(`/customers/${customerId}?message=task_updated`);
}

export async function deleteCustomerCollaborationTask(formData: FormData) {
  const canWriteCustomers = await hasPermission("customers.write");
  const customerId = String(formData.get("customerId") ?? "").trim();
  const taskId = String(formData.get("taskId") ?? "").trim();

  if (!canWriteCustomers) redirect("/customers?error=not_allowed");
  if (!isSupabaseConfigured()) redirect("/customers?error=preview_mode");
  if (!customerId || !taskId) redirect(`/customers/${customerId}?error=missing_task_fields`);

  const supabase = await createClient();
  const { error } = await supabase.from("customer_collaboration_tasks").delete().eq("id", taskId).eq("customer_id", customerId);

  if (error) {
    console.error("[customers:delete-collaboration-task]", error.message);
    redirect(`/customers/${customerId}?error=task_delete_failed&detail=${encodeURIComponent(error.message)}`);
  }

  const currentUser = await getCurrentUser();
  await writeAuditLog(supabase, {
    actorId: currentUser?.id,
    action: "delete",
    entityType: "customer_collaboration_task",
    entityId: taskId,
    summary: "删除客户合作事项",
    metadata: { customerId },
  });

  revalidateCustomer(customerId);
  redirect(`/customers/${customerId}?message=task_deleted`);
}

function readCustomerPayload(formData: FormData):
  | Database["public"]["Tables"]["customers"]["Insert"]
  | Database["public"]["Tables"]["customers"]["Update"]
  | { error: string } {
  const companyName = String(formData.get("companyName") ?? "").trim();
  const customerType = String(formData.get("customerType") ?? "long_term").trim();
  const companyProfile = String(formData.get("companyProfile") ?? "").trim();
  const contactName = String(formData.get("contactName") ?? "").trim();
  const contactEmail = String(formData.get("contactEmail") ?? "").trim();
  const contactPhone = String(formData.get("contactPhone") ?? "").trim();
  const wechatId = String(formData.get("wechatId") ?? "").trim();
  const lineId = String(formData.get("lineId") ?? "").trim();
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

  if (!["long_term", "short_term", "one_time"].includes(customerType)) {
    return { error: "invalid_customer_type" };
  }

  return {
    company_name: companyName,
    customer_type: customerType as Database["public"]["Tables"]["customers"]["Insert"]["customer_type"],
    company_profile: companyProfile || null,
    contact_name: contactName,
    contact_email: contactEmail || null,
    contact_phone: contactPhone || null,
    wechat_id: wechatId || null,
    line_id: lineId || null,
    market_segment: marketSegment,
    billing_terms: billingTerms || null,
    credit_limit_jpy: creditLimitJpy,
    status: status as Database["public"]["Tables"]["customers"]["Insert"]["status"],
    notes: notes || null,
  };
}

function readCollaborationTaskPayload(formData: FormData):
  | Database["public"]["Tables"]["customer_collaboration_tasks"]["Insert"]
  | Database["public"]["Tables"]["customer_collaboration_tasks"]["Update"]
  | { error: string } {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const status = String(formData.get("status") ?? "todo").trim();
  const priority = String(formData.get("priority") ?? "normal").trim();
  const dueOn = String(formData.get("dueOn") ?? "").trim();
  const assigneeProfileId = String(formData.get("assigneeProfileId") ?? "").trim();

  if (!title) return { error: "missing_task_fields" };
  if (!["todo", "in_progress", "waiting", "completed", "cancelled"].includes(status)) return { error: "invalid_task_status" };
  if (!["low", "normal", "high", "urgent"].includes(priority)) return { error: "invalid_task_priority" };

  return {
    customer_id: String(formData.get("customerId") ?? "").trim(),
    assignee_profile_id: assigneeProfileId || null,
    title,
    description: description || null,
    status: status as Database["public"]["Tables"]["customer_collaboration_tasks"]["Insert"]["status"],
    priority: priority as Database["public"]["Tables"]["customer_collaboration_tasks"]["Insert"]["priority"],
    due_on: dueOn || null,
  };
}

function applyTaskCompletionFields(
  payload: Database["public"]["Tables"]["customer_collaboration_tasks"]["Insert"] | Database["public"]["Tables"]["customer_collaboration_tasks"]["Update"],
  actorId: string | undefined,
  existingTask?: { status: string; completed_at: string | null; completed_by: string | null } | null,
) {
  if (payload.status === "completed") {
    return {
      ...payload,
      completed_at: existingTask?.status === "completed" && existingTask.completed_at ? existingTask.completed_at : new Date().toISOString(),
      completed_by: existingTask?.status === "completed" && existingTask.completed_by ? existingTask.completed_by : actorId ?? null,
    };
  }

  return {
    ...payload,
    completed_at: null,
    completed_by: null,
  };
}

function revalidateCustomer(customerId: string) {
  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);
  revalidatePath("/dashboard");
  revalidatePath("/orders");
  revalidatePath("/calendar");
}
