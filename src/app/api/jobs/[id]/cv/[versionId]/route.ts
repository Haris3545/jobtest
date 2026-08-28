import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { renderCvPdf, CvContent } from "@/lib/pdf-render";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  const { versionId } = await params;
  const version = await prisma.cvVersion.findUnique({ where: { id: versionId } });
  if (!version) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const download = req.nextUrl.searchParams.get("download");
  if (download) {
    return new NextResponse(Buffer.from(version.fileData), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="haris_khan_cv.pdf"',
      },
    });
  }
  return NextResponse.json({
    id: version.id,
    version: version.version,
    content: version.extractedText ? (JSON.parse(version.extractedText) as CvContent) : null,
  });
}

/** Edit the tailored CV content and re-render the PDF in place (same version row). */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  const { versionId } = await params;
  const content = (await req.json()) as CvContent;
  const pdfBytes = await renderCvPdf(content);
  const updated = await prisma.cvVersion.update({
    where: { id: versionId },
    data: { fileData: Buffer.from(pdfBytes), extractedText: JSON.stringify(content), changeSummary: "Manually edited" },
  });
  return NextResponse.json({ id: updated.id, version: updated.version });
}
