import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { sheetsConfigured } from "@/lib/google-sheets";
import { GoogleSyncClient } from "./google-sync-client";

export const metadata = { title: "Google Sync" };

export default async function AdminGoogleSyncPage() {
  const settings = await getSettings();

  const [connections, syncRuns] = await Promise.all([
    prisma.googleSheetConnection.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { sessions: true } },
        syncRuns: { orderBy: { startedAt: "desc" }, take: 1 },
      },
    }),
    prisma.syncRun.findMany({
      orderBy: { startedAt: "desc" },
      take: 15,
      include: { connection: true },
    }),
  ]);

  return (
    <div>
      <GoogleSyncClient
        connections={connections.map((c) => ({
          id: c.id,
          name: c.name,
          spreadsheetId: c.spreadsheetId,
          sheetName: c.sheetName,
          isActive: c.isActive,
          lastSyncedAt: c.lastSyncedAt,
          _count: c._count,
          latestRun: c.syncRuns[0] ?? null,
        }))}
        syncRuns={syncRuns}
        configured={sheetsConfigured()}
        timezone={settings.timezone}
      />
    </div>
  );
}
