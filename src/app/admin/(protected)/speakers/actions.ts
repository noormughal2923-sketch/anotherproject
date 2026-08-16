"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { speakerSchema } from "@/lib/validation";

export type SpeakerActionResult = { error?: string } | undefined;

export async function createSpeakerAction(
  formData: FormData
): Promise<SpeakerActionResult> {
  await requireAdmin();
  const parsed = speakerSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    title: String(formData.get("title") ?? "") || undefined,
    email: String(formData.get("email") ?? "") || undefined,
    bio: String(formData.get("bio") ?? "") || undefined,
  });
  if (!parsed.success) {
    return { error: "Please fix the invalid fields and try again." };
  }

  try {
    await prisma.speaker.create({ data: parsed.data });
  } catch {
    return { error: "Could not create the speaker. Please try again." };
  }
  revalidatePath("/admin/speakers");
  revalidatePath("/admin");
}

export async function updateSpeakerAction(
  id: string,
  formData: FormData
): Promise<SpeakerActionResult> {
  await requireAdmin();
  const parsed = speakerSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    title: String(formData.get("title") ?? "") || undefined,
    email: String(formData.get("email") ?? "") || undefined,
    bio: String(formData.get("bio") ?? "") || undefined,
  });
  if (!parsed.success) {
    return { error: "Please fix the invalid fields and try again." };
  }

  const existing = await prisma.speaker.findUnique({ where: { id } });
  if (!existing) {
    return { error: "Speaker not found." };
  }

  try {
    await prisma.speaker.update({ where: { id }, data: parsed.data });
  } catch {
    return { error: "Could not update the speaker. Please try again." };
  }
  revalidatePath("/admin/speakers");
  revalidatePath("/admin");
}

export async function setSpeakerActiveAction(
  id: string,
  formData: FormData
): Promise<void> {
  await requireAdmin();
  const isActive = formData.get("isActive") === "true";
  await prisma.speaker.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/speakers");
}

export async function deleteSpeakerAction(id: string): Promise<void> {
  await requireAdmin();
  const existing = await prisma.speaker.findUnique({ where: { id } });
  if (!existing) return;
  await prisma.speaker.delete({ where: { id } });
  revalidatePath("/admin/speakers");
  revalidatePath("/admin");
}