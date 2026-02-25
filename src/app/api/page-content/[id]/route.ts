import { NextRequest, NextResponse } from "next/server";
import { getPageContent } from "@/lib/notion";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const content = await getPageContent(id);
    return NextResponse.json({ content });
  } catch (error) {
    console.error("Failed to fetch page content:", error);
    return NextResponse.json(
      { error: "Failed to fetch page content" },
      { status: 500 }
    );
  }
}
