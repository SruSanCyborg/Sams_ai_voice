import json
from fastapi import APIRouter, HTTPException
from models.schemas import ModeratorRequest
from config import settings

router = APIRouter()


@router.post("/compose")
async def compose(req: ModeratorRequest):
    if not settings.groq_api_key:
        # Evenly space participants when no API key is configured
        suggestions = [
            {
                "participant_id": p.get("id", ""),
                "suggested_position": [(i - len(req.participants) / 2) * 2.5, 0, 0],
                "reason": "Evenly spaced (no AI key configured)",
            }
            for i, p in enumerate(req.participants)
        ]
        return {"suggestions": suggestions}

    try:
        from groq import AsyncGroq
        client = AsyncGroq(api_key=settings.groq_api_key)

        prompt = f"""You are an AI spatial audio meeting moderator for ECHO-3D.
Current participants and positions: {json.dumps(req.participants, indent=2)}
Recent speakers: {', '.join(req.speaking_history[-5:])}

Suggest optimal 3D positions (x, y=0, z) for each participant to improve conversation flow.
Frequent speakers should be closer to center. Keep x and z between -6 and 6.
Return ONLY a valid JSON object: {{"suggestions": [{{"participant_id": "...", "suggested_position": [x, 0, z], "reason": "..."}}]}}"""

        response = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=500,
            temperature=0.3,
        )

        content = response.choices[0].message.content or "{}"
        # Strip markdown code fences if model wraps the JSON
        content = content.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        data = json.loads(content)
        suggestions = data.get("suggestions", data) if isinstance(data, dict) else data
        return {"suggestions": suggestions}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
