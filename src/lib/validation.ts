import { z } from "zod";

export function sanitizeText(text: string): string {
  if (!text) return "";
  // Strip null bytes and dangerous control characters while preserving printable chars
  return text
    .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, "")
    .trim();
}

const optionalText = (max: number) =>
  z
    .string()
    .max(max * 2, `Payload too large`)
    .transform((v) => sanitizeText(v))
    .refine((v) => v.length <= max, { message: `Must be ${max} characters or fewer` })
    .optional()
    .transform((v) => (v ? v : undefined));

export const loginSchema = z.object({
  email: z
    .string()
    .max(254, "Email is too long")
    .transform((v) => sanitizeText(v).toLowerCase())
    .pipe(z.email("Enter a valid email address")),
  password: z
    .string()
    .min(1, "Password is required")
    .max(256, "Password exceeds maximum length"),
});

export const attendanceSchema = z.object({
  email: z
    .string()
    .max(254, "Email is too long")
    .transform((v) => sanitizeText(v).toLowerCase())
    .pipe(z.email("Enter the email you registered with")),
  name: optionalText(100),
});

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const sessionSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  slug: z
    .union([
      z
        .string()
        .trim()
        .max(120)
        .regex(SLUG_RE, "Use lowercase letters, numbers and hyphens"),
      z.literal(""),
    ])
    .optional()
    .transform((v) => (v ? v : undefined)),
  description: optionalText(5000),
  meetLink: z
    .union([z.string().trim().max(500), z.literal("")])
    .optional()
    .transform((v) => (v ? v : undefined)),
  
});

export const speakerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  title: optionalText(120),
  email: z
    .union([z.string().email("Enter a valid email address"), z.literal("")])
    .optional()
    .transform((v) => (v ? v : undefined)),
  bio: optionalText(2000),
});

export const connectionSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  spreadsheetId: z.string().trim().min(1, "Spreadsheet ID is required").max(200),
  sheetName: z.string().trim().min(1, "Worksheet name is required").max(200),
});

export const overrideSchema = z.object({
  sessionId: z.string().min(1, "Session is required"),
  email: z.string().email("Enter a valid email address"),
  reason: z.string().trim().min(10, "A reason is required (at least 10 characters)").max(1000),
});

export const settingsSchema = z.object({
  orgName: z.string().trim().min(1, "Organization name is required").max(120),
  timezone: z.string().trim().min(1, "Timezone is required").max(80),
});

export function parseBool(value: FormDataEntryValue | null): boolean {
  return value === "on";
}

export function toBool(value: string | null): boolean {
  return value === "true";
}