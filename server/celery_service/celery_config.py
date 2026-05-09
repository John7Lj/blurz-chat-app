# Copyright (c) 2026 Blurz
# 
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from db.config import config

broker_url = config.Redis_Url
result_backend = config.Redis_Url
broker_conection_retry_on_startup = True

task_serializer = 'json'
result_serializer = 'json'
accept_content = ['json']
timezone = 'UTC'
enable_utc = True

FLOWER_UNAUTHENTICATED_API=323