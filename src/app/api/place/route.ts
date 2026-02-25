import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { placePoint } from "@/lib/notion";

export async function POST(request: NextRequest) {
  // Check auth
  const cookieStore = await cookies();
  const session = cookieStore.get("loremap-auth");
  if (!session || session.value !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { pageId, x, y } = await request.json();

    if (!pageId || typeof x !== "number" || typeof y !== "number") {
      return NextResponse.json(
        { error: "Missing pageId, x, or y" },
        { status: 400 }
      );
    }

    if (x < 0 || x > 1 || y < 0 || y > 1) {
      return NextResponse.json(
        { error: "Coordinates must be between 0 and 1" },
        { status: 400 }
      );
    }

    await placePoint(pageId, x, y);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to place point:", error);
    return NextResponse.json(
      { error: "Failed to update Notion" },
      { status: 500 }
    );
  }
}
