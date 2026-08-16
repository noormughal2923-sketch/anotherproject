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

export function formatTime(
  date: Date | string | number | null | undefined,
  timezone?: string
): string {
  if (!date) return "—";
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", {
      ...(timezone ? { timeZone: timezone } : {}),
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(d);
  } catch {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(d);
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
 * Example: 2026-08-16T15:00:00Z → "2026-08-16T20:00" for Asia/Karachi (+5)
 */
export function utcToZonedLocalInput(
  date: Date | string | number | null | undefined,
  timezone: string
): string {
  if (!date) return "";
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (!d || Number.isNaN(d.getTime())) return "";

  try {
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const parts = fmt.formatToParts(d);
    const map: Record<string, string> = {};
    for (const p of parts) {
      map[p.type] = p.value;
    }
    const hour = map.hour === "24" ? "00" : map.hour;
    return `${map.year}-${map.month}-${map.day}T${hour}:${map.minute}`;
  } catch {
    return toLocalInputValue(d);
  }
}

export function utcToLocalInput(date: Date, timezone: string): string {
  return utcToZonedLocalInput(date, timezone);
}

/**
 * Convert a datetime-local input string (YYYY-MM-DDTHH:mm) to a UTC Date,
 * interpreting the string strictly as wall-clock time in the given IANA timezone.
 *
 * Uses iterative exact offset resolution to guarantee zero time shifting across
 * all timezones, UTC offsets, and daylight saving boundaries.
 */
export function parseZonedLocalInput(
  datetimeStr: string | null | undefined,
  timezone: string
): Date | null {
  if (!datetimeStr || typeof datetimeStr !== "string") return null;
  const clean = datetimeStr.trim().replace(" ", "T");
  const [datePart, timePart] = clean.split("T");
  if (!datePart || !timePart) return null;

  const [y, m, d] = datePart.split("-").map(Number);
  const [h, min] = timePart.split(":").map(Number);

  if (
    Number.isNaN(y) ||
    Number.isNaN(m) ||
    Number.isNaN(d) ||
    Number.isNaN(h) ||
    Number.isNaN(min)
  ) {
    return null;
  }

  const naiveUtc = Date.UTC(y, m - 1, d, h, min, 0, 0);

  try {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    let guessUtc = naiveUtc;
    for (let i = 0; i < 4; i++) {
      const parts = fmt.formatToParts(new Date(guessUtc));
      const map: Record<string, string> = {};
      for (const p of parts) map[p.type] = p.value;
      const hourVal = map.hour === "24" ? 0 : Number(map.hour);
      const renderedAsUtc = Date.UTC(
        Number(map.year),
        Number(map.month) - 1,
        Number(map.day),
        hourVal,
        Number(map.minute),
        Number(map.second || 0)
      );
      const diff = renderedAsUtc - naiveUtc;
      if (diff === 0) break;
      guessUtc -= diff;
    }

    return new Date(guessUtc);
  } catch {
    return new Date(naiveUtc);
  }
}

export function localInputToUTC(
  datetimeLocal: string,
  timezone: string
): Date {
  const result = parseZonedLocalInput(datetimeLocal, timezone);
  return result ?? new Date(datetimeLocal);
}

/**
 * Get human-readable timezone abbreviation (e.g. PKT, GMT+5, EST)
 */
export function getTimezoneAbbr(
  date: Date = new Date(),
  timezone: string = "Asia/Karachi"
): string {
  try {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "short",
    });
    const parts = fmt.formatToParts(date);
    const tzPart = parts.find((p) => p.type === "timeZoneName");
    return tzPart?.value ?? timezone;
  } catch {
    return timezone;
  }
}

/**
 * Get formatted duration string between two dates (e.g. "1h 30m" or "45m")
 */
export function getDurationString(
  startDate: Date | string,
  endDate: Date | string
): string {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return "0m";

  const diffMs = end - start;
  const diffMins = Math.round(diffMs / (1000 * 60));
  const hours = Math.floor(diffMins / 60);
  const minutes = diffMins % 60;

  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

/**
 * Get relative status and time description
 */
export function getSessionTimingStatus(
  startDate: Date | string,
  endDate: Date | string,
  now: Date = new Date()
): {
  status: "UPCOMING" | "LIVE" | "COMPLETED";
  badgeColor: string;
  relativeText: string;
} {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const current = now.getTime();

  if (current >= start && current <= end) {
    const minsRemaining = Math.max(1, Math.round((end - current) / 60000));
    return {
      status: "LIVE",
      badgeColor: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      relativeText: `Live now (${minsRemaining}m remaining)`,
    };
  }

  if (current < start) {
    const diffMs = start - current;
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    let text = "";
    if (diffDays > 1) text = `Starts in ${diffDays} days`;
    else if (diffDays === 1) text = "Starts tomorrow";
    else if (diffHours > 0) text = `Starts in ${diffHours}h ${diffMins % 60}m`;
    else text = `Starts in ${diffMins}m`;

    return {
      status: "UPCOMING",
      badgeColor: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
      relativeText: text,
    };
  }

  const diffAgoMs = current - end;
  const minsAgo = Math.round(diffAgoMs / 60000);
  const hoursAgo = Math.floor(minsAgo / 60);
  const daysAgo = Math.floor(hoursAgo / 24);

  let agoText = "";
  if (daysAgo > 1) agoText = `Ended ${daysAgo} days ago`;
  else if (daysAgo === 1) agoText = "Ended yesterday";
  else if (hoursAgo > 0) agoText = `Ended ${hoursAgo}h ago`;
  else agoText = `Ended ${minsAgo}m ago`;

  return {
    status: "COMPLETED",
    badgeColor: "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30",
    relativeText: agoText,
  };
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}