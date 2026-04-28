#!/usr/bin/env python3
from fastapi import APIRouter
import opaque

private_key = "SUPER SECRET KEY"

router = APIRouter(
    prefix="/users",
    tags=["users"],
    responses={404: {"description": "Not found"}}
)

@router.get("/")
async def read_users():
    return [{"username": "Rick"}, {"username": "Dick"}]

@router.get("/{username}")
async def read_user(username: str):
    return {"username": username}

@router.post("/step-2")
async def step1(request):
    # skS is an optional server long-term private key
    secS, pub = opaque.CreateRegistrationResponse(request.M, private_key)
    #store (secS, user)
    return pub

@router.post("/step-4")
async def step4(request):
    #get secS from (secS, user)
    rec1 = opaque.StoreUserRecord(secS, request.rec0)
    #store in db (rec1, user)
