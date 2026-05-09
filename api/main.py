from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from routers.auth import router as auth_router
from routers.users import router as users_router
from routers.chats import router as chats_router

app = FastAPI()
origins = [
    # "*",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(chats_router)
