"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { AUDIT_ACTIONS, ADMIN_BASE_PATH } from "@/lib/constants";

export async function deleteAllAuditLogsAction(): Promise<{ success: boolean; message: string }> {
  try {
    const admin = await requireAdmin();

    const count = await prisma.auditLog.count();

    // Delete all audit logs
    await prisma.auditLog.deleteMany({});

    // Record that audit logs were cleared
    await logAudit({
      adminId: admin.id,
      action: AUDIT_ACTIONS.AUDIT_CLEAR,
      targetType: "AuditLog",
      reason: `Cleared all ${count} audit log records`,
      metadata: { previousLogCount: count },
    });

    revalidatePath(`${ADMIN_BASE_PATH}/audit-logs`);
    revalidatePath("/admin/audit-logs");
    revalidatePath(ADMIN_BASE_PATH);
    revalidatePath("/admin");

    return { success: true, message: `Successfully cleared all ${count} audit log entries.` };
  } catch (error) {
    console.error("[deleteAllAuditLogsAction] Error:", error);
    return { success: false, message: "Failed to clear audit logs. Please try again." };
  }
}
