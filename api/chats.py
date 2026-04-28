from fastapi import APIRouter, Depends, HTTPException
import uuid
import db

router = APIRouter(
    prefix="/messages",
    tags=["messages"],
    # dependencies=[Depends(get_token_header)],
    responses={404: {"description": "Not found"}}
)

fake_chats_db = [ {"chat_id": 1, "user_id": 1, "title":"What are oranges?", "messages": [{"role": "user", "message":"What are oranges?"}, {"role": "assistant", "message":"Oranges are a fruit."}]},
                  {"chat_id": 2, "user_id": 1, "title":"What are oranges?", "messages": [{"role": "user", "message":"What are oranges?"}, {"role": "assistant", "message":"Oranges are a fruit."}]}]
fake_users_db = { 1: {"username":"milena", "password_hash": "fhjdaksfhdsl", "salt": "1234fhdajsk"},
                  2: {"username":"ivan", "password_hash": "fhjdaksfhdsl", "salt": "1234fhdajsk"} }

@router.get("/")
async def read_chats():
    return fake_chats_db

@router.get("/chat/{user_id}/{chat_id}")
async def read_chat(user_id: int, chat_id: int):
    if user_id not in fake_users_db:
        raise HTTPException(status_code=404, detail="User not found")
    for chat in fake_chats_db:
        if chat["chat_id"] != chat_id:
            raise HTTPException(status_code=404, detail="Chat not found.")

    chat = db.get_chat(user_id, chat_id)
