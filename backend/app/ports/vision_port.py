from typing import Protocol, List, Dict, Any

class VisionPort(Protocol):
    async def analyze_defect_image(
        self, 
        image_bytes: bytes, 
        mime_type: str, 
        checklist_questions: List[str]
    ) -> Dict[str, Any]: ...