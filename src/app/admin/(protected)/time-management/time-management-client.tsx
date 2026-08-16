"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  Clock,
  Globe,
  Radio,
  Sparkles,
  Play,
  Plus,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Users,
  Search,
  ExternalLink,
  ChevronRight,
  Sliders,
  RotateCcw,
  Zap,
  Timer,
  Check,
  ChevronUp,
  ChevronDown,
  X,
  Lock,
  Unlock,
  PlusCircle,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatDateTime,
  formatDate,
  formatTime,
  utcToZonedLocalInput,
  getTimezoneAbbr,
  getDurationString,
  getSessionTimingStatus,
} from "@/lib/datetime";
import { ADMIN_BASE_PATH } from "@/lib/constants";
import {
  updateSessionTimingAction,
  quickStartSessionAction,
  extendSessionTimeAction,
  toggleSessionAttendanceAction,
  toggleSessionRegistrationAction,
  updateSessionSpeakersAction,
  type TimeActionResult,
} from "./actions";

export type SerializedSpeaker = {
  id: string;
  name: string;
  title?: string | null;
  email?: string | null;
  photoUrl?: string | null;
  organization?: string | null;
  sortOrder?: number;
  sessions?: {
    id: string;
    title: string;
    slug: string;
    startTime: string;
    endTime: string;
    status: string;
  }[];
};

export type SerializedSession = {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  meetLink?: string | null;
  startTime: string;
  endTime: string;
  timezone: string;
  status: string;
  isActive: boolean;
  registrationOpen: boolean;
  attendanceOpen: boolean;
  attendanceStartTime: string | null;
  attendanceEndTime: string | null;
  sheetConnection: { id: string; name: string; spreadsheetId: string } | null;
  speakers: {
    id: string;
    name: string;
    title?: string | null;
    photoUrl?: string | null;
    sortOrder: number;
  }[];
  _count: {
    registrations: number;
    attendance: number;
  };
};

