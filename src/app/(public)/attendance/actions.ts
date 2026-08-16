"use server";

import { markAttendance, type AttendanceResult } from "@/lib/attendance";
import { clientIp } from "@/lib/rate-limit";

export async function markAttendanceAction(
  _prev: AttendanceResult | null,
  formData: FormData
): Promise<AttendanceResult> {
  const email = String(formData.get("email") ?? "");
  const rawName = String(formData.get("name") ?? "");
  const name = rawName.trim() ? rawName : undefined;
  const ip = await clientIp();
  return markAttendance(email, name, ip);
}