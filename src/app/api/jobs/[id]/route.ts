import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      cvVersions: { orderBy: { version: "desc" } },
      coverLetters: { orderBy: { version: "desc" } },
      reminders: { orderBy: { remindAt: "asc" } },
    },
  });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(job);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const data: Record<string, unknown> = {};
  for (const key of [
    "title",
    "company",
    "location",
    "source",
    "description",
    "salary",
    "status",
    "notes",
  ]) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  if (body.openDate !== undefined) data.openDate = body.openDate ? new Date(body.openDate) : null;
  if (body.closingDate !== undefined)
    data.closingDate = body.closingDate ? new Date(body.closingDate) : null;

  const job = await prisma.job.update({ where: { id }, data });
  return NextResponse.json(job);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.job.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
