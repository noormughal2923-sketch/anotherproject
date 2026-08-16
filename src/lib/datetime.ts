export function formatDateTime(
  date: Date | string | number | null | undefined,
  timezone?: string,
  opts: Intl.DateTimeFormatOptions = {}
): string {
  if (!date) return "—";
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", {
      ...(timezone ? { timeZone: timezone } : {}),
      dateStyle: "medium",
      timeStyle: "short",
      ...opts,
    }).format(d);
  } catch {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  }
}

export function formatDate(
  date: Date | string | number | null | undefined,
  timezone?: string,
  opts: Intl.DateTimeFormatOptions = {}
): string {
  if (!date) return "—";
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", {
      ...(timezone ? { timeZone: timezone } : {}),
      dateStyle: "medium",
      ...opts,
    }).format(d);
  } catch {
    return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(d);
  }
}

export function toLocalInputValue(date: Date | string | number | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (!d || Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

/**
 * Convert a UTC Date object to a datetime-local input string in the given
 * IANA timezone (e.g. "Asia/Karachi").
 *
 * Example: 2026-08-16T12:30:00Z → "2026-08-16T17:30" for Asia/Karachi (+5)
 */
export function utcToLocalInput(date: Date, timezone: string): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = fmt.formatToParts(date);
  const map: Record<string, string> = {};
  for (const p of parts) {
    map[p.type] = p.value;
  }
  const hour = map.hour === "24" ? "00" : map.hour;
  return `${map.year}-${map.month}-${map.day}T${hour}:${map.minute}`;
}

/**
 * Convert a datetime-local input string (YYYY-MM-DDTHH:mm) to a UTC Date,
 * interpreting the string as wall-clock time in the given IANA timezone.
 *
 * Example: "2026-08-16T17:30" + "Asia/Karachi" → Date(2026-08-16T12:30:00Z)
 */
export function localInputToUTC(
  datetimeLocal: string,
  timezone: string
): Date {
  const [datePart, timePart] = datetimeLocal.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const [h, min] = timePart.split(":").map(Number);

  const targetUTC = Date.UTC(y, m - 1, d, h, min, 0);
  const dObj = new Date(targetUTC);

  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = fmt.formatToParts(dObj);
  const map: Record<string, string> = {};
  for (const p of parts) {
    map[p.type] = p.value;
  }

  const asTzUTC = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour === "24" ? "00" : map.hour),
    Number(map.minute),
    Number(map.second || 0)
  );

  const offset = asTzUTC - targetUTC;
  return new Date(targetUTC - offset);
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}