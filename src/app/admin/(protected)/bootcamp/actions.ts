"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { ADMIN_BASE_PATH, AUDIT_ACTIONS } from "@/lib/constants";

export type BootcampActionResult = {
  success?: boolean;
  error?: string;
  message?: string;
};

const BOOTCAMP_TAG = "cgs-bootcamp-2026";

function revalidateAll() {
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/sessions");
  revalidatePath("/attendance");
  revalidatePath(`${ADMIN_BASE_PATH}/bootcamp`);
  revalidatePath(`${ADMIN_BASE_PATH}/certificates`);
  revalidatePath(`${ADMIN_BASE_PATH}/sessions`);
  revalidatePath(`${ADMIN_BASE_PATH}/attendance`);
  revalidatePath(ADMIN_BASE_PATH);
  revalidatePath("/admin/bootcamp");
  revalidatePath("/admin/certificates");
  revalidatePath("/admin");
}

/**
 * Start a bootcamp session (set it LIVE with attendance open).
 * Atomically closes any other active bootcamp session first.
 */
export async function startBootcampSessionAction(
  sessionNumber: number,
  durationMinutes: number = 120
): Promise<BootcampActionResult> {
  const admin = await requireAdmin();

  if (![1, 2, 3].includes(sessionNumber)) {
    return { error: "Invalid session number. Must be 1, 2, or 3." };
  }

  const session = await prisma.session.findFirst({
    where: { bootcampTag: BOOTCAMP_TAG, sessionNumber },
  });

  if (!session) {
    return { error: `Bootcamp session ${sessionNumber} not found.` };
  }

  const now = new Date();
  const endTime = new Date(now.getTime() + durationMinutes * 60 * 1000);

  try {
    await prisma.$transaction(async (tx) => {
      // Close ALL other bootcamp sessions first (mutual exclusivity)
      await tx.session.updateMany({
        where: {
          bootcampTag: BOOTCAMP_TAG,
          sessionNumber: { not: sessionNumber },
          attendanceOpen: true,
        },
        data: {
          attendanceOpen: false,
          status: "COMPLETED",
        },
      });

      // Activate this session
      await tx.session.update({
        where: { id: session.id },
        data: {
          startTime: now,
          endTime,
          status: "LIVE",
          attendanceOpen: true,
          attendanceStartTime: now,
          attendanceEndTime: endTime,
          isActive: true,
        },
      });
    });

    await logAudit({
      adminId: admin.id,
      action: AUDIT_ACTIONS.SESSION_UPDATE,
      targetType: "Session",
      targetId: session.id,
      metadata: {
        actionType: "bootcamp_session_start",
        sessionNumber,
        durationMinutes,
        startTime: now.toISOString(),
        endTime: endTime.toISOString(),
      },
    });

    revalidateAll();
    return {
      success: true,
      message: `Session ${sessionNumber} is now LIVE with attendance open for ${durationMinutes} minutes.`,
    };
  } catch (err) {
    console.error("[startBootcampSessionAction] Error:", err);
    return { error: "Failed to start bootcamp session." };
  }
}

/**
 * End a bootcamp session (close attendance, mark COMPLETED).
 * Preserves all existing attendance records.
 */
export async function endBootcampSessionAction(
  sessionNumber: number
): Promise<BootcampActionResult> {
  const admin = await requireAdmin();

  const session = await prisma.session.findFirst({
    where: { bootcampTag: BOOTCAMP_TAG, sessionNumber },
  });

  if (!session) {
    return { error: `Bootcamp session ${sessionNumber} not found.` };
  }

  try {
    await prisma.session.update({
      where: { id: session.id },
      data: {
        attendanceOpen: false,
        status: "COMPLETED",
      },
    });

    await logAudit({
      adminId: admin.id,
      action: AUDIT_ACTIONS.SESSION_UPDATE,
      targetType: "Session",
      targetId: session.id,
      metadata: {
        actionType: "bootcamp_session_end",
        sessionNumber,
      },
    });

    revalidateAll();
    return {
      success: true,
      message: `Session ${sessionNumber} has been ended. Attendance is now closed.`,
    };
  } catch (err) {
    console.error("[endBootcampSessionAction] Error:", err);
    return { error: "Failed to end bootcamp session." };
  }
}

/**
 * Set a specific session as the active one (mutual exclusivity).
 */
export async function setActiveBootcampSessionAction(
  sessionNumber: number
): Promise<BootcampActionResult> {
  const admin = await requireAdmin();

  if (![1, 2, 3].includes(sessionNumber)) {
    return { error: "Invalid session number." };
  }

  const session = await prisma.session.findFirst({
    where: { bootcampTag: BOOTCAMP_TAG, sessionNumber },
  });

  if (!session) {
    return { error: `Bootcamp session ${sessionNumber} not found.` };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Close all other bootcamp sessions
      await tx.session.updateMany({
        where: {
          bootcampTag: BOOTCAMP_TAG,
          sessionNumber: { not: sessionNumber },
        },
        data: {
          attendanceOpen: false,
        },
      });

      // Set this session as active with attendance open
      await tx.session.update({
        where: { id: session.id },
        data: {
          attendanceOpen: true,
          status: "LIVE",
          isActive: true,
        },
      });
    });

    await logAudit({
      adminId: admin.id,
      action: AUDIT_ACTIONS.SESSION_UPDATE,
      targetType: "Session",
      targetId: session.id,
      metadata: {
        actionType: "set_active_bootcamp_session",
        sessionNumber,
      },
    });

    revalidateAll();
    return {
      success: true,
      message: `Session ${sessionNumber} is now the active session.`,
    };
  } catch (err) {
    console.error("[setActiveBootcampSessionAction] Error:", err);
    return { error: "Failed to set active session." };
  }
}

/**
 * Issue a single certificate (with backend eligibility check).
 */
export async function issueSingleCertificateAction(
  userId: string
): Promise<BootcampActionResult> {
  const admin = await requireAdmin();

  const { issueCertificate } = await import("@/lib/certificates");
  const result = await issueCertificate(userId);

  if (!result.success) {
    return { error: result.error };
  }

  await logAudit({
    adminId: admin.id,
    action: "certificate.issue",
    targetType: "Certificate",
    targetId: userId,
    metadata: {
      certificateNumber: result.certificateNumber,
    },
  });

  revalidateAll();
  return {
    success: true,
    message: `Certificate ${result.certificateNumber} issued successfully.`,
  };
}

/**
 * Issue certificates for ALL eligible participants.
 */
export async function issueAllCertificatesAction(): Promise<BootcampActionResult> {
  const admin = await requireAdmin();

  const { issueAllEligibleCertificates } = await import("@/lib/certificates");
  const result = await issueAllEligibleCertificates();

  await logAudit({
    adminId: admin.id,
    action: "certificate.bulk_issue",
    targetType: "Certificate",
    metadata: {
      issued: result.issued,
      skipped: result.skipped,
      errors: result.errors,
    },
  });

  revalidateAll();
  return {
    success: true,
    message: `Certificates issued: ${result.issued} new, ${result.skipped} already issued, ${result.errors} errors.`,
  };
}
