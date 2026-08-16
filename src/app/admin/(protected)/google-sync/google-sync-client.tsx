"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Pencil, Plus, RefreshCcw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/datetime";
import {
  setConnectionActiveAction,
  syncNowAction,
  type ConnectionActionResult,
} from "./actions";
import { ConnectionDialog, type ConnectionFormData } from "./connection-dialog";

type ConnectionRow = {
  id: string;
  name: string;
  spreadsheetId: string;
  sheetName: string;
  isActive: boolean;
  lastSyncedAt: Date | null;
  _count: { sessions: number };
  latestRun: {
    id: string;
    status: string;
    startedAt: Date;
    rowsRead: number;
    createdCount: number;
    updatedCount: number;
    duplicateCount: number;
    invalidCount: number;
    errorMessage: string | null;
  } | null;
};

type SyncRunRow = {
  id: string;
  status: string;
  startedAt: Date;
  rowsRead: number;
  createdCount: number;
  updatedCount: number;
  duplicateCount: number;
  invalidCount: number;
  errorMessage: string | null;
  connection: { name: string };
};

export function GoogleSyncClient({
  connections,
  syncRuns,
  configured,
  timezone,
}: {
  connections: ConnectionRow[];
  syncRuns: SyncRunRow[];
  configured: boolean;
  timezone: string;
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ConnectionFormData | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  async function onSyncNow(id: string) {
    setSyncingId(id);
    const result: ConnectionActionResult = await syncNowAction(id);
    setSyncingId(null);
    if (result?.error) {
      toast.error(result.error);
    } else if (result?.success) {
      toast.success(result.success);
    }
    router.refresh();
  }

  return (
    <div className="app-page space-y-6 font-sans">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Badge variant="cgs" className="mb-1">Synchronization Engine</Badge>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Google Sheets Registration Sync
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Synchronize participant registrations from official Google Form spreadsheets into PostgreSQL.
          </p>
        </div>

        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
          variant="cgs"
          size="sm"
          className="gap-1 font-sans"
        >
          <Plus className="h-4 w-4" /> Add Sheet Connection
        </Button>
      </div>

      {!configured && (
        <Alert variant="warning" className="border-red-500/30 bg-red-500/10">
          <ShieldCheck className="h-5 w-5 text-red-400" />
          <AlertTitle className="font-heading font-bold text-red-300">Google Service Account Credentials Pending</AlertTitle>
          <AlertDescription className="text-xs text-red-200/90 font-sans mt-1">
            Configure <code className="rounded bg-slate-900 px-1 py-0.5 font-mono text-red-300">GOOGLE_SERVICE_ACCOUNT_EMAIL</code> and{" "}
            <code className="rounded bg-slate-900 px-1 py-0.5 font-mono text-red-300">GOOGLE_PRIVATE_KEY</code> in your environment to enable automated Google Sheets synchronization.
          </AlertDescription>
        </Alert>
      )}

      {/* Connection Cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {connections.length === 0 && (
          <Card className="lg:col-span-2 border-dashed border-border bg-card/40 p-12 text-center text-xs text-muted-foreground">
            No Google Sheet connections configured yet. Click &quot;Add Sheet Connection&quot; to link your registration form.
          </Card>
        )}

        {connections.map((c) => (
          <Card key={c.id} className={`border-border bg-card ${c.isActive ? "cgs-glow-card" : "opacity-60"}`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-heading font-bold text-lg text-foreground truncate">{c.name}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5 font-sans">
                    Sheet: <strong className="text-foreground">{c.sheetName}</strong> · Linked to {c._count.sessions} session{c._count.sessions === 1 ? "" : "s"}
                  </p>
                </div>

                <form action={setConnectionActiveAction.bind(null, c.id)}>
                  <input
                    type="hidden"
                    name="isActive"
                    value={c.isActive ? "false" : "true"}
                  />
                  <Button variant="ghost" size="sm" type="submit" className="h-8 text-xs">
                    {c.isActive ? "Disable" : "Enable"}
                  </Button>
                </form>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground border-t border-border/40 pt-3">
                <a
                  href={`https://docs.google.com/spreadsheets/d/${c.spreadsheetId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Open Spreadsheet
                </a>
                <span>·</span>
                <span>
                  Last synced:{" "}
                  <strong className="text-foreground font-mono">
                    {c.lastSyncedAt
                      ? formatDateTime(c.lastSyncedAt, timezone)
                      : "Never"}
                  </strong>
                </span>
              </div>

              {c.latestRun && (
                <div className="mt-4 rounded-xl border border-border/60 bg-secondary/30 p-3 text-xs">
                  {c.latestRun.status === "success" ? (
                    <div className="flex flex-wrap items-center justify-between gap-2 text-muted-foreground">
                      <span className="font-semibold text-foreground">Rows Read: {c.latestRun.rowsRead}</span>
                      <Badge variant="present">+{c.latestRun.createdCount} New</Badge>
                      <Badge variant="outline">Updated: {c.latestRun.updatedCount}</Badge>
                      <Badge variant="pending">Duplicates: {c.latestRun.duplicateCount}</Badge>
                    </div>
                  ) : (
                    <p className="text-red-400 font-semibold">
                      Last sync error: {c.latestRun.errorMessage ?? "Unknown failure"}
                    </p>
                  )}
                </div>
              )}

              <div className="mt-5 flex gap-2 pt-2 border-t border-border/40">
                <Button
                  size="sm"
                  variant="cgs"
                  onClick={() => onSyncNow(c.id)}
                  disabled={syncingId === c.id || !c.isActive}
                  className="gap-1 font-semibold"
                >
                  <RefreshCcw className={`h-4 w-4 ${syncingId === c.id ? "animate-spin" : ""}`} />
                  {syncingId === c.id ? "Synchronizing..." : "Sync Now"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditing({
                      id: c.id,
                      name: c.name,
                      spreadsheetId: c.spreadsheetId,
                      sheetName: c.sheetName,
                    });
                    setDialogOpen(true);
                  }}
                  className="h-9 text-xs"
                >
                  <Pencil className="h-3.5 w-3.5 mr-1" /> Edit Config
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sync History */}
      {syncRuns.length > 0 && (
        <div className="space-y-4 pt-4">
          <h2 className="font-heading text-lg font-bold text-foreground">Google Sync Execution History</h2>
          <Card className="overflow-hidden border-border bg-card">
            <div className="w-full overflow-x-auto">
              <Table>
              <TableHeader>
                <TableRow className="bg-secondary/30">
                  <TableHead>Connection</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Rows Read</TableHead>
                  <TableHead className="text-center">Created</TableHead>
                  <TableHead className="text-center">Updated</TableHead>
                  <TableHead className="text-center">Duplicates</TableHead>
                  <TableHead>Execution Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {syncRuns.map((r) => (
                  <TableRow key={r.id} className="hover:bg-secondary/30 transition-colors">
                    <TableCell className="font-semibold text-foreground text-xs">{r.connection.name}</TableCell>
                    <TableCell>
                      {r.status === "success" ? (
                        <Badge variant="success">Success</Badge>
                      ) : (
                        <Badge variant="destructive" title={r.errorMessage ?? ""}>Error</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center text-xs font-mono">{r.rowsRead}</TableCell>
                    <TableCell className="text-center text-xs font-mono text-blue-400 font-semibold">{r.createdCount}</TableCell>
                    <TableCell className="text-center text-xs font-mono">{r.updatedCount}</TableCell>
                    <TableCell className="text-center text-xs font-mono">{r.duplicateCount}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatDateTime(r.startedAt, timezone)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </Card>
        </div>
      )}

      <ConnectionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        connection={editing}
      />
    </div>
  );
}
