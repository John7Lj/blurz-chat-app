# Copyright (c) 2026 Blurz
# 
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from typing import Any
from fastapi.requests import Request
from fastapi.responses import JSONResponse
from fastapi import FastAPI, status


class AppError(Exception):
    """This is the base class of the entire App"""
    
class InvalidToken(AppError):
    """User has provided an invalid or expired token"""
    pass

class TokenExpired(InvalidToken):
    """User has provided a token that has expired"""
    pass


class RevokedToken(AppError):
    """User has provided a token that has been revoked like added to the blacklist """
    pass

class AccessTokenRequired(AppError):
    """User has provided a refresh token when an access token is needed"""
    pass

class RefreshTokenRequired(AppError):
    """User has provided an access token when a refresh token is needed"""
    pass

class UserAlreadyExists(AppError):
    """User has provided an email for a user who exists during sign up."""
    pass

class InvalidCredentials(AppError):
    """User has provided wrong email or password during log in."""
    pass

class InsufficientPermission(AppError):
    """User does not have the necessary permissions to perform an action."""
    pass

class UserNotFound(AppError):
    """User Not found"""
    pass

class VerificationError(AppError):
    """Error during email verification"""
    pass

class DataNotFound(AppError):
    """Generic data not found error"""
    pass

class PasswordAlreadyReset(AppError):
    """Password has already been reset using this token"""
    pass

class UserAlreadyVerify(AppError):
    """User is already verified"""
    pass

class EmailNotVerified(AppError):
    """User email is not verified"""
    pass

def create_exception_handler(status_code: int,
                              initial_detail: Any):
    
    async def handler_exception(request: Request, exc: AppError):
        return JSONResponse(
            content={"status_code": status_code, "detail": initial_detail},
            status_code=status_code
        )
    
    return handler_exception


