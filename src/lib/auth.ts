import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes } from "crypto";

import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, ADMIN_BASE_PATH } from "@/lib/constants";

export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export async function getAdmin() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }
  const session = await prisma.adminSession.findUnique({
    where: { token },
    include: { admin: true },
  });
  if (
    !session ||
    session.expiresAt.getTime() < Date.now() ||
    !session.admin.isActive
  ) {
    if (session) {
      await prisma.adminSession
        .delete({ where: { id: session.id } })
        .catch(() => {});
    }
    return null;
  }
  return session.admin;
}

export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) {
    redirect(ADMIN_BASE_PATH);
  }
  return admin;
}

export async function requireSuperAdmin() {
  const admin = await requireAdmin();
  if (admin.role !== "SUPER_ADMIN") {
    redirect(ADMIN_BASE_PATH);
  }
  return admin;
}

export async function createAdminSession(
  adminId: string,
  ipAddress?: string,
  userAgent?: string
) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  await prisma.adminSession.create({
    data: { token, adminId, ipAddress, userAgent, expiresAt },
  });
  // Update last login timestamp
  await prisma.admin
    .update({ where: { id: adminId }, data: { lastLoginAt: new Date() } })
    .catch(() => {});
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroyAdminSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.adminSession.deleteMany({ where: { token } });
  }
  store.delete(SESSION_COOKIE);
}