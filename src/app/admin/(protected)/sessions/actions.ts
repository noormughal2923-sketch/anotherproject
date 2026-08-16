"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { sessionSchema } from "@/lib/validation";
import { ADMIN_BASE_PATH } from "@/lib/constants";

import { slugify } from "@/lib/datetime";

export type SessionActionResult = { error?: string } | undefined;

function revalidateAll() {
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/sessions");
  revalidatePath("/attendance");
  revalidatePath(`${ADMIN_BASE_PATH}/sessions`);
  revalidatePath("/admin/sessions");
  revalidatePath(ADMIN_BASE_PATH);
  revalidatePath("/admin");
}

async function parseSessionInput(formData: FormData) {
  const parsed = sessionSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    slug: String(formData.get("slug") ?? "") || undefined,
    description: String(formData.get("description") ?? "") || undefined,
    meetLink: String(formData.get("meetLink") ?? "") || undefined,
  });
  if (!parsed.success) {
    return { error: "Please fix the invalid fields and try again." };
  }

  const { data } = parsed;
  const registrationOpen = formData.get("registrationOpen") === "on";
  const attendanceOpen = formData.get("attendanceOpen") === "on";
  const speakerIds = formData.getAll("speakerIds").map(String);
  const sheetConnectionId =
    String(formData.get("sheetConnectionId") ?? "") || null;

  return {
    data: {
      ...data,
      registrationOpen,
      attendanceOpen,
      sheetConnectionId,
    },
    speakerIds,
  };
}

export async function createSessionAction(
  formData: FormData
): Promise<SessionActionResult> {
  await requireAdmin();
  const parsed = await parseSessionInput(formData);
  if ("error" in parsed) {
    return { error: parsed.error };
  }
  const { data, speakerIds } = parsed;

  let baseSlug = data.slug || slugify(data.title);
  if (!baseSlug) {
    baseSlug = `session-${Date.now()}`;
  }

  let slug = baseSlug;
  let counter = 1;
  while (await prisma.session.findUnique({ where: { slug } })) {
    counter++;
    slug = `${baseSlug}-${counter}`;
  }

  try {
    await prisma.session.create({
       data: {
        title: data.title,
        slug,
        description: data.description,
        meetLink: data.meetLink,
        startTime: new Date(),
        endTime: new Date(Date.now() + 60 * 60 * 1000),
        registrationOpen: data.registrationOpen,
        attendanceOpen: data.attendanceOpen,
        sheetConnectionId: data.sheetConnectionId,
        speakers: {
          create: speakerIds.map((speakerId, i) => ({
            speakerId,
            sortOrder: i,
          })),
        },
      },
    });
  } catch (err) {
    if (isUniqueError(err)) {
      return { error: "A session with this slug already exists." };
    }
    return { error: "Could not create the session. Please try again." };
  }
  revalidateAll();
}

export async function updateSessionAction(
  id: string,
  formData: FormData
): Promise<SessionActionResult> {
  await requireAdmin();
  const parsed = await parseSessionInput(formData);
  if ("error" in parsed) {
    return { error: parsed.error };
  }
  const { data, speakerIds } = parsed;

  const existing = await prisma.session.findUnique({ where: { id } });
  if (!existing) {
    return { error: "Session not found." };
  }

  const slug = data.slug || existing.slug || slugify(data.title) || `session-${Date.now()}`;

  try {
    await prisma.session.update({
      where: { id },
      data: {
        title: data.title,
        slug,
        description: data.description,
        meetLink: data.meetLink,
        registrationOpen: data.registrationOpen,
        attendanceOpen: data.attendanceOpen,
        sheetConnectionId: data.sheetConnectionId,
        speakers: {
          deleteMany: {},
          create: speakerIds.map((speakerId, i) => ({
            speakerId,
            sortOrder: i,
          })),
        },
      },
    });
  } catch (err) {
    if (isUniqueError(err)) {
      return { error: "A session with this slug already exists." };
    }
    return { error: "Could not update the session. Please try again." };
  }
  revalidateAll();
}

export async function setSessionActiveAction(
  id: string,
  formData: FormData
): Promise<void> {
  await requireAdmin();
  const isActive = formData.get("isActive") === "true";
  await prisma.session.update({ where: { id }, data: { isActive } });
  revalidateAll();
}

export async function deleteSessionAction(id: string): Promise<void> {
  await requireAdmin();
  const existing = await prisma.session.findUnique({ where: { id } });
  if (!existing) return;
  await prisma.session.delete({ where: { id } });
  revalidateAll();
}

function isUniqueError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "P2002"
  );
}