from pydantic import BaseModel

class Token(BaseModel):
    access_token: str
    token_type: str

class LoginRequest(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    restaurant_id: int
    username: str
    full_name: str | None
    phone: str | None
    is_active: bool

    class Config:
        from_attributes = True
