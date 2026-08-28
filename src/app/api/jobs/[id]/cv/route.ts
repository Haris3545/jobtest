import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { tailorCvContent } from "@/lib/ai-tasks";
import { renderCvPdf, CvContent } from "@/lib/pdf";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const versions = await prisma.cvVersion.findMany({
    where: { jobId: id },
    orderBy: { version: "desc" },
    select: { id: true, version: true, changeSummary: true, createdAt: true, extractedText: true },
  });
  return NextResponse.json(versions);
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    const master = await prisma.cvMaster.findFirst({ orderBy: { uploadedAt: "desc" } });
    if (!master?.extractedText) {
      return NextResponse.json(
        { error: "Upload your master CV first (Settings → CV)." },
        { status: 400 }
      );
    }

    const content = await tailorCvContent({
      masterCvText: master.extractedText,
      jobTitle: job.title,
      company: job.company,
      jobDescription: job.description ?? "",
    });
    const pdfBytes = await renderCvPdf(content);

    const last = await prisma.cvVersion.findFirst({ where: { jobId: id }, orderBy: { version: "desc" } });
    const version = await prisma.cvVersion.create({
      data: {
        jobId: id,
        version: (last?.version ?? 0) + 1,
        fileData: Buffer.from(pdfBytes),
        extractedText: JSON.stringify(content),
        changeSummary: "Tailored (reordered/reworded) for this role",
      },
    });
    return NextResponse.json({ id: version.id, version: version.version, content } satisfies {
      id: string;
      version: number;
      content: CvContent;
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate CV" },
      { status: 500 }
    );
  }
}
