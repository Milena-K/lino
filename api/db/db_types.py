#!/usr/bin/env python3
from pydantic import BaseModel, Field, TypeAdapter
from typing import Literal, List, Optional, Annotated

Role = Literal["system", "user", "assistant"]

class User(BaseModel):
    user_id: int
    user_name: str
    registration_record: str
    rsa_key: str
    salt: str
    iv: str

class MessageJSON(BaseModel):
    role: Role
    content: str = Field(
        json_schema_extra={
            'min_length': 1
        }
    )

class ChatJSON(BaseModel):
    model: str = Field(
        json_schema_extra={
            'min_length': 3
        }
    )
    messages: List[MessageJSON]
    stream: Optional[bool] = False
    temperature: Optional[float] = Field(default=0.7, ge=0.0, le=2.0)

