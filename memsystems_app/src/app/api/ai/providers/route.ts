import { NextResponse } from "next/server";
import { PROVIDER_CATALOG } from "@/features/ai/provider-catalog";

export async function GET() {
  return NextResponse.json(PROVIDER_CATALOG);
}
