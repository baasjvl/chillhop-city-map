import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deleteMapTag } from "@/lib/notion-tags";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const session = cookieStore.get("loremap-auth");
  if (!session || session.value !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { pageId } = await request.json();

    if (!pageId) {
      return NextResponse.json({ error: "Missing pageId" }, { status: 400 });
    }

    await deleteMapTag(pageId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete tag:", error);
    return NextResponse.json(
      { error: "Failed to delete tag" },
      { status: 500 }
    );
  }
}
