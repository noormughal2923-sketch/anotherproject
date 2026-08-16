import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { SessionsClient } from "./sessions-client";

export const metadata = { title: "Sessions Management" };

export default async function AdminSessionsPage() {
  const settings = await getSettings();

  const [sessions, speakers, connections] = await Promise.all([
    prisma.session.findMany({
      orderBy: [{ startTime: "desc" }],
      include: {
        sheetConnection: true,
        _count: { select: { registrations: true, attendance: true } },
      },
    }),
    prisma.speaker.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.googleSheetConnection.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <SessionsClient
      sessions={sessions.map((s) => ({
        id: s.id,
        title: s.title,
        slug: s.slug,
        startTime: s.startTime,
        endTime: s.endTime,
        isActive: s.isActive,
        registrationOpen: s.registrationOpen,
        attendanceOpen: s.attendanceOpen,
        sheetConnection: s.sheetConnection
          ? {
              id: s.sheetConnection.id,
              name: s.sheetConnection.name,
              spreadsheetId: s.sheetConnection.spreadsheetId,
            }
          : null,
        _count: s._count,
      }))}
      timezone={settings.timezone}
      speakers={speakers.map((s) => ({ id: s.id, name: s.name }))}
      connections={connections.map((c) => ({ id: c.id, name: c.name }))}
    />
  );
}