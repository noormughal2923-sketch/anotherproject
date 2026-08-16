"use server";

import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth";
import { normalizeEmail } from "@/lib/email";
import { logAudit } from "@/lib/audit";
import { AUDIT_ACTIONS, ADMIN_BASE_PATH } from "@/lib/constants";

const createAdminSchema = z.object({
  email: z.email("Valid email required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().trim().max(100).optional(),
  role: z.enum(["SUPER_ADMIN", "ADMIN"]),
});

export type AdminActionResult = { error?: string } | undefined;

export async function createAdminAction(
  formData: FormData
): Promise<AdminActionResult> {
  const currentAdmin = await requireSuperAdmin();

  const parsed = createAdminSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    name: String(formData.get("name") ?? "") || undefined,
    role: String(formData.get("role") ?? "ADMIN"),
  });

  if (!parsed.success) {
    return { error: "Invalid inputs. Ensure password is at least 8 characters." };
  }

  const email = normalizeEmail(parsed.data.email);
  if (!email) {
    return { error: "Invalid email format." };
  }

  const existing = await prisma.admin.findUnique({ where: { email } });
  if (existing) {
    return { error: "An administrator with this email already exists." };
  }

  const passwordHash = await hash(parsed.data.password, 12);

  const newAdmin = await prisma.admin.create({
    data: {
      email,
      passwordHash,
      name: parsed.data.name ?? null,
      role: parsed.data.role,
    },
  });

  await logAudit({
    adminId: currentAdmin.id,
    action: AUDIT_ACTIONS.ADMIN_CREATE,
    targetType: "Admin",
    targetId: newAdmin.id,
    metadata: { email: newAdmin.email, role: newAdmin.role },
  });

  revalidatePath("/admin/admins");
  revalidatePath(`${ADMIN_BASE_PATH}/admins`);
  revalidatePath(ADMIN_BASE_PATH);
}

export async function toggleAdminStatusAction(id: string): Promise<void> {
  const currentAdmin = await requireSuperAdmin();
  if (currentAdmin.id === id) {
    return; // Cannot deactivate self
  }

  const existing = await prisma.admin.findUnique({ where: { id } });
  if (!existing) return;

  const updated = await prisma.admin.update({
    where: { id },
    data: { isActive: !existing.isActive },
  });

  await logAudit({
    adminId: currentAdmin.id,
    action: AUDIT_ACTIONS.ADMIN_DEACTIVATE,
    targetType: "Admin",
    targetId: id,
    metadata: { email: updated.email, isActive: updated.isActive },
  });

  revalidatePath("/admin/admins");
  revalidatePath(`${ADMIN_BASE_PATH}/admins`);
  revalidatePath(ADMIN_BASE_PATH);
}

export async function deleteAdminAction(id: string): Promise<void> {
  const currentAdmin = await requireSuperAdmin();
  if (currentAdmin.id === id) {
    return; // Cannot delete self
  }

  const existing = await prisma.admin.findUnique({ where: { id } });
  if (!existing) return;

  if (existing.role === "SUPER_ADMIN") {
    const superAdminCount = await prisma.admin.count({
      where: { role: "SUPER_ADMIN" },
    });
    if (superAdminCount <= 1) {
      return; // Cannot delete the last super admin
    }
  }

  await prisma.admin.delete({ where: { id } });

  await logAudit({
    adminId: currentAdmin.id,
    action: AUDIT_ACTIONS.ADMIN_DELETE,
    targetType: "Admin",
    targetId: id,
    metadata: { email: existing.email, role: existing.role },
  });

  revalidatePath("/admin/admins");
  revalidatePath(`${ADMIN_BASE_PATH}/admins`);
  revalidatePath(ADMIN_BASE_PATH);
}
