import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildPrepBrief } from "@/lib/ai-tasks";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    const result = await buildPrepBrief({
      jobTitle: job.title,
      company: job.company,
      jobDescription: job.description ?? "",
      status: job.status,
    });

    await prisma.job.update({
      where: { id },
      data: { nextSteps: result.nextSteps, companyBrief: result.companyBrief },
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate prep brief" },
      { status: 500 }
    );
  }
}
