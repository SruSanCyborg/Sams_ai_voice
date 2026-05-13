import { NextRequest, NextResponse } from "next/server";
import { AccessToken, VideoGrant } from "livekit-server-sdk";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { roomId, participantName } = await req.json();
  if (!roomId || !participantName) {
    return NextResponse.json({ error: "roomId and participantName required" }, { status: 400 });
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL ?? "ws://localhost:7880";

  if (!apiKey || !apiSecret) {
    return NextResponse.json({ error: "LiveKit credentials not configured" }, { status: 500 });
  }

  const grant: VideoGrant = {
    room: roomId,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  };

  const token = new AccessToken(apiKey, apiSecret, {
    identity: participantName,
    name: participantName,
    ttl: "4h",
  });
  token.addGrant(grant);

  return NextResponse.json({
    token: await token.toJwt(),
    livekit_url: livekitUrl,
    room_id: roomId,
  });
}
