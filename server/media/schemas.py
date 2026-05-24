# Copyright (c) 2026 Blurz
# 
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from pydantic import BaseModel
import uuid
from datetime import datetime
from typing import Optional


class MediaUploadResponse(BaseModel):
    message_id: uuid.UUID
    chat_id: uuid.UUID
    sender_id: uuid.UUID
    msg_type: str
    file_url: str
    file_name: str | None = None
    file_key: str | None = None
    file_size: int | None = None
    file_mime: str | None = None
    thumbnail_url: str | None = None
    sent_at: datetime


class ProfilePictureResponse(BaseModel):
    message: str
    profile_url: str


# ── Size limits (bytes) ─────────────────────────────────────────────
MAX_IMAGE_SIZE = 7 * 1024 * 1024       # 7 MB
MAX_VIDEO_SIZE = 15 * 1024 * 1024      # 15 MB
MAX_AUDIO_SIZE = 15 * 1024 * 1024      # 15 MB
MAX_DOCUMENT_SIZE = 25 * 1024 * 1024   # 25 MB
MAX_FILE_SIZE = 25 * 1024 * 1024       # 25 MB
MAX_PROFILE_SIZE = 5 * 1024 * 1024     # 5 MB

# ── MIME → msg_type mapping ─────────────────────────────────────────
MIME_TYPE_MAP = {
    "image": "image",
    "video": "video",
    "audio": "audio",
}

DOCUMENT_MIMES = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
}

def get_msg_type(content_type: str) -> str:
    """Map MIME type to msg_type string."""
    major = content_type.split("/")[0]
    if major in MIME_TYPE_MAP:
        return MIME_TYPE_MAP[major]
    if content_type in DOCUMENT_MIMES:
        return "document"
    return "file"

def get_max_size(msg_type: str) -> int:
    """Return max file size in bytes for the given msg_type."""
    return {
        "image": MAX_IMAGE_SIZE,
        "video": MAX_VIDEO_SIZE,
        "audio": MAX_AUDIO_SIZE,
        "document": MAX_DOCUMENT_SIZE,
        "file": MAX_FILE_SIZE,
    }.get(msg_type, MAX_FILE_SIZE)


# ── Direct upload schemas ────────────────────────────────────────────

VALID_CATEGORIES = {"image", "video", "audio", "document", "file", "profile"}


class SignUploadRequest(BaseModel):
    """Client sends the media category to get a short-lived Cloudinary signature."""
    category: str  # "image" | "video" | "audio" | "document" | "file" | "profile"


class SignUploadResponse(BaseModel):
    timestamp: int
    signature: str
    cloud_name: str
    api_key: str
    folder: str
    resource_type: str
    transformation: Optional[str] = None


class ConfirmChatUploadRequest(BaseModel):
    """After uploading directly to Cloudinary, the client sends metadata here."""
    chat_id: uuid.UUID
    secure_url: str
    public_id: str
    resource_type: str
    original_filename: str
    file_size: int
    file_mime: str


class ConfirmProfileUploadRequest(BaseModel):
    """After uploading a profile pic directly to Cloudinary."""
    secure_url: str
    public_id: str

