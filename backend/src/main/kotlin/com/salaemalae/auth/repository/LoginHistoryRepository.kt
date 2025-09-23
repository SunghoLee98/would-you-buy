package com.salaemalae.auth.repository

import com.salaemalae.auth.domain.LoginHistory
import com.salaemalae.auth.domain.User
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.time.LocalDateTime
import java.util.UUID

@Repository
interface LoginHistoryRepository : JpaRepository<LoginHistory, UUID> {
    fun findByUserOrderByCreatedAtDesc(user: User): List<LoginHistory>

    @Query("SELECT COUNT(lh) FROM LoginHistory lh WHERE lh.user.email = :email AND lh.success = false AND lh.createdAt > :since")
    fun countFailedLoginAttempts(email: String, since: LocalDateTime): Long

    @Query("SELECT COUNT(DISTINCT lh.ipAddress) FROM LoginHistory lh WHERE lh.ipAddress = :ipAddress AND lh.createdAt > :since")
    fun countAttemptsFromIp(ipAddress: String, since: LocalDateTime): Long
}