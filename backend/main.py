# Image to Prompt AI - FastAPI Server (embedded in Colab notebook)
# This file is generated inside the notebook automatically during Run All.
# It should NOT need to be created manually by the user.

import os
import re
import json
import uuid
import tempfile
import logging
from typing import List

import requests
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# ------------------------------------------------------------------
# Configuration
# ------------------------------------------------------------------
OLLAMA_HOST = os.environ.get("OLLAMA_HOST", "127.0.0.1:11434")
OLLAMA_BASE = f"http://{OLLAMA_HOST}"
MODEL_12B = os.environ.get("MODEL_12B", "gemma3:12b")
MODEL_4B = os.environ.get("MODEL_4B", "gemma3:4b")
MODEL = os.environ.get("IMAGE_TO_PROMPT_MODEL", MODEL_12B)
SERVICE = "image-to-prompt-ai"
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/avif"}
MAX_SIZE = 20 * 1024 * 1024  # 20 MB

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("image-to-prompt-ai")

app = FastAPI(title="Image to Prompt AI", version="1.0.0")

# CORS: allow all for personal use; restrict later if needed
_cors_origins = os.environ.get("CORS_ORIGINS", "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _cors_origins.split(",") if o.strip()],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# ------------------------------------------------------------------
# System Prompt - the heart of the analysis quality
# ------------------------------------------------------------------
SYSTEM_PROMPT = """You are a professional visual analyst, a commercial stock-image specialist, and an expert AI image-generation prompt engineer.

Your task is to analyze the uploaded image and produce a detailed, professional, commercially useful AI image-generation prompt.

Carefully inspect the image and describe ONLY what is reasonably visible. Do NOT invent objects, people, locations, brands, logos, products, actions, or environmental details that are not present.

Analyze and include where applicable:
- Subject(s) and their attributes
- Objects and their arrangement
- Environment, background, and setting
- Composition, framing, camera angle, and perspective
- Lighting, shadows, highlights, and mood
- Colors, palette, saturation, and contrast
- Materials, textures, surfaces, and reflectivity
- Depth, focus, depth of field, and foreground/background separation
- Photography or illustration style
- Commercial and professional visual characteristics

Respond with STRICT JSON only, with this exact structure:
{
  "description": "A short, accurate 1-3 sentence visual description.",
  "prompt": "A detailed, natural, professional image-generation prompt of 100-180 words. Write it as a coherent paragraph intended for an AI image generator. Do not just list features; weave them into a professional prompt.",
  "keywords": ["15-25 relevant keywords describing only the visible subject"]
}
The "prompt" must be detailed, natural, visually accurate, professional, AI-generation friendly, and commercially useful.
The "description" must be shorter than the "prompt".
The "keywords" must describe only the visible subject.
Return ONLY valid JSON. No commentary, no markdown fences, no extra text."""


def _health_ok() -> bool:
    try:
        r = requests.get(f"{OLLAMA_BASE}/", timeout=5)
        return r.status_code == 200
    except Exception:
        return False


def _model_available(model: str) -> bool:
    try:
        r = requests.get(f"{OLLAMA_BASE}/api/tags", timeout=10)
        if r.status_code != 200:
            return False
        names = {m.get("name", "").split(":")[0] for m in r.json().get("models", [])}
        return model.split(":")[0] in names
    except Exception:
        return False


def _parse_json_response(text: str) -> dict:
    """Robustly parse JSON from the model output, removing markdown fences if present."""
    if not text:
        raise ValueError("Empty model response")
    cleaned = text.strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    try:
        return json.loads(cleaned)
    except Exception:
        # try to find the JSON object within the text
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except Exception:
                raise
    raise ValueError("Invalid JSON in model response")


def _safe_result(description, prompt, keywords) -> dict:
    return {
        "description": description or "The image could not be described.",
        "prompt": prompt or "Unable to generate a prompt for this image.",
        "keywords": keywords if isinstance(keywords, list) else [],
    }


def _analyze_bytes(image_bytes: bytes) -> dict:
    # Use /api/generate with base64 image for vision
    import base64
    b64 = base64.b64encode(image_bytes).decode("utf-8")

    payload = {
        "model": MODEL,
        "system": SYSTEM_PROMPT,
        "prompt": "Analyze this image and generate a professional AI image-generation prompt according to your instructions. Return only JSON.",
        "images": [b64],
        "stream": False,
        "options": {"temperature": 0.7, "num_predict": 1200},
    }

    r = requests.post(f"{OLLAMA_BASE}/api/generate", json=payload, timeout=600)
    if r.status_code != 200:
        raise RuntimeError(f"Ollama error: {r.status_code} {r.text[:200]}")

    data = r.json()
    out = data.get("response", "")

    try:
        parsed = _parse_json_response(out)
        description = str(parsed.get("description", ""))
        prompt = str(parsed.get("prompt", ""))
        keywords = parsed.get("keywords", [])
        if isinstance(keywords, list):
            keywords = [str(k).strip() for k in keywords][:25]
        else:
            keywords = []
        return _safe_result(description, prompt, keywords)
    except Exception as exc:
        logger.warning(f"JSON parse recovery: {exc}")
        # graceful fallback: return raw response as description
        return _safe_result(out[:400], out, [])


# ------------------------------------------------------------------
# Routes
# ------------------------------------------------------------------
@app.get("/")
def root():
    return {"service": SERVICE, "status": "ok", "docs": "/docs"}


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": SERVICE,
        "ollama": _health_ok(),
        "model": MODEL,
        "vision": True,
    }


def _validate_upload(file: UploadFile):
    content_type = file.content_type or ""
    if content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported image format.")
    return content_type


@app.post("/analyze-image")
async def analyze_image(file: UploadFile = File(...)):
    _validate_upload(file)

    data = await file.read()
    if len(data) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="Image exceeds 20 MB limit.")
    if len(data) == 0:
        raise HTTPException(status_code=400, detail="Empty image file.")

    ext = os.path.splitext(file.filename or "")[1] or ".img"
    temp_path = os.path.join(tempfile.gettempdir(), f"iap_{uuid.uuid4().hex}{ext}")
    try:
        with open(temp_path, "wb") as f:
            f.write(data)
        result = _analyze_bytes(data)
        return {"success": True, **result}
    finally:
        try:
            if os.path.exists(temp_path):
                os.remove(temp_path)
        except Exception:
            pass


@app.post("/analyze-images")
async def analyze_images(files: List[UploadFile] = File(...)):
    results = []
    for file in files:
        try:
            _validate_upload(file)
            data = await file.read()
            if len(data) > MAX_SIZE:
                results.append({"filename": file.filename, "success": False, "error": "Image exceeds 20 MB limit."})
                continue
            result = _analyze_bytes(data)
            results.append({"filename": file.filename, "success": True, **result})
        except HTTPException as exc:
            results.append({"filename": file.filename, "success": False, "error": exc.detail})
        except Exception as exc:
            results.append({"filename": file.filename, "success": False, "error": str(exc)})
    return {"results": results}
