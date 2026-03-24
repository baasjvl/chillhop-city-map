import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { updateRoutines } from "@/lib/notion-characters";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const session = cookieStore.get("loremap-auth");
  if (!session || session.value !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { pageId, routines } = await request.json();
    if (!pageId || typeof routines !== "string") {
      return NextResponse.json({ error: "Missing pageId or routines" }, { status: 400 });
    }
    await updateRoutines(pageId, routines);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update routine:", error);
    return NextResponse.json({ error: "Failed to update routine" }, { status: 500 });
  }
}
