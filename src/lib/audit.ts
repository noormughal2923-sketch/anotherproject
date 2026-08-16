import "server-only";

import { prisma } from "@/lib/prisma";
import { clientIp } from "@/lib/rate-limit";

export async function logAudit(params: {
  adminId?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  reason?: string;
}): Promise<void> {
  const ip = await clientIp();
  try {
    await prisma.auditLog.create({
      data: {
        adminId: params.adminId ?? null,
        action: params.action,
        targetType: params.targetType ?? null,
        targetId: params.targetId ?? null,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        reason: params.reason ?? null,
        ipAddress: ip,
      },
    });
  } catch (err) {
    // Audit logging should never break the primary operation
    console.error("[AuditLog] Failed to write audit log:", err);
  }
}
