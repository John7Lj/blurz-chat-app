from fastapi import APIRouter, Depends, status, HTTPException
from db.main import get_session
from .service import User_Service
from .schema import Create_User as Create_User_Model, User,Login_User,UserInfo,Password_Reset,Password_reset_Confirm, ChangePassword
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.exc import IntegrityError
from utils import access_token,verify_password,CreationSafeLink,generate_hashed_password
from datetime import datetime,timedelta
from db.config import config
from fastapi.responses import JSONResponse
from .dependencies import RefreshToken,AccessTokenBearer,get_current_user,CheckRoler
from errors import AccessTokenRequired,UserAlreadyExists,UserNotFound,InvalidCredentials,VerificationError,DataNotFound,PasswordAlreadyReset,UserAlreadyVerify
from db.redis import add_to_blacklist,check_blacklist
from mailserver.service import send_email,mail
from celery_service.celery_tasks import bg_send_mail,bg_save_profile_picture
from db.models import User as User_DB


auth_router = APIRouter()

user_service = User_Service()

access_token_bearer = AccessTokenBearer()

password_reset_link = CreationSafeLink(config.password_secrete_reset,'password_reset_link')

email_verification_link = CreationSafeLink(config.jwt_secret,'email_verification_link')


refresh = timedelta(days=config.refresh_token_expiary)

access = timedelta(minutes=config.access_token_expiary)

@auth_router.post("/signup", response_model=User, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: Create_User_Model,
    session: AsyncSession = Depends(get_session)
):
    email = user_data.email
    username = user_data.username
    phone = user_data.phone

    is_existed = await user_service.user_exist(email, phone, username, session)
    if is_existed:
        raise UserAlreadyExists()


    picture_bytes = None
    picture_ext = None

    try:
        new_user = await user_service.create_user(user_data, session)
        if user_data.profile_picture:
            picture_bytes = await user_data.profile_picture.read()
            picture_ext = Path(user_data.profile_picture.filename).suffix.lower()

        if picture_bytes:
            bg_save_profile_picture.delay(picture_bytes, picture_ext, str(new_user.uid))

        token = email_verification_link.create_safe_url({"email": email})
        link = f'{config.domain}/auth/verify/{token}'
        bg_send_mail.delay(
            rec=[email],
            sub='verify email',
            html_path='verify_message.html',
            data_var={"link": link}
        )

        return new_user

    except IntegrityError:
        raise UserAlreadyExists()



"""verify the URL to check is valid"""  
@auth_router.get("/verify/{token}")

async def activation_user(token:str,session:AsyncSession=Depends(get_session)):
    
    data = email_verification_link.de_serializ_url(token)
    
    if await check_blacklist(data['token_id']):
        raise UserAlreadyVerify()
    
    email = data['email']
    if not email:
        raise VerificationError()
    
    await user_service.activation_user(email,session)
    
    await add_to_blacklist(data['token_id'],exp=1600)

    return JSONResponse(
            content={"message": "Account verified successfully"},
            status_code=status.HTTP_200_OK,
        )    



@auth_router.post('/resend_verify_link')
async def crtate_url_vreification(email:Password_Reset,session: AsyncSession = Depends(get_session)):
    email = email.email
    if not email :
        raise DataNotFound()
    is_existed = await user_service.user_exist(email, session)
    
    if is_existed:
    
        token = email_verification_link.create_safe_url({"email":email})
      
        link = f'{config.domain}/auth/verify/{token}'
        
        data = {"link":link}
        
        bg_send_mail.delay(rec=[email],sub = 'verifying mail',html_path='verify_message.html',data_var=data)
        




@auth_router.post('/login',)
async def login_user(user_data:Login_User,session:AsyncSession=Depends(get_session)):
    user_data_login = user_data
    email = user_data_login.email
    phone = user_data_login.phone
    password = user_data_login.password
    
    user_existence:User_DB = await user_service.get_user_by_email(email, session)
    if not user_existence:
        user_existence:User_DB = await user_service.get_user_by_phone(phone, session)
    
    if not user_existence:
        raise UserNotFound()
    
    if not password:
        raise InvalidCredentials()
    is_valid_password = verify_password(password, user_existence.password_hash) 
     
    if not is_valid_password:
        raise InvalidCredentials()
        
        # Create tokens
    access_token_str = access_token(
            user_data={
                "email": email,
                "id": str(user_existence.id),
                "username": user_existence.username,
            },
            expire=access
        )
        
    refresh_token_str = access_token(
            user_data={
                "email": email,
                "id": str(user_existence.id),
                "username": user_existence.username,
            },
            expire=refresh,
            refresh=True
        )  
        
    return JSONResponse(
            content={
                "message": "you have login successfully",
                "access_token": access_token_str,
                "refresh_token": refresh_token_str,
                "email": email,
                "phone":phone,
                "username": user_existence.username,
                "user_id": str(user_existence.id)
            },
            status_code=200
        )
    



    
