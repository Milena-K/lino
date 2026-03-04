import httpx
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import json

app = FastAPI()

OLLAMA_BASE_URL = "http://192.168.100.248"

class PromptRequest(BaseModel):
    prompt: str
    model: str = "llama3.2"

@app.post("/chat/stream")
async def chat_stream(request: PromptRequest):
    async def generate():
        async with httpx.AsyncClient(timeout=300) as client:
            async with client.stream(
                "POST",
                f"{OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": request.model,
                    "prompt": request.prompt,
                    "stream": True
                }
            ) as response:
                async for chunk in response.aiter_lines():
                    if chunk:
                        data = json.loads(chunk)
                        yield data.get("response", "")

    return StreamingResponse(generate(), media_type="text/plain")
