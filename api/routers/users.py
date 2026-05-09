#!/usr/bin/env python3
import db.main as db
# from db.main import get_user_id
from fastapi import APIRouter, HTTPException

router = APIRouter(
    prefix="/users",
    tags=["users"],
    responses={404: {"description": "Not found"}}
)

@router.get("/{username}")
async def read_user(username: str):
    user = await db.get_user(username)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "user_id": user.user_id,
        "username": user.user_name,
        "registration_record": user.registration_record
    }

@router.post("/delete/{username}")
async def delete_user(username:str):
    await db.delete_user(username)
