import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const sessions = await prisma.session.findMany({
      where: { isActive: true },
      orderBy: { startTime: "asc" },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        status: true,
        startTime: true,
        endTime: true,
        registrationOpen: true,
        attendanceOpen: true,
        speakers: {
          select: {
            speaker: {
              select: {
                name: true,
                title: true,
                organization: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ sessions }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
