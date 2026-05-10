# Copyright (c) 2026 Blurz
# 
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from pydantic import BaseModel, Field,EmailStr
import uuid
from datetime import datetime
from typing import  List
from typing import Optional
from fastapi import File,UploadFile


class User(BaseModel): 
    id: uuid.UUID 
    username: str = Field(max_length=20)
    email: EmailStr 
    phone:str
    first_name: str
    last_name: str
    is_verified: bool 
    profile_url: Optional[str] = None
    bio: Optional[str] = None
    created_at: datetime | None = None  # ✅ Made optional
    updated_at: datetime | None = None  # ✅ Made optional



class UserInfo(User):
    pass


""""password mustn't given at the reponse model"""


class Create_User(BaseModel): 
    username: str = Field(min_length=3, max_length=20, pattern=r"^[a-zA-Z0-9_]+$")
    email: EmailStr
    phone: str = Field(pattern=r"^\+?[1-9]\d{1,14}$")
    first_name: str = Field(min_length=1, max_length=50, pattern=r"^[a-zA-Z\s\-']+$")
    last_name: str = Field(min_length=1, max_length=50, pattern=r"^[a-zA-Z\s\-']+$")
    password: str = Field(min_length=8, max_length=72) 
    profile_picture: Optional[UploadFile] = None



    
class User_Activation(BaseModel): 
    is_verified: bool 



    
class Login_User(BaseModel): 
    email: str = Field(max_length=40)
    password: str|None = Field(min_length=8, max_length=72) 
    phone:str|None=None
    
    
class Password_Reset(BaseModel):
    email:str
    
    
class Password_reset_Confirm(BaseModel):
    new_password:str=Field(min_length=8, max_length=72) 
    confirm_password:str=Field(min_length=8, max_length=72) 

class ChangePassword(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=72)
