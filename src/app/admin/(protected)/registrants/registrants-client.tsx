"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  UserRound,
  Download,
  Trash2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateTime } from "@/lib/datetime";
import { ADMIN_BASE_PATH } from "@/lib/constants";
import { deleteRegistrantAction, deleteAllRegistrantsAction } from "./actions";

type RegistrantRow = {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
  registrations: {
    id: string;
    registeredAt: Date;
    source: string;
    session: { id: string; title: string; startTime: Date };
  }[];
  attendance: {
    id: string;
    markedAt: Date;
    method: string;
    overrideReason: string | null;
    session: { id: string; title: string; startTime: Date };
  }[];
};

function buildUrl(q: string, sessionId: string, page: number) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (sessionId) params.set("sessionId", sessionId);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `${ADMIN_BASE_PATH}/registrants?${qs}` : `${ADMIN_BASE_PATH}/registrants`;
}

export function RegistrantsClient({
  users,
  total,
  page,
  pageSize,
  q,
  sessionId,
  sessions,
  timezone,
}: {
  users: RegistrantRow[];
  total: number;
  page: number;
  pageSize: number;
  q: string;
  sessionId: string;
  sessions: { id: string; title: string }[];
  timezone: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<RegistrantRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RegistrantRow | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkConfirmText, setBulkConfirmText] = useState("");
  const [isPending, startTransition] = useTransition();

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const exportUrl = `/api/admin/export?type=registrants${sessionId ? `&sessionId=${sessionId}` : ""}`;

  const handleDeleteSingle = (target: RegistrantRow) => {
    startTransition(async () => {
      const res = await deleteRegistrantAction(target.id);
      if (res.success) {
        toast.success(res.message);
        setDeleteTarget(null);
        if (selected?.id === target.id) {
          setSelected(null);
        }
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  const handleDeleteAll = () => {
    if (bulkConfirmText.trim().toUpperCase() !== "DELETE ALL") {
      toast.error("Please type 'DELETE ALL' to confirm bulk deletion.");
      return;
    }
    startTransition(async () => {
      const res = await deleteAllRegistrantsAction();
      if (res.success) {
        toast.success(res.message);
        setBulkDeleteOpen(false);
        setBulkConfirmText("");
        setSelected(null);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <div className="app-page space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="cgs" className="mb-1">Participant Records</Badge>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Registrants Directory
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Total {total} participant{total === 1 ? "" : "s"} registered in the platform database.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {total > 0 && (
            <Button
              variant="destructive"
              size="sm"
              className="gap-1.5 text-xs font-semibold"
              onClick={() => {
                setBulkConfirmText("");
                setBulkDeleteOpen(true);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete All Registrants
            </Button>
          )}
          <Button asChild variant="outline" size="sm" className="gap-2 font-sans text-xs">
            <a href={exportUrl} download>
              <Download className="h-4 w-4 text-primary" /> Export CSV
            </a>
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <form
        method="get"
        action={`${ADMIN_BASE_PATH}/registrants`}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Search by participant email or full name..."
            className="pl-9 h-10 text-xs"
          />
        </div>
        <div className="sm:w-64">
          <Select
            name="sessionId"
            value={sessionId || "all"}
            onValueChange={(v) => {
              const url = buildUrl(q, v === "all" ? "" : v, 1);
              window.location.href = url;
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
            <Link href={`${ADMIN_BASE_PATH}/registrants`}>Clear</Link>
          </Button>
        )}
      </form>

      {/* Table Card */}
      <Card className="overflow-hidden border-border bg-card">
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/30">
                <TableHead>Participant</TableHead>
                <TableHead>Email Address</TableHead>
                <TableHead className="text-center">Registered Sessions</TableHead>
                <TableHead className="text-center">Attended Sessions</TableHead>
                <TableHead>First Registered</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-12 text-center text-xs text-muted-foreground font-sans"
                  >
                    No registrants match your search filter criteria.
                  </TableCell>
                </TableRow>
              )}
              {users.map((user) => (
                <TableRow
                  key={user.id}
                  className="cursor-pointer hover:bg-secondary/30 transition-colors"
                  onClick={() => setSelected(user)}
                >
                  <TableCell className="font-semibold text-foreground text-xs">
                    {user.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">
                    {user.email}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="text-xs">
                      {user.registrations.length}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={user.attendance.length > 0 ? "present" : "pending"}
                      className="text-xs"
                    >
                      {user.attendance.length}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDateTime(user.createdAt, timezone)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(user);
                      }}
                      title={`Delete ${user.email}`}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
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

      {/* Single Registrant Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && !isPending && setDeleteTarget(null)}>
        <DialogContent className="font-sans sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive mb-1">
              <AlertTriangle className="h-5 w-5" />
              <DialogTitle className="font-heading text-lg font-bold text-foreground">
                Confirm Registrant Deletion
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to delete participant <strong className="text-foreground">{deleteTarget?.email}</strong>?
              This will permanently remove their profile, session registrations, and verified attendance logs.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteTarget(null)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleteTarget && handleDeleteSingle(deleteTarget)}
              disabled={isPending}
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {isPending ? "Deleting..." : "Permanently Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete All Registrants Confirmation Dialog */}
      <Dialog open={bulkDeleteOpen} onOpenChange={(o) => !o && !isPending && setBulkDeleteOpen(false)}>
        <DialogContent className="font-sans sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive mb-1">
              <AlertTriangle className="h-6 w-6" />
              <DialogTitle className="font-heading text-xl font-bold text-foreground">
                Delete ALL Registrants?
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground space-y-2">
              <span className="block text-destructive font-semibold">
                WARNING: This action is irreversible!
              </span>
              <span className="block">
                This will delete <strong>ALL {total} registrants</strong>, their session registrations, and attendance history from the database.
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 pt-2">
            <p className="text-xs font-medium text-foreground">
              To confirm, type <span className="font-mono font-bold text-destructive">DELETE ALL</span> in the field below:
            </p>
            <Input
              value={bulkConfirmText}
              onChange={(e) => setBulkConfirmText(e.target.value)}
              placeholder="DELETE ALL"
              className="h-10 text-sm font-mono"
              disabled={isPending}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setBulkDeleteOpen(false);
                setBulkConfirmText("");
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteAll}
              disabled={isPending || bulkConfirmText.trim().toUpperCase() !== "DELETE ALL"}
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {isPending ? "Deleting All Registrants..." : "Permanently Delete All"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Registrant Detail Modal */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto font-sans sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <DialogTitle className="flex items-center gap-2 font-heading text-xl font-bold text-foreground">
                <UserRound className="h-5 w-5 text-primary" />
                {selected?.name ?? selected?.email}
              </DialogTitle>
            </div>
          </DialogHeader>

          {selected && (
            <div className="space-y-6 pt-2 text-xs">
              <div className="rounded-xl border border-border/80 bg-secondary/30 p-3 space-y-1">
                <p className="font-semibold text-foreground">{selected.email}</p>
                <p className="text-muted-foreground">Registered since: {formatDateTime(selected.createdAt, timezone)}</p>
              </div>

              <div>
                <h3 className="font-heading font-bold text-sm text-foreground mb-2">
                  Session Registrations ({selected.registrations.length})
                </h3>
                {selected.registrations.length === 0 ? (
                  <p className="text-muted-foreground italic">Not registered for any sessions.</p>
                ) : (
                  <ul className="space-y-2">
                    {selected.registrations.map((r) => (
                      <li
                        key={r.id}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-border/60 bg-card"
                      >
                        <span className="font-semibold text-foreground truncate">{r.session.title}</span>
                        <Badge variant="outline" className="text-[10px]">{r.source}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h3 className="font-heading font-bold text-sm text-foreground mb-2">
                  Verified Attendance Log ({selected.attendance.length})
                </h3>
                {selected.attendance.length === 0 ? (
                  <p className="text-muted-foreground italic">No attendance records found.</p>
                ) : (
                  <ul className="space-y-2">
                    {selected.attendance.map((a) => (
                      <li key={a.id} className="p-2.5 rounded-lg border border-border/60 bg-card space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground truncate">{a.session.title}</span>
                          {a.method === "manual-override" ? (
                            <Badge variant="excused">Manual Override</Badge>
                          ) : (
                            <Badge variant="present">Verified Portal</Badge>
                          )}
                        </div>
                        {a.overrideReason && (
                          <p className="text-[11px] text-muted-foreground italic">
                            Reason: {a.overrideReason}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="border-t border-border/60 pt-4 flex justify-end">
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => {
                    const target = selected;
                    setSelected(null);
                    setDeleteTarget(target);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete This Registrant
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