def register_error_handlers(app: FastAPI):
    app.add_exception_handler(
        exc_class_or_status_code=UserAlreadyExists,
        handler=create_exception_handler(
            status_code=status.HTTP_403_FORBIDDEN,
            initial_detail={
                "message": "User with email already exists",
                "error_code": "user_exists",
            },
        ),
    )

    app.add_exception_handler(
        UserNotFound,
        create_exception_handler(
            status_code=status.HTTP_404_NOT_FOUND,
            initial_detail={
                "message": "User not found",
                "error_code": "user_not_found",
            },
        ),
    )

    app.add_exception_handler(
        InvalidCredentials,
        create_exception_handler(
            status_code=status.HTTP_400_BAD_REQUEST,
            initial_detail={
                "message": "Invalid Email Or Password",
                "error_code": "invalid_email_or_password",
            },
        ),
    )
    app.add_exception_handler(
        InvalidToken,
        create_exception_handler(
            status_code=status.HTTP_401_UNAUTHORIZED,
            initial_detail={
                "message": "Token is invalid Or expired",
                "resolution": "Please get new token",
                "error_code": "invalid_token",
            },
        ),
    )
    app.add_exception_handler(
        RevokedToken,
        create_exception_handler(
            status_code=status.HTTP_401_UNAUTHORIZED,
            initial_detail={
                "message": "Token is invalid or has been revoked",
                "resolution": "Please get new token",
                "error_code": "token_revoked",
            },
        ),
    )
    app.add_exception_handler(
        AccessTokenRequired,
        create_exception_handler(
            status_code=status.HTTP_401_UNAUTHORIZED,
            initial_detail={
                "message": "Please provide a valid access token",
                "resolution": "Please get an access token",
                "error_code": "access_token_required",
            },
        ),
    )
    app.add_exception_handler(
        RefreshTokenRequired,
        create_exception_handler(
            status_code=status.HTTP_403_FORBIDDEN,
            initial_detail={
                "message": "Please provide a valid refresh token",
                "resolution": "Please get an refresh token",
                "error_code": "refresh_token_required",
            },
        ),
    )
    app.add_exception_handler(
        InsufficientPermission,
        create_exception_handler(
            status_code=status.HTTP_401_UNAUTHORIZED,
            initial_detail={
                "message": "You do not have enough permissions to perform this action",
                "error_code": "insufficient_permissions",
            },
        ),
    )

    app.add_exception_handler(
        PasswordAlreadyReset,
        create_exception_handler(
            status_code=status.HTTP_400_BAD_REQUEST,
            initial_detail={
                "message": "Password has already been reset using this link",
                "error_code": "password_already_reset",
            },
        ),
    )

    app.add_exception_handler(
        UserAlreadyVerify,
        create_exception_handler(
            status_code=status.HTTP_400_BAD_REQUEST,
            initial_detail={
                "message": "User is already verified",
                "error_code": "user_already_verified",
            },
        ),
    )

    app.add_exception_handler(
        VerificationError,
        create_exception_handler(
            status_code=status.HTTP_400_BAD_REQUEST,
            initial_detail={
                "message": "Email verification failed",
                "error_code": "verification_error",
            },
        ),
    )

    app.add_exception_handler(
        DataNotFound,
        create_exception_handler(
            status_code=status.HTTP_404_NOT_FOUND,
            initial_detail={
                "message": "Requested data not found",
                "error_code": "data_not_found",
            },
        ),
    )

    app.add_exception_handler(
        EmailNotVerified,
        create_exception_handler(
            status_code=status.HTTP_403_FORBIDDEN,
            initial_detail={
                "message": "Email is not verified",
                "error_code": "email_not_verified",
            },
        ),
    )

    # ── Pydantic validation errors (422) → human-readable messages ────
    from fastapi.exceptions import RequestValidationError
    
    FIELD_LABELS = {
        "username": "Username",
        "email": "Email",
        "phone": "Phone number",
        "first_name": "First name",
        "last_name": "Last name",
        "password": "Password",
        "new_password": "New password",
        "confirm_password": "Confirm password",
        "current_password": "Current password",
        "content": "Message content",
        "profile_picture": "Profile picture",
    }

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        errors = []
        for error in exc.errors():
            # Extract field name from location tuple (e.g., ('body', 'phone'))
            loc = error.get("loc", ())
            field_name = loc[-1] if loc else "unknown"
            field_label = FIELD_LABELS.get(str(field_name), str(field_name).replace("_", " ").title())
            
            error_type = error.get("type", "")
            ctx = error.get("ctx", {})
            
            # Build human-readable message based on error type
            if error_type == "string_too_short":
                min_len = ctx.get("min_length", "")
                msg = f"{field_label} must be at least {min_len} characters"
            elif error_type == "string_too_long":
                max_len = ctx.get("max_length", "")
                msg = f"{field_label} must be at most {max_len} characters"
            elif error_type == "string_pattern_mismatch":
                if field_name == "phone":
                    msg = "Phone number must be a valid international number (e.g., +1234567890)"
                else:
                    msg = f"{field_label} format is invalid"
            elif error_type == "value_error" and "email" in str(field_name).lower():
                msg = "Please enter a valid email address"
            elif error_type in ("value_error.email", "value_error"):
                msg = f"{field_label} is invalid"
            elif error_type == "missing":
                msg = f"{field_label} is required"
            elif error_type == "type_error.none.not_allowed":
                msg = f"{field_label} cannot be empty"
            else:
                # Fallback: use Pydantic's message but prefix with field name
                raw_msg = error.get("msg", "Invalid value")
                msg = f"{field_label}: {raw_msg}"
            
            errors.append({
                "field": str(field_name),
                "message": msg,
                "error_code": "validation_error",
            })
        
        # Return the first error as the primary message for simple toast display
        primary = errors[0] if errors else {"message": "Invalid input", "field": "unknown"}
        
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "status_code": 422,
                "detail": {
                    "message": primary["message"],
                    "error_code": "validation_error",
                    "field": primary["field"],
                    "errors": errors,
                },
            },
        )

    @app.exception_handler(500)
    async def internal_server_error(request, exc):
        import traceback
        print("====== 500 ERROR ======")
        traceback.print_exception(type(exc), exc, exc.__traceback__)
        print("=======================")
        return JSONResponse(
            content={
                "message": "Oops! Something went wrong",
                "error_code": "server_error",
            },
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
