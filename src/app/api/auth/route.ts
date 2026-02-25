import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { password, name } = await request.json();

  if (password !== process.env.EDITOR_PASSWORD) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true, name });
  response.cookies.set("loremap-auth", "authenticated", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  response.cookies.set("loremap-author", name || "Anonymous", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}

export async function GET() {
  // Check if authenticated
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const session = cookieStore.get("loremap-auth");
  const author = cookieStore.get("loremap-author");

  if (session?.value === "authenticated") {
    return NextResponse.json({
      authenticated: true,
      name: author?.value || "Anonymous",
    });
  }

  return NextResponse.json({ authenticated: false });
}
