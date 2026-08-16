import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, ClipboardCheck, Video, ExternalLink, User, Building2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { formatDateTime } from "@/lib/datetime";

export const metadata = { title: "Session Details" };
export const dynamic = "force-dynamic";

export default async function SessionPage({
  params,
}: PageProps<"/session/[slug]">) {
  const { slug } = await params;
  const settings = await getSettings();

  const session = await prisma.session.findFirst({
    where: { slug, isActive: true },
    include: {
      speakers: { include: { speaker: true }, orderBy: { sortOrder: "asc" } },
      _count: { select: { registrations: true, attendance: true } },
    },
  });

  if (!session) {
    notFound();
  }

  const now = new Date();
  const isLive = now >= session.startTime && now <= session.endTime;
  const hasEnded = now > session.endTime;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 animate-fade-in">
      {/* Breadcrumb & Navigation */}
      <Link
        href="/sessions"
        className="inline-flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        ← Back to all sessions
      </Link>

      {/* Hero / Header Card */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-[linear-gradient(115deg,rgb(239_68_68/0.11),transparent_40%,rgb(37_99_235/0.11)),var(--card)] p-6 shadow-lg sm:p-8">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {isLive ? (
            <Badge variant="live">● LIVE NOW</Badge>
          ) : hasEnded ? (
            <Badge variant="completed">Completed</Badge>
          ) : (
            <Badge variant="upcoming">Upcoming</Badge>
          )}

          {session.registrationOpen ? (
            <Badge variant="success">Registration Open</Badge>
          ) : (
            <Badge variant="warning">Registration Closed</Badge>
          )}

          {session.attendanceOpen && (
            <Badge variant="cgs">Attendance Open</Badge>
          )}
        </div>

        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
          {session.title}
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs sm:text-sm text-muted-foreground border-t border-border/60 pt-4">
          <span className="flex items-center gap-1.5 font-medium text-foreground">
            <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
            {formatDateTime(session.startTime, settings.timezone)} —{" "}
            {formatDateTime(session.endTime, settings.timezone)}
          </span>
        </div>

        {/* Action Bar */}
        <div className="mt-6 flex flex-wrap items-center gap-3 pt-2">
          {session.meetLink && (
            <Button asChild variant="cgs" size="lg">
              <a
                href={session.meetLink}
                target="_blank"
                rel="noopener noreferrer"
                className="gap-2"
              >
                <Video className="h-4 w-4" />
                Join Google Meet
                <ExternalLink className="h-3.5 w-3.5 opacity-80" />
              </a>
            </Button>
          )}

          {isLive && session.attendanceOpen && (
            <Button asChild variant="outline" size="lg">
              <Link href="/attendance">
                <ClipboardCheck className="h-4 w-4 text-blue-400" />
                Mark Attendance
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Description Section */}
      <div className="mt-8 space-y-6">
        <div className="rounded-xl border border-border/70 bg-card/70 p-6">
          <h2 className="font-heading text-lg font-bold text-foreground mb-3">
            About This Session
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {session.fullDescription || session.description || "No description provided."}
          </p>
        </div>

        {/* Speakers Section */}
        {session.speakers.length > 0 && (
          <div>
            <h2 className="font-heading text-xl font-bold text-foreground mb-4">
              Featured Speakers
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {session.speakers.map(({ speaker }) => (
                <Card key={speaker.id} className="cgs-glow-card border-border/80 bg-card/75">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary-muted font-bold text-primary">
                        {speaker.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-heading font-semibold text-foreground text-sm truncate">
                          {speaker.name}
                        </h3>
                        {speaker.title && (
                          <p className="text-xs font-medium text-primary">
                            {speaker.title}
                          </p>
                        )}
                        {speaker.organization && (
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Building2 className="h-3 w-3" />
                            {speaker.organization}
                          </p>
                        )}
                      </div>
                    </div>

                    {speaker.bio && (
                      <p className="mt-3 text-xs text-muted-foreground leading-relaxed line-clamp-3">
                        {speaker.bio}
                      </p>
                    )}

                    {speaker.linkedinUrl && (
                      <a
                        href={speaker.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                      >
                        LinkedIn Profile <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Session Stats */}
        <div className="rounded-xl border border-border/40 bg-secondary/30 p-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>Registered Participants: <strong className="text-foreground">{session._count.registrations}</strong></span>
          <span>Verified Attendance: <strong className="text-foreground">{session._count.attendance}</strong></span>
        </div>
      </div>
    </div>
  );
}
