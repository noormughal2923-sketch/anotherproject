import "server-only";

import { prisma } from "@/lib/prisma";

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<boolean> {
  const cutoff = new Date(Date.now() - windowMs);
  const count = await prisma.rateLimitEvent.count({
    where: { key, createdAt: { gte: cutoff } },
  });
  if (count >= limit) {
    return false;
  }
  await prisma.rateLimitEvent.create({ data: { key } });
  return true;
}

export async function clientIp(): Promise<string> {
  const { headers } = await import("next/headers");
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) {
    return fwd.split(",")[0]?.trim() || "unknown";
  }
  return h.get("x-real-ip") || "unknown";
}