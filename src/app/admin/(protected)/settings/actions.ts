"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth";
import { settingsSchema } from "@/lib/validation";
import { setSetting } from "@/lib/settings";
import { SETTING_KEYS } from "@/lib/constants";

export type SettingsActionResult = { error?: string; success?: string } | undefined;

export async function saveSettingsAction(
  _prev: SettingsActionResult,
  formData: FormData
): Promise<SettingsActionResult> {
  await requireAdmin();

  const parsed = settingsSchema.safeParse({
    orgName: String(formData.get("orgName") ?? ""),
    timezone: String(formData.get("timezone") ?? ""),
  });
  if (!parsed.success) {
    return { error: "Please fill in the organization name and timezone." };
  }

  const portalOpen = formData.get("portalOpen") === "on";
  const registrationOpen = formData.get("registrationOpen") === "on";
  const attendanceOpen = formData.get("attendanceOpen") === "on";

  try {
    await setSetting(SETTING_KEYS.ORG_NAME, parsed.data.orgName);
    await setSetting(SETTING_KEYS.DEFAULT_TIMEZONE, parsed.data.timezone);
    await setSetting(SETTING_KEYS.PORTAL_OPEN, String(portalOpen));
    await setSetting(SETTING_KEYS.REGISTRATION_OPEN, String(registrationOpen));
    await setSetting(SETTING_KEYS.ATTENDANCE_OPEN, String(attendanceOpen));
  } catch {
    return { error: "Could not save settings. Please try again." };
  }

  revalidatePath("/admin/settings");
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/sessions");
  revalidatePath("/attendance");
  return { success: "Settings saved." };
}