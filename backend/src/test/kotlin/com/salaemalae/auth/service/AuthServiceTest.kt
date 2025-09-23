package com.salaemalae.auth.service

import com.salaemalae.auth.domain.User
import com.salaemalae.auth.domain.UserRole
import com.salaemalae.auth.dto.LoginRequest
import com.salaemalae.auth.dto.RegisterRequest
import com.salaemalae.auth.repository.LoginHistoryRepository
import com.salaemalae.auth.repository.RefreshTokenRepository
import com.salaemalae.auth.repository.UserProfileRepository
import com.salaemalae.auth.repository.UserRepository
import com.salaemalae.auth.security.JwtTokenProvider
import com.salaemalae.common.exception.EmailAlreadyExistsException
import com.salaemalae.common.exception.UsernameAlreadyExistsException
import com.salaemalae.config.JwtConfig
import jakarta.servlet.http.HttpServletRequest
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.mockito.kotlin.*
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.BadCredentialsException
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.crypto.password.PasswordEncoder
import java.util.*
import kotlin.test.assertEquals
import kotlin.test.assertNotNull

class AuthServiceTest {

    private lateinit var authService: AuthService
    private lateinit var userRepository: UserRepository
    private lateinit var userProfileRepository: UserProfileRepository
    private lateinit var refreshTokenRepository: RefreshTokenRepository
    private lateinit var loginHistoryRepository: LoginHistoryRepository
    private lateinit var passwordEncoder: PasswordEncoder
    private lateinit var jwtTokenProvider: JwtTokenProvider
    private lateinit var authenticationManager: AuthenticationManager
    private lateinit var jwtConfig: JwtConfig
    private lateinit var httpRequest: HttpServletRequest

    @BeforeEach
    fun setup() {
        userRepository = mock()
        userProfileRepository = mock()
        refreshTokenRepository = mock()
        loginHistoryRepository = mock()
        passwordEncoder = mock()
        jwtTokenProvider = mock()
        authenticationManager = mock()
        jwtConfig = JwtConfig().apply {
            secret = "testSecret"
            accessTokenExpiration = 3600000
            refreshTokenExpiration = 2592000000
        }
        httpRequest = mock()

        authService = AuthService(
            userRepository,
            userProfileRepository,
            refreshTokenRepository,
            loginHistoryRepository,
            passwordEncoder,
            jwtTokenProvider,
            authenticationManager,
            jwtConfig
        )
    }

    @Test
    fun `register should create new user successfully`() {
        // Given
        val request = RegisterRequest(
            email = "test@test.com",
            password = "Test1234!",
            username = "testuser",
            termsAccepted = true
        )

        val user = User(
            email = request.email,
            username = request.username,
            passwordHash = "hashedPassword",
            role = UserRole.USER
        )

        whenever(userRepository.existsByEmail(request.email)).thenReturn(false)
        whenever(userRepository.existsByUsername(request.username)).thenReturn(false)
        whenever(passwordEncoder.encode(request.password)).thenReturn("hashedPassword")
        whenever(userRepository.save(any())).thenReturn(user)
        whenever(userProfileRepository.save(any())).thenReturn(mock())

        // When
        val response = authService.register(request, httpRequest)

        // Then
        assertNotNull(response)
        assertEquals(request.email, response.email)
        assertEquals(request.username, response.username)

        verify(userRepository).save(any())
        verify(userProfileRepository).save(any())
    }

    @Test
    fun `register should throw exception when email already exists`() {
        // Given
        val request = RegisterRequest(
            email = "existing@test.com",
            password = "Test1234!",
            username = "testuser",
            termsAccepted = true
        )

        whenever(userRepository.existsByEmail(request.email)).thenReturn(true)

        // When & Then
        assertThrows<EmailAlreadyExistsException> {
            authService.register(request, httpRequest)
        }

        verify(userRepository, never()).save(any())
    }

    @Test
    fun `register should throw exception when username already exists`() {
        // Given
        val request = RegisterRequest(
            email = "test@test.com",
            password = "Test1234!",
            username = "existinguser",
            termsAccepted = true
        )

        whenever(userRepository.existsByEmail(request.email)).thenReturn(false)
        whenever(userRepository.existsByUsername(request.username)).thenReturn(true)

        // When & Then
        assertThrows<UsernameAlreadyExistsException> {
            authService.register(request, httpRequest)
        }

        verify(userRepository, never()).save(any())
    }

