import { NextRequest, NextResponse } from "next/server";
import { getCharacters } from "@/lib/notion-characters";

export async function GET(request: NextRequest) {
  try {
    const bustCache = request.nextUrl.searchParams.get("refresh") === "true";
    const characters = await getCharacters(bustCache);
    return NextResponse.json({ characters });
  } catch (error) {
    console.error("Failed to fetch characters:", error);
    return NextResponse.json({ error: "Failed to fetch from Notion" }, { status: 500 });
  }
}
