package com.salaemalae.common.exception

import org.springframework.http.HttpStatus

open class ApiException(
    val code: String,
    override val message: String,
    val httpStatus: HttpStatus
) : RuntimeException(message)

class AuthenticationException(
    message: String = "인증에 실패했습니다."
) : ApiException("AUTH_FAILED", message, HttpStatus.UNAUTHORIZED)

class ValidationException(
    val errors: Map<String, String>,
    message: String = "입력값이 올바르지 않습니다."
) : ApiException("VALIDATION_ERROR", message, HttpStatus.BAD_REQUEST)

class UserNotFoundException(
    message: String = "사용자를 찾을 수 없습니다."
) : ApiException("USER_NOT_FOUND", message, HttpStatus.NOT_FOUND)

class EmailAlreadyExistsException(
    message: String = "이미 사용중인 이메일입니다."
) : ApiException("EMAIL_ALREADY_EXISTS", message, HttpStatus.CONFLICT)

class UsernameAlreadyExistsException(
    message: String = "이미 사용중인 닉네임입니다."
) : ApiException("USERNAME_ALREADY_EXISTS", message, HttpStatus.CONFLICT)

class InvalidTokenException(
    message: String = "유효하지 않은 토큰입니다."
) : ApiException("TOKEN_INVALID", message, HttpStatus.UNAUTHORIZED)

class TokenExpiredException(
    message: String = "토큰이 만료되었습니다."
) : ApiException("TOKEN_EXPIRED", message, HttpStatus.UNAUTHORIZED)

class RateLimitExceededException(
    message: String = "요청 한도를 초과했습니다."
) : ApiException("RATE_LIMIT_EXCEEDED", message, HttpStatus.TOO_MANY_REQUESTS)