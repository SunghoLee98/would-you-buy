package com.salaemalae.auth.repository

import com.salaemalae.auth.domain.User
import com.salaemalae.auth.domain.UserProfile
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

@Repository
interface UserProfileRepository : JpaRepository<UserProfile, UUID> {
    fun findByUser(user: User): Optional<UserProfile>
    fun findByUserId(userId: UUID): Optional<UserProfile>
}