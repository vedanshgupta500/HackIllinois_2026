import { NextResponse } from "next/server";
import { getScanCount } from "@/lib/scanCounter";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ count: getScanCount() });
}
