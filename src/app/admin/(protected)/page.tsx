import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  CalendarDays,
  ClipboardCheck,
  Mic,
  RefreshCcw,
  Users,
  Plus,
  Radio,
  BarChart3,
  Percent,
  Shield,
  Award,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { formatDateTime } from "@/lib/datetime";
import { ADMIN_BASE_PATH } from "@/lib/constants";

export const metadata = { title: "Dashboard Overview" };

export default async function AdminDashboardPage() {
  const settings = await getSettings();
  const now = new Date();

  const [
    totalSessions,
    upcomingSessions,
    activeSpeakers,
    totalUsers,
    totalRegistrations,
    totalAttendance,
    recentSyncRuns,
  ] = await Promise.all([
    prisma.session.count({ where: { isActive: true } }),
    prisma.session.count({
      where: { isActive: true, startTime: { gt: now } },
    }),
    prisma.speaker.count({ where: { isActive: true } }),
    prisma.user.count(),
    prisma.registration.count(),
    prisma.attendance.count(),
    prisma.syncRun.findMany({
      orderBy: { startedAt: "desc" },
      take: 5,
      include: { connection: true },
    }),
  ]);

  const upcoming = await prisma.session.findMany({
    where: { isActive: true, startTime: { gt: now } },
    orderBy: { startTime: "asc" },
    take: 5,
    include: { _count: { select: { registrations: true, attendance: true } } },
  });

  const attendanceRate =
    totalRegistrations > 0
      ? Math.round((totalAttendance / totalRegistrations) * 100)
      : 0;

  const stats = [
    { label: "Total Sessions", value: totalSessions, href: `${ADMIN_BASE_PATH}/sessions`, icon: CalendarDays },
    { label: "Upcoming Sessions", value: upcomingSessions, href: `${ADMIN_BASE_PATH}/sessions`, icon: Radio },
    { label: "Active Speakers", value: activeSpeakers, href: `${ADMIN_BASE_PATH}/speakers`, icon: Mic },
    { label: "Total Registrants", value: totalUsers, href: `${ADMIN_BASE_PATH}/registrants`, icon: Users },
    { label: "Session Registrations", value: totalRegistrations, href: `${ADMIN_BASE_PATH}/registrants`, icon: BarChart3 },
    { label: "Verified Attendance", value: totalAttendance, href: `${ADMIN_BASE_PATH}/attendance`, icon: ClipboardCheck },
  ];

  return (
    <div className="app-page space-y-8 font-sans">
      {/* Dashboard Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border/70 pb-7">
        <div>
          <Badge variant="cgs" className="mb-2">Platform Control Center</Badge>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Dashboard Overview
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Real-time session metrics, participant attendance analytics, and Google Sheet sync statuses.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild size="sm" variant="cgs">
            <Link href={`${ADMIN_BASE_PATH}/bootcamp`}>
              <Shield className="h-4 w-4" /> Bootcamp Control
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={`${ADMIN_BASE_PATH}/certificates`}>
              <Award className="h-4 w-4" /> Certificates
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={`${ADMIN_BASE_PATH}/time-management`}>
              <CalendarClock className="h-4 w-4" /> Timing
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={`${ADMIN_BASE_PATH}/google-sync`}>
              <RefreshCcw className="h-4 w-4" /> Google Sync
            </Link>
          </Button>
        </div>
      </div>

      {/* Main KPI Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.label} href={s.href}>
              <Card className="cgs-glow-card h-full border-border/80 bg-card/75 hover:bg-card">
                <CardContent className="flex h-full flex-col justify-between p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-muted-foreground truncate">{s.label}</span>
                    <Icon className="h-4 w-4 shrink-0 text-primary" />
                  </div>
                  <div className="mt-3">
                    <p className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                      {s.value}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Attendance Rate Banner */}
      <Card className="overflow-hidden border-primary/20 bg-[linear-gradient(115deg,rgb(239_68_68/0.13),transparent_40%,rgb(37_99_235/0.13)),var(--card)] p-6 shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/30 bg-primary-muted text-primary">
              <Percent className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Overall Attendance Rate</p>
              <h3 className="font-heading text-3xl font-extrabold text-foreground mt-0.5">
                {attendanceRate}% <span className="text-xs font-normal text-muted-foreground font-sans">of registered participants attended</span>
              </h3>
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={`${ADMIN_BASE_PATH}/attendance`}>
              View Detailed Logs <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </Card>

      {/* Tables Section */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Upcoming Sessions Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold text-foreground">Upcoming Sessions</h2>
            <Link
              href={`${ADMIN_BASE_PATH}/sessions`}
              className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {upcoming.length === 0 ? (
            <Card className="border-dashed border-border bg-card/30 p-8 text-center text-xs text-muted-foreground">
              No upcoming sessions scheduled right now.
            </Card>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border bg-card">
              <table className="w-full text-xs">
                <thead className="border-b border-border/80 bg-secondary/30 text-left text-muted-foreground font-semibold">
                  <tr>
                    <th className="px-4 py-3">Session Title</th>
                    <th className="px-4 py-3">Start Date</th>
                    <th className="px-4 py-3 text-center">Regs</th>
                    <th className="px-4 py-3 text-center">Attd</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {upcoming.map((s) => (
                    <tr key={s.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-3 font-semibold text-foreground">{s.title}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {formatDateTime(s.startTime, settings.timezone)}
                      </td>
                      <td className="px-4 py-3 text-center font-medium">{s._count.registrations}</td>
                      <td className="px-4 py-3 text-center font-medium">{s._count.attendance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Sync Runs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold text-foreground">Recent Google Sync Runs</h2>
            <Link
              href={`${ADMIN_BASE_PATH}/google-sync`}
              className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              Sync Engine <RefreshCcw className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recentSyncRuns.length === 0 ? (
            <Card className="border-dashed border-border bg-card/30 p-8 text-center text-xs text-muted-foreground">
              No Google Sheet sync runs executed yet.
            </Card>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border bg-card">
              <table className="w-full text-xs">
                <thead className="border-b border-border/80 bg-secondary/30 text-left text-muted-foreground font-semibold">
                  <tr>
                    <th className="px-4 py-3">Connection</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-center">Created</th>
                    <th className="px-4 py-3 text-center">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {recentSyncRuns.map((r) => (
                    <tr key={r.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground truncate max-w-[150px]">{r.connection.name}</td>
                      <td className="px-4 py-3">
                        {r.status === "success" ? (
                          <Badge variant="success">Success</Badge>
                        ) : (
                          <Badge variant="destructive">Error</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center font-medium">{r.createdCount}</td>
                      <td className="px-4 py-3 text-center font-medium">{r.updatedCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
