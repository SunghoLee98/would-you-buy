package com.salaemalae.common.exception

import com.salaemalae.common.response.ErrorResponse
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.authentication.BadCredentialsException
import org.springframework.validation.FieldError
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice

@RestControllerAdvice
class GlobalExceptionHandler {

    private val logger = LoggerFactory.getLogger(this::class.java)

    @ExceptionHandler(ApiException::class)
    fun handleApiException(ex: ApiException): ResponseEntity<ErrorResponse> {
        logger.error("API Exception: ${ex.code} - ${ex.message}")

        val errorResponse = ErrorResponse(
            success = false,
            error = ErrorResponse.ErrorDetail(
                code = ex.code,
                message = ex.message,
                details = if (ex is ValidationException) ex.errors else null
            )
        )
        return ResponseEntity(errorResponse, ex.httpStatus)
    }

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidationException(ex: MethodArgumentNotValidException): ResponseEntity<ErrorResponse> {
        val errors = ex.bindingResult.allErrors.associate {
            val fieldName = (it as? FieldError)?.field ?: "unknown"
            fieldName to (it.defaultMessage ?: "Invalid value")
        }

        logger.error("Validation Exception: $errors")

        val errorResponse = ErrorResponse(
            success = false,
            error = ErrorResponse.ErrorDetail(
                code = "VALIDATION_ERROR",
                message = "입력값이 올바르지 않습니다.",
                details = errors
            )
        )
        return ResponseEntity(errorResponse, HttpStatus.BAD_REQUEST)
    }

    @ExceptionHandler(BadCredentialsException::class)
    fun handleBadCredentialsException(ex: BadCredentialsException): ResponseEntity<ErrorResponse> {
        logger.error("Bad Credentials: ${ex.message}")

        val errorResponse = ErrorResponse(
            success = false,
            error = ErrorResponse.ErrorDetail(
                code = "INVALID_CREDENTIALS",
                message = "이메일 또는 비밀번호가 올바르지 않습니다."
            )
        )
        return ResponseEntity(errorResponse, HttpStatus.UNAUTHORIZED)
    }

    @ExceptionHandler(Exception::class)
    fun handleGenericException(ex: Exception): ResponseEntity<ErrorResponse> {
        logger.error("Unexpected error occurred", ex)

        val errorResponse = ErrorResponse(
            success = false,
            error = ErrorResponse.ErrorDetail(
                code = "INTERNAL_SERVER_ERROR",
                message = "서버 내부 오류가 발생했습니다."
            )
        )
        return ResponseEntity(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR)
    }
}