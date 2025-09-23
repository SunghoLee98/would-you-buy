package com.salaemalae.auth.security

import com.salaemalae.auth.domain.User
import com.salaemalae.auth.domain.UserRole
import com.salaemalae.config.JwtConfig
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.util.*
import kotlin.test.*

class JwtTokenProviderTest {

    private lateinit var jwtTokenProvider: JwtTokenProvider
    private lateinit var jwtConfig: JwtConfig
    private lateinit var testUser: User

    @BeforeEach
    fun setup() {
        jwtConfig = JwtConfig().apply {
            secret = "testSecretKeyForTestingOnlyPleaseChangeInProduction123456789"
            accessTokenExpiration = 3600000 // 1 hour
            refreshTokenExpiration = 2592000000 // 30 days
        }

        jwtTokenProvider = JwtTokenProvider(jwtConfig)

        testUser = User(
            id = UUID.randomUUID(),
            email = "test@test.com",
            username = "testuser",
            passwordHash = "hashedPassword",
            role = UserRole.USER
        )
    }

    @Test
    fun `should generate valid access token`() {
        // When
        val token = jwtTokenProvider.generateAccessToken(testUser)

        // Then
        assertNotNull(token)
        assertTrue(token.isNotEmpty())
        assertTrue(jwtTokenProvider.validateToken(token))
    }

    @Test
    fun `should generate valid refresh token`() {
        // When
        val token = jwtTokenProvider.generateRefreshToken(testUser)

        // Then
        assertNotNull(token)
        assertTrue(token.isNotEmpty())
        assertTrue(jwtTokenProvider.validateToken(token))
    }

    @Test
    fun `should extract user id from valid token`() {
        // Given
        val token = jwtTokenProvider.generateAccessToken(testUser)

        // When
        val userId = jwtTokenProvider.getUserIdFromToken(token)

        // Then
        assertNotNull(userId)
        assertEquals(testUser.id.toString(), userId)
    }

    @Test
    fun `should extract email from valid token`() {
        // Given
        val token = jwtTokenProvider.generateAccessToken(testUser)

        // When
        val email = jwtTokenProvider.getEmailFromToken(token)

        // Then
        assertNotNull(email)
        assertEquals(testUser.email, email)
    }

    @Test
    fun `should extract username from valid token`() {
        // Given
        val token = jwtTokenProvider.generateAccessToken(testUser)

        // When
        val username = jwtTokenProvider.getUsernameFromToken(token)

        // Then
        assertNotNull(username)
        assertEquals(testUser.username, username)
    }

    @Test
    fun `should extract role from valid token`() {
        // Given
        val token = jwtTokenProvider.generateAccessToken(testUser)

        // When
        val role = jwtTokenProvider.getRoleFromToken(token)

        // Then
        assertNotNull(role)
        assertEquals(testUser.role.name, role)
    }

    @Test
    fun `should return false for invalid token`() {
        // Given
        val invalidToken = "invalid.token.here"

        // When
        val isValid = jwtTokenProvider.validateToken(invalidToken)

        // Then
        assertFalse(isValid)
    }

    @Test
    fun `should return false for empty token`() {
        // Given
        val emptyToken = ""

        // When
        val isValid = jwtTokenProvider.validateToken(emptyToken)

        // Then
        assertFalse(isValid)
    }

    @Test
    fun `should return null when extracting user id from invalid token`() {
        // Given
        val invalidToken = "invalid.token.here"

        // When
        val userId = jwtTokenProvider.getUserIdFromToken(invalidToken)

        // Then
        assertNull(userId)
    }

    @Test
    fun `should have different tokens for different users`() {
        // Given
        val user1 = testUser
        val user2 = User(
            id = UUID.randomUUID(),
            email = "another@test.com",
            username = "anotheruser",
            passwordHash = "hashedPassword",
            role = UserRole.USER
        )

        // When
        val token1 = jwtTokenProvider.generateAccessToken(user1)
        val token2 = jwtTokenProvider.generateAccessToken(user2)

        // Then
        assertNotEquals(token1, token2)

        val userId1 = jwtTokenProvider.getUserIdFromToken(token1)
        val userId2 = jwtTokenProvider.getUserIdFromToken(token2)

        assertNotEquals(userId1, userId2)
        assertEquals(user1.id.toString(), userId1)
        assertEquals(user2.id.toString(), userId2)
    }
}