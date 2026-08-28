import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scrapeJobUrl } from "@/lib/scrape";

/**
 * Re-fetches the job's original listing URL (kept "on file" as `job.url`) to
 * check whether anything has changed — e.g. a deadline extension — since it
 * was first added. Returns the fresh scrape for the user to review; it does
 * not overwrite saved fields automatically.
 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    const scanned = await scrapeJobUrl(job.url);
    await prisma.job.update({ where: { id }, data: { lastScannedAt: new Date() } });

    return NextResponse.json({
      ...scanned,
      changed: {
        title: scanned.title != null && scanned.title !== job.title,
        closingDate:
          scanned.closingDate != null &&
          job.closingDate != null &&
          new Date(scanned.closingDate).getTime() !== job.closingDate.getTime(),
        description: scanned.description != null && scanned.description !== job.description,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Recheck failed" },
      { status: 500 }
    );
  }
}
