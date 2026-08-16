import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/auth";
import { exportRegistrantsCsv, exportAttendanceCsv } from "@/lib/export";

export async function GET(req: Request) {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const sessionId = searchParams.get("sessionId") || undefined;

  let csvContent = "";
  let filename = "";

  if (type === "registrants") {
    csvContent = await exportRegistrantsCsv(sessionId);
    filename = `cgs-registrants-${new Date().toISOString().slice(0, 10)}.csv`;
  } else if (type === "attendance") {
    csvContent = await exportAttendanceCsv(sessionId);
    filename = `cgs-attendance-${new Date().toISOString().slice(0, 10)}.csv`;
  } else {
    return NextResponse.json(
      { error: "Invalid export type. Use 'registrants' or 'attendance'" },
      { status: 400 }
    );
  }

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
