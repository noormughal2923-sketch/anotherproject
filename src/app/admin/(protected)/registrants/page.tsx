import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { RegistrantsClient } from "./registrants-client";

export const metadata = { title: "Registrants" };

export const PAGE_SIZE = 25;

export default async function AdminRegistrantsPage({
  searchParams,
}: PageProps<"/admin/registrants">) {
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
              { email: { contains: q } },
              { name: { contains: q } },
            ],
          }
        : {},
      sessionId
        ? { registrations: { some: { sessionId } } }
        : {},
    ],
  };

  const [users, total, sessions] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        registrations: {
          include: { session: true },
          orderBy: { registeredAt: "desc" },
        },
        attendance: {
          include: { session: true },
          orderBy: { markedAt: "desc" },
        },
      },
    }),
    prisma.user.count({ where }),
    prisma.session.findMany({
      where: { isActive: true },
      orderBy: { startTime: "desc" },
      take: 200,
    }),
  ]);

  return (
    <RegistrantsClient
      users={users}
      total={total}
      page={page}
      pageSize={PAGE_SIZE}
      q={q}
      sessionId={sessionId}
      sessions={sessions.map((s) => ({ id: s.id, title: s.title }))}
      timezone={settings.timezone}
    />
  );
}