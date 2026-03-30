import { NextRequest, NextResponse } from "next/server";
import { getAppBaseUrl } from "@/lib/deployment";
import { getPublicApiSpec } from "@/lib/public-api";

export async function GET(request: NextRequest) {
  const baseUrl = new URL(request.url).origin || getAppBaseUrl();
  return NextResponse.json(getPublicApiSpec(baseUrl));
}