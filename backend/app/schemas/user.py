# import uuid
# from datetime import datetime
# from pydantic import BaseModel, EmailStr, ConfigDict, model_validator

# class UserBase(BaseModel):
#     email: EmailStr
#     full_name: str
#     organization: str

#     @property
#     def name(self) -> str:
#         return self.full_name

# class UserCreate(UserBase):
#     password: str

#     def __init__(self, **data):
#         if "name" in data and "full_name" not in data:
#             data["full_name"] = data["name"]
#         super().__init__(**data)

# class UserLogin(BaseModel):
#     email: EmailStr
#     password: str

# class UserOut(UserBase):
#     id: uuid.UUID
#     plan_type: str
#     created_at: datetime
#     avatar_url: str | None = None
    
#     # Legacy outputs
#     plan: str | None = None
#     name: str | None = None


#     model_config = ConfigDict(from_attributes=True, populate_by_name=True)

#     @model_validator(mode="before")
#     @classmethod
#     def populate_legacy_fields(cls, data):
#         if isinstance(data, dict):
#             if "full_name" in data and "name" not in data:
#                 data["name"] = data["full_name"]
#             elif "name" in data and "full_name" not in data:
#                 data["full_name"] = data["name"]

#             if "plan_type" in data and "plan" not in data:
#                 data["plan"] = data["plan_type"]
#             elif "plan" in data and "plan_type" not in data:
#                 data["plan_type"] = data["plan"]
#             return data

#         try:
#             if hasattr(data, "full_name"):
#                 data.name = data.full_name
#             if hasattr(data, "plan_type"):
#                 data.plan = data.plan_type
#         except Exception:
#             pass
#         return data

# class Token(BaseModel):
#     access_token: str
#     token_type: str

# class TokenData(BaseModel):
#     user_id: str | None = None



import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict, model_validator


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    organization: str | None = None


class UserCreate(UserBase):
    password: str

    @model_validator(mode="before")
    @classmethod
    def populate_full_name(cls, data):
        if isinstance(data, dict):
            if "name" in data and "full_name" not in data:
                data["full_name"] = data["name"]
        return data


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(UserBase):
    id: uuid.UUID
    plan_type: str
    created_at: datetime
    avatar_url: str | None = None

    # Legacy frontend support
    plan: str | None = None
    name: str | None = None

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )

    @model_validator(mode="before")
    @classmethod
    def populate_legacy_fields(cls, data):
        if isinstance(data, dict):
            if "full_name" in data and "name" not in data:
                data["name"] = data["full_name"]
            elif "name" in data and "full_name" not in data:
                data["full_name"] = data["name"]

            if "plan_type" in data and "plan" not in data:
                data["plan"] = data["plan_type"]
            elif "plan" in data and "plan_type" not in data:
                data["plan_type"] = data["plan"]

        return data


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    user_id: str | None = None