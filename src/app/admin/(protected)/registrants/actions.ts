"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { AUDIT_ACTIONS, ADMIN_BASE_PATH } from "@/lib/constants";

export async function deleteRegistrantAction(userId: string): Promise<{ success: boolean; message: string }> {
  try {
    const admin = await requireAdmin();

    if (!userId || typeof userId !== "string") {
      return { success: false, message: "Invalid registrant ID provided." };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      return { success: false, message: "Registrant not found." };
    }

    // Delete user (Prisma cascade onDelete deletes associated registrations and attendance records)
    await prisma.user.delete({
      where: { id: userId },
    });

    await logAudit({
      adminId: admin.id,
      action: AUDIT_ACTIONS.REGISTRANT_DELETE,
      targetType: "User",
      targetId: userId,
      reason: `Deleted registrant ${user.email} (${user.name ?? "unnamed"})`,
      metadata: { email: user.email, name: user.name },
    });

    revalidatePath(`${ADMIN_BASE_PATH}/registrants`);
    revalidatePath("/admin/registrants");
    revalidatePath(ADMIN_BASE_PATH);
    revalidatePath("/admin");

    return { success: true, message: `Registrant ${user.email} successfully deleted.` };
  } catch (error) {
    console.error("[deleteRegistrantAction] Error:", error);
    return { success: false, message: "Failed to delete registrant. Please try again." };
  }
}

export async function deleteAllRegistrantsAction(): Promise<{ success: boolean; message: string }> {
  try {
    const admin = await requireAdmin();

    const totalCount = await prisma.user.count();

    // Delete all attendance, registrations, and users in a transaction
    await prisma.$transaction([
      prisma.attendance.deleteMany({}),
      prisma.registration.deleteMany({}),
      prisma.user.deleteMany({}),
    ]);

    await logAudit({
      adminId: admin.id,
      action: AUDIT_ACTIONS.REGISTRANT_DELETE_ALL,
      targetType: "User",
      reason: `Bulk deleted all ${totalCount} registrants, registrations, and attendance records`,
      metadata: { deletedCount: totalCount },
    });

    revalidatePath(`${ADMIN_BASE_PATH}/registrants`);
    revalidatePath("/admin/registrants");
    revalidatePath(ADMIN_BASE_PATH);
    revalidatePath("/admin");

    return { success: true, message: `Successfully deleted all ${totalCount} registrants.` };
  } catch (error) {
    console.error("[deleteAllRegistrantsAction] Error:", error);
    return { success: false, message: "Failed to delete all registrants. Please try again." };
  }
}
