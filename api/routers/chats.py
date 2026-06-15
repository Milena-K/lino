from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from db.db_types import MessageJSON as Message
from pydantic import BaseModel
from ollama import AsyncClient
import db.main as db
from typing import List
import uuid

# OLLAMA_BASE_URL = "http://192.168.100.248"
OLLAMA_BASE_URL = "http://localhost:11434"

router = APIRouter(
    prefix="/chat",
    tags=["chat"],
    # dependencies=[Depends(get_token_header)],
    responses={404: {"description": "Not found"}}
)

class PromptRequest(BaseModel):
    messages: List[Message]


@router.post("/")
# async def chat_stream(request: PromptRequest):
async def chat_stream(request: PromptRequest):
    """The user writes a prompt and receives a response back."""
    async def generate():
        response = await AsyncClient().chat(model='llama3.2:1B', stream=True, messages=request.messages)
        async for chunk in response:
            if chunk:
                yield chunk.message.content.encode()
    return StreamingResponse(generate(), media_type="text/plain")

@router.get("/{username}/{chat_id}")
async def read_chat(username: str, chat_id: int, session_key: str):
    #TODO check maybe also if session key matches the latest session key
    user_id = await db.get_user_id(username)
    if user_id is None:
        raise HTTPException(status_code=404, detail="User not found")

    user_session_key = await db.get_login_record

    chat = await db.get_chat_by_id(user_id, chat_id)
    if chat is None:
        raise HTTPException(status_code=404, detail="Chat not found.")
    return chat

# TODO improve this method
# @router.post("/chat/{user_id}")
# async def save_chat(user_id: int, chat_id: int,  messages: MessageJSON):
#     """Saves chat to db, this func should be called by the client after each response from /chat"""
#     user_id = await db.get_user_id(username)
#     if user_id is None:
#         raise HTTPException(status_code=404, detail="User not found")
#     if chat_id is None:
#         await db.create_chat(user_id, "New chat", messages)

#     chat = await db.get_chat_by_id(user_id, chat_id)
#     if chat is None:
#         raise HTTPException(status_code=404, detail="Chat not found.")
#     await db.update_chat(user_id, chat_id, messages)
