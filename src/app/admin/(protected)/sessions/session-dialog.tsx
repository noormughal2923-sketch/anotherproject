"use client";

import { CalendarPlus } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SessionForm } from "./session-form";

export function SessionDialog({
  open,
  onOpenChange,
  speakers,
  connections,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  speakers: { id: string; name: string }[];
  connections: { id: string; name: string }[];
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading text-xl font-bold text-foreground">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[image:var(--cgs-gradient)] text-white">
              <CalendarPlus className="h-4.5 w-4.5" />
            </span>
            Create New Session
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Schedule a new cybersecurity workshop, assign speakers and connect a Google Sheet for registrations.
          </DialogDescription>
        </DialogHeader>
        <SessionForm
          speakers={speakers}
          connections={connections}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}