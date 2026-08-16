import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncConnection, sheetsConfigured } from "@/lib/google-sheets";

export async function POST(req: Request) {
  // Verify Vercel Cron authorization if CRON_SECRET is configured
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!sheetsConfigured()) {
    return NextResponse.json(
      { error: "Google Sheets service credentials not configured" },
      { status: 400 }
    );
  }

  try {
    const connections = await prisma.googleSheetConnection.findMany({
      where: { isActive: true },
    });

    const results = [];
    for (const conn of connections) {
      try {
        const summary = await syncConnection(conn.id);
        results.push(summary);
      } catch (err) {
        results.push({
          connectionId: conn.id,
          error: err instanceof Error ? err.message : "Sync failed",
        });
      }
    }

    return NextResponse.json({ synced: results.length, details: results }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
