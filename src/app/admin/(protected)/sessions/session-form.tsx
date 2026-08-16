"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ADMIN_BASE_PATH } from "@/lib/constants";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { slugify, toLocalInputValue } from "@/lib/datetime";
import {
  createSessionAction,
  updateSessionAction,
  type SessionActionResult,
} from "./actions";

const formSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(5000).optional(),
  meetLink: z.string().trim().max(500).optional(),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  registrationOpen: z.boolean(),
  attendanceOpen: z.boolean(),
  sheetConnectionId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type SpeakerOption = { id: string; name: string };
type ConnectionOption = { id: string; name: string };

export function SessionForm({
  session,
  speakers,
  connections,
  onCancel,
}: {
  session?: {
    id: string;
    title: string;
    slug?: string;
    description: string | null;
    meetLink: string | null;
    startTime: Date;
    endTime: Date;
    registrationOpen: boolean;
    attendanceOpen: boolean;
    speakerIds: string[];
    sheetConnectionId: string | null;
  };
  speakers: SpeakerOption[];
  connections: ConnectionOption[];
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [speakerIds, setSpeakerIds] = useState<string[]>(
    session?.speakerIds ?? []
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: session?.title ?? "",
      description: session?.description ?? "",
      meetLink: session?.meetLink ?? "",
      startTime: session ? toLocalInputValue(session.startTime) : "",
      endTime: session ? toLocalInputValue(session.endTime) : "",
      registrationOpen: session?.registrationOpen ?? true,
      attendanceOpen: session?.attendanceOpen ?? true,
      sheetConnectionId: session?.sheetConnectionId ?? "",
    },
  });

  async function onSubmit(values: FormValues) {
    setError(null);
    setSubmitting(true);
    const fd = new FormData();
    fd.set("title", values.title);
    fd.set("description", values.description ?? "");
    fd.set("meetLink", values.meetLink ?? "");
    fd.set("startTime", values.startTime);
    fd.set("endTime", values.endTime);
    fd.set("registrationOpen", values.registrationOpen ? "on" : "off");
    fd.set("attendanceOpen", values.attendanceOpen ? "on" : "off");
    for (const id of speakerIds) {
      fd.append("speakerIds", id);
    }
    fd.set("sheetConnectionId", values.sheetConnectionId ?? "");

    const result: SessionActionResult = session
      ? await updateSessionAction(session.id, fd)
      : await createSessionAction(fd);
    if (result?.error) {
      setError(result.error);
      setSubmitting(false);
    } else {
      toast.success(session ? "Session details updated" : "New session created");
      setSubmitting(false);
      if (onCancel) {
        onCancel();
      } else {
        router.push(`${ADMIN_BASE_PATH}/sessions`);
      }
      router.refresh();
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 font-sans">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="sm:col-span-2 space-y-1">
                <FormLabel className="text-xs font-semibold">Session Title</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. Introduction to Cybersecurity"
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
            name="meetLink"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-xs font-semibold">Google Meet Joining URL</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://meet.google.com/abc-defg-hij"
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
            name="startTime"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-xs font-semibold">Start Date & Time</FormLabel>
                <FormControl>
                  <Input type="datetime-local" className="h-10 text-xs font-mono" {...field} />
                </FormControl>
                <FormDescription className="text-[11px]">Your local timezone</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-xs font-semibold">End Date & Time</FormLabel>
                <FormControl>
                  <Input type="datetime-local" className="h-10 text-xs font-mono" {...field} />
                </FormControl>
                <FormDescription className="text-[11px]">Your local timezone</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="sm:col-span-2 space-y-1">
                <FormLabel className="text-xs font-semibold">Session Overview & Agenda</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Provide a detailed summary of key topics, agendas, and prerequisites..."
                    rows={4}
                    className="text-xs"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="registrationOpen"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-xl border border-border bg-card/50 p-4">
                <div>
                  <FormLabel className="text-xs font-semibold">Registration Status</FormLabel>
                  <FormDescription className="text-[11px]">
                    Accept new participant registrations for this session.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="attendanceOpen"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-xl border border-border bg-card/50 p-4">
                <div>
                  <FormLabel className="text-xs font-semibold">Attendance Verification</FormLabel>
                  <FormDescription className="text-[11px]">
                    Allow participants to verify attendance on the portal.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="sheetConnectionId"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-xs font-semibold">Associated Google Sheet</FormLabel>
              <Select
                value={field.value || "none"}
                onValueChange={(v) => field.onChange(v === "none" ? "" : v)}
              >
                <FormControl>
                  <SelectTrigger className="h-10 text-xs">
                    <SelectValue placeholder="Select Google Sheet connection" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">None (Manual Registration)</SelectItem>
                  {connections.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription className="text-[11px]">
                Participant emails synced from this sheet will be eligible to mark attendance for this session.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <Label className="text-xs font-semibold">Assigned Speakers</Label>
          <p className="text-[11px] text-muted-foreground">Select keynote speakers presenting during this session.</p>
          <div className="grid gap-2 sm:grid-cols-2 pt-1">
            {speakers.map((speaker) => (
              <label
                key={speaker.id}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border/80 bg-card/60 px-3 py-2.5 text-xs transition-colors hover:bg-secondary/40 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary-muted"
              >
                <Checkbox
                  checked={speakerIds.includes(speaker.id)}
                  onCheckedChange={(checked) => {
                    setSpeakerIds((current) =>
                      checked
                        ? [...current, speaker.id]
                        : current.filter((id) => id !== speaker.id)
                    );
                  }}
                />
                <span className="font-semibold text-foreground">{speaker.name}</span>
              </label>
            ))}
            {speakers.length === 0 && (
              <p className="text-xs text-muted-foreground italic">
                No speaker profiles found. Add speakers under the Speakers tab first.
              </p>
            )}
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="py-2.5 text-xs">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={() => (onCancel ? onCancel() : window.history.back())}>
            Cancel
          </Button>
          <Button type="submit" variant="cgs" size="sm" className="font-semibold" disabled={submitting}>
            {submitting && <Loader2 className="animate-spin h-4 w-4 mr-1" />}
            {session ? "Save Changes" : "Create Session"}
          </Button>
        </div>
      </form>
    </Form>
  );
}