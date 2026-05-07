from fastapi import FastAPI, status
from fastapi.requests import Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import time 
import logging

logger = logging.getLogger(__name__)

"""simple middleware type one"""


 #   the functions of the middleware are : logging request , authuntication like in the dependencies injection 
 # , cors origins and prevent host attack  , Rate lImiting , 
 
def custome_simple_middle(app: FastAPI):
    
    @app.middleware('http')
    
    async def custome_logging(request: Request, call_next):
        
        start_time = time.time()
                
        response = await call_next(request)
        
        processed_time = time.time() - start_time
         
        message = f"{request.client.host}:{request.client.port} - {request.method} - {request.url.path} - completed after {processed_time:.3f}s"
        
        logger.info(message)
        
        return response
    
    # Allow localhost AND any device on the local network (phones on same Wi-Fi).
    # The regex covers: localhost, 127.x.x.x, 192.168.x.x, 10.x.x.x, 172.16-31.x.x
    LOCAL_ORIGIN_REGEX = (
        r"^https?://"
        r"(localhost"
        r"|127(\.\d{1,3}){3}"
        r"|192\.168(\.\d{1,3}){2}"
        r"|10(\.\d{1,3}){3}"
        r"|172\.(1[6-9]|2\d|3[01])(\.\d{1,3}){2}"
        r")(:\d+)?$"
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["https://blurz-chat-app.vercel.app"],
        allow_origin_regex=LOCAL_ORIGIN_REGEX,
        allow_methods=['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
        allow_headers=['*'],
        allow_credentials=True,
    )
    
    
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=['*'],

    )
