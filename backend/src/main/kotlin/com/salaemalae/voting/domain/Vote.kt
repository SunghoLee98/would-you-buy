package com.salaemalae.voting.domain

import com.salaemalae.auth.domain.User
import jakarta.persistence.*
import java.time.LocalDate
import java.time.LocalDateTime
import java.util.UUID

@Entity
@Table(
    name = "votes",
    uniqueConstraints = [
        UniqueConstraint(columnNames = ["user_id", "stock_code", "voting_date"])
    ]
)
data class Vote(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID = UUID.randomUUID(),

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    val user: User,

    @Column(name = "stock_code", nullable = false, length = 20)
    val stockCode: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "vote_type", nullable = false, length = 10)
    val voteType: VoteType,

    @Column(name = "voting_date", nullable = false)
    val votingDate: LocalDate,

    @Column(name = "can_change_vote")
    val canChangeVote: Boolean = true,

    @Column(name = "confidence_level")
    val confidenceLevel: Int? = null,

    @Column(name = "prediction_reason", length = 500)
    val predictionReason: String? = null,

    @Column(name = "is_result_calculated")
    val isResultCalculated: Boolean = false,

    @Column(name = "is_correct")
    val isCorrect: Boolean? = null,

    @Column(name = "points_earned")
    val pointsEarned: Int? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
) {
    @PreUpdate
    fun preUpdate() {
        updatedAt = LocalDateTime.now()
    }

    /**
     * Check if this vote can still be modified
     */
    fun canBeModified(): Boolean {
        return canChangeVote && !isResultCalculated && LocalDate.now() <= votingDate
    }

    /**
     * Check if voting window is still open
     */
    fun isVotingWindowOpen(): Boolean {
        val today = LocalDate.now()
        return today <= votingDate
    }

    /**
     * Check if this is a KOSPI prediction (higher points)
     */
    fun isKospiPrediction(): Boolean {
        return stockCode == Stock.KOSPI_CODE
    }

    /**
     * Calculate base points for this vote type
     */
    fun calculateBasePoints(): Int {
        return when {
            isKospiPrediction() -> VoteType.KOSPI_POINTS
            else -> when (voteType) {
                VoteType.UP -> VoteType.CORRECT_POINTS
                VoteType.DOWN -> VoteType.CORRECT_POINTS
            }
        }
    }

    /**
     * Mark vote as correct and calculate points
     */
    fun markAsCorrect(): Vote {
        val basePoints = calculateBasePoints()
        return this.copy(
            isCorrect = true,
            pointsEarned = basePoints,
            isResultCalculated = true,
            updatedAt = LocalDateTime.now()
        )
    }

    /**
     * Mark vote as incorrect and calculate penalty
     */
    fun markAsIncorrect(): Vote {
        return this.copy(
            isCorrect = false,
            pointsEarned = VoteType.INCORRECT_PENALTY,
            isResultCalculated = true,
            updatedAt = LocalDateTime.now()
        )
    }

    companion object {
        /**
         * Create a new vote for a user
         */
        fun createVote(
            user: User,
            stockCode: String,
            voteType: VoteType,
            votingDate: LocalDate = LocalDate.now().plusDays(1),
            predictionReason: String? = null,
            confidenceLevel: Int? = null
        ): Vote {
            return Vote(
                user = user,
                stockCode = stockCode,
                voteType = voteType,
                votingDate = votingDate,
                predictionReason = predictionReason,
                confidenceLevel = confidenceLevel?.takeIf { it in 1..5 }
            )
        }
    }
}

enum class VoteType {
    UP,
    DOWN;

    companion object {
        const val CORRECT_POINTS = 10
        const val KOSPI_POINTS = 15
        const val INCORRECT_PENALTY = -5

        /**
         * Get display name in Korean
         */
        fun VoteType.getKoreanName(): String {
            return when (this) {
                UP -> "상승"
                DOWN -> "하락"
            }
        }

        /**
         * Get emoji representation
         */
        fun VoteType.getEmoji(): String {
            return when (this) {
                UP -> "📈"
                DOWN -> "📉"
            }
        }
    }
}