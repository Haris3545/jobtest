import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ACTIVE_STATUSES = ["SAVED", "APPLIED", "INTERVIEW"];
const WINDOW_DAYS = 14;

export async function GET() {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const jobs = await prisma.job.findMany({
    where: {
      status: { in: ACTIVE_STATUSES },
      closingDate: { not: null, gte: now, lte: windowEnd },
    },
    orderBy: { closingDate: "asc" },
    select: { id: true, title: true, company: true, closingDate: true, status: true },
  });

  return NextResponse.json(
    jobs.map((j) => ({
      ...j,
      daysLeft: j.closingDate
        ? Math.ceil((j.closingDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
        : null,
    }))
  );
}
