import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { updatePointStatus } from "@/lib/notion";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const session = cookieStore.get("loremap-auth");
  if (!session || session.value !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { pageId, status } = await request.json();

    if (!pageId || typeof status !== "string") {
      return NextResponse.json(
        { error: "Missing pageId or status" },
        { status: 400 }
      );
    }

    await updatePointStatus(pageId, status);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update status:", error);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    );
  }
}