@auth_router.post('/refresh_token')
async def get_acces_by_refresh(token:dict=Depends(RefreshToken())):
    
    if token:
        new_access_token = access_token(user_data=token['user'],expire=access)
        
        return JSONResponse(
               content ={
                  "access_token":new_access_token
             } )
    
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
                        detail='this token either expired or invalid')
     
    
@auth_router.post('/logout')
async def logout(token:dict=Depends(AccessTokenBearer())):
    
    if await add_to_blacklist(token['jti']):
        return JSONResponse(
            content={"Message":"you have loged out successflly"},
            status_code = 200,

        )
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to logout"
        )    
    
    
    """
    
    notice this for forget Password reset flow , not regular reset password this in case the user forget the original password
    
    1: user request to resent his password 
    
    2: the token or the email exctracted from but be carfull , we check if exist or not then if exist 

    3: we shall send to this user mail an uniuque link that contain a token with period expiration and this email
        
    4: when the user click on this link and the link is valid the user can now reset the password and revoke the token of authorization 
    and add to the redis black list
    
    
    5: after the user has successfully updated the password the access ,refresh and link token must be revoked and added to the redis blacklist
    
    """ 
   # Notice this is for forgetting password and not in normal reset password 
@auth_router.post('/password_reset')
async def passsword_reset(Email:Password_Reset,session:AsyncSession=Depends(get_session)):
    email = Email.email
    
    user_existence = await user_service.get_user_by_email(email,session)
    
    if not user_existence:
        raise UserNotFound()
    
    try:
        token = password_reset_link.create_safe_url({"email":email})
        
        # Point to CLIENT URL
        link = f'{config.domain}/reset-password/{token}'
        
        data = {"link":link}
        
        bg_send_mail.delay(rec=[email],
                            data_var=data,html_path='password_reset_link.html',
                            sub = 'Reset Email Password')
      
    except IntegrityError:
        raise UserAlreadyExists() 
    
    return JSONResponse(
        content={"message": "If the email exists, a reset link has been sent."},
        status_code=200
    )


@auth_router.post("/confirm_password/{token}")
async def confirm_password(passwords:Password_reset_Confirm
                           ,token:str,session:AsyncSession=Depends(get_session)):
    
    data = password_reset_link.de_serializ_url(token,600)
    
    """check if this link is beeing sent again to prevent it from consuming resourse """
    if await check_blacklist(data['token_id']):
        raise PasswordAlreadyReset()
    

    if not passwords.new_password==passwords.confirm_password:
        raise InvalidCredentials()
    
    email = data['email']
    if not email:
        raise DataNotFound()

    try:
        user_exist =  await user_service.get_user_by_email(email,session)
        if not user_exist:
            raise UserNotFound()
    except IntegrityError:
        raise IntegrityError()

    new_password = generate_hashed_password(passwords.new_password)
    user_exist.password_hash = new_password
    await session.commit()
    await session.refresh(user_exist)
    
    # Only blacklist the RESET token
    await add_to_blacklist(data['token_id'],exp=600)
    
    return JSONResponse(
            content={"message": "Password has been updated successfully"},
            status_code=status.HTTP_200_OK,
        )  

@auth_router.post('/change_password')
async def change_password(
    passwords: ChangePassword,
    session: AsyncSession = Depends(get_session),
    user_data: User = Depends(get_current_user)
):
    # 1. Verify current password
    user = await user_service.get_user_by_email(user_data.email, session)
    if not user:
        raise UserNotFound()
        
    if not verify_password(passwords.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect current password")
        
    # 2. Hash new password and update
    user.password_hash = generate_hashed_password(passwords.new_password)
    
    await session.commit()
    
    return JSONResponse(
        content={"message": "Password updated successfully"},
        status_code=200
    )  
