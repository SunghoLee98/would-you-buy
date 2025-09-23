package com.salaemalae.auth.domain

import jakarta.persistence.*
import java.time.LocalDateTime
import java.util.UUID

@Entity
@Table(name = "login_history")
data class LoginHistory(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID = UUID.randomUUID(),

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    val user: User,

    @Column(name = "ip_address")
    val ipAddress: String? = null,

    @Column(name = "user_agent", columnDefinition = "TEXT")
    val userAgent: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "login_type", nullable = false, length = 20)
    val loginType: LoginType,

    @Column(nullable = false)
    val success: Boolean,

    @Column(name = "failure_reason", length = 100)
    val failureReason: String? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
)

enum class LoginType {
    EMAIL,
    GOOGLE,
    KAKAO,
    NAVER
}