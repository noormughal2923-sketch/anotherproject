"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { connectionSchema } from "@/lib/validation";
import { syncConnection } from "@/lib/google-sheets";

export type ConnectionActionResult =
  | { error?: string; success?: string }
  | undefined;

export async function createConnectionAction(
  formData: FormData
): Promise<ConnectionActionResult> {
  await requireAdmin();
  const parsed = connectionSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    spreadsheetId: String(formData.get("spreadsheetId") ?? ""),
    sheetName: String(formData.get("sheetName") ?? ""),
  });
  if (!parsed.success) {
    return { error: "Please fill in all fields correctly." };
  }
  try {
    await prisma.googleSheetConnection.create({ data: parsed.data });
  } catch {
    return { error: "Could not create the connection. Please try again." };
  }
  revalidatePath("/admin/google-sync");
  return { success: "Connection added." };
}

export async function updateConnectionAction(
  id: string,
  formData: FormData
): Promise<ConnectionActionResult> {
  await requireAdmin();
  const parsed = connectionSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    spreadsheetId: String(formData.get("spreadsheetId") ?? ""),
    sheetName: String(formData.get("sheetName") ?? ""),
  });
  if (!parsed.success) {
    return { error: "Please fill in all fields correctly." };
  }
  const existing = await prisma.googleSheetConnection.findUnique({
    where: { id },
  });
  if (!existing) {
    return { error: "Connection not found." };
  }
  try {
    await prisma.googleSheetConnection.update({
      where: { id },
      data: parsed.data,
    });
  } catch {
    return { error: "Could not update the connection. Please try again." };
  }
  revalidatePath("/admin/google-sync");
  return { success: "Connection updated." };
}

export async function setConnectionActiveAction(
  id: string,
  formData: FormData
): Promise<void> {
  await requireAdmin();
  const isActive = formData.get("isActive") === "true";
  await prisma.googleSheetConnection.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/google-sync");
}

export async function syncNowAction(
  id: string
): Promise<ConnectionActionResult> {
  await requireAdmin();
  try {
    const summary = await syncConnection(id);
    revalidatePath("/admin/google-sync");
    revalidatePath("/admin");
    revalidatePath("/admin/registrants");
    return {
      success: `Synced: ${summary.created} created, ${summary.updated} updated, ${summary.duplicate} duplicates, ${summary.invalid} invalid.`,
    };
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Sync failed. Please try again.",
    };
  }
}