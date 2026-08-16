import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { AuditLogsClient } from "./audit-logs-client";

export const metadata = { title: "Audit Logs" };

export default async function AuditLogsPage() {
  const settings = await getSettings();

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      admin: { select: { email: true, name: true } },
    },
  });

  return (
    <AuditLogsClient
      logs={logs}
      timezone={settings.timezone}
    />
  );
}
