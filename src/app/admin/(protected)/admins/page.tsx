import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { formatDateTime } from "@/lib/datetime";
import { AdminsClient } from "./admins-client";

export const metadata = { title: "Administrators" };

export default async function AdminManagementPage() {
  const currentAdmin = await requireSuperAdmin();
  const settings = await getSettings();

  const admins = await prisma.admin.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "desc" }],
  });

  return (
    <AdminsClient
      currentAdminId={currentAdmin.id}
      admins={admins.map((a) => ({
        id: a.id,
        name: a.name,
        email: a.email,
        role: a.role,
        isActive: a.isActive,
        lastLoginLabel: a.lastLoginAt
          ? formatDateTime(a.lastLoginAt, settings.timezone)
          : "Never",
        createdAtLabel: formatDateTime(a.createdAt, settings.timezone),
      }))}
    />
  );
}