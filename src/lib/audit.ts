import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/rate-limit";

export async function audit(opts: {
  actorId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  let ip: string | null = null;
  try {
    ip = await clientIp();
  } catch {
    ip = null;
  }
  await db.adminAuditLog.create({
    data: {
      actorId: opts.actorId,
      action: opts.action,
      entityType: opts.entityType,
      entityId: opts.entityId ?? null,
      summary: opts.summary,
      metadata: opts.metadata,
      ip,
    },
  });
}
