#!/usr/bin/env python3
import os
import json
import base64
from pydantic import BaseModel
from fastapi import Depends, APIRouter, Request
from pyrate_limiter import Duration, Limiter, Rate
from fastapi_limiter.depends import RateLimiter
from dotenv import load_dotenv
from opaque_service import server_setup
import opaquepy

load_dotenv()

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
    dependencies=[Depends(RateLimiter(limiter=Limiter(Rate(100, Duration.SECOND * 60))))],
    responses={404: {"description": "Not found"}}
)

#TODO create a db table for each
users = {}
credentialSecrets = {}
registerSecrets = {}


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

# TODO: where is the client pub key set and shared?

@router.post("/register")
async def register(request: RegistrationRequest):
    # TODO check in db if username is already registered
    reg_response = opaquepy.register(
        server_setup,
        request.regReq,
        request.username,
    )
    return reg_response

@router.post("/register_finish")
async def register_finish(request: RegistrationFinishRequest):
    record = opaquepy.register_finish(request.registration_record)
    # TODO save in db (username, record)
    users[request.username] = record

    print(record)

@router.post("/login")
async def login(request: LoginRequest):
    # TODO find user record in db (username, record)
    user_record = users.get(request.username, None)
    if not user_record:
        raise Exception("User does not exist.")
    (response, user_state) = opaquepy.login(server_setup, user_record, request.login_request, request.username)
    #TODO create a db for credential secrets
    credentialSecrets[request.username] = user_state
    return response

@router.post("/login_finish")
async def login_finish(request: LoginFinishRequest):
    user_state = credentialSecrets.get(request.username, None)
    if not user_state:
        raise Exception("Missing user credentials.")
    session_key = opaquepy.login_finish(request.request_finish, user_state)
    # TODO: save session key to chat db?
    print(session_key)
