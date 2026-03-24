import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createPoint } from "@/lib/notion";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const session = cookieStore.get("loremap-auth");
  if (!session || session.value !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name } = await request.json();

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const point = await createPoint(name.trim());
    return NextResponse.json(point);
  } catch (error) {
    console.error("Failed to create point:", error);
    return NextResponse.json(
      { error: "Failed to create point in Notion" },
      { status: 500 }
    );
  }
}
