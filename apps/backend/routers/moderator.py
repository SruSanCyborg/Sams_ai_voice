import json
import asyncio
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from models.schemas import ModeratorRequest
from config import settings

router = APIRouter()


@router.post("/compose")
async def compose(req: ModeratorRequest):
    if not settings.openai_api_key:
        # Return mock suggestions if no API key
        suggestions = [
            {
                "participant_id": p.get("id", ""),
                "suggested_position": [
                    (i - len(req.participants) / 2) * 2.5,
                    0,
                    0,
                ],
                "reason": "Arranged for even spacing",
            }
            for i, p in enumerate(req.participants)
        ]
        return {"suggestions": suggestions}

    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=settings.openai_api_key)

        prompt = f"""You are an AI spatial audio meeting moderator for ECHO-3D.
Current participants and positions: {json.dumps(req.participants, indent=2)}
Recent speakers: {', '.join(req.speaking_history[-5:])}

Suggest optimal 3D positions (x, y=0, z) for each participant to improve conversation flow.
Participants who talk often should be closer to the center.
Return JSON array: [{{"participant_id": "...", "suggested_position": [x, 0, z], "reason": "..."}}]
Keep x and z values between -6 and 6. Return only valid JSON."""

        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            max_tokens=500,
        )

        content = response.choices[0].message.content or "{}"
        data = json.loads(content)
        suggestions = data.get("suggestions", data) if isinstance(data, dict) else data
        return {"suggestions": suggestions}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
