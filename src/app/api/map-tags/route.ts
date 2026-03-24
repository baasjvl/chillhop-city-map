import { NextRequest, NextResponse } from "next/server";
import { getMapTags, getTagTypeOptions } from "@/lib/notion-tags";

export async function GET(request: NextRequest) {
  try {
    const bustCache = request.nextUrl.searchParams.get("refresh") === "true";
    const [tags, tagTypes] = await Promise.all([
      getMapTags(bustCache),
      getTagTypeOptions(),
    ]);
    return NextResponse.json({ tags, tagTypes });
  } catch (error) {
    console.error("Failed to fetch map tags:", error);
    return NextResponse.json(
      { error: "Failed to fetch from Notion" },
      { status: 500 }
    );
  }
}
