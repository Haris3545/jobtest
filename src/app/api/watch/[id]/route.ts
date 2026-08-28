import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const data: Record<string, unknown> = {};
  for (const key of ["label", "roleQuery", "region", "notes", "active"]) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  if (body.targetStartYear !== undefined) data.targetStartYear = body.targetStartYear ? Number(body.targetStartYear) : null;
  if (body.cadenceDays !== undefined) data.cadenceDays = Number(body.cadenceDays);
  const target = await prisma.watchTarget.update({ where: { id }, data });
  return NextResponse.json(target);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.watchTarget.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
