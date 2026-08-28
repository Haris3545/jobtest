import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { tavilySearch } from "@/lib/tavily";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const target = await prisma.watchTarget.findUnique({ where: { id } });
    if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const yearPart = target.targetStartYear ? `${target.targetStartYear} start` : "";
    const query = `${target.roleQuery} ${yearPart} ${target.region ?? ""} graduate scheme applications open`;
    const results = await tavilySearch(query, { maxResults: 8, topic: "news", days: target.cadenceDays * 3 });

    const existingUrls = new Set(
      (await prisma.watchFinding.findMany({ where: { watchTargetId: id }, select: { url: true } })).map(
        (f) => f.url
      )
    );

    const newResults = results.filter((r) => !existingUrls.has(r.url));
    const created = await prisma.$transaction(
      newResults.map((r) =>
        prisma.watchFinding.create({
          data: {
            watchTargetId: id,
            title: r.title,
            url: r.url,
            snippet: r.content.slice(0, 500),
          },
        })
      )
    );

    await prisma.watchTarget.update({ where: { id }, data: { lastCheckedAt: new Date() } });
    return NextResponse.json({ newFindings: created.length, findings: created });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Watch check failed" },
      { status: 500 }
    );
  }
}
