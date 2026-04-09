from typing import Literal
import uuid
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ValidationError, RootModel
from typing import TypeAlias
from ollama import chat, AsyncClient
import json
import asyncio

app = FastAPI()

origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OLLAMA_BASE_URL = "http://192.168.100.248"
OLLAMA_BASE_URL = "http://localhost:11434"


class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str

class PromptRequest(BaseModel):
    messages: list[Message]


@app.post("/chat")
async def chat_stream(request: PromptRequest):
    """The user writes a prompt and receives a response back."""
    async def generate():
        response = await AsyncClient().chat(model='llama3.2:1B', stream=True, messages=request.messages)
        async for chunk in response:
            if chunk:
                yield chunk.message.content.encode()
    return StreamingResponse(generate(), media_type="text/plain")


@app.post("/chat/{id}")
def save_chat(id: uuid.UUID):
    """Saves chat to db, this func should be called by the client after each response from /chat"""
    print(id)
