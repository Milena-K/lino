#!/usr/bin/env python3
from pydantic import BaseModel
from fastapi import Depends, APIRouter
from pyrate_limiter import Duration, Limiter, Rate
from fastapi_limiter.depends import RateLimiter
import opaque

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

# Why are these not stored in cfg?
idS = "server"
infos = (None, None)
# infos = {
#     "info": None,
#     "einfo": None
# }
#TODO generate pub-sec GPG key for server
pkS = opaque.hexToUint8Array(
    "8f40c5adb68f25624ae5b214ea767a6ec94d829d3d7b5e1ad1ba6f3e2138285f"
)
skS = opaque.hexToUint8Array(
    "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f"
)
# skU pkU pkS idS idU
cfg = (None, None, pkS, idS, None)

@router.post("/register-without-password/")
async def register(req, id):
    print(req.body)
    try:
        idU = req.body.id
        request = opaque.hexToUint8Array(req.body.request)
        response = opaque.createRegistrationResponse({ "M": request })
        registerSecrets[idU] = response.sec
        response = { "response": opaque.uint8ArrayToHex(response.pub) }
        return response
    except Exception as e:
        return { "error": e }

# What is the difference from the previous method ?
# TODO: check if req and id are query params or sent in req body
@router.post("/register-with-global-server-key/")
async def register_global(req, id):
    print(req.body)
    try:
        idU = id
        request = opaque.hexToUint8Array(req.body.request)
        response = opaque.create1kRegistrationResponse({
            "M": request,
            "pkS": pkS
        })
        registerSecrets[idU] = response.sec
        response = {
            "response": opaque.uint8ArrayToHex(response.pub),
            "type": "global-server-key"
        }
        return response
    except Exception as e:
        return { "error": e }

# TODO: check if req and id are query params or sent in req body
@router.post("/store-user-record/")
async def store_user(req, id):
    try:
        idU = id
        sec = registerSecrets.pop(idU, None) #TODO maybe check if sec is None?
        rec = opaque.hexToUint8Array(req.body.rec)
        userRec = opaque.storeUserRecord({ sec, rec })
        # Allow registration to go through to prevent user-enumeration attacks.
        if not users.get(idU, None):
            users[idU] = userRec
        return True
    except Exception as e:
        return { "error": e }

#TODO finish this
@router.post("/store-user-record-using-global-server-key/")
async def store_user_global(req, id):
    try:
        idU = id
        sec = registerSecrets.pop(idU, None)
        rec = opaque.hexToUint8Array(req.body.rec)
        userRec = opaque.store1kUserRecord({
            sec,
            skS,
            rec,
        })
        if not users.get(idU, None):
            users[idU] = userRec
        return True
    except Exception as e:
        return { "error": e }

@router.post("/request-credentials/")
async def credentials(req, id):
    print(req)
    try:
        pub = opaque.hexToUint8Array(req)
        idU = id
        rec = users.get(idU, None)
        if rec:
            rec = rec.rec
        else:
            return { "error": "Requesting creds for user failed." }

        resp, sk, sec = opaque.createCredentialResponse({
            pub,
            rec,
            cfg,
            (idS, idU),
            infos,
        })
        credentialSecrets[idU] = sec
        response = { "response": opaque.unit8ArrayToHex(resp),
                     "pkS": None}
        if pkS == opaque.NotPackaged:
            _pkS = opaque.getServerPublicKeyFromUserRecord({ rec })
            response["pkS"] = opaque.uint8ArrayToHex(_pkS)
        return response
    except Exception as e:
        return { "error": e }

@router.post("/authorize/")
async def authorize(req, id):
    try:
        sec = credentialSecrets.pop(id, None)
        authU = opaque.hexToUint8Array(req.body.auth)
        return opaque.userAuth({
            sec,
            authU,
        })
    except Exception as e:
        return { "error": e }
