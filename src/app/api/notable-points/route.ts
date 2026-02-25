import { NextRequest, NextResponse } from "next/server";
import { getNotablePoints } from "@/lib/notion";

export async function GET(request: NextRequest) {
  try {
    const bustCache =
      request.nextUrl.searchParams.get("refresh") === "true";
    const points = await getNotablePoints(bustCache);
    return NextResponse.json(points);
  } catch (error) {
    console.error("Failed to fetch notable points:", error);
    return NextResponse.json(
      { error: "Failed to fetch from Notion" },
      { status: 500 }
    );
  }
}
