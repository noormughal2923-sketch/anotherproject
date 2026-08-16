"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { overrideSchema } from "@/lib/validation";
import { normalizeEmail } from "@/lib/email";
import { clientIp } from "@/lib/rate-limit";

export type OverrideActionResult = { error?: string } | undefined;

export async function markAttendanceOverrideAction(
  formData: FormData
): Promise<OverrideActionResult> {
  await requireAdmin();

  const parsed = overrideSchema.safeParse({
    sessionId: String(formData.get("sessionId") ?? ""),
    email: String(formData.get("email") ?? ""),
    reason: String(formData.get("reason") ?? ""),
  });
  if (!parsed.success) {
    return { error: "Please fill in all fields (reason needs at least 10 characters)." };
  }

  const email = normalizeEmail(parsed.data.email);
  if (!email) {
    return { error: "Please enter a valid email address." };
  }

  const session = await prisma.session.findUnique({
    where: { id: parsed.data.sessionId },
  });
  if (!session) {
    return { error: "Session not found." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { error: "No registrant found with this email. Sync or add the registrant first." };
  }

  const existing = await prisma.attendance.findUnique({
    where: { userId_sessionId: { userId: user.id, sessionId: session.id } },
  });
  if (existing) {
    return { error: "Attendance is already marked for this registrant in this session." };
  }

  try {
    await prisma.attendance.create({
      data: {
        userId: user.id,
        sessionId: session.id,
        method: "manual-override",
        overrideReason: parsed.data.reason,
        ipAddress: await clientIp(),
      },
    });
  } catch {
    return { error: "Could not mark attendance. Please try again." };
  }

  revalidatePath("/admin/attendance");
  revalidatePath("/admin/registrants");
  revalidatePath("/admin");
}

export async function removeAttendanceAction(id: string): Promise<void> {
  await requireAdmin();
  const existing = await prisma.attendance.findUnique({ where: { id } });
  if (!existing) {
    return;
  }
  if (existing.method === "manual-override") {
    await prisma.attendance.delete({ where: { id } });
    revalidatePath("/admin/attendance");
    revalidatePath("/admin/registrants");
    revalidatePath("/admin");
  }
}