import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCors, corsPreflight } from "@/lib/cors";

export async function OPTIONS() {
  return corsPreflight();
}

export async function GET() {
  const jobs = await prisma.job.findMany({
    orderBy: [{ closingDate: "asc" }, { createdAt: "desc" }],
  });
  return withCors(NextResponse.json(jobs));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.title || !body.company || !body.url) {
    return withCors(
      NextResponse.json({ error: "title, company and url are required" }, { status: 400 })
    );
  }
  const job = await prisma.job.create({
    data: {
      url: body.url,
      title: body.title,
      company: body.company,
      location: body.location ?? null,
      source: body.source ?? "other",
      description: body.description ?? null,
      salary: body.salary ?? null,
      openDate: body.openDate ? new Date(body.openDate) : null,
      closingDate: body.closingDate ? new Date(body.closingDate) : null,
      status: body.status ?? "SAVED",
      notes: body.notes ?? null,
    },
  });
  return withCors(NextResponse.json(job, { status: 201 }));
}
