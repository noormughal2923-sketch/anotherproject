import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type ExportColumn<T> = {
  header: string;
  value: (row: T) => string;
};

function toCsv<T>(rows: T[], columns: ExportColumn<T>[]): string {
  const header = columns.map((c) => escapeCsv(c.header)).join(",");
  const body = rows
    .map((row) =>
      columns.map((col) => escapeCsv(col.value(row))).join(",")
    )
    .join("\n");
  return `${header}\n${body}`;
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

type RegistrantRow = Prisma.UserGetPayload<{
  include: {
    registrations: { include: { session: true } };
    attendance: { include: { session: true } };
  };
}>;

export async function exportRegistrantsCsv(sessionId?: string): Promise<string> {
  const where = sessionId
    ? { registrations: { some: { sessionId } } }
    : {};

  const users = await prisma.user.findMany({
    where,
    include: {
      registrations: { include: { session: true } },
      attendance: { include: { session: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10000,
  });

  return toCsv<RegistrantRow>(users, [
    { header: "Name", value: (u) => u.name ?? "" },
    { header: "Email", value: (u) => u.email },
    {
      header: "Sessions Registered",
      value: (u) =>
        u.registrations.map((r) => r.session.title).join("; "),
    },
    {
      header: "Sessions Attended",
      value: (u) =>
        u.attendance.map((a) => a.session.title).join("; "),
    },
    {
      header: "First Registered",
      value: (u) =>
        u.registrations.length > 0
          ? u.registrations[u.registrations.length - 1].registeredAt.toISOString()
          : "",
    },
    {
      header: "Created At",
      value: (u) => u.createdAt.toISOString(),
    },
  ]);
}

type AttendanceRow = Prisma.AttendanceGetPayload<{
  include: { user: true; session: true };
}>;

export async function exportAttendanceCsv(sessionId?: string): Promise<string> {
  const where = sessionId ? { sessionId } : {};

  const records = await prisma.attendance.findMany({
    where,
    include: { user: true, session: true },
    orderBy: { markedAt: "desc" },
    take: 10000,
  });

  return toCsv<AttendanceRow>(records, [
    { header: "Name", value: (r) => r.user.name ?? "" },
    { header: "Email", value: (r) => r.user.email },
    { header: "Session", value: (r) => r.session.title },
    { header: "Marked At", value: (r) => r.markedAt.toISOString() },
    { header: "Method", value: (r) => r.method },
    { header: "Override Reason", value: (r) => r.overrideReason ?? "" },
  ]);
}
