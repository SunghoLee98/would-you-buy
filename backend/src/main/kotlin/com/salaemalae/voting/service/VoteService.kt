package com.salaemalae.voting.service

import com.salaemalae.auth.domain.User
import com.salaemalae.auth.repository.UserRepository
import com.salaemalae.common.exception.ApiException
import com.salaemalae.voting.domain.Stock
import com.salaemalae.voting.domain.Vote
import com.salaemalae.voting.domain.VoteType
import com.salaemalae.voting.dto.*
import com.salaemalae.voting.repository.StockRepository
import com.salaemalae.voting.repository.VoteRepository
import com.salaemalae.websocket.service.WebSocketBroadcastService
import org.slf4j.LoggerFactory
import org.springframework.data.domain.PageRequest
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.LocalDateTime
import java.util.*

/**
 * Service for voting operations and statistics
 *
 * Handles user voting, vote validation, statistics calculation,
 * and leaderboard management for Korean stock predictions.
 */
@Service
@Transactional(readOnly = true)
class VoteService(
    private val voteRepository: VoteRepository,
    private val stockRepository: StockRepository,
    private val userRepository: UserRepository,
    private val stockService: StockService,
    private val webSocketBroadcastService: WebSocketBroadcastService
) {
    private val logger = LoggerFactory.getLogger(VoteService::class.java)

    /**
     * Submit a new vote for a user
     * Validates business rules and creates vote record
     */
    @Transactional
    fun submitVote(
        userId: UUID,
        request: SubmitVoteRequest
    ): VoteSubmissionResponse {
        logger.info("User {} submitting vote for stock {} on {}",
            userId, request.stockCode, request.votingDate)

        // Validate request
        val validationErrors = request.validate()
        if (validationErrors.isNotEmpty()) {
            throw ApiException("VALIDATION_ERROR", "잘못된 요청: ${validationErrors.joinToString(", ")}", HttpStatus.BAD_REQUEST)
        }

        // Get user
        val user = userRepository.findById(userId)
            .orElseThrow { ApiException("USER_NOT_FOUND", "사용자를 찾을 수 없습니다", HttpStatus.NOT_FOUND) }

        // Validate stock eligibility
        if (!stockService.isStockEligibleForVoting(request.stockCode)) {
            throw ApiException("STOCK_NOT_ELIGIBLE", "투표할 수 없는 주식입니다: ${request.stockCode}", HttpStatus.BAD_REQUEST)
        }

        // Check if user already voted for this stock on this date
        val existingVote = voteRepository.findByUserAndStockCodeAndVotingDate(
            user, request.stockCode, request.votingDate
        )

        if (existingVote.isPresent) {
            throw ApiException("VOTE_ALREADY_EXISTS", "이미 이 주식에 대해 투표했습니다", HttpStatus.CONFLICT)
        }

        // Validate voting window
        if (!isVotingWindowOpen(request.votingDate)) {
            throw ApiException("VOTING_WINDOW_CLOSED", "투표 시간이 아닙니다", HttpStatus.BAD_REQUEST)
        }

        // Create and save vote
        val vote = Vote.createVote(
            user = user,
            stockCode = request.stockCode,
            voteType = request.voteType,
            votingDate = request.votingDate,
            predictionReason = request.predictionReason,
            confidenceLevel = request.confidenceLevel
        )

        val savedVote = voteRepository.save(vote)

        // Get stock name for response
        val stockName = getStockName(request.stockCode)

        logger.info("Successfully created vote {} for user {} on stock {}",
            savedVote.id, userId, request.stockCode)

        // Broadcast vote update to WebSocket subscribers
        try {
            webSocketBroadcastService.broadcastVoteUpdate(request.stockCode, request.votingDate)
            logger.debug("Broadcasted vote update for stock {} after user {} vote",
                request.stockCode, userId)
        } catch (e: Exception) {
            logger.warn("Failed to broadcast vote update for stock {}: {}",
                request.stockCode, e.message)
        }

        return VoteSubmissionResponse(
            success = true,
            voteId = savedVote.id,
            message = "투표가 성공적으로 등록되었습니다",
            vote = UserVoteResponse.from(savedVote, stockName)
        )
    }

    /**
     * Update an existing vote
     * Allows users to change their vote before market opens
     */
    @Transactional
    fun updateVote(
        userId: UUID,
        voteId: UUID,
        request: UpdateVoteRequest
    ): VoteUpdateResponse {
        logger.info("User {} updating vote {}", userId, voteId)

        // Get vote
        val vote = voteRepository.findById(voteId)
            .orElseThrow { ApiException("VOTE_NOT_FOUND", "투표를 찾을 수 없습니다", HttpStatus.NOT_FOUND) }

        // Validate ownership
        if (vote.user.id != userId) {
            throw ApiException("VOTE_ACCESS_DENIED", "이 투표를 수정할 권한이 없습니다", HttpStatus.FORBIDDEN)
        }

        // Validate editability
        if (!vote.canBeModified()) {
            throw ApiException("VOTE_NOT_MODIFIABLE", "더 이상 수정할 수 없는 투표입니다", HttpStatus.BAD_REQUEST)
        }

        // Update vote
        val updatedVote = vote.copy(
            voteType = request.voteType,
            confidenceLevel = request.confidenceLevel,
            predictionReason = request.predictionReason,
            updatedAt = LocalDateTime.now()
        )

        val savedVote = voteRepository.save(updatedVote)

        // Get stock name for response
        val stockName = getStockName(vote.stockCode)

        logger.info("Successfully updated vote {} for user {}", voteId, userId)

        // Broadcast vote update to WebSocket subscribers
        try {
            webSocketBroadcastService.broadcastVoteUpdate(vote.stockCode, vote.votingDate)
            logger.debug("Broadcasted vote update for stock {} after user {} vote update",
                vote.stockCode, userId)
        } catch (e: Exception) {
            logger.warn("Failed to broadcast vote update for stock {}: {}",
                vote.stockCode, e.message)
        }

        return VoteUpdateResponse(
            success = true,
            message = "투표가 성공적으로 수정되었습니다",
            vote = UserVoteResponse.from(savedVote, stockName)
        )
    }

    /**
     * Get vote statistics for a specific stock and date
     * Returns community voting patterns and percentages
     */
    fun getVoteStatistics(
        stockCode: String,
        votingDate: LocalDate = LocalDate.now().plusDays(1)
    ): VoteStatisticsResponse {
        logger.debug("Getting vote statistics for stock {} on {}", stockCode, votingDate)

        val votes = voteRepository.findByStockCodeAndVotingDate(stockCode, votingDate)

        val upVotes = votes.count { it.voteType == VoteType.UP }
        val downVotes = votes.count { it.voteType == VoteType.DOWN }

        return VoteStatisticsResponse.create(
            stockCode = stockCode,
            votingDate = votingDate,
            upVotes = upVotes.toLong(),
            downVotes = downVotes.toLong()
        )
    }

    /**
     * Get user's voting history
     * Returns paginated list of user's votes with filtering options
     */
    fun getUserVotingHistory(
        userId: UUID,
        request: UserVotingHistoryRequest
    ): List<UserVoteResponse> {
        logger.debug("Getting voting history for user {} with page {}, size {}",
            userId, request.page, request.size)

        val user = userRepository.findById(userId)
            .orElseThrow { ApiException("USER_NOT_FOUND", "사용자를 찾을 수 없습니다", HttpStatus.NOT_FOUND) }

        val pageable = PageRequest.of(request.page, request.size)
        val votePage = voteRepository.findUserVotingHistory(user, pageable)

        return votePage.content.map { vote ->
            val stockName = getStockName(vote.stockCode)
            UserVoteResponse.from(vote, stockName)
        }.also { votes ->
            logger.info("Retrieved {} votes for user {} (page {}/{})",
                votes.size, userId, request.page, votePage.totalPages)
        }
    }

    /**
     * Get user's votes for today
     * Returns all votes for current voting date
     */
    fun getUserTodayVotes(userId: UUID): List<UserVoteResponse> {
        logger.debug("Getting today's votes for user {}", userId)

        val user = userRepository.findById(userId)
            .orElseThrow { ApiException("USER_NOT_FOUND", "사용자를 찾을 수 없습니다", HttpStatus.NOT_FOUND) }

        val today = LocalDate.now().plusDays(1) // Tomorrow's prediction
        val votes = voteRepository.findByUserAndVotingDate(user, today)

        return votes.map { vote ->
            val stockName = getStockName(vote.stockCode)
            UserVoteResponse.from(vote, stockName)
        }.also { todayVotes ->
            logger.info("User {} has {} votes for today", userId, todayVotes.size)
        }
    }

    /**
     * Check if user has voted for specific stock on date
     * Quick validation for UI state management
     */
    fun hasUserVoted(
        userId: UUID,
        stockCode: String,
        votingDate: LocalDate = LocalDate.now().plusDays(1)
    ): Boolean {
        val user = userRepository.findById(userId)
            .orElse(null) ?: return false

        return voteRepository.existsByUserAndStockCodeAndVotingDate(user, stockCode, votingDate)
    }

    /**
     * Get user's vote for specific stock and date
     * Returns existing vote if found
     */
    fun getUserVote(
        userId: UUID,
        stockCode: String,
        votingDate: LocalDate = LocalDate.now().plusDays(1)
    ): UserVoteResponse? {
        val user = userRepository.findById(userId)
            .orElse(null) ?: return null

        val vote = voteRepository.findByUserAndStockCodeAndVotingDate(user, stockCode, votingDate)
            .orElse(null) ?: return null

        val stockName = getStockName(stockCode)
        return UserVoteResponse.from(vote, stockName)
    }

    /**
     * Get user statistics
     * Returns comprehensive user performance metrics
     */
    fun getUserStatistics(userId: UUID): UserStatsResponse {
        logger.debug("Calculating statistics for user {}", userId)

        val user = userRepository.findById(userId)
            .orElseThrow { ApiException("USER_NOT_FOUND", "사용자를 찾을 수 없습니다", HttpStatus.NOT_FOUND) }

        val totalVotes = voteRepository.countVotesByUser(user)
        val correctVotes = voteRepository.countCorrectVotesByUser(user)
        val accuracyRate = if (totalVotes > 0) (correctVotes.toDouble() / totalVotes * 100) else 0.0

        // Calculate streaks
        val recentVotes = voteRepository.findRecentCalculatedVotesByUser(user)
        val (currentStreak, longestStreak) = calculateStreaks(recentVotes)

        // Calculate total points
        val totalPoints = recentVotes
            .filter { it.isResultCalculated }
            .sumOf { it.pointsEarned ?: 0 }

        return UserStatsResponse(
            totalPredictions = totalVotes,
            correctPredictions = correctVotes,
            accuracyRate = accuracyRate,
            totalPoints = totalPoints,
            currentStreak = currentStreak,
            longestStreak = longestStreak
        ).also { _ ->
            logger.info("User {} stats: {}/{} correct ({}%), {} points, streak {}/{}",
                userId, correctVotes, totalVotes, String.format("%.1f", accuracyRate),
                totalPoints, currentStreak, longestStreak)
        }
    }

    /**
     * Get voting dashboard data
     * Returns complete dashboard with stocks, statistics, and user votes
     */
    fun getVotingDashboard(
        userId: UUID?,
        request: VotingDashboardRequest
    ): VotingDashboardResponse {
        logger.debug("Building voting dashboard for date {}", request.date)

        // Get all active stocks
        val stocks = stockService.getActiveStocksForVoting()

        // Get vote statistics for each stock
        val dashboardItems = stocks.map { stock ->
            val voteStats = getVoteStatistics(stock.code, request.date)
            val userVote = userId?.let { getUserVote(it, stock.code, request.date) }

            VotingDashboardItem(
                stock = stock,
                voteStatistics = voteStats,
                userVote = userVote
            )
        }

        val votingWindowOpen = isVotingWindowOpen(request.date)
        val marketStatus = getMarketStatus()

        // Find KOSPI item
        val kospiItem = dashboardItems.find { it.stock.code == "KOSPI" && it.stock.isPrimary }
            ?: throw ApiException("KOSPI_NOT_FOUND", "KOSPI 정보를 찾을 수 없습니다", HttpStatus.INTERNAL_SERVER_ERROR)

        // Get featured stocks (non-primary)
        val featuredStocks = dashboardItems.filter { !it.stock.isPrimary }

        return VotingDashboardResponse(
            votingDate = request.date,
            items = dashboardItems,
            totalActiveStocks = stocks.size,
            votingWindowOpen = votingWindowOpen,
            marketStatus = marketStatus,
            kospiItem = kospiItem,
            featuredStocks = featuredStocks
        )
    }

    /**
     * Process vote results for a specific date
     * Called after market close to calculate vote outcomes
     */
    @Transactional
    fun processVoteResults(
        targetDate: LocalDate,
        stockResults: Map<String, VoteType>
    ): Int {
        logger.info("Processing vote results for date {}", targetDate)

        val votesToProcess = voteRepository.findVotesForDateNeedingCalculation(targetDate)
        var processedCount = 0

        votesToProcess.forEach { vote ->
            val actualResult = stockResults[vote.stockCode]
            if (actualResult != null) {
                val updatedVote = if (vote.voteType == actualResult) {
                    vote.markAsCorrect()
                } else {
                    vote.markAsIncorrect()
                }

                voteRepository.save(updatedVote)
                processedCount++

                logger.debug("Processed vote {} for stock {}: {} -> {} ({})",
                    vote.id, vote.stockCode, vote.voteType, actualResult,
                    if (vote.voteType == actualResult) "CORRECT" else "INCORRECT")
            }
        }

        logger.info("Processed {} vote results for date {}", processedCount, targetDate)
        return processedCount
    }

    /**
     * Check if voting window is open for given date
     * Voting allowed from market close (3:30 PM) until market open (9:00 AM) next day
     */
    private fun isVotingWindowOpen(votingDate: LocalDate): Boolean {
        val now = LocalDateTime.now()
        val today = now.toLocalDate()

        return when {
            // Voting for tomorrow is always open after market close today
            votingDate.isAfter(today) -> {
                now.hour >= MarketHours.MARKET_CLOSE_HOUR ||
                (now.hour == MarketHours.MARKET_CLOSE_HOUR &&
                 now.minute >= MarketHours.MARKET_CLOSE_MINUTE)
            }
            // Voting for today closes at market open
            votingDate.isEqual(today) -> {
                now.hour < MarketHours.MARKET_OPEN_HOUR
            }
            // Past dates are closed
            else -> false
        }
    }

    /**
     * Get current market status
     */
    private fun getMarketStatus(): String {
        val now = LocalDateTime.now()
        val currentHour = now.hour
        val currentMinute = now.minute

        return when {
            currentHour < MarketHours.MARKET_OPEN_HOUR -> "시장 개장 전"
            currentHour < MarketHours.MARKET_CLOSE_HOUR -> "시장 개장 중"
            currentHour == MarketHours.MARKET_CLOSE_HOUR &&
            currentMinute < MarketHours.MARKET_CLOSE_MINUTE -> "시장 개장 중"
            else -> "시장 폐장"
        }
    }

    /**
     * Calculate user's current and longest streaks
     */
    private fun calculateStreaks(votes: List<Vote>): Pair<Int, Int> {
        if (votes.isEmpty()) return Pair(0, 0)

        var currentStreak = 0
        var longestStreak = 0
        var tempStreak = 0

        // Process votes from most recent to oldest
        for (vote in votes) {
            if (vote.isCorrect == true) {
                tempStreak++
                if (currentStreak == 0) currentStreak = tempStreak
                longestStreak = maxOf(longestStreak, tempStreak)
            } else {
                if (currentStreak == 0) currentStreak = 0
                tempStreak = 0
            }
        }

        return Pair(currentStreak, longestStreak)
    }

    /**
     * Get stock Korean name by code
     */
    private fun getStockName(stockCode: String): String {
        return try {
            val stock = stockRepository.findByCode(stockCode).orElse(null)
            stock?.koreanName ?: stockCode
        } catch (e: Exception) {
            logger.warn("Failed to get stock name for code {}: {}", stockCode, e.message)
            stockCode
        }
    }
}