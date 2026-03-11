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
    """The user writes a prompt and receives a response back."""
    async def generate():
        auth = httpx.BasicAuth(username="milena", password="this_is_the_password")
        async with httpx.AsyncClient(timeout=3000, auth=auth) as client:
            async with client.stream(
                'POST',
                f'{OLLAMA_BASE_URL}/api/generate',
                json={
                    "prompt": request.prompt,
                    "model": request.model,
                    "stream": True
                }
            ) as response:
                async for chunk in response.aiter_lines():
                    if chunk:
                        data = json.loads(chunk)
                        yield data.get(response, "")

    return StreamingResponse(generate(), media_type="text/plain")

# call LLM server
# curl http://192.168.100.248/api/generate -d '{"prompt": "Tell me a story", "model":"llama3.2"}'


# class UserLogin(BaseModel):
#     user_name: str
#     password: str

# async def login(user: UserLogin):
#     pass
