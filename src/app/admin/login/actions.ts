"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { compare } from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/email";
import { loginSchema } from "@/lib/validation";
import { createAdminSession } from "@/lib/auth";
import { LOGIN_RATE_LIMIT, ADMIN_BASE_PATH, AUDIT_ACTIONS } from "@/lib/constants";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

export type LoginState = { error?: string } | null;

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  // Honeypot: bots that autofill hidden fields are rejected outright.
  if (String(formData.get("company_website") ?? "").trim() !== "") {
    return { error: "Invalid email or password." };
  }

  // Timing guard: legitimate humans take longer than 1.5s to fill the form.
  const elapsed = Number(formData.get("_elapsed") ?? 0);
  if (elapsed > 0 && elapsed < 1500) {
    return { error: "Invalid email or password." };
  }

  const rawEmail = String(formData.get("email") ?? "");
  const rawPassword = String(formData.get("password") ?? "");

  // Length guards to prevent ReDoS or large payload attacks
  if (rawEmail.length > 254 || rawPassword.length > 256) {
    return { error: "Invalid email or password." };
  }

  const ip = await clientIp();

  const allowed = await rateLimit(
    LOGIN_RATE_LIMIT.key(ip),
    LOGIN_RATE_LIMIT.limit,
    LOGIN_RATE_LIMIT.windowMs
  );
  if (!allowed) {
    return { error: "Too many login attempts. Please try again in a few minutes." };
  }

  const parsed = loginSchema.safeParse({
    email: rawEmail,
    password: rawPassword,
  });
  if (!parsed.success) {
    return { error: "Invalid email or password." };
  }

  const email = normalizeEmail(parsed.data.email);
  if (!email) {
    return { error: "Invalid email or password." };
  }

  const admin = await prisma.admin.findUnique({ where: { email } });
  const valid =
    admin &&
    admin.isActive &&
    (await compare(parsed.data.password, admin.passwordHash));

  await prisma.loginAttempt.create({
    data: { email, ipAddress: ip, success: Boolean(valid) },
  });

  if (!valid || !admin) {
    return { error: "Invalid email or password." };
  }

  await createAdminSession(admin.id, ip, (await headers()).get("user-agent") ?? undefined);
  await logAudit({
    adminId: admin.id,
    action: AUDIT_ACTIONS.ADMIN_LOGIN,
    targetType: "Admin",
    targetId: admin.id,
    metadata: { email: admin.email, role: admin.role },
  });

  redirect(ADMIN_BASE_PATH);
}