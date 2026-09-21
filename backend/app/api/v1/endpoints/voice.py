from typing import Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.config import settings
from app.ports.voice_port import VoicePort
from app.adapters.voice.livekit_adapter import LiveKitVoiceAdapter

router = APIRouter()

class FlexibleVoiceTokenRequest(BaseModel):
    unit_id: Optional[str] = Field(None, description="Inspection unit identifier")
    room_name: Optional[str] = Field(None, description="Direct WebRTC room name")
    participant_id: Optional[str] = Field(None, description="Participant identity")

class SessionTokenResponse(BaseModel):
    token: str
    room_name: str
    livekit_url: str

def get_voice_service() -> VoicePort:
    return LiveKitVoiceAdapter()

@router.post("/token", response_model=SessionTokenResponse)
async def get_voice_token(
    payload: FlexibleVoiceTokenRequest,
    voice_service: VoicePort = Depends(get_voice_service)
):
    resolved_unit = payload.unit_id or payload.room_name
    if not resolved_unit:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing required field: Provide either unit_id or room_name."
        )

    resolved_room = f"inspection-unit-{resolved_unit}" if not resolved_unit.startswith("inspection-unit-") else resolved_unit
    resolved_identity = payload.participant_id or "field-inspector"

    try:
        token = await voice_service.generate_connection_token(
            room_name=resolved_room,
            participant_identity=resolved_identity
        )
        return SessionTokenResponse(
            token=token,
            room_name=resolved_room,
            livekit_url=settings.LIVEKIT_URL
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Voice Token Generation Failed: {str(e)}"
        )