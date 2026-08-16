"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronLeft, ChevronRight, Plus, Search, Trash2, Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { formatDateTime } from "@/lib/datetime";
import { ADMIN_BASE_PATH } from "@/lib/constants";
import {
  markAttendanceOverrideAction,
  removeAttendanceAction,
  type OverrideActionResult,
} from "./actions";

const overrideSchema = z.object({
  sessionId: z.string().min(1, "Session is required"),
  email: z.string().email("Enter a valid email address"),
  reason: z
    .string()
    .trim()
    .min(10, "A reason is required (at least 10 characters)")
    .max(1000),
});

type OverrideValues = z.infer<typeof overrideSchema>;

type AttendanceRow = {
  id: string;
  markedAt: Date;
  method: string;
  overrideReason: string | null;
  user: { id: string; email: string; name: string | null };
  session: { id: string; title: string };
};

function buildUrl(q: string, sessionId: string, page: number) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (sessionId) params.set("sessionId", sessionId);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `${ADMIN_BASE_PATH}/attendance?${qs}` : `${ADMIN_BASE_PATH}/attendance`;
}

export function AttendanceClient({
  records,
  total,
  registrations,
  attendanceRate,
  totalRegistrations,
  page,
  pageSize,
  q,
  sessionId,
  sessions,
  timezone,
}: {
  records: AttendanceRow[];
  total: number;
  registrations: number;
  attendanceRate: number;
  totalRegistrations: number;
  page: number;
  pageSize: number;
  q: string;
  sessionId: string;
  sessions: { id: string; title: string }[];
  timezone: string;
}) {
  const router = useRouter();
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const exportUrl = `/api/admin/export?type=attendance${sessionId ? `&sessionId=${sessionId}` : ""}`;

  const form = useForm<OverrideValues>({
    resolver: zodResolver(overrideSchema),
    defaultValues: {
      sessionId: sessionId || "",
      email: "",
      reason: "",
    },
  });

  async function onOverride(values: OverrideValues) {
    setError(null);
    const fd = new FormData();
    fd.set("sessionId", values.sessionId);
    fd.set("email", values.email);
    fd.set("reason", values.reason);
    const result: OverrideActionResult = await markAttendanceOverrideAction(fd);
    if (result?.error) {
      setError(result.error);
      return;
    }
    toast.success("Attendance override created successfully");
    setOverrideOpen(false);
    form.reset();
    router.refresh();
  }

  return (
    <div className="app-page space-y-6 font-sans">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Badge variant="cgs" className="mb-1">Attendance Ledger</Badge>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Attendance Verification Records
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Total {total} verified attendance record{total === 1 ? "" : "s"} across active CGS sessions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm" className="gap-2 font-sans">
            <a href={exportUrl} download>
            <Download className="h-4 w-4 text-primary" /> Export CSV
            </a>
          </Button>
          <Button onClick={() => setOverrideOpen(true)} variant="cgs" size="sm" className="gap-1 font-sans">
            <Plus className="h-4 w-4" /> Manual Override
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5 border-border bg-card">
          <p className="text-xs font-semibold text-muted-foreground">Verified Present</p>
          <p className="font-heading text-3xl font-extrabold text-blue-400 mt-1">{total}</p>
        </Card>
        <Card className="p-5 border-border bg-card">
          <p className="text-xs font-semibold text-muted-foreground">
            {sessionId ? "Registrations (Filtered)" : "Total Registrations"}
          </p>
          <p className="font-heading text-3xl font-extrabold text-foreground mt-1">
            {sessionId ? registrations : totalRegistrations}
          </p>
        </Card>
        <Card className="p-5 border-border bg-card">
          <p className="text-xs font-semibold text-muted-foreground">Attendance Completion Rate</p>
          <p className="mt-1 font-heading text-3xl font-extrabold text-primary">{attendanceRate}%</p>
        </Card>
      </div>

      {/* Filter Bar */}
      <form
        method="get"
        action={`${ADMIN_BASE_PATH}/attendance`}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Search by participant email or name..."
            className="pl-9 h-10 text-xs"
          />
        </div>
        <div className="sm:w-64">
          <Select
            name="sessionId"
            value={sessionId || "all"}
            onValueChange={(v) => {
              window.location.href = buildUrl(q, v === "all" ? "" : v, 1);
            }}
          >
            <SelectTrigger className="h-10 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sessions</SelectItem>
              {sessions.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" variant="cgs" className="h-10 text-xs font-semibold">Search</Button>
        {(q || sessionId) && (
          <Button asChild variant="ghost" className="h-10 text-xs">
            <Link href={`${ADMIN_BASE_PATH}/attendance`}>Clear</Link>
          </Button>
        )}
      </form>

      {/* Attendance Table */}
      <Card className="overflow-hidden border-border bg-card">
        <div className="w-full overflow-x-auto">
          <Table>
          <TableHeader>
            <TableRow className="bg-secondary/30">
              <TableHead>Participant</TableHead>
              <TableHead>Session Title</TableHead>
              <TableHead>Marked Timestamp</TableHead>
              <TableHead>Verification Method</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-12 text-center text-xs text-muted-foreground font-sans"
                >
                  No attendance verification records match your search.
                </TableCell>
              </TableRow>
            )}
            {records.map((r) => (
              <TableRow key={r.id} className="hover:bg-secondary/30 transition-colors">
                <TableCell>
                  <div className="font-semibold text-foreground text-xs">{r.user.name ?? "—"}</div>
                  <div className="text-[11px] text-muted-foreground font-mono">
                    {r.user.email}
                  </div>
                </TableCell>
                <TableCell className="text-xs font-medium text-foreground">{r.session.title}</TableCell>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                  {formatDateTime(r.markedAt, timezone)}
                </TableCell>
                <TableCell>
                  {r.method === "manual-override" ? (
                    <Badge variant="excused" title={r.overrideReason ?? ""}>
                      Manual Override
                    </Badge>
                  ) : (
                    <Badge variant="present">Verified Portal</Badge>
                  )}
                  {r.overrideReason && (
                    <p className="mt-1 text-[11px] text-muted-foreground italic line-clamp-1 max-w-xs">
                      Reason: {r.overrideReason}
                    </p>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <form action={removeAttendanceAction.bind(null, r.id)}>
                    <Button
                      variant="ghost"
                      size="sm"
                      type="submit"
                      className="text-red-400 hover:bg-red-500/10 h-8 w-8 p-0"
                      title={
                        r.method === "manual-override"
                          ? "Remove override record"
                          : "Remove attendance record"
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </form>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <p>
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Button asChild variant="outline" size="sm">
                <Link href={buildUrl(q, sessionId, page - 1)}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Link>
              </Button>
            )}
            {page < totalPages && (
              <Button asChild variant="outline" size="sm">
                <Link href={buildUrl(q, sessionId, page + 1)}>
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Manual Override Modal */}
      <Dialog open={overrideOpen} onOpenChange={setOverrideOpen}>
        <DialogContent className="font-sans sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl font-bold text-foreground">
              Manual Attendance Override
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Manually mark attendance for a registered participant outside the portal window. An audit reason is required.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onOverride)} className="space-y-4 pt-2">
              <FormField
                control={form.control}
                name="sessionId"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs font-semibold">Select Session</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="h-10 text-xs">
                          <SelectValue placeholder="Select target session" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sessions.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs font-semibold">Registrant Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="participant@example.com"
                        className="h-10 text-xs"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs font-semibold">Audit Override Reason</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="State reason (at least 10 characters)... e.g. Joined live Meet call directly via shared calendar invite"
                        rows={3}
                        className="text-xs"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && (
                <Alert variant="destructive" className="py-2 text-xs">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOverrideOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="cgs" size="sm" className="font-semibold">
                  Confirm Override
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