export function TimeManagementClient({
  sessions,
  speakers,
  connections,
  timezone: orgTimezone,
  orgName,
}: {
  sessions: SerializedSession[];
  speakers: SerializedSpeaker[];
  connections: { id: string; name: string }[];
  timezone: string;
  orgName: string;
}) {
  const router = useRouter();

  // Active view tab: "schedule" | "speakers" | "quick-presets"
  const [activeTab, setActiveTab] = useState<"schedule" | "speakers" | "quick-presets">("schedule");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "LIVE" | "UPCOMING" | "COMPLETED" | "ATTENDANCE_OPEN">("ALL");
  const [speakerFilter, setSpeakerFilter] = useState<string>("ALL");

  // Selected session for time editor dialog
  const [editingSession, setEditingSession] = useState<SerializedSession | null>(null);

  // Live real-time clock ticker
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Filtered sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = s.title.toLowerCase().includes(q);
        const matchesSlug = s.slug.toLowerCase().includes(q);
        const matchesSpeaker = s.speakers.some((sp) => sp.name.toLowerCase().includes(q));
        if (!matchesTitle && !matchesSlug && !matchesSpeaker) return false;
      }

      // Speaker filter
      if (speakerFilter !== "ALL") {
        if (!s.speakers.some((sp) => sp.id === speakerFilter)) return false;
      }

      // Status filter
      const timing = getSessionTimingStatus(s.startTime, s.endTime, now);
      if (statusFilter === "LIVE" && timing.status !== "LIVE") return false;
      if (statusFilter === "UPCOMING" && timing.status !== "UPCOMING") return false;
      if (statusFilter === "COMPLETED" && timing.status !== "COMPLETED") return false;
      if (statusFilter === "ATTENDANCE_OPEN" && !s.attendanceOpen) return false;

      return true;
    });
  }, [sessions, searchQuery, statusFilter, speakerFilter, now]);

  // Statistics counters
  const stats = useMemo(() => {
    let liveCount = 0;
    let upcoming24hCount = 0;
    let attendanceOpenCount = 0;
    const nowMs = now.getTime();
    const next24hMs = nowMs + 24 * 60 * 60 * 1000;

    for (const s of sessions) {
      const startMs = new Date(s.startTime).getTime();
      const endMs = new Date(s.endTime).getTime();

      if (nowMs >= startMs && nowMs <= endMs) liveCount++;
      if (startMs > nowMs && startMs <= next24hMs) upcoming24hCount++;
      if (s.attendanceOpen) attendanceOpenCount++;
    }

    return {
      total: sessions.length,
      live: liveCount,
      upcoming24h: upcoming24hCount,
      attendanceOpen: attendanceOpenCount,
    };
  }, [sessions, now]);

  // Quick Action handlers
  async function handleQuickStart(sessionId: string, durationMin: number = 60) {
    toast.loading("Starting live session...", { id: "quick-start" });
    const res = await quickStartSessionAction(sessionId, durationMin);
    if (res.error) {
      toast.error(res.error, { id: "quick-start" });
    } else {
      toast.success(res.message || "Session is now LIVE!", { id: "quick-start" });
      router.refresh();
    }
  }

  async function handleExtend(sessionId: string, minutes: number) {
    toast.loading(`Extending session by +${minutes}m...`, { id: "extend" });
    const res = await extendSessionTimeAction(sessionId, minutes);
    if (res.error) {
      toast.error(res.error, { id: "extend" });
    } else {
      toast.success(res.message || `Extended by ${minutes}m`, { id: "extend" });
      router.refresh();
    }
  }

  async function handleToggleAttendance(sessionId: string, currentState: boolean) {
    const newState = !currentState;
    toast.loading(newState ? "Opening attendance..." : "Closing attendance...", { id: "attendance" });
    const res = await toggleSessionAttendanceAction(sessionId, newState);
    if (res.error) {
      toast.error(res.error, { id: "attendance" });
    } else {
      toast.success(newState ? "Attendance verification is now OPEN" : "Attendance verification is CLOSED", { id: "attendance" });
      router.refresh();
    }
  }

  async function handleToggleRegistration(sessionId: string, currentState: boolean) {
    const newState = !currentState;
    const res = await toggleSessionRegistrationAction(sessionId, newState);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(newState ? "Registration is now OPEN" : "Registration is CLOSED");
      router.refresh();
    }
  }

  return (
    <div className="app-page space-y-6 font-sans">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="cgs" className="gap-1.5 py-0.5">
              <CalendarClock className="h-3.5 w-3.5 text-primary" />
              Schedule & Precision Timing
            </Badge>
            <Badge variant="outline" className="border-border bg-card/60 text-[11px] font-mono text-muted-foreground">
              {orgTimezone} ({getTimezoneAbbr(now, orgTimezone)})
            </Badge>
          </div>
          <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Time Management
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Precision scheduling, live session timer controls, speaker slot assignments, and attendance windows for {orgName}.
          </p>
        </div>

        {/* Live Dual Clocks */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary-muted/20 px-3.5 py-2 backdrop-blur-md">
            <div className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary"></span>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Org Clock ({getTimezoneAbbr(now, orgTimezone)})</p>
              <p className="font-mono text-sm font-bold text-foreground">
                {formatTime(now, orgTimezone)} <span className="text-[11px] font-normal text-muted-foreground">{formatDate(now, orgTimezone)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-border/80 bg-card/70 px-3.5 py-2 backdrop-blur-md">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Browser Local Time</p>
              <p className="font-mono text-sm font-medium text-foreground">
                {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border-border/80 bg-card/60 p-4 transition-all hover:bg-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Total Sessions</span>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-2 font-heading text-2xl font-bold text-foreground">{stats.total}</p>
          <p className="text-[11px] text-muted-foreground">Configured in portal</p>
        </Card>

        <Card className={`border-emerald-500/30 bg-emerald-500/5 p-4 transition-all hover:bg-emerald-500/10 ${stats.live > 0 ? "ring-1 ring-emerald-500/50" : ""}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Live Right Now</span>
            <div className="flex h-2 w-2 rounded-full bg-emerald-500"></div>
          </div>
          <p className="mt-2 font-heading text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.live}</p>
          <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80">Active broadcast slots</p>
        </Card>

        <Card className="border-blue-500/30 bg-blue-500/5 p-4 transition-all hover:bg-blue-500/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Next 24 Hours</span>
            <Radio className="h-4 w-4 text-blue-500" />
          </div>
          <p className="mt-2 font-heading text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.upcoming24h}</p>
          <p className="text-[11px] text-blue-600/80 dark:text-blue-400/80">Upcoming schedule</p>
        </Card>

        <Card className="border-border/80 bg-card/60 p-4 transition-all hover:bg-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Attendance Open</span>
            <CheckCircle2 className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-2 font-heading text-2xl font-bold text-foreground">{stats.attendanceOpen}</p>
          <p className="text-[11px] text-muted-foreground">Active verification portals</p>
        </Card>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3">
        <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card/60 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("schedule")}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "schedule"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
            }`}
          >
            <CalendarClock className="h-3.5 w-3.5" />
            Sessions Schedule & Time Setter
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("speakers")}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "speakers"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            Speaker Timetables ({speakers.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("quick-presets")}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "quick-presets"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            Quick Presets & Guide
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`${ADMIN_BASE_PATH}/sessions`}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            Session CRUD <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* TAB 1: SESSIONS SCHEDULE */}
      {activeTab === "schedule" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search session title or speaker..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 pl-9 text-xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Status Filter Chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                {(["ALL", "LIVE", "UPCOMING", "COMPLETED", "ATTENDANCE_OPEN"] as const).map((st) => (
                  <Button
                    key={st}
                    type="button"
                    variant={statusFilter === st ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(st)}
                    className="h-8 text-[11px] font-medium"
                  >
                    {st === "ALL" && "All Statuses"}
                    {st === "LIVE" && "🔴 Live Now"}
                    {st === "UPCOMING" && "Upcoming"}
                    {st === "COMPLETED" && "Completed"}
                    {st === "ATTENDANCE_OPEN" && "Attendance Open"}
                  </Button>
                ))}
              </div>
            </div>

            {/* Speaker Dropdown Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Speaker:</span>
              <Select value={speakerFilter} onValueChange={setSpeakerFilter}>
                <SelectTrigger className="h-8 w-44 text-xs">
                  <SelectValue placeholder="All Speakers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Speakers</SelectItem>
                  {speakers.map((sp) => (
                    <SelectItem key={sp.id} value={sp.id}>
                      {sp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Sessions List / Cards */}
          {filteredSessions.length === 0 ? (
            <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed border-border/80 bg-card/40">
              <CalendarClock className="h-10 w-10 text-muted-foreground/60 mb-3" />
              <h3 className="font-heading text-base font-semibold text-foreground">No sessions match your filters</h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                Try clearing your search query or selecting a different status filter.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 text-xs"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("ALL");
                  setSpeakerFilter("ALL");
                }}
              >
                Reset Filters
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredSessions.map((session) => {
                const timing = getSessionTimingStatus(session.startTime, session.endTime, now);
                const durationStr = getDurationString(session.startTime, session.endTime);
                const isLive = timing.status === "LIVE";

                return (
                  <Card
                    key={session.id}
                    className={`overflow-hidden border transition-all hover:shadow-lg ${
                      isLive
                        ? "border-emerald-500/60 bg-emerald-500/[0.03] shadow-emerald-500/10 shadow-md"
                        : "border-border/80 bg-card/75"
                    }`}
                  >
                    <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                      {/* Left: Session Info & Speakers */}
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${timing.badgeColor}`}>
                            {isLive && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500"></span>}
                            {timing.relativeText}
                          </span>

                          <Badge variant="outline" className="border-border text-[11px] font-mono text-muted-foreground">
                            {durationStr}
                          </Badge>

                          {session.attendanceOpen ? (
                            <Badge variant="cgs" className="bg-primary-muted text-primary text-[10px] font-bold uppercase">
                              Attendance OPEN
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-border text-[10px] text-muted-foreground">
                              Attendance Closed
                            </Badge>
                          )}

                          {session.sheetConnection && (
                            <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/5 text-[10px] text-emerald-600 dark:text-emerald-400">
                              Sheet: {session.sheetConnection.name}
                            </Badge>
                          )}
                        </div>

                        <div>
                          <h3 className="font-heading text-lg font-bold text-foreground">
                            {session.title}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-mono">/session/{session.slug}</span>
                            <Link
                              href={`/session/${session.slug}`}
                              target="_blank"
                              className="text-primary hover:underline inline-flex items-center gap-0.5"
                            >
                              View Public <ExternalLink className="h-2.5 w-2.5" />
                            </Link>
                          </div>
                        </div>

                        {/* Assigned Speakers Chips */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[11px] font-semibold text-muted-foreground">Speakers:</span>
                          {session.speakers.length === 0 ? (
                            <span className="text-[11px] italic text-muted-foreground/80">No speakers assigned</span>
                          ) : (
                            session.speakers.map((sp) => (
                              <span
                                key={sp.id}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary/40 px-2 py-0.5 text-xs font-medium text-foreground"
                              >
                                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary-muted text-[9px] font-bold text-primary">
                                  {sp.name.charAt(0)}
                                </span>
                                {sp.name}
                              </span>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Middle: Timing Box */}
                      <div className="flex flex-col gap-1 rounded-xl border border-border/80 bg-secondary/30 p-3.5 sm:min-w-[240px]">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-primary" />
                            Scheduled Time ({orgTimezone})
                          </span>
                          <span className="font-mono font-bold text-foreground">{durationStr}</span>
                        </div>
                        <p className="font-heading text-sm font-bold text-foreground">
                          {formatDate(session.startTime, orgTimezone)}
                        </p>
                        <p className="font-mono text-xs text-foreground/90">
                          {formatTime(session.startTime, orgTimezone)} — {formatTime(session.endTime, orgTimezone)}
                        </p>

                        {/* Attendance Window detail */}
                        <div className="mt-1 pt-1.5 border-t border-border/60 text-[10px] text-muted-foreground">
                          {session.attendanceStartTime && session.attendanceEndTime ? (
                            <span>
                              Window: {formatTime(session.attendanceStartTime, orgTimezone)} – {formatTime(session.attendanceEndTime, orgTimezone)}
                            </span>
                          ) : session.attendanceOpen ? (
                            <span className="text-emerald-500 font-medium">Always open when active</span>
                          ) : (
                            <span>Attendance currently locked</span>
                          )}
                        </div>
                      </div>

                      {/* Right: Quick Action Controls */}
                      <div className="flex flex-wrap items-center gap-2 lg:flex-col lg:items-end">
                        <Button
                          variant="cgs"
                          size="sm"
                          className="h-8 gap-1.5 font-semibold text-xs shadow-sm"
                          onClick={() => setEditingSession(session)}
                        >
                          <Sliders className="h-3.5 w-3.5" />
                          Set / Edit Timing
                        </Button>

                        <div className="flex items-center gap-1.5">
                          {/* Go Live Button */}
                          {!isLive && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1 text-[11px] border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                              onClick={() => handleQuickStart(session.id, 60)}
                            >
                              <Play className="h-3 w-3 fill-current" /> Go Live
                            </Button>
                          )}

                          {/* Extend Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1 text-[11px] border-border hover:bg-secondary"
                            onClick={() => handleExtend(session.id, 30)}
                            title="Extend end time by 30 minutes"
                          >
                            <Timer className="h-3 w-3" /> +30m
                          </Button>

                          {/* Toggle Attendance */}
                          <Button
                            variant="outline"
                            size="sm"
                            className={`h-8 gap-1 text-[11px] ${
                              session.attendanceOpen
                                ? "border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                                : "border-primary/30 text-primary hover:bg-primary-muted"
                            }`}
                            onClick={() => handleToggleAttendance(session.id, session.attendanceOpen)}
                          >
                            {session.attendanceOpen ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                            {session.attendanceOpen ? "Close Att" : "Open Att"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SPEAKER TIMETABLES */}
      {activeTab === "speakers" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading text-base font-bold text-foreground">Speaker Schedules & Slot Allocations</h3>
              <p className="text-xs text-muted-foreground">Select any keynote speaker to see their scheduled session timeline and adjust their speaking slots.</p>
            </div>
            <Link href={`${ADMIN_BASE_PATH}/speakers`}>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                <Users className="h-3.5 w-3.5" /> Manage Speaker Profiles
              </Button>
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {speakers.map((sp) => {
              const assignedSessions = sessions.filter((s) => s.speakers.some((rel) => rel.id === sp.id));

              return (
                <Card key={sp.id} className="overflow-hidden border-border/80 bg-card/75 p-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-muted font-heading text-base font-bold text-primary">
                          {sp.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-heading text-sm font-bold text-foreground">{sp.name}</h4>
                          <p className="text-[11px] text-muted-foreground">{sp.title || sp.organization || "Keynote Speaker"}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-border text-[10px]">
                        {assignedSessions.length} session{assignedSessions.length === 1 ? "" : "s"}
                      </Badge>
                    </div>

                    {/* Assigned Sessions List */}
                    <div className="space-y-1.5 pt-2 border-t border-border/60">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Speaking Timeline</span>
                      {assignedSessions.length === 0 ? (
                        <p className="text-xs italic text-muted-foreground/80 py-1">No sessions assigned yet</p>
                      ) : (
                        assignedSessions.map((s) => {
                          const timing = getSessionTimingStatus(s.startTime, s.endTime, now);
                          return (
                            <div
                              key={s.id}
                              className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-secondary/30 p-2 text-xs"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-foreground truncate">{s.title}</p>
                                <p className="font-mono text-[10px] text-muted-foreground">
                                  {formatDate(s.startTime, orgTimezone)} • {formatTime(s.startTime, orgTimezone)}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-[10px] font-semibold text-primary hover:bg-primary-muted"
                                onClick={() => setEditingSession(s)}
                              >
                                Edit Time
                              </Button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Assign to Session Quick Button */}
                  <div className="pt-3 mt-3 border-t border-border/60">
                    <AssignSpeakerDropdown
                      speaker={sp}
                      allSessions={sessions}
                      onAssigned={() => router.refresh()}
                    />
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: QUICK PRESETS & GUIDE */}
      {activeTab === "quick-presets" && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-border/80 bg-card p-5 space-y-4">
            <div>
              <h3 className="font-heading text-base font-bold text-foreground flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" /> Precision Timing Architecture
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                How CGS guarantees zero time shift across client browsers, serverless functions, and database storage.
              </p>
            </div>

            <div className="space-y-3 text-xs text-muted-foreground">
              <div className="rounded-xl border border-border/80 bg-secondary/30 p-3">
                <p className="font-semibold text-foreground">1. Anchored IANA Timezone</p>
                <p className="mt-0.5">
                  All dates are strictly converted according to the organization&apos;s configured timezone (<strong>{orgTimezone}</strong>). When you specify 8:00 PM, it is always interpreted as 8:00 PM in {orgTimezone}.
                </p>
              </div>

              <div className="rounded-xl border border-border/80 bg-secondary/30 p-3">
                <p className="font-semibold text-foreground">2. Iterative Bi-Directional Conversion</p>
                <p className="mt-0.5">
                  The server executes an iterative offset resolution algorithm to resolve wall-clock timestamps into exact UTC dates, preventing DST transitions or Vercel server timezone skew from altering the time.
                </p>
              </div>

              <div className="rounded-xl border border-border/80 bg-secondary/30 p-3">
                <p className="font-semibold text-foreground">3. Dual Clock Visibility</p>
                <p className="mt-0.5">
                  The Time Management console shows both Organization Wall-Clock Time and the administrator&apos;s Local Browser Time with live status updates.
                </p>
              </div>
            </div>
          </Card>

          <Card className="border-border/80 bg-card p-5 space-y-4">
            <div>
              <h3 className="font-heading text-base font-bold text-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" /> Live Timezone Summary
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">Current system-wide timezone and date configurations.</p>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between py-1.5 border-b border-border/60">
                <span className="text-muted-foreground">Organization Timezone:</span>
                <span className="font-bold text-foreground">{orgTimezone}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/60">
                <span className="text-muted-foreground">Abbreviation:</span>
                <span className="font-bold text-foreground">{getTimezoneAbbr(now, orgTimezone)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/60">
                <span className="text-muted-foreground">Current Org Time:</span>
                <span className="font-bold text-primary">{formatDateTime(now, orgTimezone)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/60">
                <span className="text-muted-foreground">Browser Local Time:</span>
                <span className="font-bold text-foreground">{now.toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-2">
              <Link href={`${ADMIN_BASE_PATH}/settings`}>
                <Button variant="outline" size="sm" className="w-full text-xs gap-1.5">
                  <Globe className="h-3.5 w-3.5" /> Adjust Organization Default Timezone in Settings
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      )}

      {/* PRECISION TIME & SPEAKER EDIT MODAL */}
      {editingSession && (
        <TimeEditDialog
          session={editingSession}
          allSpeakers={speakers}
          timezone={orgTimezone}
          onClose={() => setEditingSession(null)}
          onSaved={() => {
            setEditingSession(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Precision Time & Speaker Edit Dialog Component
// ---------------------------------------------------------------------------

function TimeEditDialog({
  session,
  allSpeakers,
  timezone,
  onClose,
  onSaved,
}: {
  session: SerializedSession;
  allSpeakers: SerializedSpeaker[];
  timezone: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Start & End Times in zoned local input format (YYYY-MM-DDTHH:mm)
  const initialStart = useMemo(() => utcToZonedLocalInput(session.startTime, timezone), [session.startTime, timezone]);
  const initialEnd = useMemo(() => utcToZonedLocalInput(session.endTime, timezone), [session.endTime, timezone]);

  const [startTimeStr, setStartTimeStr] = useState<string>(initialStart);
  const [endTimeStr, setEndTimeStr] = useState<string>(initialEnd);

  // Attendance Mode: "session_bound" | "custom" | "always_open" | "closed"
  const initialMode = session.attendanceStartTime && session.attendanceEndTime
    ? "custom"
    : session.attendanceOpen
    ? "session_bound"
    : "closed";

  const [attendanceMode, setAttendanceMode] = useState<"session_bound" | "custom" | "always_open" | "closed">(initialMode);
  const [attendanceStartTimeStr, setAttendanceStartTimeStr] = useState<string>(
    session.attendanceStartTime ? utcToZonedLocalInput(session.attendanceStartTime, timezone) : initialStart
  );
  const [attendanceEndTimeStr, setAttendanceEndTimeStr] = useState<string>(
    session.attendanceEndTime ? utcToZonedLocalInput(session.attendanceEndTime, timezone) : initialEnd
  );

  const [attendanceOpen, setAttendanceOpen] = useState(session.attendanceOpen);
  const [registrationOpen, setRegistrationOpen] = useState(session.registrationOpen);

  // Assigned Speakers (ordered array of speaker IDs)
  const [selectedSpeakerIds, setSelectedSpeakerIds] = useState<string[]>(
    session.speakers.map((s) => s.id)
  );

  // Quick Preset Helper
  function applyPreset(type: "today_8pm" | "today_7pm" | "tomorrow_8pm" | "start_now" | "plus_15m" | "plus_30m" | "plus_1h") {
    const pad = (n: number) => String(n).padStart(2, "0");
    const d = new Date();

    if (type === "today_8pm" || type === "today_7pm" || type === "tomorrow_8pm") {
      if (type === "tomorrow_8pm") {
        d.setDate(d.getDate() + 1);
      }
      const hour = type === "today_7pm" ? "19" : "20";
      const y = d.getFullYear();
      const m = pad(d.getMonth() + 1);
      const day = pad(d.getDate());

      const newStart = `${y}-${m}-${day}T${hour}:00`;
      const newEnd = `${y}-${m}-${day}T${pad(Number(hour) + 1)}:30`;
      setStartTimeStr(newStart);
      setEndTimeStr(newEnd);
      toast.success(`Preset applied: ${type.replace("_", " ")}`);
    } else if (type === "start_now") {
      const nowZoned = utcToZonedLocalInput(new Date(), timezone);
      const endZoned = utcToZonedLocalInput(new Date(Date.now() + 60 * 60 * 1000), timezone);
      setStartTimeStr(nowZoned);
      setEndTimeStr(endZoned);
      toast.success("Preset applied: Start Right Now (1 hour duration)");
    } else if (type === "plus_15m" || type === "plus_30m" || type === "plus_1h") {
      if (!endTimeStr) return;
      const [datePart, timePart] = endTimeStr.split("T");
      const [y, m, d] = datePart.split("-").map(Number);
      const [h, min] = timePart.split(":").map(Number);
      const addedMins = type === "plus_15m" ? 15 : type === "plus_30m" ? 30 : 60;

      const dateObj = new Date(y, m - 1, d, h, min + addedMins);
      const newEnd = `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}T${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}`;
      setEndTimeStr(newEnd);
      toast.success(`End time extended by +${addedMins}m`);
    }
  }

  // Speaker Reorder / Toggle
  function toggleSpeaker(id: string) {
    if (selectedSpeakerIds.includes(id)) {
      setSelectedSpeakerIds((prev) => prev.filter((item) => item !== id));
    } else {
      setSelectedSpeakerIds((prev) => [...prev, id]);
    }
  }

  function moveSpeaker(index: number, direction: "up" | "down") {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === selectedSpeakerIds.length - 1) return;

    const newArr = [...selectedSpeakerIds];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const temp = newArr[index];
    newArr[index] = newArr[targetIndex];
    newArr[targetIndex] = temp;
    setSelectedSpeakerIds(newArr);
  }

  // Submit
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const payload = {
      sessionId: session.id,
      startTimeStr,
      endTimeStr,
      timezone,
      attendanceMode,
      attendanceStartTimeStr: attendanceMode === "custom" ? attendanceStartTimeStr : undefined,
      attendanceEndTimeStr: attendanceMode === "custom" ? attendanceEndTimeStr : undefined,
      attendanceOpen: attendanceMode !== "closed",
      registrationOpen,
      speakerIds: selectedSpeakerIds,
    };

    const res: TimeActionResult = await updateSessionTimingAction(payload);
    setSubmitting(false);

    if (res.error) {
      setError(res.error);
      toast.error(res.error);
    } else {
      toast.success(res.message || "Schedule updated with zero time shift!");
      onSaved();
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto font-sans p-6">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge variant="cgs" className="gap-1 text-[11px]">
              <Clock className="h-3 w-3" /> Time & Speaker Configurator
            </Badge>
            <Badge variant="outline" className="border-border text-[11px] font-mono text-muted-foreground">
              {timezone}
            </Badge>
          </div>
          <DialogTitle className="font-heading text-xl font-bold text-foreground">
            Schedule: {session.title}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Set session start and end times, attendance verification windows, and assign speakers with 100% timezone accuracy.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {/* Quick Presets Bar */}
          <div className="rounded-xl border border-primary/20 bg-primary-muted/15 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Quick Timing Presets
              </span>
              <span className="text-[10px] text-muted-foreground">Instant 1-click scheduling</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Button type="button" variant="outline" size="sm" onClick={() => applyPreset("today_8pm")} className="h-7 text-[11px] bg-card/60">
                Today at 8:00 PM (1.5h)
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => applyPreset("today_7pm")} className="h-7 text-[11px] bg-card/60">
                Today at 7:00 PM (1.5h)
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => applyPreset("tomorrow_8pm")} className="h-7 text-[11px] bg-card/60">
                Tomorrow at 8:00 PM
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => applyPreset("start_now")} className="h-7 text-[11px] border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5">
                <Play className="h-2.5 w-2.5 fill-current mr-1" /> Start Now (1h)
              </Button>
            </div>
          </div>

          {/* Session Timing Fields */}
          <div className="space-y-3 rounded-xl border border-border/80 bg-card/50 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <CalendarClock className="h-3.5 w-3.5 text-primary" /> Session Broadcast Window ({timezone})
            </h4>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Start Date & Time ({timezone})</Label>
                <Input
                  type="datetime-local"
                  value={startTimeStr}
                  onChange={(e) => setStartTimeStr(e.target.value)}
                  className="h-10 text-xs font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">End Date & Time ({timezone})</Label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => applyPreset("plus_15m")}
                      className="text-[10px] font-semibold text-primary hover:underline"
                    >
                      +15m
                    </button>
                    <span className="text-muted-foreground">•</span>
                    <button
                      type="button"
                      onClick={() => applyPreset("plus_30m")}
                      className="text-[10px] font-semibold text-primary hover:underline"
                    >
                      +30m
                    </button>
                    <span className="text-muted-foreground">•</span>
                    <button
                      type="button"
                      onClick={() => applyPreset("plus_1h")}
                      className="text-[10px] font-semibold text-primary hover:underline"
                    >
                      +1h
                    </button>
                  </div>
                </div>
                <Input
                  type="datetime-local"
                  value={endTimeStr}
                  onChange={(e) => setEndTimeStr(e.target.value)}
                  className="h-10 text-xs font-mono"
                  required
                />
              </div>
            </div>
          </div>

          {/* Attendance Timing Configuration */}
          <div className="space-y-3 rounded-xl border border-border/80 bg-card/50 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Attendance Verification Window
            </h4>

            <div className="grid gap-2 sm:grid-cols-3">
              <label
                className={`flex cursor-pointer flex-col justify-between rounded-lg border p-3 text-xs transition-all ${
                  attendanceMode === "session_bound"
                    ? "border-primary bg-primary-muted/20 text-primary shadow-sm"
                    : "border-border/80 bg-secondary/30 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">Match Session Time</span>
                  <input
                    type="radio"
                    name="att_mode"
                    checked={attendanceMode === "session_bound"}
                    onChange={() => setAttendanceMode("session_bound")}
                    className="sr-only"
                  />
                  {attendanceMode === "session_bound" && <Check className="h-3.5 w-3.5 text-primary" />}
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">Opens at session start, closes at session end.</p>
              </label>

              <label
                className={`flex cursor-pointer flex-col justify-between rounded-lg border p-3 text-xs transition-all ${
                  attendanceMode === "custom"
                    ? "border-primary bg-primary-muted/20 text-primary shadow-sm"
                    : "border-border/80 bg-secondary/30 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">Custom Window</span>
                  <input
                    type="radio"
                    name="att_mode"
                    checked={attendanceMode === "custom"}
                    onChange={() => setAttendanceMode("custom")}
                    className="sr-only"
                  />
                  {attendanceMode === "custom" && <Check className="h-3.5 w-3.5 text-primary" />}
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">Specify exact separate start & end for attendance.</p>
              </label>

              <label
                className={`flex cursor-pointer flex-col justify-between rounded-lg border p-3 text-xs transition-all ${
                  attendanceMode === "closed"
                    ? "border-primary bg-primary-muted/20 text-primary shadow-sm"
                    : "border-border/80 bg-secondary/30 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">Attendance Locked</span>
                  <input
                    type="radio"
                    name="att_mode"
                    checked={attendanceMode === "closed"}
                    onChange={() => setAttendanceMode("closed")}
                    className="sr-only"
                  />
                  {attendanceMode === "closed" && <Check className="h-3.5 w-3.5 text-primary" />}
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">Attendance verification is disabled.</p>
              </label>
            </div>

            {/* Custom Attendance Window Pickers */}
            {attendanceMode === "custom" && (
              <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t border-border/60">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">Attendance Start Time</Label>
                  <Input
                    type="datetime-local"
                    value={attendanceStartTimeStr}
                    onChange={(e) => setAttendanceStartTimeStr(e.target.value)}
                    className="h-9 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">Attendance End Time</Label>
                  <Input
                    type="datetime-local"
                    value={attendanceEndTimeStr}
                    onChange={(e) => setAttendanceEndTimeStr(e.target.value)}
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Speaker Selection & Order */}
          <div className="space-y-3 rounded-xl border border-border/80 bg-card/50 p-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-primary" /> Keynote Speakers Assigned ({selectedSpeakerIds.length})
              </h4>
              <span className="text-[10px] text-muted-foreground">Check to assign, arrows to reorder</span>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 max-h-48 overflow-y-auto pr-1">
              {allSpeakers.map((speaker) => {
                const isSelected = selectedSpeakerIds.includes(speaker.id);
                const orderIndex = selectedSpeakerIds.indexOf(speaker.id);

                return (
                  <div
                    key={speaker.id}
                    className={`flex items-center justify-between rounded-lg border p-2.5 text-xs transition-all ${
                      isSelected
                        ? "border-primary/60 bg-primary-muted/20"
                        : "border-border/70 bg-secondary/20 hover:bg-secondary/40"
                    }`}
                  >
                    <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSpeaker(speaker.id)}
                        className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="font-semibold text-foreground truncate">{speaker.name}</span>
                    </label>

                    {isSelected && (
                      <div className="flex items-center gap-1 pl-2">
                        <span className="text-[10px] font-bold text-primary mr-1">#{orderIndex + 1}</span>
                        <button
                          type="button"
                          onClick={() => moveSpeaker(orderIndex, "up")}
                          disabled={orderIndex === 0}
                          className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSpeaker(orderIndex, "down")}
                          disabled={orderIndex === selectedSpeakerIds.length - 1}
                          className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Registration & Attendance Quick Toggles */}
          <div className="flex items-center justify-between rounded-xl border border-border/80 bg-card/50 p-4">
            <div>
              <p className="text-xs font-semibold text-foreground">Participant Registration</p>
              <p className="text-[11px] text-muted-foreground">Allow new students/participants to register for this session.</p>
            </div>
            <Switch checked={registrationOpen} onCheckedChange={setRegistrationOpen} />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="cgs" size="sm" className="font-semibold" disabled={submitting}>
              {submitting ? "Saving Schedule..." : "Save Session Timing & Speakers"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Assign Speaker Quick Dropdown Component
// ---------------------------------------------------------------------------

function AssignSpeakerDropdown({
  speaker,
  allSessions,
  onAssigned,
}: {
  speaker: SerializedSpeaker;
  allSessions: SerializedSession[];
  onAssigned: () => void;
}) {
  const [loading, setLoading] = useState(false);

  // Unassigned sessions
  const availableSessions = allSessions.filter((s) => !s.speakers.some((sp) => sp.id === speaker.id));

  async function handleAssign(sessionId: string) {
    if (!sessionId) return;
    setLoading(true);
    const targetSession = allSessions.find((s) => s.id === sessionId);
    if (!targetSession) return;

    const currentSpeakerIds = targetSession.speakers.map((sp) => sp.id);
    const newSpeakerIds = [...currentSpeakerIds, speaker.id];

    toast.loading(`Assigning ${speaker.name} to session...`, { id: "assign-sp" });
    const res = await updateSessionSpeakersAction(sessionId, newSpeakerIds);
    setLoading(false);

    if (res.error) {
      toast.error(res.error, { id: "assign-sp" });
    } else {
      toast.success(`${speaker.name} assigned to "${targetSession.title}"`, { id: "assign-sp" });
      onAssigned();
    }
  }

  return (
    <div className="space-y-1">
      <Select onValueChange={handleAssign} disabled={loading || availableSessions.length === 0}>
        <SelectTrigger className="h-8 text-xs bg-card/60">
          <SelectValue placeholder={availableSessions.length === 0 ? "Assigned to all sessions" : "+ Assign to another session"} />
        </SelectTrigger>
        <SelectContent>
          {availableSessions.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
