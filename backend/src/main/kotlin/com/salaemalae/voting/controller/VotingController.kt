package com.salaemalae.voting.controller

import com.salaemalae.auth.security.CustomUserDetails
import com.salaemalae.common.response.ApiResponse
import com.salaemalae.voting.dto.*
import com.salaemalae.voting.service.StockService
import com.salaemalae.voting.service.VoteService
import jakarta.validation.Valid
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*
import java.time.LocalDate
import java.util.*

/**
 * REST Controller for voting operations
 *
 * Provides endpoints for Korean stock voting system including:
 * - Stock information and voting dashboard
 * - User voting operations (submit, update, view)
 * - Vote statistics and community data
 * - User statistics and leaderboards
 *
 * All responses use Korean localization for Korean market.
 */
@RestController
@RequestMapping("/api/v1")
class VotingController(
    private val voteService: VoteService,
    private val stockService: StockService
) {
    private val logger = LoggerFactory.getLogger(VotingController::class.java)

    // ===================================================================
    // Stock Information Endpoints
    // ===================================================================

    /**
     * GET /api/stocks/voting
     * Get votable stocks with KOSPI highlight for voting dashboard
     */
    @GetMapping("/stocks/voting")
    fun getVotableStocks(): ResponseEntity<ApiResponse<VotingDashboardResponse>> {
        logger.info("Fetching votable stocks for dashboard")

        val dashboard = voteService.getVotingDashboard(
            userId = null,
            request = VotingDashboardRequest()
        )

        return ResponseEntity.ok(
            ApiResponse.success(dashboard, "투표 가능한 주식 목록을 조회했습니다")
        )
    }

    /**
     * GET /api/stocks/voting (authenticated)
     * Get votable stocks with user's votes included
     */
    @GetMapping("/stocks/voting/dashboard")
    fun getVotingDashboard(
        @AuthenticationPrincipal userDetails: CustomUserDetails,
        @RequestParam(defaultValue = "") date: String
    ): ResponseEntity<ApiResponse<VotingDashboardResponse>> {
        logger.info("User {} fetching voting dashboard", userDetails.id)

        val votingDate = if (date.isBlank()) {
            LocalDate.now().plusDays(1)
        } else {
            LocalDate.parse(date)
        }

        val dashboard = voteService.getVotingDashboard(
            userId = userDetails.id,
            request = VotingDashboardRequest(date = votingDate)
        )

        return ResponseEntity.ok(
            ApiResponse.success(dashboard, "투표 대시보드를 조회했습니다")
        )
    }

    /**
     * GET /api/stocks/{stockCode}
     * Get detailed information for specific stock
     */
    @GetMapping("/stocks/{stockCode}")
    fun getStockInfo(
        @PathVariable stockCode: String
    ): ResponseEntity<ApiResponse<StockInfoResponse>> {
        logger.info("Fetching stock info for: {}", stockCode)

        val stockInfo = stockService.getStockByCode(stockCode)

        return ResponseEntity.ok(
            ApiResponse.success(stockInfo, "주식 정보를 조회했습니다")
        )
    }

    // ===================================================================
    // Vote Statistics Endpoints
    // ===================================================================

    /**
     * GET /api/votes/statistics
     * Get community voting statistics for all stocks or specific stock
     */
    @GetMapping("/votes/statistics")
    fun getVoteStatistics(
        @RequestParam(required = false) stockCode: String?,
        @RequestParam(required = false) date: String?
    ): ResponseEntity<ApiResponse<Any>> {
        logger.info("Fetching vote statistics for stock: {} on date: {}", stockCode, date)

        val votingDate = date?.let { LocalDate.parse(it) } ?: LocalDate.now().plusDays(1)

        return if (stockCode != null) {
            // Get statistics for specific stock
            val statistics = voteService.getVoteStatistics(stockCode, votingDate)
            ResponseEntity.ok(
                ApiResponse.success(statistics, "투표 통계를 조회했습니다")
            )
        } else {
            // Get statistics for all stocks (dashboard format)
            val dashboard = voteService.getVotingDashboard(
                userId = null,
                request = VotingDashboardRequest(date = votingDate)
            )
            ResponseEntity.ok(
                ApiResponse.success(dashboard.items.map { it.voteStatistics }, "전체 투표 통계를 조회했습니다")
            )
        }
    }

    // ===================================================================
    // User Voting Endpoints
    // ===================================================================

    /**
     * POST /api/votes
     * Submit user vote for stock prediction
     */
    @PostMapping("/votes")
    fun submitVote(
        @AuthenticationPrincipal userDetails: CustomUserDetails,
        @Valid @RequestBody request: SubmitVoteRequest
    ): ResponseEntity<ApiResponse<VoteSubmissionResponse>> {
        logger.info("User {} submitting vote for stock {}: {}",
            userDetails.id, request.stockCode, request.voteType)

        val response = voteService.submitVote(userDetails.id, request)

        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(ApiResponse.success(response, "투표가 성공적으로 등록되었습니다"))
    }

    /**
     * PUT /api/votes/{voteId}
     * Update existing user vote
     */
    @PutMapping("/votes/{voteId}")
    fun updateVote(
        @AuthenticationPrincipal userDetails: CustomUserDetails,
        @PathVariable voteId: UUID,
        @Valid @RequestBody request: UpdateVoteRequest
    ): ResponseEntity<ApiResponse<VoteUpdateResponse>> {
        logger.info("User {} updating vote {}", userDetails.id, voteId)

        val response = voteService.updateVote(userDetails.id, voteId, request)

        return ResponseEntity.ok(
            ApiResponse.success(response, "투표가 성공적으로 수정되었습니다")
        )
    }

    /**
     * GET /api/votes/my-votes
     * Get user's voting history with pagination
     */
    @GetMapping("/votes/my-votes")
    fun getUserVotes(
        @AuthenticationPrincipal userDetails: CustomUserDetails,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(required = false) stockCode: String?,
        @RequestParam(required = false) startDate: String?,
        @RequestParam(required = false) endDate: String?
    ): ResponseEntity<ApiResponse<List<UserVoteResponse>>> {
        logger.info("User {} fetching vote history (page: {}, size: {})", userDetails.id, page, size)

        val request = UserVotingHistoryRequest(
            page = page,
            size = size,
            stockCode = stockCode,
            startDate = startDate?.let { LocalDate.parse(it) },
            endDate = endDate?.let { LocalDate.parse(it) }
        )

        val votes = voteService.getUserVotingHistory(userDetails.id, request)

        return ResponseEntity.ok(
            ApiResponse.success(votes, "투표 내역을 조회했습니다")
        )
    }

    /**
     * GET /api/votes/my-votes/today
     * Get user's votes for today (current voting date)
     */
    @GetMapping("/votes/my-votes/today")
    fun getUserTodayVotes(
        @AuthenticationPrincipal userDetails: CustomUserDetails
    ): ResponseEntity<ApiResponse<List<UserVoteResponse>>> {
        logger.info("User {} fetching today's votes", userDetails.id)

        val votes = voteService.getUserTodayVotes(userDetails.id)

        return ResponseEntity.ok(
            ApiResponse.success(votes, "오늘의 투표 현황을 조회했습니다")
        )
    }

    /**
     * GET /api/votes/check
     * Check if user has voted for specific stock
     */
    @GetMapping("/votes/check")
    fun checkUserVote(
        @AuthenticationPrincipal userDetails: CustomUserDetails,
        @RequestParam stockCode: String,
        @RequestParam(required = false) date: String?
    ): ResponseEntity<ApiResponse<Map<String, Any?>>> {
        logger.debug("Checking vote for user {} on stock {}", userDetails.id, stockCode)

        val votingDate = date?.let { LocalDate.parse(it) } ?: LocalDate.now().plusDays(1)
        val hasVoted = voteService.hasUserVoted(userDetails.id, stockCode, votingDate)
        val userVote = if (hasVoted) {
            voteService.getUserVote(userDetails.id, stockCode, votingDate)
        } else null

        val response: Map<String, Any?> = mapOf(
            "hasVoted" to hasVoted,
            "vote" to userVote
        )

        return ResponseEntity.ok(
            ApiResponse.success(response, "투표 상태를 확인했습니다")
        )
    }

    // ===================================================================
    // User Statistics Endpoints
    // ===================================================================

    /**
     * GET /api/votes/my-stats
     * Get user's voting statistics and performance metrics
     */
    @GetMapping("/votes/my-stats")
    fun getUserStatistics(
        @AuthenticationPrincipal userDetails: CustomUserDetails
    ): ResponseEntity<ApiResponse<UserStatsResponse>> {
        logger.info("User {} fetching statistics", userDetails.id)

        val stats = voteService.getUserStatistics(userDetails.id)

        return ResponseEntity.ok(
            ApiResponse.success(stats, "사용자 통계를 조회했습니다")
        )
    }

    // ===================================================================
    // System Information Endpoints
    // ===================================================================

    /**
     * GET /api/voting/status
     * Get current voting system status and market information
     */
    @GetMapping("/voting/status")
    fun getVotingStatus(): ResponseEntity<ApiResponse<Map<String, Any>>> {
        logger.debug("Fetching voting system status")

        val now = LocalDate.now()
        val votingDate = now.plusDays(1)

        val status = mapOf(
            "currentDate" to now,
            "votingDate" to votingDate,
            "marketStatus" to getMarketStatus(),
            "votingWindowOpen" to isVotingWindowOpen(),
            "systemTime" to java.time.LocalDateTime.now()
        )

        return ResponseEntity.ok(
            ApiResponse.success(status, "투표 시스템 상태를 조회했습니다")
        )
    }

    // ===================================================================
    // Guest/Public Endpoints
    // ===================================================================

    /**
     * GET /api/public/stocks
     * Get basic stock information for guest users
     */
    @GetMapping("/public/stocks")
    fun getPublicStocks(): ResponseEntity<ApiResponse<List<StockInfoResponse>>> {
        logger.info("Fetching public stock information for guest users")

        val stocks = stockService.getActiveStocksForVoting()

        return ResponseEntity.ok(
            ApiResponse.success(stocks, "주식 정보를 조회했습니다")
        )
    }

    /**
     * GET /api/public/votes/statistics/{stockCode}
     * Get public vote statistics for specific stock
     */
    @GetMapping("/public/votes/statistics/{stockCode}")
    fun getPublicVoteStatistics(
        @PathVariable stockCode: String,
        @RequestParam(required = false) date: String?
    ): ResponseEntity<ApiResponse<VoteStatisticsResponse>> {
        logger.info("Fetching public vote statistics for stock: {}", stockCode)

        val votingDate = date?.let { LocalDate.parse(it) } ?: LocalDate.now().plusDays(1)
        val statistics = voteService.getVoteStatistics(stockCode, votingDate)

        return ResponseEntity.ok(
            ApiResponse.success(statistics, "투표 통계를 조회했습니다")
        )
    }

    // ===================================================================
    // Helper Methods
    // ===================================================================

    /**
     * Get current market status
     */
    private fun getMarketStatus(): String {
        val now = java.time.LocalDateTime.now()
        val currentHour = now.hour
        val currentMinute = now.minute

        return when {
            currentHour < 9 -> "시장 개장 전"
            currentHour < 15 -> "시장 개장 중"
            currentHour == 15 && currentMinute < 30 -> "시장 개장 중"
            else -> "시장 폐장"
        }
    }

    /**
     * Check if voting window is currently open
     */
    private fun isVotingWindowOpen(): Boolean {
        val now = java.time.LocalDateTime.now()
        val currentHour = now.hour
        val currentMinute = now.minute

        // Voting window: after market close (3:30 PM) until market open (9:00 AM) next day
        return currentHour >= 15 && (currentHour > 15 || currentMinute >= 30) || currentHour < 9
    }

    // ===================================================================
    // Exception Handling
    // ===================================================================

    /**
     * Handle validation errors with Korean messages
     */
    @ExceptionHandler(jakarta.validation.ConstraintViolationException::class)
    fun handleValidationException(
        ex: jakarta.validation.ConstraintViolationException
    ): ResponseEntity<ApiResponse<Nothing>> {
        val errors = ex.constraintViolations.map { it.message }
        val message = "입력값이 올바르지 않습니다: ${errors.joinToString(", ")}"

        logger.warn("Validation error: {}", message)

        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(ApiResponse.error(message))
    }

    /**
     * Handle general exceptions
     */
    @ExceptionHandler(Exception::class)
    fun handleGeneralException(ex: Exception): ResponseEntity<ApiResponse<Nothing>> {
        logger.error("Unexpected error in voting controller", ex)

        return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ApiResponse.error("서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요."))
    }
}