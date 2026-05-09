#!/usr/bin/env python3
from pydantic import BaseModel, TypeAdapter
from fastapi import Depends, APIRouter, Request, HTTPException
from pyrate_limiter import Duration, Limiter, Rate
from fastapi_limiter.depends import RateLimiter
from dotenv import load_dotenv
from datetime import datetime
from db.db_types import User
import os
import json
import base64
import opaquepy
import db.main as db

load_dotenv()


server_setup = os.getenv("OPAQUE_SERVER_SETUP")

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
    dependencies=[Depends(RateLimiter(limiter=Limiter(Rate(100, Duration.SECOND * 60))))],
    responses={404: {"description": "Not found"}}
)

class RegistrationRequest(BaseModel):
    username: str
    regReq: str

class RegistrationFinishRequest(BaseModel):
    username: str
    registration_record: str

class LoginRequest(BaseModel):
    username: str
    login_request: str

class LoginFinishRequest(BaseModel):
    username: str
    request_finish: str


@router.post("/register")
async def register(request: RegistrationRequest) -> str:
    if not isinstance(server_setup, str):
        raise HTTPException(500, "Server setup string not found.")

    reg_response = opaquepy.register(
        server_setup,
        request.regReq,
        request.username,
    )
    return reg_response

@router.post("/register_finish")
async def register_finish(request: RegistrationFinishRequest):
    user = await db.get_user(request.username)
    if user is None:
        record = opaquepy.register_finish(request.registration_record)
        await db.create_user(request.username, record)
    # send a 200 even if user does exist to avoid leaking
    # the information if the user exists or not

@router.post("/login")
async def login(request: LoginRequest) -> str:
    user: User | None = await db.get_user(request.username)
    if user is None:
        raise HTTPException(status_code=404, detail="User does not exist.")
    user_record = user.registration_record
    has_login = await db.get_login_record(user.user_name)
    if has_login:
        raise HTTPException(status_code=404, detail="User already has login.")

    if not isinstance(server_setup, str):
        raise HTTPException(500, "Server setup string not found.")
    response, credential_secret = opaquepy.login(server_setup,
                                                user_record,
                                                request.login_request,
                                                request.username)
    await db.create_credential_secret(user.user_name,
                                    credential_secret,
                                    str(datetime.now()))
    return response

@router.post("/login_finish")
async def login_finish(request: LoginFinishRequest) -> str:
    user: User | None = await db.get_user(request.username)
    if user is None:
        raise HTTPException(status_code=404, detail="User does not exist.")

    user_state = await db.get_credential_secret(user.user_name)
    if user_state is None:
        raise HTTPException(status_code=404, detail="Login step 1 did not complete correctly.")

    session_key = opaquepy.login_finish(request.request_finish, user_state)
    await db.create_login_record(user.user_name, session_key, str(datetime.now()))
    await db.delete_credential_secret(request.username)
    return session_key

@router.post("/logout/{username}")
async def sign_out(username: str):
    await db.delete_login_record(username)
