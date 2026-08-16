"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { parseZonedLocalInput } from "@/lib/datetime";
import { logAudit } from "@/lib/audit";
import { ADMIN_BASE_PATH, AUDIT_ACTIONS } from "@/lib/constants";

export type TimeActionResult = {
  success?: boolean;
  error?: string;
  message?: string;
};

function revalidateAll() {
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/sessions");
  revalidatePath("/attendance");
  revalidatePath(`${ADMIN_BASE_PATH}/time-management`);
  revalidatePath(`${ADMIN_BASE_PATH}/sessions`);
  revalidatePath(`${ADMIN_BASE_PATH}/speakers`);
  revalidatePath(`${ADMIN_BASE_PATH}/attendance`);
  revalidatePath(ADMIN_BASE_PATH);
  revalidatePath("/admin/time-management");
  revalidatePath("/admin/sessions");
  revalidatePath("/admin");
}

/**
 * Update complete timing, attendance window, and speaker assignments for a session.
 */
export async function updateSessionTimingAction(payload: {
  sessionId: string;
  startTimeStr: string; // e.g. "2026-08-16T20:00"
  endTimeStr: string; // e.g. "2026-08-16T21:30"
  timezone?: string;
  attendanceMode: "session_bound" | "custom" | "always_open" | "closed";
  attendanceStartTimeStr?: string;
  attendanceEndTimeStr?: string;
  attendanceOpen?: boolean;
  registrationOpen?: boolean;
  speakerIds?: string[];
  status?: string;
}): Promise<TimeActionResult> {
  const admin = await requireAdmin();
  const { sessionId } = payload;

  if (!sessionId) {
    return { error: "Session ID is required." };
  }

  const existing = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { speakers: true },
  });

  if (!existing) {
    return { error: "Session not found." };
  }

  const settings = await getSettings();
  const effectiveTz = payload.timezone || existing.timezone || settings.timezone || "Asia/Karachi";

  // Parse start and end times in the specified timezone
  const startTime = parseZonedLocalInput(payload.startTimeStr, effectiveTz);
  const endTime = parseZonedLocalInput(payload.endTimeStr, effectiveTz);

  if (!startTime || !endTime) {
    return { error: "Invalid date/time format. Please check the session start and end times." };
  }

  if (endTime.getTime() <= startTime.getTime()) {
    return { error: "Session End Time must be strictly after the Start Time." };
  }

  let attendanceStartTime: Date | null = null;
  let attendanceEndTime: Date | null = null;
  let attendanceOpen = payload.attendanceOpen ?? existing.attendanceOpen;

  if (payload.attendanceMode === "session_bound") {
    attendanceStartTime = startTime;
    attendanceEndTime = endTime;
  } else if (payload.attendanceMode === "custom") {
    if (payload.attendanceStartTimeStr && payload.attendanceEndTimeStr) {
      attendanceStartTime = parseZonedLocalInput(payload.attendanceStartTimeStr, effectiveTz);
      attendanceEndTime = parseZonedLocalInput(payload.attendanceEndTimeStr, effectiveTz);

      if (!attendanceStartTime || !attendanceEndTime) {
        return { error: "Invalid attendance window date/time values." };
      }

      if (attendanceEndTime.getTime() <= attendanceStartTime.getTime()) {
        return { error: "Attendance Window End Time must be after Attendance Start Time." };
      }
    }
  } else if (payload.attendanceMode === "closed") {
    attendanceOpen = false;
    attendanceStartTime = null;
    attendanceEndTime = null;
  }

  const status = payload.status || (Date.now() >= startTime.getTime() && Date.now() <= endTime.getTime()
    ? "LIVE"
    : Date.now() < startTime.getTime()
    ? "UPCOMING"
    : "COMPLETED");

  const speakerIds = payload.speakerIds ?? existing.speakers.map((s) => s.speakerId);

  try {
    await prisma.$transaction(async (tx) => {
      // Update session timing and fields
      await tx.session.update({
        where: { id: sessionId },
        data: {
          startTime,
          endTime,
          timezone: effectiveTz,
          status,
          attendanceStartTime,
          attendanceEndTime,
          attendanceOpen,
          registrationOpen: payload.registrationOpen ?? existing.registrationOpen,
          speakers: {
            deleteMany: {},
            create: speakerIds.map((speakerId, i) => ({
              speakerId,
              sortOrder: i,
            })),
          },
        },
      });

      // Audit log
      await logAudit({
        adminId: admin.id,
        action: AUDIT_ACTIONS.SESSION_UPDATE,
        targetType: "Session",
        targetId: sessionId,
        metadata: {
          actionType: "timing_update",
          previousStartTime: existing.startTime.toISOString(),
          previousEndTime: existing.endTime.toISOString(),
          newStartTime: startTime.toISOString(),
          newEndTime: endTime.toISOString(),
          timezone: effectiveTz,
          attendanceMode: payload.attendanceMode,
          speakerCount: speakerIds.length,
        },
      });
    });

    revalidateAll();
    return { success: true, message: "Session timing and speaker assignments updated successfully." };
  } catch (err) {
    console.error("[updateSessionTimingAction] Error:", err);
    return { error: "Failed to update session timing. Please try again." };
  }
}

/**
 * Instantly start a session live right now for a given duration.
 */
