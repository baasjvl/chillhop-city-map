import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readFile, writeFile } from "fs/promises";
import path from "path";

const CONFIG_PATH = path.join(process.cwd(), "public/maps/config.json");

export async function GET() {
  const raw = await readFile(CONFIG_PATH, "utf-8");
  return NextResponse.json(JSON.parse(raw));
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const session = cookieStore.get("loremap-auth");
  if (!session || session.value !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const config = await request.json();

    if (!config.image || !config.width || !config.height) {
      return NextResponse.json(
        { error: "Missing image, width, or height" },
        { status: 400 }
      );
    }

    await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2) + "\n");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to save map config:", error);
    return NextResponse.json(
      { error: "Failed to save config" },
      { status: 500 }
    );
  }
}
