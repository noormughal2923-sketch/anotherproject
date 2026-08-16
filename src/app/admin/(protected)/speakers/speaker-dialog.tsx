"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  createSpeakerAction,
  updateSpeakerAction,
  type SpeakerActionResult,
} from "./actions";

const formSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  title: z.string().trim().max(120).optional(),
  email: z
    .union([z.email("Enter a valid email address"), z.literal("")])
    .optional(),
  bio: z.string().trim().max(2000).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export type SpeakerFormData = {
  id: string;
  name: string;
  title: string | null;
  email: string | null;
  bio: string | null;
};

export function SpeakerDialog({
  open,
  onOpenChange,
  speaker,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  speaker?: SpeakerFormData | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      title: "",
      email: "",
      bio: "",
    },
  });

  useEffect(() => {
    if (speaker) {
      form.reset({
        name: speaker.name,
        title: speaker.title ?? "",
        email: speaker.email ?? "",
        bio: speaker.bio ?? "",
      });
    } else {
      form.reset({ name: "", title: "", email: "", bio: "" });
    }
  }, [speaker, open, form]);

  function resetAndClose(openValue: boolean) {
    onOpenChange(openValue);
    if (!openValue) {
      setError(null);
    }
  }

  async function onSubmit(values: FormValues) {
    setError(null);
    const fd = new FormData();
    fd.set("name", values.name);
    fd.set("title", values.title ?? "");
    fd.set("email", values.email ?? "");
    fd.set("bio", values.bio ?? "");

    const result: SpeakerActionResult = speaker
      ? await updateSpeakerAction(speaker.id, fd)
      : await createSpeakerAction(fd);
    if (result?.error) {
      setError(result.error);
      return;
    }
    toast.success(speaker ? "Speaker profile updated" : "Speaker profile created");
    resetAndClose(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="font-sans sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading text-xl font-bold text-foreground">
            <UserCheck className="h-5 w-5 text-primary" />
            {speaker ? "Edit Speaker Profile" : "Add Keynote Speaker"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {speaker
              ? "Update this speaker's credentials and biography."
              : "Add a new speaker profile for assignment to cybersecurity sessions."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-xs font-semibold">Speaker Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Dr. Sarah Jenkins" className="h-10 text-xs" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-xs font-semibold">Title & Designation</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Principal Threat Analyst, CGS" className="h-10 text-xs" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-xs font-semibold">Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="speaker@example.com" className="h-10 text-xs" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-xs font-semibold">Biography</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Brief speaker bio..." rows={3} className="text-xs" {...field} />
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
                onClick={() => resetAndClose(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="cgs" size="sm" className="font-semibold">
                {speaker ? "Save Changes" : "Create Speaker"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
