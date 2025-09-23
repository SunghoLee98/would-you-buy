package com.salaemalae.auth.dto

import com.fasterxml.jackson.annotation.JsonInclude
import java.time.LocalDateTime
import java.util.UUID

@JsonInclude(JsonInclude.Include.NON_NULL)
data class TokenResponse(
    val accessToken: String,
    val refreshToken: String? = null,
    val tokenType: String = "Bearer",
    val expiresIn: Long,
    val user: UserDto? = null
)

data class UserDto(
    val userId: UUID,
    val email: String,
    val username: String,
    val role: String,
    val createdAt: LocalDateTime? = null
)

data class UserProfileDto(
    val userId: UUID,
    val email: String,
    val username: String,
    val role: String,
    val statistics: UserStatisticsDto,
    val createdAt: LocalDateTime,
    val lastLoginAt: LocalDateTime? = null
)

data class UserStatisticsDto(
    val totalPredictions: Int = 0,
    val correctPredictions: Int = 0,
    val accuracyRate: Double = 0.0,
    val totalPoints: Int = 0,
    val currentStreak: Int = 0,
    val longestStreak: Int = 0
)

data class RegistrationResponse(
    val userId: UUID,
    val email: String,
    val username: String,
    val createdAt: LocalDateTime
)

data class AvailabilityResponse(
    val available: Boolean,
    val message: String
)