    @Test
    fun `login should return tokens on successful authentication`() {
        // Given
        val request = LoginRequest(
            email = "test@test.com",
            password = "Test1234!"
        )

        val user = User(
            id = UUID.randomUUID(),
            email = request.email,
            username = "testuser",
            passwordHash = "hashedPassword",
            role = UserRole.USER
        )

        val authentication = UsernamePasswordAuthenticationToken(request.email, request.password)

        whenever(httpRequest.getHeader("User-Agent")).thenReturn("TestAgent")
        whenever(httpRequest.remoteAddr).thenReturn("127.0.0.1")
        whenever(loginHistoryRepository.countFailedLoginAttempts(any(), any())).thenReturn(0)
        whenever(authenticationManager.authenticate(any())).thenReturn(authentication)
        whenever(userRepository.findActiveUserByEmail(request.email)).thenReturn(Optional.of(user))
        whenever(jwtTokenProvider.generateAccessToken(user)).thenReturn("accessToken")
        whenever(jwtTokenProvider.generateRefreshToken(user)).thenReturn("refreshToken")
        whenever(refreshTokenRepository.save(any())).thenReturn(mock())
        whenever(loginHistoryRepository.save(any())).thenReturn(mock())

        // When
        val response = authService.login(request, httpRequest)

        // Then
        assertNotNull(response)
        assertEquals("accessToken", response.accessToken)
        assertEquals("refreshToken", response.refreshToken)
        assertEquals("Bearer", response.tokenType)

        verify(refreshTokenRepository).save(any())
        verify(loginHistoryRepository).save(any())
    }

    @Test
    fun `login should throw exception on invalid credentials`() {
        // Given
        val request = LoginRequest(
            email = "test@test.com",
            password = "WrongPassword"
        )

        whenever(httpRequest.getHeader("User-Agent")).thenReturn("TestAgent")
        whenever(httpRequest.remoteAddr).thenReturn("127.0.0.1")
        whenever(loginHistoryRepository.countFailedLoginAttempts(any(), any())).thenReturn(0)
        whenever(authenticationManager.authenticate(any()))
            .thenThrow(BadCredentialsException("Invalid credentials"))
        whenever(userRepository.findByEmail(request.email)).thenReturn(Optional.empty())

        // When & Then
        assertThrows<com.salaemalae.common.exception.AuthenticationException> {
            authService.login(request, httpRequest)
        }
    }

    @Test
    fun `checkEmailAvailability should return correct availability status`() {
        // Given
        val availableEmail = "available@test.com"
        val existingEmail = "existing@test.com"

        whenever(userRepository.existsByEmail(availableEmail)).thenReturn(false)
        whenever(userRepository.existsByEmail(existingEmail)).thenReturn(true)

        // When
        val availableResponse = authService.checkEmailAvailability(availableEmail)
        val existingResponse = authService.checkEmailAvailability(existingEmail)

        // Then
        assertEquals(true, availableResponse.available)
        assertEquals("사용 가능한 이메일입니다.", availableResponse.message)

        assertEquals(false, existingResponse.available)
        assertEquals("이미 사용중인 이메일입니다.", existingResponse.message)
    }

    @Test
    fun `checkUsernameAvailability should return correct availability status`() {
        // Given
        val availableUsername = "available"
        val existingUsername = "existing"

        whenever(userRepository.existsByUsername(availableUsername)).thenReturn(false)
        whenever(userRepository.existsByUsername(existingUsername)).thenReturn(true)

        // When
        val availableResponse = authService.checkUsernameAvailability(availableUsername)
        val existingResponse = authService.checkUsernameAvailability(existingUsername)

        // Then
        assertEquals(true, availableResponse.available)
        assertEquals("사용 가능한 닉네임입니다.", availableResponse.message)

        assertEquals(false, existingResponse.available)
        assertEquals("이미 사용중인 닉네임입니다.", existingResponse.message)
    }
}