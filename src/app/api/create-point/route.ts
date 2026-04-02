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
    const { name, x, y } = await request.json();

    const pointName = name && typeof name === "string" && name.trim() ? name.trim() : "";

    const point = await createPoint(pointName, x, y);
    return NextResponse.json(point);
  } catch (error) {
    console.error("Failed to create point:", error);
    return NextResponse.json(
      { error: "Failed to create point in Notion" },
      { status: 500 }
    );
  }
}
