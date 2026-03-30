from redis.asyncio import Redis
from redis.exceptions import ConnectionError
from .config import config

# Create Redis client
Token_Blacklist = Redis.from_url(config.Redis_Url, decode_responses=True)

# Async function to check Redis connection
async def check_redis_connection():
    try:
        await Token_Blacklist.ping()
        print('✓ Redis is working')
        return True
    except ConnectionError as e:
        print(f'✗ Redis is not working: {e}')
        return False

# Add to blacklist with error handling
async def add_to_blacklist(jti: str, exp=1800):
    try:
        result = await Token_Blacklist.set(name=jti, value='', ex=exp)
        if result:
            print(f'✓ Token blacklisted: {jti}')
        return result
    except ConnectionError as e:
        print(f'✗ Redis error in add_to_blacklist: {e}')
        return False

# Check blacklist with error handling
async def check_blacklist(jti: str) -> bool:
    try:
        result = await Token_Blacklist.get(name=jti)
        return result is not None
    except ConnectionError as e:
        print(f'✗ Redis error in check_blacklist: {e}')
        # Return False to allow access when Redis is down (or True to deny)
        return False