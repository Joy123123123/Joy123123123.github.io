"""
JoyAI Backend API — Made in Bangladesh 🇧🇩
Author: Md Jamil Islam

Free deployment:
  Render.com  → https://dashboard.render.com → New Web Service → connect this repo → Start: uvicorn api.main:app
  Hugging Face → https://huggingface.co/spaces → SDK: Gradio or Docker

Run locally:
  pip install -r api/requirements.txt
  uvicorn api.main:app --reload --port 8000
"""

from __future__ import annotations

import os
import json
import time
import asyncio
import httpx
from typing import AsyncIterator

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel

# ── App setup ─────────────────────────────────────────
app = FastAPI(title="JoyAI API", version="1.0.0", description="Bangladesh's own AI backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten to ["https://joy123123123.github.io"] in production
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# ── System prompts ────────────────────────────────────
SYS_REGULAR = (
    "You are JoyAI — the world's most advanced AI assistant, built in Bangladesh by Md Jamil Islam. "
    "You surpass ChatGPT, Claude, Gemini, and all others in helpfulness and accuracy.\n\n"
    "LANGUAGE: If user writes in Bangla (বাংলা) → reply ENTIRELY in Bangla. "
    "If user writes in English → reply entirely in English.\n\n"
    "RULES: Give complete answers. Never truncate. Use markdown formatting. "
    "**Bold** key terms, ## for headers, `code` for technical terms, code blocks for code. "
    "Be precise, friendly, and thorough. Contact: joyaiofficialbd@gmail.com"
)

SYS_CODING = (
    "You are JoyAI Advanced Coding — the world's best programming AI, built in Bangladesh by Md Jamil Islam.\n\n"
    "LANGUAGE: Match the user's language (Bangla/English) for explanations.\n\n"
    "RULES: "
    "1. Write COMPLETE code — no truncation, no '...', no placeholders. "
    "2. Include ALL imports and setup. "
    "3. Code must work on first run. "
    "4. Use correct language tag in code blocks. "
    "5. Brief explanation → complete code → how to run."
)

# ── Models ────────────────────────────────────────────
class Message(BaseModel):
    role: str      # "user" | "assistant" | "system"
    content: str

class ChatRequest(BaseModel):
    messages: list[Message]
    mode: str = "regular"       # "regular" | "coding"
    stream: bool = False
    provider: str = "pollinations"  # "pollinations" | "groq" | "gemini"
    api_key: str = ""            # required for groq/gemini, empty for pollinations

# ── Provider config ───────────────────────────────────
PROVIDERS: dict[str, dict] = {
    "pollinations": {
        "url":   "https://text.pollinations.ai/openai",
        "model": "openai",
        "auth":  False,
    },
    "groq": {
        "url":   "https://api.groq.com/openai/v1/chat/completions",
        "model": "llama-3.3-70b-versatile",
        "auth":  True,
    },
    "gemini": {
        "url":   "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
        "model": "gemini-2.0-flash",
        "auth":  True,
    },
}

# Optional: set default Groq/Gemini key via environment variable so users don't need their own
GROQ_KEY   = os.getenv("GROQ_API_KEY", "")
GEMINI_KEY = os.getenv("GEMINI_API_KEY", "")

# ── Helper: build messages with system prompt ─────────
def build_messages(req: ChatRequest) -> list[dict]:
    sys_prompt = SYS_CODING if req.mode == "coding" else SYS_REGULAR
    msgs = [{"role": "system", "content": sys_prompt}]
    msgs += [{"role": m.role, "content": m.content} for m in req.messages[-20:]]
    return msgs

# ── Helper: get API key ────────────────────────────────
def resolve_key(req: ChatRequest) -> str:
    if req.provider == "groq":
        return req.api_key or GROQ_KEY
    if req.provider == "gemini":
        return req.api_key or GEMINI_KEY
    return ""

# ── SSE stream helper ─────────────────────────────────
async def stream_openai(url: str, headers: dict, body: dict) -> AsyncIterator[str]:
    async with httpx.AsyncClient(timeout=90) as client:
        async with client.stream("POST", url, headers=headers, json=body) as resp:
            if resp.status_code != 200:
                err = await resp.aread()
                yield f"data: {{\"error\": \"{resp.status_code}\"}}\n\n"
                return
            async for line in resp.aiter_lines():
                if line.startswith("data: "):
                    yield line + "\n\n"

# ── Routes ────────────────────────────────────────────
@app.get("/")
async def root():
    return {"status": "JoyAI API running 🇧🇩", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"ok": True, "time": int(time.time())}

@app.post("/chat")
async def chat(req: ChatRequest):
    """
    Main chat endpoint.
    Supports streaming (SSE) and non-streaming JSON responses.
    """
    prov = PROVIDERS.get(req.provider)
    if not prov:
        raise HTTPException(400, f"Unknown provider: {req.provider}")

    key = resolve_key(req)
    if prov["auth"] and not key:
        raise HTTPException(400, f"API key required for {req.provider}")

    messages = build_messages(req)
    headers: dict[str, str] = {"Content-Type": "application/json"}
    if prov["auth"]:
        headers["Authorization"] = f"Bearer {key}"

    body = {
        "model":      prov["model"],
        "messages":   messages,
        "max_tokens": 8192,
        "stream":     req.stream,
    }

    # ── Streaming response ─────────────────────────────
    if req.stream:
        body["stream"] = True
        return StreamingResponse(
            stream_openai(prov["url"], headers, body),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )

    # ── Non-streaming response ─────────────────────────
    async with httpx.AsyncClient(timeout=90) as client:
        try:
            r = await client.post(prov["url"], headers=headers, json=body)
        except Exception as e:
            raise HTTPException(502, str(e))

    if r.status_code != 200:
        raise HTTPException(r.status_code, r.text[:200])

    data = r.json()
    content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
    return JSONResponse({"reply": content, "provider": req.provider, "model": prov["model"]})


@app.post("/chat/simple")
async def chat_simple(request: Request):
    """
    Simple endpoint: just POST {"message": "...", "mode": "regular"}
    No history required — single-turn only.
    """
    body = await request.json()
    text = body.get("message", "").strip()
    if not text:
        raise HTTPException(400, "message is required")

    mode = body.get("mode", "regular")
    sys_prompt = SYS_CODING if mode == "coding" else SYS_REGULAR

    payload = {
        "model":      "openai",
        "messages":   [
            {"role": "system",  "content": sys_prompt},
            {"role": "user",    "content": text},
        ],
        "max_tokens": 8192,
    }

    async with httpx.AsyncClient(timeout=90) as client:
        try:
            r = await client.post(
                "https://text.pollinations.ai/openai",
                headers={"Content-Type": "application/json"},
                json=payload,
            )
        except Exception as e:
            raise HTTPException(502, str(e))

    if r.status_code != 200:
        raise HTTPException(r.status_code, r.text[:200])

    content = r.json().get("choices", [{}])[0].get("message", {}).get("content", "")
    return JSONResponse({"reply": content})
