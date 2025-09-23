package com.salaemalae.auth.domain

import jakarta.persistence.*
import java.time.LocalDate
import java.time.LocalDateTime
import java.util.UUID

@Entity
@Table(name = "user_profiles")
data class UserProfile(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID = UUID.randomUUID(),

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    val user: User,

    @Column(name = "avatar_url", length = 500)
    val avatarUrl: String? = null,

    @Column(length = 500)
    val bio: String? = null,

    @Column(name = "total_predictions")
    var totalPredictions: Int = 0,

    @Column(name = "correct_predictions")
    var correctPredictions: Int = 0,

    @Column(name = "total_points")
    var totalPoints: Int = 0,

    @Column(name = "current_streak")
    var currentStreak: Int = 0,

    @Column(name = "longest_streak")
    var longestStreak: Int = 0,

    @Column(name = "last_prediction_date")
    var lastPredictionDate: LocalDate? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
) {
    val accuracyRate: Double
        get() = if (totalPredictions > 0) {
            (correctPredictions.toDouble() / totalPredictions) * 100
        } else 0.0

    @PreUpdate
    fun preUpdate() {
        updatedAt = LocalDateTime.now()
    }
}