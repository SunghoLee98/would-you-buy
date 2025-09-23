package com.salaemalae.auth.security

import com.salaemalae.auth.repository.UserRepository
import com.salaemalae.common.exception.UserNotFoundException
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
class CustomUserDetailsService(
    private val userRepository: UserRepository
) : UserDetailsService {

    @Transactional(readOnly = true)
    override fun loadUserByUsername(username: String): UserDetails {
        val user = userRepository.findActiveUserByEmail(username)
            .orElseThrow { UserNotFoundException("사용자를 찾을 수 없습니다: $username") }
        return CustomUserDetails(user)
    }

    @Transactional(readOnly = true)
    fun loadUserById(userId: UUID): UserDetails {
        val user = userRepository.findActiveUserById(userId)
            .orElseThrow { UserNotFoundException("사용자를 찾을 수 없습니다: $userId") }
        return CustomUserDetails(user)
    }
}