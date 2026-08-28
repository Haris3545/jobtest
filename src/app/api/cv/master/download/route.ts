import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const master = await prisma.cvMaster.findFirst({ orderBy: { uploadedAt: "desc" } });
  if (!master) return NextResponse.json({ error: "No master CV uploaded" }, { status: 404 });
  return new NextResponse(Buffer.from(master.fileData), {
    headers: {
      "Content-Type": master.mimeType,
      "Content-Disposition": 'attachment; filename="haris_khan_cv.pdf"',
    },
  });
}
