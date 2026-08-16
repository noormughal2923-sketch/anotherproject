"use client";

import { useActionState, startTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { saveSettingsAction, type SettingsActionResult } from "./actions";

const formSchema = z.object({
  orgName: z.string().trim().min(1, "Organization name is required").max(120),
  timezone: z.string().trim().min(1, "Timezone is required").max(80),
  portalOpen: z.boolean(),
  registrationOpen: z.boolean(),
  attendanceOpen: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export function SettingsForm({
  orgName,
  timezone,
  portalOpen,
  registrationOpen,
  attendanceOpen,
}: FormValues) {
  const [state, formAction, pending] = useActionState<
    SettingsActionResult,
    FormData
  >(saveSettingsAction, undefined);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      orgName,
      timezone,
      portalOpen,
      registrationOpen,
      attendanceOpen,
    },
  });

  function onSubmit(values: FormValues) {
    const fd = new FormData();
    fd.set("orgName", values.orgName);
    fd.set("timezone", values.timezone);
    fd.set("portalOpen", values.portalOpen ? "on" : "off");
    fd.set("registrationOpen", values.registrationOpen ? "on" : "off");
    fd.set("attendanceOpen", values.attendanceOpen ? "on" : "off");
    startTransition(() => {
      formAction(fd);
    });
    toast.success("Global portal settings updated");
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 font-sans">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="orgName"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-xs font-semibold">Organization Title</FormLabel>
                <FormControl>
                  <Input className="h-10 text-xs font-semibold" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="timezone"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-xs font-semibold">Default Timezone</FormLabel>
                <FormControl>
                  <Input placeholder="Asia/Karachi" className="h-10 text-xs font-mono" {...field} />
                </FormControl>
                <FormDescription className="text-[11px]">
                  IANA Timezone identifier used across session displays (Default: Asia/Karachi).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-3">
          <FormField
            control={form.control}
            name="portalOpen"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-xl border border-border bg-card/50 p-4">
                <div>
                  <FormLabel className="text-xs font-semibold">Public Portal Online</FormLabel>
                  <FormDescription className="text-[11px]">
                    Master kill-switch. When toggled OFF, the public website and attendance flow are disabled.
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
            name="registrationOpen"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-xl border border-border bg-card/50 p-4">
                <div>
                  <FormLabel className="text-xs font-semibold">Global Registration Open</FormLabel>
                  <FormDescription className="text-[11px]">
                    Global master switch for accepting new participant registrations.
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
                  <FormLabel className="text-xs font-semibold">Global Attendance Open</FormLabel>
                  <FormDescription className="text-[11px]">
                    Global master switch for verifying attendance through the participant portal.
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

        {state?.error && (
          <Alert variant="destructive" className="py-2.5 text-xs">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}
        {state?.success && (
          <Alert variant="info" className="py-2.5 text-xs">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>{state.success}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end pt-2">
          <Button type="submit" variant="cgs" size="sm" className="font-semibold" disabled={pending}>
            {pending && <Loader2 className="animate-spin h-4 w-4 mr-1" />}
            {pending ? "Saving Config..." : "Save Settings"}
          </Button>
        </div>
      </form>
    </Form>
  );
}