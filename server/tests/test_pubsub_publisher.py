# Copyright (c) 2026 Blurz
# 
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Unit tests for server/pubsub/publisher.py
Tests: Publisher — publish_message, publish_typing, publish_read
"""
import pytest
import uuid
import json
from datetime import datetime, timezone
from unittest.mock import AsyncMock


@pytest.fixture
def redis_mock():
    r = AsyncMock()
    r.publish = AsyncMock()
    return r


@pytest.fixture
def publisher(redis_mock):
    from pubsub.publisher import Publisher
    return Publisher(redis_client=redis_mock)


class TestPublishMessage:
    @pytest.mark.asyncio
    async def test_publishes_to_correct_channel(self, publisher, redis_mock):
        cid = uuid.uuid4()
        await publisher.publish_message(
            chat_id=cid, message_id=uuid.uuid4(),
            sender_id=uuid.uuid4(), content="hi",
            sent_at=datetime.now(timezone.utc),
        )
        channel = redis_mock.publish.call_args[0][0]
        assert channel == f"chat:{cid}"

    @pytest.mark.asyncio
    async def test_payload_structure(self, publisher, redis_mock):
        cid = uuid.uuid4()
        mid = uuid.uuid4()
        sid = uuid.uuid4()
        now = datetime.now(timezone.utc)

        await publisher.publish_message(cid, mid, sid, "hello", now)
        payload = json.loads(redis_mock.publish.call_args[0][1])
        assert payload["type"] == "message"
        assert payload["chat_id"] == str(cid)
        assert payload["message_id"] == str(mid)
        assert payload["sender_id"] == str(sid)
        assert payload["content"] == "hello"


class TestPublishTyping:
    @pytest.mark.asyncio
    async def test_publishes_typing_indicator(self, publisher, redis_mock):
        cid, uid = uuid.uuid4(), uuid.uuid4()
        await publisher.publish_typing(chat_id=cid, user_id=uid)
        payload = json.loads(redis_mock.publish.call_args[0][1])
        assert payload["type"] == "typing"
        assert payload["user_id"] == str(uid)

    @pytest.mark.asyncio
    async def test_correct_channel(self, publisher, redis_mock):
        cid = uuid.uuid4()
        await publisher.publish_typing(chat_id=cid, user_id=uuid.uuid4())
        assert redis_mock.publish.call_args[0][0] == f"chat:{cid}"


class TestPublishRead:
    @pytest.mark.asyncio
    async def test_publishes_read_receipt(self, publisher, redis_mock):
        cid, mid, uid = uuid.uuid4(), uuid.uuid4(), uuid.uuid4()
        await publisher.publish_read(chat_id=cid, message_id=mid, user_id=uid)
        payload = json.loads(redis_mock.publish.call_args[0][1])
        assert payload["type"] == "read"
        assert payload["message_id"] == str(mid)
        assert payload["user_id"] == str(uid)
