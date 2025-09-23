package com.salaemalae.auth.repository

import com.salaemalae.auth.domain.RefreshToken
import com.salaemalae.auth.domain.User
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.time.LocalDateTime
import java.util.Optional
import java.util.UUID

@Repository
interface RefreshTokenRepository : JpaRepository<RefreshToken, UUID> {
    fun findByToken(token: String): Optional<RefreshToken>
    fun findByUser(user: User): List<RefreshToken>
    fun findByUserId(userId: UUID): List<RefreshToken>

    @Modifying
    @Query("UPDATE RefreshToken rt SET rt.revokedAt = :now WHERE rt.user = :user AND rt.revokedAt IS NULL")
    fun revokeAllUserTokens(user: User, now: LocalDateTime = LocalDateTime.now())

    @Modifying
    @Query("DELETE FROM RefreshToken rt WHERE rt.expiresAt < :now OR rt.revokedAt IS NOT NULL")
    fun deleteExpiredTokens(now: LocalDateTime = LocalDateTime.now())

    fun countByUserAndRevokedAtIsNullAndExpiresAtAfter(user: User, now: LocalDateTime = LocalDateTime.now()): Long
}