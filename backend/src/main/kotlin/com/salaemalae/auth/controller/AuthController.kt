package com.salaemalae.auth.controller

import com.salaemalae.auth.dto.*
import com.salaemalae.auth.security.CustomUserDetails
import com.salaemalae.auth.service.AuthService
import com.salaemalae.common.response.ApiResponse
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/auth")
class AuthController(
    private val authService: AuthService
) {

    @PostMapping("/register")
    fun register(
        @Valid @RequestBody request: RegisterRequest,
        httpRequest: HttpServletRequest
    ): ResponseEntity<ApiResponse<RegistrationResponse>> {
        val response = authService.register(request, httpRequest)
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(ApiResponse.success(response, "회원가입이 완료되었습니다."))
    }

    @PostMapping("/login")
    fun login(
        @Valid @RequestBody request: LoginRequest,
        httpRequest: HttpServletRequest
    ): ResponseEntity<ApiResponse<TokenResponse>> {
        val response = authService.login(request, httpRequest)
        return ResponseEntity.ok(ApiResponse.success(response, "로그인 성공"))
    }

    @PostMapping("/refresh")
    fun refreshToken(
        @Valid @RequestBody request: RefreshTokenRequest
    ): ResponseEntity<ApiResponse<TokenResponse>> {
        val response = authService.refreshAccessToken(request)
        return ResponseEntity.ok(ApiResponse.success(response, "토큰이 갱신되었습니다."))
    }

    @PostMapping("/logout")
    fun logout(
        @Valid @RequestBody request: LogoutRequest,
        @AuthenticationPrincipal userDetails: CustomUserDetails
    ): ResponseEntity<ApiResponse<Unit>> {
        authService.logout(request.refreshToken, userDetails.id)
        return ResponseEntity.ok(ApiResponse.success(null, "로그아웃되었습니다."))
    }

    @GetMapping("/check-email")
    fun checkEmailAvailability(
        @RequestParam email: String
    ): ResponseEntity<ApiResponse<AvailabilityResponse>> {
        val response = authService.checkEmailAvailability(email)
        return ResponseEntity.ok(ApiResponse.success(response))
    }

    @GetMapping("/check-username")
    fun checkUsernameAvailability(
        @RequestParam username: String
    ): ResponseEntity<ApiResponse<AvailabilityResponse>> {
        val response = authService.checkUsernameAvailability(username)
        return ResponseEntity.ok(ApiResponse.success(response))
    }

    @PostMapping("/forgot-password")
    fun forgotPassword(
        @Valid @RequestBody request: ForgotPasswordRequest
    ): ResponseEntity<ApiResponse<Unit>> {
        // TODO: Implement password reset email sending
        return ResponseEntity.ok(
            ApiResponse.success(null, "비밀번호 재설정 링크가 이메일로 발송되었습니다.")
        )
    }

    @PostMapping("/reset-password")
    fun resetPassword(
        @Valid @RequestBody request: ResetPasswordRequest
    ): ResponseEntity<ApiResponse<Unit>> {
        // TODO: Implement password reset
        return ResponseEntity.ok(
            ApiResponse.success(null, "비밀번호가 성공적으로 변경되었습니다.")
        )
    }
}