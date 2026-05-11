import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

export async function GET(req: NextRequest) {
  const roomId = req.nextUrl.searchParams.get("id");
  if (!roomId) return NextResponse.json({ error: "id required" }, { status: 400 });

  const res = await fetch(`${BACKEND_URL}/rooms/${roomId}`);
  const data = await res.json();
  return NextResponse.json(data);
}
