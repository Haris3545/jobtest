import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const jobs = await prisma.job.findMany({
    select: { status: true, createdAt: true, atsScore: true },
  });

  const byStatus: Record<string, number> = {};
  for (const j of jobs) byStatus[j.status] = (byStatus[j.status] ?? 0) + 1;

  const applied = jobs.filter((j) =>
    ["APPLIED", "INTERVIEW", "OFFER", "REJECTED"].includes(j.status)
  ).length;
  const interviewed = jobs.filter((j) => ["INTERVIEW", "OFFER"].includes(j.status)).length;
  const offers = jobs.filter((j) => j.status === "OFFER").length;
  const rejected = jobs.filter((j) => j.status === "REJECTED").length;

  const scored = jobs.filter((j) => j.atsScore != null);
  const avgAtsScore = scored.length
    ? Math.round(scored.reduce((sum, j) => sum + (j.atsScore ?? 0), 0) / scored.length)
    : null;

  return NextResponse.json({
    total: jobs.length,
    byStatus,
    applied,
    interviewed,
    offers,
    rejected,
    responseRate: applied ? Math.round((interviewed / applied) * 100) : 0,
    offerRate: applied ? Math.round((offers / applied) * 100) : 0,
    avgAtsScore,
  });
}
