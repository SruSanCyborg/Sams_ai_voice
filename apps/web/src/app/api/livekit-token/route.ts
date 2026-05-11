import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

export async function POST(req: NextRequest) {
  const { roomId, participantName } = await req.json();
  if (!roomId || !participantName) {
    return NextResponse.json({ error: "roomId and participantName required" }, { status: 400 });
  }

  const res = await fetch(`${BACKEND_URL}/rooms/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ room_id: roomId, participant_name: participantName }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to get token" }, { status: 500 });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
