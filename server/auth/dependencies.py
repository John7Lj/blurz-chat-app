   
from abc import abstractmethod
from fastapi.security import HTTPBearer
from fastapi import status,Request,Depends
from fastapi.exceptions import HTTPException
from utils import decode_token
from db.redis import check_blacklist
from sqlmodel.ext.asyncio.session import AsyncSession
from db.main import get_session
from .service import User_Service
import logging
from db.models import User
from errors import (
    InvalidToken,
    RefreshTokenRequired,
    AccessTokenRequired,
    InsufficientPermission,
    VerificationError,
    EmailNotVerified
)
class BearerToken(HTTPBearer):
    
    def __init__(self,auto_error:bool=True):
        super().__init__(auto_error=auto_error)
        
        
    async def __call__(self,request:Request):
        credits = await super().__call__(request)
        
        token_data = decode_token(credits.credentials)
    
        if not token_data :
            raise InvalidToken()
            
        if await check_blacklist(token_data['jti']):
            raise HTTPException(
                status_code = status.HTTP_403_FORBIDDEN,
                                detail = 'This token has been revoked , plz get a valid token')
            
        self.verify_token(token_data)
        
        return token_data # here if all exceptions false then the token will be valid and will return it to the user 
    
    @abstractmethod
    def verify_token(self,token:dict):
        pass          
     
   
class AccessTokenBearer(BearerToken):
    
    def verify_token (self,token:dict):
            
        if token and token.get('refresh_token') == True:
            raise AccessTokenRequired()
            

            
class RefreshToken(BearerToken):
    
    def verify_token (self,token:dict):
        if token and token.get('refresh_token') != True:
            raise RefreshTokenRequired()




async def get_current_user(token: dict = Depends(AccessTokenBearer()),
                           session: AsyncSession = Depends(get_session)) -> object:
    if not token:
        raise InvalidToken()
    email = token['user']['email']
    try:
        user = await User_Service().get_user_by_email(email, session)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return user
        
    except HTTPException:
        raise  # Re-raise HTTP exceptions
        
    except Exception as e:
        logging.exception(f'Error fetching user: {e}')
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch user"
        )
 
class CheckRoler :
    def __init__ (self,allowd_rloes:list[str]):
        self.allowd_rloes = allowd_rloes
        
    def __call__(self,user_details:User=Depends(get_current_user))->bool:
        
        if not user_details.is_verified:
            raise EmailNotVerified()
        
        if user_details:
            if user_details.role in self.allowd_rloes:
                return True
            raise InsufficientPermission()
        