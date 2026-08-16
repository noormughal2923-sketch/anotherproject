import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { formatDateTime } from "@/lib/datetime";
import { SessionForm } from "../session-form";
import { setSessionActiveAction } from "../actions";
import { ADMIN_BASE_PATH } from "@/lib/constants";

export const metadata = { title: "Edit Session" };

export default async function EditSessionPage({
  params,
}: PageProps<"/admin/sessions/[id]">) {
  const { id } = await params;
  const settings = await getSettings();

  const [session, speakers, connections] = await Promise.all([
    prisma.session.findUnique({
      where: { id },
      include: {
        speakers: { include: { speaker: true }, orderBy: { sortOrder: "asc" } },
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
  if (!session) {
    notFound();
  }

  return (
    <div className="app-page max-w-3xl">
      <Link
        href={`${ADMIN_BASE_PATH}/sessions`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to sessions
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{session.title}</h1>
        {!session.isActive && <Badge variant="outline">Archived</Badge>}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Registrations
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {session._count.registrations}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Attendance
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {session._count.attendance}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {formatDateTime(session.startTime, settings.timezone)}
            <br />
            {formatDateTime(session.endTime, settings.timezone)}
          </CardContent>
        </Card>
      </div>

      {session.sheetConnection && (
        <a
          href={`https://docs.google.com/spreadsheets/d/${session.sheetConnection.spreadsheetId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <ExternalLink className="h-4 w-4" />
          Open registration sheet: {session.sheetConnection.name}
        </a>
      )}

      <div className="mt-6 rounded-lg border bg-card p-6">
        <SessionForm
          session={{
            id: session.id,
            title: session.title,
            slug: session.slug,
            description: session.description,
            meetLink: session.meetLink,
            startTime: session.startTime,
            endTime: session.endTime,
            registrationOpen: session.registrationOpen,
            attendanceOpen: session.attendanceOpen,
            speakerIds: session.speakers.map((sp) => sp.speakerId),
            sheetConnectionId: session.sheetConnectionId,
          }}
          speakers={speakers.map((s) => ({ id: s.id, name: s.name }))}
          connections={connections.map((c) => ({ id: c.id, name: c.name }))}
        />
      </div>

      <div className="mt-6 rounded-lg border border-destructive/30 p-6">
        <h2 className="font-semibold text-destructive">
          {session.isActive ? "Archive session" : "Restore session"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {session.isActive
            ? "Archiving hides the session from the public site and the attendance flow. Registrations and attendance records are kept."
            : "Restore this session to make it visible again."}
        </p>
        <form action={setSessionActiveAction.bind(null, session.id)} className="mt-4">
          <input
            type="hidden"
            name="isActive"
            value={session.isActive ? "false" : "true"}
          />
          <button
            type="submit"
            className="rounded-md border border-destructive/50 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 cursor-pointer"
          >
            {session.isActive ? "Archive session" : "Restore session"}
          </button>
        </form>
      </div>
    </div>
  );
}
