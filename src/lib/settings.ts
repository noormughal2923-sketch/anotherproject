import "server-only";

import { prisma } from "@/lib/prisma";
import { DEFAULT_TIMEZONE, SETTING_KEYS } from "@/lib/constants";

export type Settings = {
  portalOpen: boolean;
  registrationOpen: boolean;
  attendanceOpen: boolean;
  maintenanceMode: boolean;
  orgName: string;
  timezone: string;
  supportEmail: string;
};

export async function getSettings(): Promise<Settings> {
  const rows = await prisma.systemSetting.findMany();
  const map = new Map(rows.map((r) => [r.key, r.value]));

  return {
    portalOpen: map.get(SETTING_KEYS.PORTAL_OPEN) !== "false",
    registrationOpen: map.get(SETTING_KEYS.REGISTRATION_OPEN) !== "false",
    attendanceOpen: map.get(SETTING_KEYS.ATTENDANCE_OPEN) !== "false",
    maintenanceMode: map.get(SETTING_KEYS.MAINTENANCE_MODE) === "true",
    orgName: map.get(SETTING_KEYS.ORG_NAME) ?? "CyberGuardiansSociety",
    timezone: map.get(SETTING_KEYS.DEFAULT_TIMEZONE) ?? DEFAULT_TIMEZONE,
    supportEmail:
      map.get(SETTING_KEYS.SUPPORT_EMAIL) ??
      "contact@cyberguardianssociety.org",
  };
}

export async function setSetting(key: string, value: string) {
  await prisma.systemSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}