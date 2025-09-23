package com.salaemalae.auth.dto

import jakarta.validation.constraints.*

data class LoginRequest(
    @field:NotBlank(message = "이메일은 필수 입력값입니다.")
    @field:Email(message = "올바른 이메일 형식이 아닙니다.")
    val email: String,

    @field:NotBlank(message = "비밀번호는 필수 입력값입니다.")
    val password: String
)

data class RegisterRequest(
    @field:NotBlank(message = "이메일은 필수 입력값입니다.")
    @field:Email(message = "올바른 이메일 형식이 아닙니다.")
    val email: String,

    @field:NotBlank(message = "비밀번호는 필수 입력값입니다.")
    @field:Pattern(
        regexp = "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[@\$!%*?&])[A-Za-z\\d@\$!%*?&]{8,}$",
        message = "비밀번호는 최소 8자 이상이며, 대문자, 소문자, 숫자, 특수문자를 포함해야 합니다."
    )
    val password: String,

    @field:NotBlank(message = "사용자명은 필수 입력값입니다.")
    @field:Size(min = 2, max = 20, message = "사용자명은 2-20자 사이여야 합니다.")
    @field:Pattern(
        regexp = "^[a-zA-Z0-9가-힣]+$",
        message = "사용자명은 한글, 영문, 숫자만 사용 가능합니다."
    )
    val username: String,

    @field:AssertTrue(message = "이용약관에 동의해야 합니다.")
    val termsAccepted: Boolean
)

data class RefreshTokenRequest(
    @field:NotBlank(message = "리프레시 토큰은 필수 입력값입니다.")
    val refreshToken: String
)

data class LogoutRequest(
    @field:NotBlank(message = "리프레시 토큰은 필수 입력값입니다.")
    val refreshToken: String
)

data class ForgotPasswordRequest(
    @field:NotBlank(message = "이메일은 필수 입력값입니다.")
    @field:Email(message = "올바른 이메일 형식이 아닙니다.")
    val email: String
)

data class ResetPasswordRequest(
    @field:NotBlank(message = "토큰은 필수 입력값입니다.")
    val token: String,

    @field:NotBlank(message = "새 비밀번호는 필수 입력값입니다.")
    @field:Pattern(
        regexp = "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[@\$!%*?&])[A-Za-z\\d@\$!%*?&]{8,}$",
        message = "비밀번호는 최소 8자 이상이며, 대문자, 소문자, 숫자, 특수문자를 포함해야 합니다."
    )
    val newPassword: String
)