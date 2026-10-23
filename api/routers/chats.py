from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from api.db.db_types import MessageJSON as Message
from pydantic import BaseModel
from pathlib import Path
from ollama import AsyncClient
from typing import List
import api.db.main as db
import uuid
import gnupg
import os

BASE_URL = "http://localhost:11434"

router = APIRouter(
    prefix="/chat",
    tags=["chat"],
    # dependencies=[Depends(get_token_header)],
    responses={404: {"description": "Not found"}},
)

gpg = gnupg.GPG()
# key_path = os.getenv("PGP_KEY_PATH", "./llm/keys/private-backup.asc")
priv_key = gpg.import_keys(
    Path("/home/milena/Documents/Uni/bachelors/lino/api/llm/keys/private-backup.asc")
    .read_text()
    .strip()
)
print(priv_key.fingerprints)
# pub_key = gpg.import_keys(
#     Path("/home/milena/Documents/Uni/bachelors/lino/api/llm/keys/public.asc")
#     .read_text()
#     .strip()
# )
# print(pub_key.fingerprints)
# print(gpg.list_keys(secret=True))


class PromptRequest(BaseModel):
    messages: List[Message]


@router.post("/")
# async def chat_stream(request: PromptRequest):
async def chat_stream(request: PromptRequest):
    """The user writes a prompt and receives a response back."""

    async def generate():
        response = await AsyncClient().chat(
            model="llama3.2:1B", stream=True, messages=request.messages
        )
        async for chunk in response:
            if chunk:
                yield chunk.message.content.encode()

    return StreamingResponse(generate(), media_type="text/plain")


@router.get("/{username}/{chat_id}")
async def read_chat(username: str, chat_id: int, session_key: str):
    # TODO check maybe also if session key matches the latest session key
    user_id = await db.get_user_id(username)
    if user_id is None:
        raise HTTPException(status_code=404, detail="User not found")

    user_session_key = await db.get_login_record

    chat = await db.get_chat_by_id(user_id, chat_id)
    if chat is None:
        raise HTTPException(status_code=404, detail="Chat not found.")
    return chat


class EncryptedRequest(BaseModel):
    message: str


# TODO encrypt and decrypt with key
def encrypt_message(message: str) -> str:
    """Encrypt a string, return armored ciphertext."""
    encrypted = gpg.encrypt(
        message,
        priv_key.fingerprints[0],
        armor=True,  # ASCII-armored output (text-safe)
        always_trust=True,  # skip trust-model prompt for your own key
    )
    if not encrypted.ok:
        raise RuntimeError(
            f"Encryption failed: {encrypted.status} / {encrypted.stderr}"
        )
    return str(encrypted)


def decrypt_message(ciphertext: str) -> str:
    """Decrypt an armored string, return plaintext."""
    decrypted = gpg.decrypt(
        ciphertext,
    )
    if not decrypted.ok:
        print("ok:", decrypted.ok)
        print("status:", decrypted.status)
        print("stderr:\n", decrypted.stderr)
        raise RuntimeError(f"Decryption failed: {decrypted.status} / {decrypted}")

    return str(decrypted)


# TODO: write a function in one of the components that will call /saveChat
# from auth worker and then send the message to the server.
@router.post("/save")
async def save(req: EncryptedRequest):
    # print(gpg.list_keys(secret=True)[1]["fingerprint"])
    # decrypt
    decrypted = decrypt_message(req.message)

    print(decrypted)
    return {"ok": True}


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
