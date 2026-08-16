"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  createConnectionAction,
  updateConnectionAction,
  type ConnectionActionResult,
} from "./actions";

const formSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  spreadsheetId: z.string().trim().min(1, "Spreadsheet ID is required").max(200),
  sheetName: z.string().trim().min(1, "Worksheet name is required").max(200),
});

type FormValues = z.infer<typeof formSchema>;

export type ConnectionFormData = {
  id: string;
  name: string;
  spreadsheetId: string;
  sheetName: string;
};

export function ConnectionDialog({
  open,
  onOpenChange,
  connection,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connection?: ConnectionFormData | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: connection?.name ?? "",
      spreadsheetId: connection?.spreadsheetId ?? "",
      sheetName: connection?.sheetName ?? "Form Responses 1",
    },
  });

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
    fd.set("spreadsheetId", values.spreadsheetId);
    fd.set("sheetName", values.sheetName);

    const result: ConnectionActionResult = connection
      ? await updateConnectionAction(connection.id, fd)
      : await createConnectionAction(fd);
    if (result?.error) {
      setError(result.error);
      return;
    }
    resetAndClose(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {connection ? "Edit connection" : "Add Google Sheet connection"}
          </DialogTitle>
          <DialogDescription>
            Link a Google Form responses sheet that will sync registrations into
            the database.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Intro to Cybersecurity registrations" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="spreadsheetId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Spreadsheet ID</FormLabel>
                  <FormControl>
                    <Input placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms" {...field} />
                  </FormControl>
                  <FormDescription>
                    The long ID in your spreadsheet URL between /d/ and /edit.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sheetName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Worksheet name</FormLabel>
                  <FormControl>
                    <Input placeholder="Form Responses 1" {...field} />
                  </FormControl>
                  <FormDescription>
                    Usually &quot;Form Responses 1&quot; for Google Form sheets.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => resetAndClose(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {connection ? "Save changes" : "Add connection"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}