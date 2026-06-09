import type { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/types/database";

type AuditLogInput = {
  actorId: string | null | undefined;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
  metadata?: Json;
};

export async function writeAuditLog(supabase: Awaited<ReturnType<typeof createClient>>, input: AuditLogInput) {
  if (!input.actorId) {
    return;
  }

  const { error } = await supabase.from("audit_logs").insert({
    actor_id: input.actorId,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    summary: input.summary,
    metadata: input.metadata ?? {},
  } as never);

  if (error) {
    console.error("[audit:write]", error.message);
  }
}
