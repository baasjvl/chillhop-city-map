import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { updatePageContent } from "@/lib/notion";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const session = cookieStore.get("loremap-auth");
  if (!session || session.value !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { pageId, content } = await request.json();

    if (!pageId) {
      return NextResponse.json({ error: "Missing pageId" }, { status: 400 });
    }

    await updatePageContent(pageId, content ?? "");
    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Failed to update page content:", msg, error);
    return NextResponse.json(
      { error: `Failed to update page content: ${msg}` },
      { status: 500 }
    );
  }
}
