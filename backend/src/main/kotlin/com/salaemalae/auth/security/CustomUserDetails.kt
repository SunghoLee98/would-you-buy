package com.salaemalae.auth.security

import com.salaemalae.auth.domain.User
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.userdetails.UserDetails
import java.util.UUID

class CustomUserDetails(
    private val user: User
) : UserDetails {
    val id: UUID = user.id
    val email: String = user.email

    override fun getAuthorities(): Collection<GrantedAuthority> {
        return listOf(SimpleGrantedAuthority("ROLE_${user.role.name}"))
    }

    override fun getPassword(): String = user.passwordHash

    override fun getUsername(): String = user.email

    override fun isAccountNonExpired(): Boolean = true

    override fun isAccountNonLocked(): Boolean = user.isActive

    override fun isCredentialsNonExpired(): Boolean = true

    override fun isEnabled(): Boolean = user.isActive && user.deletedAt == null
}