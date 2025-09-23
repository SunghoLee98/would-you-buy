package com.salaemalae.auth.domain

import jakarta.persistence.*
import java.time.LocalDateTime
import java.util.UUID

@Entity
@Table(name = "refresh_tokens")
data class RefreshToken(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID = UUID.randomUUID(),

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    val user: User,

    @Column(unique = true, nullable = false, length = 500)
    val token: String,

    @Column(name = "device_info")
    val deviceInfo: String? = null,

    @Column(name = "ip_address")
    val ipAddress: String? = null,

    @Column(name = "expires_at", nullable = false)
    val expiresAt: LocalDateTime,

    @Column(name = "revoked_at")
    var revokedAt: LocalDateTime? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
) {
    fun isExpired(): Boolean = LocalDateTime.now().isAfter(expiresAt)
    fun isRevoked(): Boolean = revokedAt != null
    fun isValid(): Boolean = !isExpired() && !isRevoked()

    fun revoke() {
        revokedAt = LocalDateTime.now()
    }
}