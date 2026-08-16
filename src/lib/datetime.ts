export function formatDateTime(
  date: Date | string,
  timezone: string,
  opts: Intl.DateTimeFormatOptions = {}
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
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
  date: Date | string,
  timezone: string,
  opts: Intl.DateTimeFormatOptions = {}
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      dateStyle: "medium",
      ...opts,
    }).format(d);
  } catch {
    return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(d);
  }
}

export function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

/**
 * Convert a UTC Date object to a datetime-local input string in the given
 * IANA timezone (e.g. "Asia/Karachi").
 *
 * Example: 2026-08-16T12:00:00Z → "2026-08-16T17:00" for Asia/Karachi (+5)
 */
export function utcToLocalInput(date: Date, timezone: string): string {
  const pad = (n: number) => String(n).padStart(2, "0");

  // Use Intl to extract the wall-clock parts in the target timezone
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = Object.fromEntries(
    fmt.formatToParts(date).map((p) => [p.type, p.value])
  );

  const year = parts.year;
  const month = parts.month;
  const day = parts.day;
  // Intl may return "24" for midnight in some locales; normalise to "00"
  const hour = parts.hour === "24" ? "00" : pad(parseInt(parts.hour, 10));
  const minute = pad(parseInt(parts.minute, 10));

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

/**
 * Convert a datetime-local input string to a UTC Date, interpreting the
 * string as wall-clock time in the given IANA timezone.
 *
 * Example: "2026-08-16T17:00" + "Asia/Karachi" → Date(2026-08-16T12:00:00Z)
 *
 * How: We use a binary search on UTC offsets because JavaScript has no native
 * way to construct a Date from a timezone-aware wall-clock string.
 */
export function localInputToUTC(
  datetimeLocal: string,
  timezone: string
): Date {
  // Parse the components from the datetime-local string
  const [datePart, timePart] = datetimeLocal.split("T");
  const [yearStr, monthStr, dayStr] = datePart.split("-");
  const [hourStr, minuteStr] = timePart.split(":");

  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  // Create a rough UTC guess by treating the input as UTC first
  const guessUTC = new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));

  // Now find the offset: what wall-clock time does guessUTC produce in the
  // target timezone?
  const wallStr = utcToLocalInput(guessUTC, timezone);
  const [wDate, wTime] = wallStr.split("T");
  const [wY, wM, wD] = wDate.split("-").map(Number);
  const [wH, wMin] = wTime.split(":").map(Number);

  // Difference in minutes between what we want and what we got
  const wantMinutes =
    year * 525960 + month * 43800 + day * 1440 + hour * 60 + minute;
  const gotMinutes =
    wY * 525960 + wM * 43800 + wD * 1440 + wH * 60 + wMin;
  const diffMs = (gotMinutes - wantMinutes) * 60 * 1000;

  // Apply the correction
  const corrected = new Date(guessUTC.getTime() + diffMs);

  // Verify — handle DST edge cases by checking the round-trip
  const verify = utcToLocalInput(corrected, timezone);
  if (verify !== datetimeLocal) {
    // If still off, try one more correction pass
    const [vDate, vTime] = verify.split("T");
    const [vY, vM, vD] = vDate.split("-").map(Number);
    const [vH, vMin] = vTime.split(":").map(Number);
    const gotMinutes2 =
      vY * 525960 + vM * 43800 + vD * 1440 + vH * 60 + vMin;
    const diffMs2 = (gotMinutes2 - wantMinutes) * 60 * 1000;
    return new Date(corrected.getTime() + diffMs2);
  }

  return corrected;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}