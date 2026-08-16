import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { AttendanceClient } from "./attendance-client";

export const metadata = { title: "Attendance" };

export const PAGE_SIZE = 25;

export default async function AdminAttendancePage({
  searchParams,
}: PageProps<"/admin/attendance">) {
  const sp = await searchParams;
  const settings = await getSettings();
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const sessionId = typeof sp.sessionId === "string" ? sp.sessionId : "";
  const page = Math.max(1, Number(sp.page) || 1);

  const where = {
    AND: [
      q
        ? {
            OR: [
              { user: { email: { contains: q } } },
              { user: { name: { contains: q } } },
            ],
          }
        : {},
      sessionId ? { sessionId } : {},
    ],
  };

  const [records, total, registrationsForFilter, totalRegistrations, sessions] =
    await Promise.all([
      prisma.attendance.findMany({
        where,
        orderBy: { markedAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: { user: true, session: true },
      }),
      prisma.attendance.count({ where }),
      prisma.registration.count({ where: sessionId ? { sessionId } : {} }),
      prisma.registration.count(),
      prisma.session.findMany({
        where: { isActive: true },
        orderBy: { startTime: "desc" },
        take: 200,
      }),
    ]);

  const attendanceRate =
    registrationsForFilter > 0
      ? Math.round((total / registrationsForFilter) * 100)
      : 0;

  return (
    <AttendanceClient
      records={records}
      total={total}
      registrations={registrationsForFilter}
      attendanceRate={attendanceRate}
      totalRegistrations={totalRegistrations}
      page={page}
      pageSize={PAGE_SIZE}
      q={q}
      sessionId={sessionId}
      sessions={sessions.map((s) => ({ id: s.id, title: s.title }))}
      timezone={settings.timezone}
    />
  );
}