package com.salaemalae.auth.service

import com.salaemalae.auth.dto.UserProfileDto
import com.salaemalae.auth.dto.UserStatisticsDto
import com.salaemalae.auth.repository.LoginHistoryRepository
import com.salaemalae.auth.repository.UserProfileRepository
import com.salaemalae.auth.repository.UserRepository
import com.salaemalae.auth.security.CustomUserDetails
import com.salaemalae.common.exception.UserNotFoundException
import org.slf4j.LoggerFactory
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional(readOnly = true)
class UserService(
    private val userRepository: UserRepository,
    private val userProfileRepository: UserProfileRepository,
    private val loginHistoryRepository: LoginHistoryRepository
) {
    private val logger = LoggerFactory.getLogger(this::class.java)

    fun getCurrentUser(): UserProfileDto {
        val authentication = SecurityContextHolder.getContext().authentication
        val userDetails = authentication.principal as CustomUserDetails

        return getUserProfile(userDetails.id)
    }

    fun getUserProfile(userId: UUID): UserProfileDto {
        val user = userRepository.findActiveUserById(userId)
            .orElseThrow { UserNotFoundException() }

        val profile = userProfileRepository.findByUserId(userId)
            .orElseThrow { UserNotFoundException("사용자 프로필을 찾을 수 없습니다.") }

        val lastLogin = loginHistoryRepository.findByUserOrderByCreatedAtDesc(user)
            .firstOrNull { it.success }?.createdAt

        return UserProfileDto(
            userId = user.id,
            email = user.email,
            username = user.username,
            role = user.role.name,
            statistics = UserStatisticsDto(
                totalPredictions = profile.totalPredictions,
                correctPredictions = profile.correctPredictions,
                accuracyRate = profile.accuracyRate,
                totalPoints = profile.totalPoints,
                currentStreak = profile.currentStreak,
                longestStreak = profile.longestStreak
            ),
            createdAt = user.createdAt,
            lastLoginAt = lastLogin
        )
    }

    @Transactional
    fun updateUserProfile(userId: UUID, bio: String?, avatarUrl: String?) {
        val profile = userProfileRepository.findByUserId(userId)
            .orElseThrow { UserNotFoundException("사용자 프로필을 찾을 수 없습니다.") }

        // Note: In a real implementation, you would create a copy with updated fields
        // For now, we'll just log the update request
        logger.info("Profile update requested for user: $userId")
    }
}