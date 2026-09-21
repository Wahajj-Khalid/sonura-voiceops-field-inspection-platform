import json
import logging
import base64
import httpx
from typing import Dict, Any, List, Optional
from app.core.config import settings
from app.core.constants import GEMINI_BASE_URL, GEMINI_PRIORITY_MODELS
from app.ports.vision_port import VisionPort

logger = logging.getLogger("gemini-vision-adapter")

# Keywords that disqualify models from multimodal vision analysis
EXCLUDED_MODEL_SUBSTRINGS = [
    "tts",
    "transcribe",
    "clip",
    "audio",
    "robotics",
    "deep-research",
    "gemma",
    "banana",
    "antigravity",
    "customtools"
]

class GeminiVisionAdapter(VisionPort):
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.base_url = GEMINI_BASE_URL
        self._cached_discovered_models: Optional[List[str]] = None

    async def _get_candidate_models(self) -> List[str]:
        curated_models = list(GEMINI_PRIORITY_MODELS)

        if self._cached_discovered_models is not None:
            for discovered in self._cached_discovered_models:
                if discovered not in curated_models:
                    curated_models.append(discovered)
            return curated_models[:5]

        headers = {
            "x-goog-api-key": self.api_key,
            "Content-Type": "application/json"
        }
        list_url = f"{self.base_url}?key={self.api_key}"
        dynamic_list = []

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.get(list_url, headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    for item in data.get("models", []):
                        methods = item.get("supportedGenerationMethods", [])
                        name = item.get("name", "").replace("models/", "")
                        
                        is_excluded = any(sub in name.lower() for sub in EXCLUDED_MODEL_SUBSTRINGS)
                        if "generateContent" in methods and not is_excluded and ("flash" in name or "pro" in name):
                            dynamic_list.append(name)
                    self._cached_discovered_models = dynamic_list
        except Exception as e:
            logger.warning(f"Could not query dynamic Google model list: {str(e)}")

        for discovered in dynamic_list:
            if discovered not in curated_models:
                curated_models.append(discovered)

        # Cap trial list to at most 4 valid vision models to prevent request timeouts
        return curated_models[:4]

    async def analyze_defect_image(
        self, 
        image_bytes: bytes, 
        mime_type: str, 
        checklist_questions: List[str]
    ) -> Dict[str, Any]:
        if not self.api_key:
            return {
                "defect_detected": False,
                "defect_summary": "Gemini API key is not configured on backend server.",
                "severity": "LOW",
                "matched_checklist_keyword": "",
                "suggested_voice_announcement": "Photo captured and stored.",
                "error_message": "Missing GEMINI_API_KEY in environment configuration."
            }

        base64_data = base64.b64encode(image_bytes).decode("utf-8")
        questions_context = "\n".join([f"- {q}" for q in checklist_questions])

        prompt = (
            "You are Sonura Multimodal Industrial Defect Analyzer for mission-critical operations.\n"
            "Carefully analyze this industrial equipment photograph for physical defects, hazards, and degradation.\n"
            "Identify rust, corrosion, fluid leaks, torn gaskets, pipe cracks, mechanical binding, soot buildup, "
            "clogged filters, melted wiring, or safety lockout issues.\n\n"
            "CURRENT AUDIT CHECKLIST QUESTIONS:\n"
            f"{questions_context}\n\n"
            "Execution Rules:\n"
            "1. If any defect, corrosion, leak, or blockage is visible, set defect_detected to true.\n"
            "2. Write a concise 1 to 2 sentence defect_summary describing the physical fault.\n"
            "3. Set severity strictly to LOW, MEDIUM, or CRITICAL.\n"
            "4. In matched_checklist_keyword, specify the matching noun from the checklist questions (such as valve, filter, coolant, seal, or pressure).\n"
            "5. In suggested_voice_announcement, create a spoken alert for the voice copilot.\n\n"
            "Respond STRICTLY in a JSON object with this exact structure:\n"
            "{\n"
            '  "defect_detected": true,\n'
            '  "defect_summary": "Description of defect.",\n'
            '  "severity": "LOW" | "MEDIUM" | "CRITICAL",\n'
            '  "matched_checklist_keyword": "keyword",\n'
            '  "suggested_voice_announcement": "Spoken alert."\n'
            "}"
        )

        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt},
                        {
                            "inlineData": {
                                "mimeType": mime_type,
                                "data": base64_data
                            }
                        }
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.1,
                "responseMimeType": "application/json"
            }
        }

        headers = {
            "x-goog-api-key": self.api_key,
            "Content-Type": "application/json"
        }

        candidate_models = await self._get_candidate_models()
        last_failure_reason = ""

        for model in candidate_models:
            api_url = f"{self.base_url}/{model}:generateContent?key={self.api_key}"
            try:
                async with httpx.AsyncClient(timeout=15.0) as client:
                    res = await client.post(api_url, headers=headers, json=payload)
                    
                    if res.status_code != 200:
                        last_failure_reason = f"Model {model} returned HTTP {res.status_code}: {res.text[:120]}"
                        logger.warning(f"Vision candidate {model} failed: {last_failure_reason}")
                        continue

                    data = res.json()
                    candidates = data.get("candidates", [])
                    if not candidates:
                        last_failure_reason = f"Model {model} returned zero candidates."
                        continue

                    raw_text = candidates[0]["content"]["parts"][0]["text"].strip()
                    if raw_text.startswith("```"):
                        lines = raw_text.splitlines()
                        if lines[0].startswith("```"):
                            lines = lines[1:]
                        if lines and lines[-1].startswith("```"):
                            lines = lines[:-1]
                        raw_text = "\n".join(lines).strip()

                    parsed = json.loads(raw_text)
                    defect_detected = bool(parsed.get("defect_detected", False))
                    defect_summary = str(parsed.get("defect_summary", "Visual inspection finding recorded."))
                    severity = str(parsed.get("severity", "MEDIUM")).upper()
                    if severity not in ["LOW", "MEDIUM", "CRITICAL"]:
                        severity = "MEDIUM"

                    matched_keyword = str(parsed.get("matched_checklist_keyword", "")).strip()
                    voice_announcement = str(
                        parsed.get("suggested_voice_announcement", "Visual inspection finding recorded.")
                    ).strip()

                    logger.info(f"Gemini defect analysis succeeded using model: {model}")
                    return {
                        "defect_detected": defect_detected,
                        "defect_summary": defect_summary,
                        "severity": severity,
                        "matched_checklist_keyword": matched_keyword,
                        "suggested_voice_announcement": voice_announcement,
                        "active_model": model
                    }
            except Exception as e:
                last_failure_reason = f"Model {model} exception: {str(e)}"
                logger.warning(last_failure_reason)
                continue

        logger.error(f"All vision models exhausted. Reason: {last_failure_reason}")
        return {
            "defect_detected": False,
            "defect_summary": "Vision triage scan complete. Photo recorded in evidence vault.",
            "severity": "LOW",
            "matched_checklist_keyword": "",
            "suggested_voice_announcement": "Photo captured and attached to audit record.",
            "error_message": f"Vision API status: {last_failure_reason}"
        }