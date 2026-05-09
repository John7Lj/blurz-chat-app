# Copyright (c) 2026 Blurz
# 
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Unit tests for server/celery_service/celery_tasks.py
Tests: bg_send_mail, bg_save_profile_picture (with mocked Celery/DB/Mail)
"""
import pytest
import base64
from unittest.mock import patch, MagicMock, AsyncMock


class TestBgSendMail:
    def test_calls_send_email_and_sends(self):
        mock_message = MagicMock()
        with patch("celery_service.celery_tasks.send_email", return_value=mock_message) as mock_send, \
             patch("celery_service.celery_tasks.mail") as mock_mail:
            mock_mail.send_message = AsyncMock()

            from celery_service.celery_tasks import bg_send_mail
            bg_send_mail(
                rec=["test@test.com"],
                sub="Test Subject",
                html_path="test.html",
                data_var={"key": "value"},
            )

            mock_send.assert_called_once_with(
                recepients=["test@test.com"],
                subject="Test Subject",
                html_message_path="test.html",
                data_variables={"key": "value"},
            )


class TestBgSaveProfilePicture:
    def test_decodes_base64_and_saves(self):
        picture_bytes = b"\x89PNG" + b"\x00" * 100
        b64_data = base64.b64encode(picture_bytes).decode("utf-8")

        with patch("auth.service.save_profile_picture_sync", return_value="/path/img.png") as mock_save, \
             patch("celery_service.celery_tasks.async_to_sync") as mock_ats:
            mock_ats.return_value = MagicMock()

            from celery_service.celery_tasks import bg_save_profile_picture
            result = bg_save_profile_picture(b64_data, ".png", "user-id-123")

            mock_save.assert_called_once()
            call_args = mock_save.call_args[0]
            assert call_args[0] == picture_bytes
            assert call_args[1] == ".png"
            assert result == "/path/img.png"
