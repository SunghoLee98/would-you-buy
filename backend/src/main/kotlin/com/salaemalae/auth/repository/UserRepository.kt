package com.salaemalae.auth.repository

import com.salaemalae.auth.domain.User
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

@Repository
interface UserRepository : JpaRepository<User, UUID> {
    fun findByEmail(email: String): Optional<User>
    fun findByUsername(username: String): Optional<User>
    fun existsByEmail(email: String): Boolean
    fun existsByUsername(username: String): Boolean

    @Query("SELECT u FROM User u WHERE u.email = :email AND u.isActive = true AND u.deletedAt IS NULL")
    fun findActiveUserByEmail(email: String): Optional<User>

    @Query("SELECT u FROM User u WHERE u.id = :id AND u.isActive = true AND u.deletedAt IS NULL")
    fun findActiveUserById(id: UUID): Optional<User>
}