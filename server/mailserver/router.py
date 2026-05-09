# Copyright (c) 2026 Blurz
# 
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from fastapi import APIRouter
from .schemas import Mail_send_Mode
from .service import welcome_message,mail
mail_router = APIRouter()

@mail_router.post('/welcome')
async def sending_mail(mails:Mail_send_Mode):
    
  
    recepients = mails.emails
    message =await welcome_message(recepients=recepients)
    
    await mail.send_message(message)
    return {'message':'Email has been sent'}
    
    