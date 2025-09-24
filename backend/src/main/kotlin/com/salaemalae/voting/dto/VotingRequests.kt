package com.salaemalae.voting.dto

import com.salaemalae.voting.domain.VoteType
import jakarta.validation.constraints.*
import java.time.LocalDate

/**
 * Request DTOs for voting operations
 * All validation messages in Korean for Korean market
 */

/**
 * Request to submit a new vote
 */
data class SubmitVoteRequest(
    @field:NotBlank(message = "주식 코드는 필수입니다")
    @field:Size(max = 20, message = "주식 코드는 20자 이하여야 합니다")
    val stockCode: String,

    @field:NotNull(message = "투표 유형은 필수입니다")
    val voteType: VoteType,

    @field:Future(message = "투표 날짜는 미래 날짜여야 합니다")
    val votingDate: LocalDate = LocalDate.now().plusDays(1),

    @field:Min(value = 1, message = "확신도는 1 이상이어야 합니다")
    @field:Max(value = 5, message = "확신도는 5 이하여야 합니다")
    val confidenceLevel: Int? = null,

    @field:Size(max = 500, message = "예측 이유는 500자 이하여야 합니다")
    val predictionReason: String? = null
) {
    /**
     * Validate business rules
     */
    fun validate(): List<String> {
        val errors = mutableListOf<String>()

        // Validate confidence level if provided
        confidenceLevel?.let {
            if (it !in 1..5) {
                errors.add("확신도는 1부터 5까지의 값이어야 합니다")
            }
        }

        // Validate stock code format (Korean stocks or KOSPI)
        if (!isValidStockCode(stockCode)) {
            errors.add("유효하지 않은 주식 코드입니다")
        }

        // Validate voting date is within reasonable range
        val maxVotingDate = LocalDate.now().plusDays(7)
        if (votingDate.isAfter(maxVotingDate)) {
            errors.add("투표 날짜는 일주일 이내여야 합니다")
        }

        return errors
    }

    private fun isValidStockCode(code: String): Boolean {
        return when {
            code == "KOSPI" -> true
            code.matches(Regex("\\d{6}")) -> true // 6-digit Korean stock codes
            else -> false
        }
    }
}

/**
 * Request to update an existing vote
 */
data class UpdateVoteRequest(
    @field:NotNull(message = "투표 유형은 필수입니다")
    val voteType: VoteType,

    @field:Min(value = 1, message = "확신도는 1 이상이어야 합니다")
    @field:Max(value = 5, message = "확신도는 5 이하여야 합니다")
    val confidenceLevel: Int? = null,

    @field:Size(max = 500, message = "예측 이유는 500자 이하여야 합니다")
    val predictionReason: String? = null
)

/**
 * Request to get vote statistics
 */
data class VoteStatisticsRequest(
    @field:NotBlank(message = "주식 코드는 필수입니다")
    val stockCode: String,

    val votingDate: LocalDate = LocalDate.now().plusDays(1)
)

/**
 * Request to get voting dashboard data
 */
data class VotingDashboardRequest(
    val date: LocalDate = LocalDate.now().plusDays(1),
    val includeInactive: Boolean = false
)

/**
 * Request to get user's voting history
 */
data class UserVotingHistoryRequest(
    val page: Int = 0,
    val size: Int = 20,
    val startDate: LocalDate? = null,
    val endDate: LocalDate? = null,
    val stockCode: String? = null
) {
    init {
        require(page >= 0) { "페이지 번호는 0 이상이어야 합니다" }
        require(size in 1..100) { "페이지 크기는 1부터 100까지여야 합니다" }

        if (startDate != null && endDate != null) {
            require(!startDate.isAfter(endDate)) { "시작 날짜는 종료 날짜보다 이후일 수 없습니다" }
        }
    }
}

/**
 * Request for leaderboard data
 */
data class LeaderboardRequest(
    val type: LeaderboardType = LeaderboardType.OVERALL,
    val limit: Int = 50,
    val period: LeaderboardPeriod = LeaderboardPeriod.ALL_TIME
) {
    init {
        require(limit in 1..100) { "제한 수는 1부터 100까지여야 합니다" }
    }
}

/**
 * Enum for leaderboard types
 */
enum class LeaderboardType {
    OVERALL,        // 전체 순위
    ACCURACY,       // 정확도 순위
    STREAK,         // 연속 정답 순위
    WEEKLY          // 주간 순위
}

/**
 * Enum for leaderboard periods
 */
enum class LeaderboardPeriod {
    ALL_TIME,       // 전체 기간
    THIS_WEEK,      // 이번 주
    THIS_MONTH,     // 이번 달
    LAST_WEEK,      // 지난 주
    LAST_MONTH      // 지난 달
}