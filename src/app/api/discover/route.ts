import { NextRequest, NextResponse } from "next/server";
import { discoverRoles } from "@/lib/ai-tasks";

export async function POST(req: NextRequest) {
  try {
    const { roleQuery, targetStartYear, region } = await req.json();
    if (!roleQuery || typeof roleQuery !== "string") {
      return NextResponse.json({ error: "roleQuery is required" }, { status: 400 });
    }
    const results = await discoverRoles({
      roleQuery,
      targetStartYear: targetStartYear ? Number(targetStartYear) : undefined,
      region,
    });
    return NextResponse.json(results);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Discovery search failed" },
      { status: 500 }
    );
  }
}
