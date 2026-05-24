# Copyright (c) 2026 Blurz
# 
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Cloudinary upload/delete helpers.
Each media category lives in its own Cloudinary folder.
"""

import time
import cloudinary
import cloudinary.uploader
import cloudinary.utils
import logging
from db.config import config

logger = logging.getLogger(__name__)

# ── Folder map ───────────────────────────────────────────────────────
FOLDERS = {
    "profile":  "blurz/profiles",
    "image":    "blurz/chat-images",
    "video":    "blurz/chat-videos",
    "audio":    "blurz/chat-audio",
    "document": "blurz/chat-documents",
    "file":     "blurz/chat-files",
}


def configure_cloudinary():
    """Call once at app startup."""
    cloudinary.config(
        cloud_name=config.CLOUDINARY_CLOUD_NAME,
        api_key=config.CLOUDINARY_API_KEY,
        api_secret=config.CLOUDINARY_API_SECRET,
        secure=True,
    )
    logger.info("Cloudinary configured for cloud: %s", config.CLOUDINARY_CLOUD_NAME)


# ── Upload helpers ───────────────────────────────────────────────────

def upload_image(file_bytes: bytes, folder_key: str = "image") -> dict:
    """Upload image with auto quality/format. Returns Cloudinary result dict."""
    result = cloudinary.uploader.upload(
        file_bytes,
        folder=FOLDERS.get(folder_key, FOLDERS["image"]),
        resource_type="image",
        transformation=[{"quality": "auto", "fetch_format": "auto"}],
    )
    return result


def upload_video(file_bytes: bytes) -> dict:
    """Upload video. Returns Cloudinary result dict."""
    result = cloudinary.uploader.upload(
        file_bytes,
        folder=FOLDERS["video"],
        resource_type="video",
    )
    return result


def upload_audio(file_bytes: bytes, original_filename: str) -> dict:
    """Upload audio file. Returns Cloudinary result dict."""
    result = cloudinary.uploader.upload(
        file_bytes,
        folder=FOLDERS["audio"],
        resource_type="raw",
        public_id=original_filename,
    )
    return result


def upload_document(file_bytes: bytes, original_filename: str) -> dict:
    """Upload document (PDF, etc.). Returns Cloudinary result dict."""
    result = cloudinary.uploader.upload(
        file_bytes,
        folder=FOLDERS["document"],
        resource_type="raw",
        public_id=original_filename,
    )
    return result


def upload_raw_file(file_bytes: bytes, original_filename: str) -> dict:
    """Upload generic file. Returns Cloudinary result dict."""
    result = cloudinary.uploader.upload(
        file_bytes,
        folder=FOLDERS["file"],
        resource_type="raw",
        public_id=original_filename,
    )
    return result


def upload_profile_image(file_bytes: bytes) -> dict:
    """Upload profile picture with auto quality. Returns Cloudinary result dict."""
    result = cloudinary.uploader.upload(
        file_bytes,
        folder=FOLDERS["profile"],
        resource_type="image",
        transformation=[
            {"width": 400, "height": 400, "crop": "fill", "gravity": "face"},
            {"quality": "auto", "fetch_format": "auto"},
        ],
    )
    return result


def delete_file(public_id: str, resource_type: str = "image"):
    """Delete a file from Cloudinary by public_id."""
    try:
        cloudinary.uploader.destroy(public_id, resource_type=resource_type)
        logger.info("Deleted from Cloudinary: %s", public_id)
    except Exception as e:
        logger.error("Failed to delete from Cloudinary: %s — %s", public_id, e)


def get_thumbnail_url(secure_url: str, resource_type: str) -> str | None:
    """Generate a small thumbnail URL for images/videos using Cloudinary transformations."""
    if resource_type == "image":
        # Insert transformation before /upload/
        return secure_url.replace("/upload/", "/upload/w_200,h_200,c_fill,q_auto/")
    elif resource_type == "video":
        # Cloudinary can generate video thumbnails as .jpg
        return secure_url.replace("/upload/", "/upload/w_200,h_200,c_fill,so_1/").rsplit(".", 1)[0] + ".jpg"
    return None


# ── Direct upload signature ──────────────────────────────────────────

# Map category → Cloudinary resource_type for the upload URL
RESOURCE_TYPES = {
    "image":    "image",
    "profile":  "image",
    "video":    "video",
    "audio":    "raw",
    "document": "raw",
    "file":     "raw",
}


def generate_upload_signature(category: str) -> dict:
    """
    Generate a short-lived signed token so the browser can upload
    directly to Cloudinary without routing file bytes through our server.
    """
    folder = FOLDERS.get(category, FOLDERS["file"])
    resource_type = RESOURCE_TYPES.get(category, "raw")
    timestamp = int(time.time())

    params_to_sign = {
        "timestamp": timestamp,
        "folder": folder,
    }

    # For profile pics, apply crop + face-detection on upload
    if category == "profile":
        params_to_sign["transformation"] = "w_400,h_400,c_fill,g_face/q_auto,f_auto"

    signature = cloudinary.utils.api_sign_request(
        params_to_sign, config.CLOUDINARY_API_SECRET
    )

    return {
        "timestamp": timestamp,
        "signature": signature,
        "cloud_name": config.CLOUDINARY_CLOUD_NAME,
        "api_key": config.CLOUDINARY_API_KEY,
        "folder": folder,
        "resource_type": resource_type,
        "transformation": params_to_sign.get("transformation"),
    }

