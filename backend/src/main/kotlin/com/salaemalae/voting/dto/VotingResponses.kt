package com.salaemalae.voting.dto

import com.salaemalae.voting.domain.VoteType
import java.math.BigDecimal
import java.time.LocalDate
import java.time.LocalDateTime
import java.util.*

/**
 * Response DTOs for voting operations
 * All Korean localized for Korean market requirements
 */

/**
 * Stock information for voting dashboard
 */
data class StockInfoResponse(
    val code: String,
    val koreanName: String,
    val englishName: String? = null,
    val currentPrice: BigDecimal? = null,
    val changeRate: BigDecimal? = null,
    val changeAmount: BigDecimal? = null,
    val isPrimary: Boolean,
    val displayOrder: Int,
    val marketType: String,
    val lastUpdated: LocalDateTime? = null,
    val isVotingEligible: Boolean,
    val priceTrend: String? = null,
    val formattedChangeRate: String? = null,
    val formattedChangeAmount: String? = null
) {
    companion object {
        fun from(stock: com.salaemalae.voting.domain.Stock): StockInfoResponse {
            return StockInfoResponse(
                code = stock.code,
                koreanName = stock.koreanName,
                englishName = stock.englishName,
                currentPrice = stock.currentPrice,
                changeRate = stock.changeRate,
                changeAmount = stock.changeAmount,
                isPrimary = stock.isPrimary,
                displayOrder = stock.displayOrder,
                marketType = stock.marketType,
                lastUpdated = stock.lastUpdated,
                isVotingEligible = stock.isVotingEligible,
                priceTrend = stock.priceTrend.name,
                formattedChangeRate = stock.getFormattedChangeRate(),
                formattedChangeAmount = stock.getFormattedChangeAmount()
            )
        }
    }
}

/**
 * Vote statistics for community voting
 */
data class VoteStatisticsResponse(
    val stockCode: String,
    val votingDate: LocalDate,
    val upVotes: Long,
    val downVotes: Long,
    val totalVotes: Long,
    val upPercentage: Double,
    val downPercentage: Double,
    val majorityVote: VoteType? = null,
    val hasClearMajority: Boolean = false,
    val majorityVoteText: String? = null,
    val consensusStrength: String = ""
) {
    companion object {
        fun create(
            stockCode: String,
            votingDate: LocalDate,
            upVotes: Long,
            downVotes: Long
        ): VoteStatisticsResponse {
            val total = upVotes + downVotes
            val upPerc = if (total > 0) (upVotes.toDouble() / total * 100.0) else 0.0
            val downPerc = if (total > 0) (downVotes.toDouble() / total * 100.0) else 0.0

            val majority = when {
                upVotes > downVotes -> VoteType.UP
                downVotes > upVotes -> VoteType.DOWN
                else -> null
            }

            val clearMajority = upPerc > 60.0 || downPerc > 60.0

            val majorityText = majority?.let {
                when (it) {
                    VoteType.UP -> "상승"
                    VoteType.DOWN -> "하락"
                }
            }

            val consensus = when {
                clearMajority -> "강한 의견 일치"
                total == 0L -> "투표 없음"
                Math.abs(upPerc - downPerc) < 10.0 -> "의견 분산"
                else -> "약간의 의견 차이"
            }

            return VoteStatisticsResponse(
                stockCode = stockCode,
                votingDate = votingDate,
                upVotes = upVotes,
                downVotes = downVotes,
                totalVotes = total,
                upPercentage = upPerc,
                downPercentage = downPerc,
                majorityVote = majority,
                hasClearMajority = clearMajority,
                majorityVoteText = majorityText,
                consensusStrength = consensus
            )
        }
    }
}

/**
 * User's vote information
 */
