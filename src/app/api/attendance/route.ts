import { NextResponse } from "next/server";
import { markAttendance } from "@/lib/attendance";
import { clientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name } = body || {};
    const ip = await clientIp();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Valid email address is required" },
        { status: 400 }
      );
    }

    const result = await markAttendance(email, name, ip);

    if (result.status === "error") {
      return NextResponse.json(
        { error: result.code },
        { status: 400 }
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
