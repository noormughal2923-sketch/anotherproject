import { getBootcampSessions } from "@/lib/certificates";
import { computeBootcampEligibility } from "@/lib/certificates";
import { prisma } from "@/lib/prisma";
import { BootcampClient } from "./bootcamp-client";

export const metadata = { title: "Bootcamp Management" };
export const dynamic = "force-dynamic";

export default async function BootcampPage() {
  const [sessions, eligibility] = await Promise.all([
    getBootcampSessions(),
    computeBootcampEligibility(),
  ]);

  const sessionData = sessions.map((s) => ({
    id: s.id,
    title: s.title,
    sessionNumber: s.sessionNumber ?? 0,
    status: s.status,
    attendanceOpen: s.attendanceOpen,
    registrationOpen: s.registrationOpen,
    startTime: s.startTime,
    endTime: s.endTime,
    meetLink: s.meetLink,
    registrations: s._count.registrations,
    attendance: s._count.attendance,
  }));

  return (
    <BootcampClient
      sessions={sessionData}
      stats={eligibility.stats}
    />
  );
}
