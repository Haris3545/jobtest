import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ letterId: string }> }
) {
  const { letterId } = await params;
  const { content } = await req.json();
  const updated = await prisma.coverLetter.update({ where: { id: letterId }, data: { content } });
  return NextResponse.json({ id: updated.id, content: updated.content });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ letterId: string }> }
) {
  const { letterId } = await params;
  const letter = await prisma.coverLetter.findUnique({ where: { id: letterId } });
  if (!letter) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (req.nextUrl.searchParams.get("download")) {
    return new NextResponse(letter.content, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": 'attachment; filename="haris_khan_cover_letter.txt"',
      },
    });
  }
  return NextResponse.json({ id: letter.id, content: letter.content, version: letter.version });
}