data class UserVoteResponse(
    val id: UUID,
    val stockCode: String,
    val stockName: String,
    val voteType: VoteType,
    val voteTypeText: String,
    val votingDate: LocalDate,
    val confidenceLevel: Int?,
    val predictionReason: String?,
    val canChangeVote: Boolean,
    val isResultCalculated: Boolean,
    val isCorrect: Boolean?,
    val pointsEarned: Int?,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime
) {
    /**
     * Get result status text in Korean
     */
    val resultStatusText: String
        get() = when {
            !isResultCalculated -> "결과 대기 중"
            isCorrect == true -> "정답"
            isCorrect == false -> "오답"
            else -> "결과 불명"
        }

    /**
     * Get confidence level text
     */
    val confidenceLevelText: String?
        get() = confidenceLevel?.let {
            when (it) {
                1 -> "매우 낮음"
                2 -> "낮음"
                3 -> "보통"
                4 -> "높음"
                5 -> "매우 높음"
                else -> "알 수 없음"
            }
        }

    companion object {
        fun from(vote: com.salaemalae.voting.domain.Vote, stockName: String): UserVoteResponse {
            return UserVoteResponse(
                id = vote.id,
                stockCode = vote.stockCode,
                stockName = stockName,
                voteType = vote.voteType,
                voteTypeText = when (vote.voteType) {
                    VoteType.UP -> "상승"
                    VoteType.DOWN -> "하락"
                },
                votingDate = vote.votingDate,
                confidenceLevel = vote.confidenceLevel,
                predictionReason = vote.predictionReason,
                canChangeVote = vote.canBeModified(),
                isResultCalculated = vote.isResultCalculated,
                isCorrect = vote.isCorrect,
                pointsEarned = vote.pointsEarned,
                createdAt = vote.createdAt,
                updatedAt = vote.updatedAt
            )
        }
    }
}

/**
 * Voting dashboard item combining stock info and vote statistics
 */
data class VotingDashboardItem(
    val stock: StockInfoResponse,
    val voteStatistics: VoteStatisticsResponse,
    val userVote: UserVoteResponse?
)

/**
 * Complete voting dashboard response
 */
data class VotingDashboardResponse(
    val votingDate: LocalDate,
    val items: List<VotingDashboardItem>,
    val totalActiveStocks: Int,
    val votingWindowOpen: Boolean,
    val marketStatus: String,
    val kospiItem: VotingDashboardItem,
    val featuredStocks: List<VotingDashboardItem>
)

/**
 * User statistics summary
 */
data class UserStatsResponse(
    val totalPredictions: Long,
    val correctPredictions: Long,
    val accuracyRate: Double,
    val totalPoints: Int,
    val currentStreak: Int,
    val longestStreak: Int,
    val rank: Int? = null,
    val weeklyRank: Int? = null,
    val weeklyPoints: Int = 0
) {
    /**
     * Get accuracy rate text
     */
    val accuracyRateText: String
        get() = String.format("%.1f%%", accuracyRate)

    /**
     * Get performance level
     */
    val performanceLevel: String
        get() = when {
            accuracyRate >= 70.0 -> "전문가"
            accuracyRate >= 60.0 -> "고수"
            accuracyRate >= 50.0 -> "숙련자"
            accuracyRate >= 40.0 -> "초보자"
            else -> "연습 필요"
        }
}

/**
 * Leaderboard entry
 */
data class LeaderboardEntryResponse(
    val rank: Int,
    val userId: UUID,
    val username: String,
    val totalPoints: Int,
    val accuracyRate: Double,
    val totalPredictions: Long,
    val correctPredictions: Long,
    val currentStreak: Int? = null,
    val avatar: String? = null
) {
    val accuracyRateText: String
        get() = String.format("%.1f%%", accuracyRate)
}

/**
 * Complete leaderboard response
 */
data class LeaderboardResponse(
    val type: LeaderboardType,
    val period: LeaderboardPeriod,
    val entries: List<LeaderboardEntryResponse>,
    val totalEntries: Long,
    val userRank: Int? = null,
    val lastUpdated: LocalDateTime
)

/**
 * Vote submission response
 */
data class VoteSubmissionResponse(
    val success: Boolean,
    val voteId: UUID,
    val message: String,
    val vote: UserVoteResponse
)

/**
 * Vote update response
 */
data class VoteUpdateResponse(
    val success: Boolean,
    val message: String,
    val vote: UserVoteResponse
)

/**
 * Community voting insights
 */
data class CommunityVotingInsights(
    val stockCode: String,
    val stockName: String,
    val votingDate: LocalDate,
    val statistics: VoteStatisticsResponse,
    val historicalAccuracy: Double? = null,
    val trend: String? = null,
    val insights: List<String> = emptyList()
)

/**
 * Daily voting summary
 */
data class DailyVotingSummaryResponse(
    val date: LocalDate,
    val totalVotes: Long,
    val totalUsers: Long,
    val mostVotedStock: String? = null,
    val mostVotedStockName: String? = null,
    val communityConsensus: Map<String, String> = emptyMap(),
    val topPerformers: List<LeaderboardEntryResponse> = emptyList()
)