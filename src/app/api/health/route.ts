import { NextResponse } from "next/server";
import { pingDatabase } from "@/lib/db";

// Public, uncached endpoint for external uptime monitors. Each hit runs a
// real query against Supabase, which is what counts as activity when the
// free tier decides whether to pause the project.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await pingDatabase();
    return NextResponse.json({ ok: true, at: new Date().toISOString() });
  } catch (err) {
    console.error("Health check failed:", err);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
