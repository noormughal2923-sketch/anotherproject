"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatDateTime } from "@/lib/datetime";
import { ADMIN_BASE_PATH } from "@/lib/constants";
import { setSessionActiveAction, deleteSessionAction } from "./actions";
import { SessionDialog } from "./session-dialog";

type SessionRow = {
  id: string;
  title: string;
  slug: string;
  startTime: Date;
  endTime: Date;
  isActive: boolean;
  registrationOpen: boolean;
  attendanceOpen: boolean;
  sheetConnection: { id: string; name: string; spreadsheetId: string } | null;
  _count: { registrations: number; attendance: number };
};

export function SessionsClient({
  sessions,
  timezone,
  speakers,
  connections,
}: {
  sessions: SessionRow[];
  timezone: string;
  speakers: { id: string; name: string }[];
  connections: { id: string; name: string }[];
}) {
  const router = useRouter();
  const now = new Date();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SessionRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  function statusOf(s: { startTime: Date; endTime: Date }) {
    if (now >= s.startTime && now <= s.endTime) return "live";
    if (now < s.startTime) return "upcoming";
    return "completed";
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteSessionAction(deleteTarget.id);
      toast.success("Session deleted permanently");
      setDeleteTarget(null);
      router.refresh();
    } catch {
      toast.error("Could not delete the session");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="app-page space-y-6 font-sans">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Badge variant="cgs" className="mb-1">Session Lifecycle</Badge>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Sessions & Workshops
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Total {sessions.length} session{sessions.length === 1 ? "" : "s"} created in the platform.
          </p>
        </div>
        <Button variant="cgs" size="sm" className="font-sans font-semibold" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> Create New Session
        </Button>
      </div>

      <Card className="overflow-hidden border-border bg-card">
        <div className="w-full overflow-x-auto">
          <Table>
          <TableHeader>
            <TableRow className="bg-secondary/30">
              <TableHead>Session Title</TableHead>
              <TableHead>Start Time</TableHead>
              <TableHead>Status & Windows</TableHead>
              <TableHead className="text-center">Regs</TableHead>
              <TableHead className="text-center">Attd</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-xs text-muted-foreground font-sans">
                  No sessions created yet. Click &quot;Create New Session&quot; to get started.
                </TableCell>
              </TableRow>
            )}
            {sessions.map((s) => {
              const status = statusOf(s);
              return (
                <TableRow key={s.id} className={s.isActive ? "hover:bg-secondary/30 transition-colors" : "opacity-50"}>
                  <TableCell>
                    <div className="font-semibold text-foreground text-xs">{s.title}</div>
                    {s.sheetConnection && (
                      <a
                        href={`https://docs.google.com/spreadsheets/d/${s.sheetConnection.spreadsheetId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {s.sheetConnection.name}
                      </a>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatDateTime(s.startTime, timezone)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {!s.isActive ? (
                        <Badge variant="draft">Archived</Badge>
                      ) : status === "live" ? (
                        <Badge variant="live">● Live</Badge>
                      ) : status === "upcoming" ? (
                        <Badge variant="upcoming">Upcoming</Badge>
                      ) : (
                        <Badge variant="completed">Completed</Badge>
                      )}
                      {s.registrationOpen ? (
                        <Badge variant="success">Reg Open</Badge>
                      ) : (
                        <Badge variant="warning">Reg Closed</Badge>
                      )}
                      {s.attendanceOpen ? (
                        <Badge variant="cgs">Attd Open</Badge>
                      ) : (
                        <Badge variant="warning">Attd Closed</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-xs font-medium">{s._count.registrations}</TableCell>
                  <TableCell className="text-center text-xs font-medium">{s._count.attendance}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild variant="outline" size="sm" className="h-8 text-xs">
                        <Link href={`${ADMIN_BASE_PATH}/sessions/${s.id}`}>
                          <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                        </Link>
                      </Button>
                      <form action={setSessionActiveAction.bind(null, s.id)}>
                        <input type="hidden" name="isActive" value={s.isActive ? "false" : "true"} />
                        <Button variant="ghost" size="sm" type="submit" className="h-8 text-xs">
                          {s.isActive ? "Archive" : "Restore"}
                        </Button>
                      </form>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                        aria-label={`Delete ${s.title}`}
                        onClick={() => setDeleteTarget(s)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        </div>
      </Card>

      <SessionDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        speakers={speakers}
        connections={connections}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this session?"
        description={
          <>
            <span className="font-semibold text-foreground">{deleteTarget?.title}</span> will be permanently deleted along with its registrations and attendance records. This action cannot be undone.
          </>
        }
        confirmLabel={deleting ? "Deleting..." : "Delete Session"}
        onConfirm={handleDelete}
      />
    </div>
  );
}