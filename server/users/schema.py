from pydantic import BaseModel
import uuid
from fastapi import UploadFile

# this class will be the respone of other users when u search or open the profile of this user
class other_users(BaseModel):
    id: uuid.UUID
    username: str
    first_name: str
    last_name: str
    picture_url: str
    created_at: str



class Update_User(BaseModel): 
    username: str |None= Field(max_length=20,default=None)
    first_name: str|None=None
    last_name: str|None=None



class Update_Profile_Picture(BaseModel):
    profile_picture: UploadFile


class Profile_Picture_Response(BaseModel):
    profile_url: str
