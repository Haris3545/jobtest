import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractPdfText } from "@/lib/pdf-extract";

export async function GET() {
  const master = await prisma.cvMaster.findFirst({ orderBy: { uploadedAt: "desc" } });
  if (!master) return NextResponse.json(null);
  return NextResponse.json({
    id: master.id,
    fileName: master.fileName,
    uploadedAt: master.uploadedAt,
    hasText: Boolean(master.extractedText),
  });
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required (multipart/form-data)" }, { status: 400 });
  }
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  let extractedText = "";
  try {
    extractedText = await extractPdfText(buffer);
  } catch (err) {
    return NextResponse.json(
      { error: `Could not read PDF text: ${err instanceof Error ? err.message : "unknown error"}` },
      { status: 400 }
    );
  }

  // Only one master CV at a time — replace any existing one.
  await prisma.cvMaster.deleteMany({});
  const master = await prisma.cvMaster.create({
    data: {
      fileName: "haris_khan_cv.pdf",
      fileData: buffer,
      mimeType: file.type || "application/pdf",
      extractedText,
    },
  });
  return NextResponse.json({ id: master.id, fileName: master.fileName, uploadedAt: master.uploadedAt });
}
