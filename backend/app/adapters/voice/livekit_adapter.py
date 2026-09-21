# backend/app/adapters/voice/livekit_adapter.py
from typing import Dict, Any
from livekit import api
from app.core.config import settings
from app.ports.voice_port import VoicePort

class LiveKitVoiceAdapter(VoicePort):
    def __init__(self):
        self.api_key = settings.LIVEKIT_API_KEY
        self.api_secret = settings.LIVEKIT_API_SECRET
        self.livekit_url = settings.LIVEKIT_URL

    async def generate_connection_token(self, room_name: str, participant_identity: str) -> str:
        token = api.AccessToken(self.api_key, self.api_secret) \
            .with_identity(participant_identity) \
            .with_name(f"Operator_{participant_identity[:6]}") \
            .with_grants(api.VideoGrants(
                room_join=True,
                room=room_name,
                can_publish=True,
                can_subscribe=True
            ))
        return token.to_jwt()

    async def dispatch_agent(self, room_name: str, metadata: Dict[str, Any]) -> bool:
        lk_client = api.LiveKitAPI(self.livekit_url, self.api_key, self.api_secret)
        try:
            await lk_client.room.create_room(api.CreateRoomRequest(name=room_name))
            return True
        finally:
            await lk_client.aclose()