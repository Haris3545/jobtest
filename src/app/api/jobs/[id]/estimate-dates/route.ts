import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { estimatePreviousCycleDates } from "@/lib/ai-tasks";

/**
 * When a listing doesn't have this cycle's open/close dates yet, search the
 * web for when the same role/scheme ran in a previous year and store a short
 * note like "2026 dates were: opened 3 Mar, closed 10 Jun" as a reference
 * point — not a confirmed date for the current cycle.
 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    const note = await estimatePreviousCycleDates({ jobTitle: job.title, company: job.company });
    await prisma.job.update({ where: { id }, data: { historicalDatesNote: note } });

    return NextResponse.json({ historicalDatesNote: note });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to estimate dates" },
      { status: 500 }
    );
  }
}
