import { NextRequest, NextResponse } from "next/server";
import { getAssetCertificatePdfBuffer } from "@/lib/certificate-assets";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    if (!code) {
      return NextResponse.json({ error: "Certificate code is required" }, { status: 400 });
    }

    const decodedCode = decodeURIComponent(code).trim();
    const pdfData = getAssetCertificatePdfBuffer(decodedCode);

    if (!pdfData) {
      return NextResponse.json(
        { error: "Certificate PDF not found or unavailable for download." },
        { status: 404 }
      );
    }

    const headers = new Headers();
    headers.set("Content-Type", "application/pdf");
    headers.set(
      "Content-Disposition",
      `attachment; filename="${pdfData.filename.replace(/"/g, "")}"`
    );
    headers.set("Content-Length", pdfData.buffer.length.toString());
    headers.set("Cache-Control", "public, max-age=86400, immutable");

    return new Response(new Uint8Array(pdfData.buffer), {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("[Certificate Download API] Error:", error);
    return NextResponse.json(
      { error: "Failed to download certificate" },
      { status: 500 }
    );
  }
}
