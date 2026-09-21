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
    custom_livekit_url: Optional[str] = Field(None, description="Ephemeral LiveKit URL for custom testing")
    custom_livekit_api_key: Optional[str] = Field(None, description="Ephemeral LiveKit API Key for custom testing")
    custom_livekit_api_secret: Optional[str] = Field(None, description="Ephemeral LiveKit API Secret for custom testing")

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

    active_url = payload.custom_livekit_url or settings.LIVEKIT_URL
    active_key = payload.custom_livekit_api_key or settings.LIVEKIT_API_KEY
    active_secret = payload.custom_livekit_api_secret or settings.LIVEKIT_API_SECRET

    if not active_url or not active_key or not active_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="LiveKit credentials are not configured. Click the Key icon in the header to enter ephemeral session keys."
        )

    try:
        adapter = LiveKitVoiceAdapter(
            api_key=active_key,
            api_secret=active_secret,
            livekit_url=active_url
        )
        token = await adapter.generate_connection_token(
            room_name=resolved_room,
            participant_identity=resolved_identity
        )
        return SessionTokenResponse(
            token=token,
            room_name=resolved_room,
            livekit_url=active_url
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Voice Token Generation Failed: {str(e)}"
        )