#!/usr/bin/env python3
from pydantic import BaseModel, Field
from typing import Literal, List, Optional

Role = Literal["system", "user", "assistant"]

class MessageJSON(BaseModel):
    role: Role
    content: str = Field(min_lenght=1)

class ChatJSON(BaseModel):
    model: str = Field(min_lenght=3)
    messages: List[MessageJSON]
    stream: Optional[bool] = False
    temperature: Optional[float] = Field(default=0.7, ge=0.0, le=2.0)
