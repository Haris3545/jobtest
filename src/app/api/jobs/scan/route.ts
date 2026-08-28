import { NextRequest, NextResponse } from "next/server";
import { scrapeJobUrl } from "@/lib/scrape";
import { withCors, corsPreflight } from "@/lib/cors";

export async function OPTIONS() {
  return corsPreflight();
}

export async function POST(req: NextRequest) {
  const { url } = await req.json();
  if (!url || typeof url !== "string") {
    return withCors(NextResponse.json({ error: "url is required" }, { status: 400 }));
  }
  try {
    new URL(url);
  } catch {
    return withCors(NextResponse.json({ error: "Invalid URL" }, { status: 400 }));
  }
  const result = await scrapeJobUrl(url);
  return withCors(NextResponse.json(result));
}