export async function quickStartSessionAction(
  sessionId: string,
  durationMinutes: number = 60
): Promise<TimeActionResult> {
  const admin = await requireAdmin();
  const existing = await prisma.session.findUnique({ where: { id: sessionId } });

  if (!existing) {
    return { error: "Session not found." };
  }

  const now = new Date();
  const endTime = new Date(now.getTime() + durationMinutes * 60 * 1000);

  try {
    await prisma.session.update({
      where: { id: sessionId },
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

    await logAudit({
      adminId: admin.id,
      action: AUDIT_ACTIONS.SESSION_UPDATE,
      targetType: "Session",
      targetId: sessionId,
      metadata: {
        actionType: "quick_start_live",
        durationMinutes,
        startTime: now.toISOString(),
        endTime: endTime.toISOString(),
      },
    });

    revalidateAll();
    return { success: true, message: `Session is now LIVE for ${durationMinutes} minutes with attendance open.` };
  } catch (err) {
    console.error("[quickStartSessionAction] Error:", err);
    return { error: "Failed to start live session." };
  }
}

/**
 * Extend an existing session and attendance window by a number of minutes.
 */
export async function extendSessionTimeAction(
  sessionId: string,
  additionalMinutes: number = 30
): Promise<TimeActionResult> {
  const admin = await requireAdmin();
  const existing = await prisma.session.findUnique({ where: { id: sessionId } });

  if (!existing) {
    return { error: "Session not found." };
  }

  const currentEnd = new Date(existing.endTime).getTime();
  const baseTime = currentEnd < Date.now() ? Date.now() : currentEnd;
  const newEndTime = new Date(baseTime + additionalMinutes * 60 * 1000);

  let newAttendanceEnd = existing.attendanceEndTime
    ? new Date(new Date(existing.attendanceEndTime).getTime() + additionalMinutes * 60 * 1000)
    : null;

  if (existing.attendanceOpen && !newAttendanceEnd) {
    newAttendanceEnd = newEndTime;
  }

  try {
    await prisma.session.update({
      where: { id: sessionId },
      data: {
        endTime: newEndTime,
        attendanceEndTime: newAttendanceEnd,
        status: Date.now() >= existing.startTime.getTime() && Date.now() <= newEndTime.getTime() ? "LIVE" : existing.status,
      },
    });

    await logAudit({
      adminId: admin.id,
      action: AUDIT_ACTIONS.SESSION_UPDATE,
      targetType: "Session",
      targetId: sessionId,
      metadata: {
        actionType: "extend_session",
        additionalMinutes,
        newEndTime: newEndTime.toISOString(),
      },
    });

    revalidateAll();
    return { success: true, message: `Session extended by ${additionalMinutes} minutes.` };
  } catch (err) {
    console.error("[extendSessionTimeAction] Error:", err);
    return { error: "Failed to extend session time." };
  }
}

/**
 * Toggle attendance status for a session.
 */
export async function toggleSessionAttendanceAction(
  sessionId: string,
  isOpen: boolean
): Promise<TimeActionResult> {
  const admin = await requireAdmin();

  try {
    await prisma.session.update({
      where: { id: sessionId },
      data: { attendanceOpen: isOpen },
    });

    await logAudit({
      adminId: admin.id,
      action: AUDIT_ACTIONS.SESSION_UPDATE,
      targetType: "Session",
      targetId: sessionId,
      metadata: { actionType: "toggle_attendance", attendanceOpen: isOpen },
    });

    revalidateAll();
    return { success: true, message: `Attendance ${isOpen ? "opened" : "closed"} successfully.` };
  } catch (err) {
    console.error("[toggleSessionAttendanceAction] Error:", err);
    return { error: "Failed to toggle attendance status." };
  }
}

/**
 * Toggle registration status for a session.
 */
export async function toggleSessionRegistrationAction(
  sessionId: string,
  isOpen: boolean
): Promise<TimeActionResult> {
  const admin = await requireAdmin();

  try {
    await prisma.session.update({
      where: { id: sessionId },
      data: { registrationOpen: isOpen },
    });

    await logAudit({
      adminId: admin.id,
      action: AUDIT_ACTIONS.SESSION_UPDATE,
      targetType: "Session",
      targetId: sessionId,
      metadata: { actionType: "toggle_registration", registrationOpen: isOpen },
    });

    revalidateAll();
    return { success: true, message: `Registration ${isOpen ? "opened" : "closed"} successfully.` };
  } catch (err) {
    console.error("[toggleSessionRegistrationAction] Error:", err);
    return { error: "Failed to toggle registration status." };
  }
}

/**
 * Update assigned speakers for a session.
 */
export async function updateSessionSpeakersAction(
  sessionId: string,
  speakerIds: string[]
): Promise<TimeActionResult> {
  const admin = await requireAdmin();

  try {
    await prisma.session.update({
      where: { id: sessionId },
      data: {
        speakers: {
          deleteMany: {},
          create: speakerIds.map((speakerId, i) => ({
            speakerId,
            sortOrder: i,
          })),
        },
      },
    });

    await logAudit({
      adminId: admin.id,
      action: AUDIT_ACTIONS.SESSION_UPDATE,
      targetType: "Session",
      targetId: sessionId,
      metadata: { actionType: "update_speakers", speakerCount: speakerIds.length, speakerIds },
    });

    revalidateAll();
    return { success: true, message: "Speakers assigned successfully." };
  } catch (err) {
    console.error("[updateSessionSpeakersAction] Error:", err);
    return { error: "Failed to update speakers." };
  }
}
