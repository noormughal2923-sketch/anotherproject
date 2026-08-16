import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { TimeManagementClient } from "./time-management-client";

export const metadata = { title: "Time & Schedule Management" };

export default async function AdminTimeManagementPage() {
  const settings = await getSettings();

  const [sessions, speakers, sheetConnections] = await Promise.all([
    prisma.session.findMany({
      orderBy: [{ startTime: "desc" }],
      include: {
        speakers: {
          orderBy: { sortOrder: "asc" },
          include: {
            speaker: true,
          },
        },
        sheetConnection: {
          select: {
            id: true,
            name: true,
            spreadsheetId: true,
          },
        },
        _count: {
          select: {
            registrations: true,
            attendance: true,
          },
        },
      },
    }),
    prisma.speaker.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: {
        sessions: {
          include: {
            session: {
              select: {
                id: true,
                title: true,
                slug: true,
                startTime: true,
                endTime: true,
                status: true,
              },
            },
          },
        },
      },
    }),
    prisma.googleSheetConnection.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
      },
    }),
  ]);

  const serializedSessions = sessions.map((s) => ({
    id: s.id,
    title: s.title,
    slug: s.slug,
    description: s.description,
    meetLink: s.meetLink,
    startTime: s.startTime.toISOString(),
    endTime: s.endTime.toISOString(),
    timezone: s.timezone || settings.timezone || "Asia/Karachi",
    status: s.status,
    isActive: s.isActive,
    registrationOpen: s.registrationOpen,
    attendanceOpen: s.attendanceOpen,
    attendanceStartTime: s.attendanceStartTime ? s.attendanceStartTime.toISOString() : null,
    attendanceEndTime: s.attendanceEndTime ? s.attendanceEndTime.toISOString() : null,
    sheetConnection: s.sheetConnection,
    speakers: s.speakers.map((sp) => ({
      id: sp.speaker.id,
      name: sp.speaker.name,
      title: sp.speaker.title,
      photoUrl: sp.speaker.photoUrl,
      sortOrder: sp.sortOrder,
    })),
    _count: s._count,
  }));

  const serializedSpeakers = speakers.map((sp) => ({
    id: sp.id,
    name: sp.name,
    title: sp.title,
    email: sp.email,
    photoUrl: sp.photoUrl,
    organization: sp.organization,
    sessions: sp.sessions.map((rel) => ({
      id: rel.session.id,
      title: rel.session.title,
      slug: rel.session.slug,
      startTime: rel.session.startTime.toISOString(),
      endTime: rel.session.endTime.toISOString(),
      status: rel.session.status,
    })),
  }));

  return (
    <TimeManagementClient
      sessions={serializedSessions}
      speakers={serializedSpeakers}
      connections={sheetConnections}
      timezone={settings.timezone || "Asia/Karachi"}
      orgName={settings.orgName || "CyberGuardiansSociety"}
    />
  );
}
