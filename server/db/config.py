# Copyright (c) 2026 Blurz
# 
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from pydantic_settings import BaseSettings,SettingsConfigDict


class settings(BaseSettings):
    DB_URL : str 
    BCRYPT_ROUNDS :int= 14
    jwt_secret:str
    jwt_algorithm:str
    refresh_token_expiary:int
    access_token_expiary:int
#   ResisHost :str
#    ResdisPort :int
#    Redispassword :str
#    Redis_DB :int
    Redis_Url:str
    MAIL_USERNAME:str
    MAIL_PASSWORD:str
    MAIL_FROM:str
    MAIL_PORT:int
    MAIL_SERVER:str
    MAIL_FROM_NAME:str
    MAIL_STARTTLS: bool = True
    MAIL_SSL_TLS: bool = False
    USE_CREDENTIALS: bool = True
    VALIDATE_CERTS: bool = True
    domain:str
    password_secrete_reset:str

    DEBUG: bool = True
    model_config = SettingsConfigDict (env_file=".env",  extra="ignore")


config = settings()



# Celery configuration
broker_url = config.Redis_Url
result_backend = config.Redis_Url
broker_connection_retry_on_startup = True