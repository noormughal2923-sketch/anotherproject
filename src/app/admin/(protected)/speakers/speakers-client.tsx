"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
import { SpeakerDialog, type SpeakerFormData } from "./speaker-dialog";
import { setSpeakerActiveAction, deleteSpeakerAction } from "./actions";

type SpeakerRow = SpeakerFormData & {
  isActive: boolean;
  _count: { sessions: number };
};

export function SpeakersClient({
  speakers,
}: {
  speakers: SpeakerRow[];
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SpeakerFormData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SpeakerRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteSpeakerAction(deleteTarget.id);
      toast.success("Speaker profile deleted");
      setDeleteTarget(null);
      router.refresh();
    } catch {
      toast.error("Could not delete the speaker");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="app-page space-y-6 font-sans">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Badge variant="cgs" className="mb-1">Directory</Badge>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Keynote & Workshop Speakers
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Total {speakers.length} expert cybersecurity speaker profile{speakers.length === 1 ? "" : "s"}.
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
          <Plus className="h-4 w-4" /> Add Speaker Profile
        </Button>
      </div>

      <Card className="overflow-hidden border-border bg-card">
        <div className="w-full overflow-x-auto">
          <Table>
          <TableHeader>
            <TableRow className="bg-secondary/30">
              <TableHead>Speaker Name</TableHead>
              <TableHead>Designation & Title</TableHead>
              <TableHead>Contact Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Assigned Sessions</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {speakers.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-12 text-center text-xs text-muted-foreground font-sans"
                >
                  No speaker profiles added yet. Click &quot;Add Speaker Profile&quot; to get started.
                </TableCell>
              </TableRow>
            )}
            {speakers.map((speaker) => (
              <TableRow key={speaker.id} className={speaker.isActive ? "hover:bg-secondary/30 transition-colors" : "opacity-50"}>
                <TableCell className="font-semibold text-foreground text-xs">{speaker.name}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {speaker.title ?? "—"}
                </TableCell>
                <TableCell className="text-xs font-mono text-muted-foreground">
                  {speaker.email ?? "—"}
                </TableCell>
                <TableCell>
                  {speaker.isActive ? (
                    <Badge variant="success">Active</Badge>
                  ) : (
                    <Badge variant="draft">Inactive</Badge>
                  )}
                </TableCell>
                <TableCell className="text-center font-medium text-xs">
                  <Badge variant="outline">{speaker._count.sessions}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => {
                        setEditing({
                          id: speaker.id,
                          name: speaker.name,
                          title: speaker.title,
                          email: speaker.email,
                          bio: speaker.bio,
                        });
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                    <form action={setSpeakerActiveAction.bind(null, speaker.id)}>
                      <input
                        type="hidden"
                        name="isActive"
                        value={speaker.isActive ? "false" : "true"}
                      />
                      <Button variant="ghost" size="sm" type="submit" className="h-8 text-xs">
                        {speaker.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    </form>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                      aria-label={`Delete ${speaker.name}`}
                      onClick={() => setDeleteTarget(speaker)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </Card>

      <SpeakerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        speaker={editing}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this speaker?"
        description={
          <>
            <span className="font-semibold text-foreground">{deleteTarget?.name}</span> will be permanently removed and unassigned from all sessions. This action cannot be undone.
          </>
        }
        confirmLabel={deleting ? "Deleting..." : "Delete Speaker"}
        onConfirm={handleDelete}
      />
    </div>
  );
}
