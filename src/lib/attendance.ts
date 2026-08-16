import "server-only";

import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/email";
import { getSettings } from "@/lib/settings";
import { ATTENDANCE_RATE_LIMIT } from "@/lib/constants";
import { rateLimit } from "@/lib/rate-limit";
import { attendanceSchema } from "@/lib/validation";

export type AttendanceResult =
  | {
      status: "success";
      name: string;
      sessionTitle: string;
      markedAt: Date;
    }
  | {
      status: "error";
      code:
        | "portal-offline"
        | "attendance-closed"
        | "no-active-session"
        | "not-registered"
        | "already-marked"
        | "rate-limited"
        | "invalid-input";
    };

export async function getActiveSession() {
  try {
    const now = new Date();
    return await prisma.session.findFirst({
      where: {
        isActive: true,
        attendanceOpen: true,
        startTime: { lte: now },
        endTime: { gte: now },
      },
      orderBy: { startTime: "desc" },
      include: { speakers: { include: { speaker: true }, orderBy: { sortOrder: "asc" } } },
    });
  } catch (err) {
    console.error("Error fetching active session:", err);
    return null;
  }
}

export async function markAttendance(
  email: string,
  name: string | undefined,
  ip: string
): Promise<AttendanceResult> {
  const settings = await getSettings();
  if (!settings.portalOpen) {
    return { status: "error", code: "portal-offline" };
  }
  if (!settings.attendanceOpen) {
    return { status: "error", code: "attendance-closed" };
  }

  const withinLimit = await rateLimit(
    ATTENDANCE_RATE_LIMIT.key(ip),
    ATTENDANCE_RATE_LIMIT.limit,
    ATTENDANCE_RATE_LIMIT.windowMs
  );
  if (!withinLimit) {
    return { status: "error", code: "rate-limited" };
  }

  const parsed = attendanceSchema.safeParse({ email, name });
  if (!parsed.success) {
    return { status: "error", code: "invalid-input" };
  }

  const normalized = normalizeEmail(parsed.data.email);
  if (!normalized) {
    return { status: "error", code: "invalid-input" };
  }

  const now = new Date();
  const session = await prisma.session.findFirst({
    where: {
      isActive: true,
      attendanceOpen: true,
      startTime: { lte: now },
      endTime: { gte: now },
    },
    orderBy: { startTime: "desc" },
  });
  if (!session) {
    return { status: "error", code: "no-active-session" };
  }

  const user = await prisma.user.findUnique({ where: { email: normalized } });
  if (!user) {
    return { status: "error", code: "not-registered" };
  }

  const registration = await prisma.registration.findUnique({
    where: { userId_sessionId: { userId: user.id, sessionId: session.id } },
  });
  if (!registration) {
    return { status: "error", code: "not-registered" };
  }

  const existing = await prisma.attendance.findUnique({
    where: { userId_sessionId: { userId: user.id, sessionId: session.id } },
  });
  if (existing) {
    return { status: "error", code: "already-marked" };
  }

  if (parsed.data.name && !user.name) {
    await prisma.user.update({
      where: { id: user.id },
      data: { name: parsed.data.name.slice(0, 200) },
    });
  }

  await prisma.attendance.create({
    data: {
      userId: user.id,
      sessionId: session.id,
      method: "portal",
      ipAddress: ip,
    },
  });

  return {
    status: "success",
    name: user.name ?? parsed.data.name ?? normalized,
    sessionTitle: session.title,
    markedAt: now,
  };
}