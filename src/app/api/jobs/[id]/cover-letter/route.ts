import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateCoverLetter } from "@/lib/ai-tasks";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const letters = await prisma.coverLetter.findMany({
    where: { jobId: id },
    orderBy: { version: "desc" },
    select: { id: true, version: true, content: true, createdAt: true },
  });
  return NextResponse.json(letters);
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    const master = await prisma.cvMaster.findFirst({ orderBy: { uploadedAt: "desc" } });
    if (!master?.extractedText) {
      return NextResponse.json({ error: "Upload your master CV first (Settings → CV)." }, { status: 400 });
    }

    const content = await generateCoverLetter({
      masterCvText: master.extractedText,
      jobTitle: job.title,
      company: job.company,
      jobDescription: job.description ?? "",
    });

    const last = await prisma.coverLetter.findFirst({ where: { jobId: id }, orderBy: { version: "desc" } });
    const letter = await prisma.coverLetter.create({
      data: { jobId: id, version: (last?.version ?? 0) + 1, content },
    });
    return NextResponse.json({ id: letter.id, version: letter.version, content: letter.content });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate cover letter" },
      { status: 500 }
    );
  }
}
