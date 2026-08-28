import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scoreAts } from "@/lib/ai-tasks";
import { CvContent } from "@/lib/pdf";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  // Prefer the latest tailored CV for this job; fall back to the master CV.
  const latestVersion = await prisma.cvVersion.findFirst({
    where: { jobId: id },
    orderBy: { version: "desc" },
  });
  let cvText = "";
  if (latestVersion?.extractedText) {
    const content = JSON.parse(latestVersion.extractedText) as CvContent;
    cvText = [
      content.name,
      content.contactLine,
      content.summary ?? "",
      ...content.sections.flatMap((s) => [s.heading, ...s.bullets]),
    ].join("\n");
  } else {
    const master = await prisma.cvMaster.findFirst({ orderBy: { uploadedAt: "desc" } });
    if (!master?.extractedText) {
      return NextResponse.json({ error: "Upload your master CV first (Settings → CV)." }, { status: 400 });
    }
    cvText = master.extractedText;
  }

  const result = await scoreAts({ cvText, jobDescription: job.description ?? "" });
  await prisma.job.update({
    where: { id },
    data: { atsScore: result.score, atsDetail: JSON.stringify(result) },
  });
  return NextResponse.json(result);
}
