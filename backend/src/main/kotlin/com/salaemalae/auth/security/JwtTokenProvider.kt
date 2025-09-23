package com.salaemalae.auth.security

import com.salaemalae.auth.domain.User
import com.salaemalae.config.JwtConfig
import io.jsonwebtoken.*
import io.jsonwebtoken.io.Decoders
import io.jsonwebtoken.security.Keys
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import java.security.Key
import java.util.*

@Component
class JwtTokenProvider(
    private val jwtConfig: JwtConfig
) {
    private val logger = LoggerFactory.getLogger(this::class.java)
    private val key: Key by lazy {
        Keys.hmacShaKeyFor(Decoders.BASE64.decode(Base64.getEncoder().encodeToString(jwtConfig.secret.toByteArray())))
    }

    fun generateAccessToken(user: User): String {
        val now = Date()
        val expiryDate = Date(now.time + jwtConfig.accessTokenExpiration)

        return Jwts.builder()
            .setSubject(user.id.toString())
            .claim("email", user.email)
            .claim("username", user.username)
            .claim("role", user.role.name)
            .setIssuedAt(now)
            .setExpiration(expiryDate)
            .signWith(key, SignatureAlgorithm.HS256)
            .compact()
    }

    fun generateRefreshToken(user: User): String {
        val now = Date()
        val expiryDate = Date(now.time + jwtConfig.refreshTokenExpiration)

        return Jwts.builder()
            .setSubject(user.id.toString())
            .setIssuedAt(now)
            .setExpiration(expiryDate)
            .signWith(key, SignatureAlgorithm.HS256)
            .compact()
    }

    fun getUserIdFromToken(token: String): String? {
        return try {
            val claims = getClaimsFromToken(token)
            claims.subject
        } catch (e: Exception) {
            logger.error("Could not get user id from token", e)
            null
        }
    }

    fun validateToken(token: String): Boolean {
        return try {
            val claims = getClaimsFromToken(token)
            !claims.expiration.before(Date())
        } catch (e: SecurityException) {
            logger.error("Invalid JWT signature", e)
            false
        } catch (e: MalformedJwtException) {
            logger.error("Invalid JWT token", e)
            false
        } catch (e: ExpiredJwtException) {
            logger.error("JWT token is expired", e)
            false
        } catch (e: UnsupportedJwtException) {
            logger.error("JWT token is unsupported", e)
            false
        } catch (e: IllegalArgumentException) {
            logger.error("JWT claims string is empty", e)
            false
        }
    }

    fun getEmailFromToken(token: String): String? {
        return try {
            val claims = getClaimsFromToken(token)
            claims["email"] as? String
        } catch (e: Exception) {
            logger.error("Could not get email from token", e)
            null
        }
    }

    fun getUsernameFromToken(token: String): String? {
        return try {
            val claims = getClaimsFromToken(token)
            claims["username"] as? String
        } catch (e: Exception) {
            logger.error("Could not get username from token", e)
            null
        }
    }

    fun getRoleFromToken(token: String): String? {
        return try {
            val claims = getClaimsFromToken(token)
            claims["role"] as? String
        } catch (e: Exception) {
            logger.error("Could not get role from token", e)
            null
        }
    }

    fun getExpirationDateFromToken(token: String): Date? {
        return try {
            val claims = getClaimsFromToken(token)
            claims.expiration
        } catch (e: Exception) {
            logger.error("Could not get expiration date from token", e)
            null
        }
    }

    private fun getClaimsFromToken(token: String): Claims {
        return Jwts.parserBuilder()
            .setSigningKey(key)
            .build()
            .parseClaimsJws(token)
            .body
    }
}