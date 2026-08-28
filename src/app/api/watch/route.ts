import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const targets = await prisma.watchTarget.findMany({
    orderBy: { createdAt: "desc" },
    include: { findings: { orderBy: { foundAt: "desc" } } },
  });
  return NextResponse.json(targets);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.label || !body.roleQuery) {
    return NextResponse.json({ error: "label and roleQuery are required" }, { status: 400 });
  }
  const target = await prisma.watchTarget.create({
    data: {
      label: body.label,
      roleQuery: body.roleQuery,
      targetStartYear: body.targetStartYear ? Number(body.targetStartYear) : null,
      region: body.region ?? null,
      notes: body.notes ?? null,
      cadenceDays: body.cadenceDays ? Number(body.cadenceDays) : 7,
    },
  });
  return NextResponse.json(target, { status: 201 });
}
