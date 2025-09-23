package com.salaemalae.auth.service

import com.salaemalae.auth.domain.*
import com.salaemalae.auth.dto.*
import com.salaemalae.auth.repository.*
import com.salaemalae.auth.security.JwtTokenProvider
import com.salaemalae.common.exception.*
import com.salaemalae.config.JwtConfig
import jakarta.servlet.http.HttpServletRequest
import org.slf4j.LoggerFactory
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.BadCredentialsException
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime
import java.util.*

@Service
@Transactional
class AuthService(
    private val userRepository: UserRepository,
    private val userProfileRepository: UserProfileRepository,
    private val refreshTokenRepository: RefreshTokenRepository,
    private val loginHistoryRepository: LoginHistoryRepository,
    private val passwordEncoder: PasswordEncoder,
    private val jwtTokenProvider: JwtTokenProvider,
    private val authenticationManager: AuthenticationManager,
    private val jwtConfig: JwtConfig
) {
    private val logger = LoggerFactory.getLogger(this::class.java)

    fun register(request: RegisterRequest, httpRequest: HttpServletRequest): RegistrationResponse {
        // Check if email already exists
        if (userRepository.existsByEmail(request.email)) {
            throw EmailAlreadyExistsException()
        }

        // Check if username already exists
        if (userRepository.existsByUsername(request.username)) {
            throw UsernameAlreadyExistsException()
        }

        // Create new user
        val user = User(
            email = request.email,
            username = request.username,
            passwordHash = passwordEncoder.encode(request.password),
            role = UserRole.USER,
            termsAcceptedAt = if (request.termsAccepted) LocalDateTime.now() else null
        )

        val savedUser = userRepository.save(user)

        // Create user profile
        val userProfile = UserProfile(
            user = savedUser
        )
        userProfileRepository.save(userProfile)

        logger.info("New user registered: ${savedUser.email}")

        return RegistrationResponse(
            userId = savedUser.id,
            email = savedUser.email,
            username = savedUser.username,
            createdAt = savedUser.createdAt
        )
    }

    fun login(request: LoginRequest, httpRequest: HttpServletRequest): TokenResponse {
        val ipAddress = getClientIp(httpRequest)
        val userAgent = httpRequest.getHeader("User-Agent")

        // Check rate limiting
        checkRateLimit(request.email, ipAddress)

        return try {
            // Authenticate user
            val authentication = authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken(request.email, request.password)
            )

            val user = userRepository.findActiveUserByEmail(request.email)
                .orElseThrow { UserNotFoundException() }

            // Generate tokens
            val accessToken = jwtTokenProvider.generateAccessToken(user)
            val refreshTokenString = jwtTokenProvider.generateRefreshToken(user)

            // Save refresh token
            val refreshToken = RefreshToken(
                user = user,
                token = refreshTokenString,
                deviceInfo = userAgent,
                ipAddress = ipAddress,
                expiresAt = LocalDateTime.now().plusSeconds(jwtConfig.refreshTokenExpiration / 1000)
            )
            refreshTokenRepository.save(refreshToken)

            // Log successful login
            val loginHistory = LoginHistory(
                user = user,
                ipAddress = ipAddress,
                userAgent = userAgent,
                loginType = LoginType.EMAIL,
                success = true
            )
            loginHistoryRepository.save(loginHistory)

            logger.info("User logged in successfully: ${user.email}")

            TokenResponse(
                accessToken = accessToken,
                refreshToken = refreshTokenString,
                tokenType = "Bearer",
                expiresIn = jwtConfig.accessTokenExpiration / 1000,
                user = UserDto(
                    userId = user.id,
                    email = user.email,
                    username = user.username,
                    role = user.role.name
                )
            )
        } catch (e: BadCredentialsException) {
            // Log failed login attempt
            userRepository.findByEmail(request.email).ifPresent { user ->
                val loginHistory = LoginHistory(
                    user = user,
                    ipAddress = ipAddress,
                    userAgent = userAgent,
                    loginType = LoginType.EMAIL,
                    success = false,
                    failureReason = "Invalid credentials"
                )
                loginHistoryRepository.save(loginHistory)
            }

            logger.warn("Failed login attempt for email: ${request.email}")
            throw AuthenticationException("이메일 또는 비밀번호가 올바르지 않습니다.")
        }
    }

    fun refreshAccessToken(request: RefreshTokenRequest): TokenResponse {
        val refreshToken = refreshTokenRepository.findByToken(request.refreshToken)
            .orElseThrow { InvalidTokenException() }

        if (!refreshToken.isValid()) {
            throw TokenExpiredException()
        }

        val user = refreshToken.user

        // Generate new access token
        val accessToken = jwtTokenProvider.generateAccessToken(user)

        return TokenResponse(
            accessToken = accessToken,
            tokenType = "Bearer",
            expiresIn = jwtConfig.accessTokenExpiration / 1000
        )
    }

    fun logout(refreshToken: String, userId: UUID) {
        val user = userRepository.findById(userId)
            .orElseThrow { UserNotFoundException() }

        // Revoke the specific refresh token
        refreshTokenRepository.findByToken(refreshToken)
            .ifPresent { it.revoke() }

        logger.info("User logged out: ${user.email}")
    }

    fun checkEmailAvailability(email: String): AvailabilityResponse {
        val exists = userRepository.existsByEmail(email)
        return AvailabilityResponse(
            available = !exists,
            message = if (!exists) "사용 가능한 이메일입니다." else "이미 사용중인 이메일입니다."
        )
    }

    fun checkUsernameAvailability(username: String): AvailabilityResponse {
        val exists = userRepository.existsByUsername(username)
        return AvailabilityResponse(
            available = !exists,
            message = if (!exists) "사용 가능한 닉네임입니다." else "이미 사용중인 닉네임입니다."
        )
    }

    private fun checkRateLimit(email: String, ipAddress: String?) {
        val oneHourAgo = LocalDateTime.now().minusHours(1)

        // Check failed login attempts per email
        val failedAttempts = loginHistoryRepository.countFailedLoginAttempts(email, oneHourAgo)
        if (failedAttempts >= 10) {
            throw RateLimitExceededException("로그인 시도 한도를 초과했습니다. 잠시 후 다시 시도해주세요.")
        }

        // Check attempts from IP
        ipAddress?.let { ip ->
            val ipAttempts = loginHistoryRepository.countAttemptsFromIp(ip, oneHourAgo)
            if (ipAttempts >= 20) {
                throw RateLimitExceededException("IP 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.")
            }
        }
    }

    private fun getClientIp(request: HttpServletRequest): String? {
        val xfHeader = request.getHeader("X-Forwarded-For")
        if (xfHeader != null) {
            return xfHeader.split(",").firstOrNull()?.trim()
        }

        val xRealIp = request.getHeader("X-Real-IP")
        if (xRealIp != null) {
            return xRealIp
        }

        return request.remoteAddr
    }
}