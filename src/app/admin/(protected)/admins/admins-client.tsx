"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { AdminDialog } from "./admin-dialog";
import { toggleAdminStatusAction, deleteAdminAction } from "./actions";

type AdminRow = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isActive: boolean;
  lastLoginLabel: string;
  createdAtLabel: string;
};

export function AdminsClient({
  admins,
  currentAdminId,
}: {
  admins: AdminRow[];
  currentAdminId: string;
}) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<AdminRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteAdminAction(deleteTarget.id);
      toast.success("Administrator account deleted");
      setDeleteTarget(null);
      router.refresh();
    } catch {
      toast.error("Could not delete the administrator");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="app-page max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <Badge variant="cgs" className="mb-1">Security & Access</Badge>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Administrator Accounts
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage system administrators, privilege roles, and active statuses.
          </p>
        </div>

        <AdminDialog />
      </div>

      <Card className="overflow-hidden border-border bg-card">
        <div className="w-full overflow-x-auto">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Administrator</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {admins.map((a) => {
              const isSelf = a.id === currentAdminId;
              return (
                <TableRow key={a.id}>
                  <TableCell>
                    <div className="font-medium text-foreground">{a.name || "CGS Admin"}</div>
                    <div className="text-xs text-muted-foreground">{a.email}</div>
                  </TableCell>
                  <TableCell>
                    {a.role === "SUPER_ADMIN" ? (
                      <Badge variant="cgs">Super Admin</Badge>
                    ) : (
                      <Badge variant="outline">Admin</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {a.isActive ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="destructive">Deactivated</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {a.lastLoginLabel}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {a.createdAtLabel}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {!isSelf && (
                        <>
                          <form action={toggleAdminStatusAction.bind(null, a.id)}>
                            <Button
                              variant="ghost"
                              size="sm"
                              type="submit"
                              className={a.isActive ? "text-red-400 hover:bg-red-500/10" : "text-blue-400"}
                            >
                              {a.isActive ? "Deactivate" : "Activate"}
                            </Button>
                          </form>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                            aria-label={`Delete ${a.name || a.email}`}
                            onClick={() => setDeleteTarget(a)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                      {isSelf && (
                        <span className="text-xs text-muted-foreground italic">(Your Account)</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        </div>
      </Card>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this administrator?"
        description={
          <>
            <span className="font-semibold text-foreground">{deleteTarget?.name || deleteTarget?.email}</span> will permanently lose access to the admin console. This action cannot be undone.
          </>
        }
        confirmLabel={deleting ? "Deleting..." : "Delete Account"}
        onConfirm={handleDelete}
      />
    </div>
  );
}