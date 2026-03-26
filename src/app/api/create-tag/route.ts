import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createMapTag } from "@/lib/notion-tags";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const session = cookieStore.get("loremap-auth");
  if (!session || session.value !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, tagType, addedBy } = await request.json();

    if (!name?.trim() || !tagType) {
      return NextResponse.json(
        { error: "Name and type are required" },
        { status: 400 }
      );
    }

    const tag = await createMapTag(name.trim(), tagType, addedBy || "Anonymous");
    return NextResponse.json(tag);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Failed to create tag:", msg, error);
    return NextResponse.json(
      { error: `Failed to create tag: ${msg}` },
      { status: 500 }
    );
  }
}
