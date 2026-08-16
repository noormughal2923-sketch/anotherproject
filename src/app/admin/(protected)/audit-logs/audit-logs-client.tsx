"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { formatDateTime } from "@/lib/datetime";
import { deleteAllAuditLogsAction } from "./actions";

type AuditLogRow = {
  id: string;
  createdAt: Date;
  action: string;
  targetType: string | null;
  ipAddress: string | null;
  reason: string | null;
  metadata: string | null;
  admin: { email: string; name: string | null } | null;
};

export function AuditLogsClient({
  logs,
  timezone,
}: {
  logs: AuditLogRow[];
  timezone: string;
}) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleClearAll = () => {
    startTransition(async () => {
      const res = await deleteAllAuditLogsAction();
      if (res.success) {
        toast.success(res.message);
        setConfirmOpen(false);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <div className="app-page max-w-6xl font-sans space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="cgs" className="mb-1">Security & Traceability</Badge>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            System Audit Logs
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Complete security event stream for administrative actions, manual overrides, and system changes.
          </p>
        </div>

        {logs.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            className="gap-1.5 text-xs font-semibold self-start sm:self-auto"
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear All Audit Logs
          </Button>
        )}
      </div>

      {/* Table Card */}
      <Card className="overflow-hidden border-border bg-card">
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/30">
                <TableHead>Timestamp</TableHead>
                <TableHead>Administrator</TableHead>
                <TableHead>Action Event</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Details / Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-xs text-muted-foreground">
                    No audit log entries recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-secondary/20 transition-colors">
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatDateTime(log.createdAt, timezone)}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-foreground">
                      {log.admin?.name || log.admin?.email || "System"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-wider">
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {log.targetType ? `${log.targetType}` : "—"}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {log.ipAddress || "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                      {log.reason || log.metadata || "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={(o) => !o && !isPending && setConfirmOpen(false)}>
        <DialogContent className="font-sans sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive mb-1">
              <AlertTriangle className="h-5 w-5" />
              <DialogTitle className="font-heading text-lg font-bold text-foreground">
                Clear All Audit Logs?
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to delete all recorded audit log entries?
              This action cannot be undone and will purge the entire administrative history stream.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClearAll}
              disabled={isPending}
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {isPending ? "Clearing Logs..." : "Permanently Clear All Logs"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
