package com.salaemalae.websocket.service

import com.salaemalae.voting.service.VoteService
import com.salaemalae.websocket.dto.*
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.context.ApplicationContext
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Service
import java.time.LocalDate
import java.time.LocalDateTime
import java.util.*
import java.util.concurrent.ConcurrentHashMap

/**
 * Service for managing WebSocket broadcasting and subscriptions
 *
 * Handles subscription management, broadcasting voting updates,
 * and maintaining client connection state for real-time updates.
 */
@Service
class WebSocketBroadcastService(
    private val messagingTemplate: SimpMessagingTemplate,
    @Autowired private val applicationContext: ApplicationContext
) {
    private val logger = LoggerFactory.getLogger(WebSocketBroadcastService::class.java)

    // Subscription management
    private val subscriptions = ConcurrentHashMap<String, SubscriptionInfo>()
    private val stockSubscriptions = ConcurrentHashMap<String, MutableSet<String>>()

    /**
     * Subscription information for a WebSocket session
     */
    data class SubscriptionInfo(
        val sessionId: String,
        val userId: String?,
        val stockCodes: MutableSet<String>,
        var lastActivity: LocalDateTime
    )

    /**
     * Register a subscription for a session
     */
    fun registerSubscription(sessionId: String, stockCode: String, userId: String?) {
        logger.debug("Registering subscription: session={}, stock={}, user={}",
            sessionId, stockCode, userId)

        // Update session subscription info
        val subscription = subscriptions.getOrPut(sessionId) {
            SubscriptionInfo(
                sessionId = sessionId,
                userId = userId,
                stockCodes = mutableSetOf(),
                lastActivity = LocalDateTime.now()
            )
        }

        subscription.stockCodes.add(stockCode)
        subscription.lastActivity = LocalDateTime.now()

        // Update stock subscription mapping
        stockSubscriptions.getOrPut(stockCode) { mutableSetOf() }.add(sessionId)

        logger.info("Session {} subscribed to stock {}. Total subscriptions: {}",
            sessionId, stockCode, subscription.stockCodes.size)
    }

    /**
     * Remove a specific subscription
     */
    fun removeSubscription(sessionId: String, stockCode: String?) {
        val subscription = subscriptions[sessionId] ?: return

        if (stockCode != null) {
            subscription.stockCodes.remove(stockCode)
            stockSubscriptions[stockCode]?.remove(sessionId)

            logger.info("Removed subscription: session={}, stock={}", sessionId, stockCode)
        } else {
            // Remove all subscriptions for this session
            removeAllSubscriptions(sessionId)
        }
    }

    /**
     * Remove all subscriptions for a session
     */
    fun removeAllSubscriptions(sessionId: String) {
        val subscription = subscriptions.remove(sessionId) ?: return

        // Remove from stock subscription mappings
        subscription.stockCodes.forEach { stockCode ->
            stockSubscriptions[stockCode]?.remove(sessionId)
        }

        logger.info("Removed all subscriptions for session {}", sessionId)
    }

    /**
     * Update last activity for a session
     */
    fun updateLastActivity(sessionId: String) {
        subscriptions[sessionId]?.lastActivity = LocalDateTime.now()
    }

    /**
     * Get count of connected users
     */
    fun getConnectedUsersCount(): Int = subscriptions.size

    /**
     * Get VoteService lazily to avoid circular dependency
     */
    private fun getVoteService(): VoteService {
        return applicationContext.getBean(VoteService::class.java)
    }

    /**
     * Get current vote statistics for a stock
     */
    fun getCurrentVoteStatistics(stockCode: String, userId: String?): WebSocketMessage {
        return try {
            val voteService = getVoteService()
            val statistics = voteService.getVoteStatistics(stockCode)
            val hasUserVoted = userId?.let {
                voteService.hasUserVoted(UUID.fromString(it), stockCode)
            } ?: false

            val userVote = userId?.let {
                voteService.getUserVote(UUID.fromString(it), stockCode)
            }

            WebSocketMessageFactory.createVoteUpdate(
                stockCode = statistics.stockCode,
                stockName = getStockName(stockCode),
                votingDate = statistics.votingDate,
                upVotes = statistics.upVotes,
                downVotes = statistics.downVotes,
                totalVotes = statistics.totalVotes,
                upRatio = statistics.upPercentage,
                downRatio = statistics.downPercentage,
                hasUserVoted = hasUserVoted,
                userVoteType = userVote?.voteType?.name
            )
        } catch (e: Exception) {
            logger.error("Failed to get vote statistics for stock {}: {}", stockCode, e.message)
            WebSocketMessageFactory.createError(
                code = "STATISTICS_ERROR",
                message = "투표 통계를 가져오는 중 오류가 발생했습니다",
                details = e.message
            )
        }
    }

    /**
     * Broadcast voting update to all subscribers of a stock
     */
    fun broadcastVoteUpdate(
        stockCode: String,
        votingDate: LocalDate = LocalDate.now().plusDays(1)
    ) {
        logger.debug("Broadcasting vote update for stock {} on {}", stockCode, votingDate)

        try {
            val voteService = getVoteService()
            val statistics = voteService.getVoteStatistics(stockCode, votingDate)
            val stockName = getStockName(stockCode)

            // Create base message without user-specific data
            val baseMessage = WebSocketMessageFactory.createVoteUpdate(
                stockCode = statistics.stockCode,
                stockName = stockName,
                votingDate = statistics.votingDate,
                upVotes = statistics.upVotes,
                downVotes = statistics.downVotes,
                totalVotes = statistics.totalVotes,
                upRatio = statistics.upPercentage,
                downRatio = statistics.downPercentage
            )

            // Broadcast to all subscribers of this stock
            val subscribers = stockSubscriptions[stockCode] ?: emptySet()
            val allSubscribers = stockSubscriptions["ALL"] ?: emptySet()
            val allTargetSubscribers = subscribers + allSubscribers

            logger.info("Broadcasting to {} subscribers for stock {}",
                allTargetSubscribers.size, stockCode)

            allTargetSubscribers.forEach { sessionId ->
                val subscription = subscriptions[sessionId]
                if (subscription != null) {
                    // Create user-specific message if user is identified
                    val userSpecificMessage = if (subscription.userId != null) {
                        try {
                            val hasUserVoted = voteService.hasUserVoted(
                                UUID.fromString(subscription.userId), stockCode, votingDate
                            )
                            val userVote = voteService.getUserVote(
                                UUID.fromString(subscription.userId), stockCode, votingDate
                            )

                            baseMessage.copy(
                                data = (baseMessage.data as VoteUpdateData).copy(
                                    hasUserVoted = hasUserVoted,
                                    userVoteType = userVote?.voteType?.name
                                )
                            )
                        } catch (e: Exception) {
                            logger.warn("Failed to get user vote info for session {}: {}",
                                sessionId, e.message)
                            baseMessage
                        }
                    } else {
                        baseMessage
                    }

                    sendToSession(sessionId, userSpecificMessage)
                }
            }

            // Also broadcast to topic for any direct topic subscribers
            messagingTemplate.convertAndSend("/topic/votes/$stockCode", baseMessage)
            messagingTemplate.convertAndSend("/topic/votes/all", baseMessage)

        } catch (e: Exception) {
            logger.error("Failed to broadcast vote update for stock {}: {}", stockCode, e.message)

            // Broadcast error message
            val errorMessage = WebSocketMessageFactory.createError(
                code = "BROADCAST_ERROR",
                message = "투표 업데이트 전송 중 오류가 발생했습니다",
                details = e.message
            )
            messagingTemplate.convertAndSend("/topic/votes/$stockCode", errorMessage)
        }
    }

    /**
     * Send message to a specific session
     */
    fun sendToSession(sessionId: String, message: WebSocketMessage) {
        try {
            messagingTemplate.convertAndSendToUser(sessionId, "/queue/updates", message)
        } catch (e: Exception) {
            logger.error("Failed to send message to session {}: {}", sessionId, e.message)
        }
    }

    /**
     * Broadcast connection status update
     */
    fun broadcastConnectionStatus() {
        val message = WebSocketMessageFactory.createConnectionStatus(
            connected = true,
            connectedUsers = getConnectedUsersCount()
        )

        messagingTemplate.convertAndSend("/topic/votes/all", message)
    }

    /**
     * Clean up inactive sessions
     */
    fun cleanupInactiveSessions(maxInactiveMinutes: Long = 30) {
        val cutoffTime = LocalDateTime.now().minusMinutes(maxInactiveMinutes)
        val inactiveSessions = subscriptions.values
            .filter { it.lastActivity.isBefore(cutoffTime) }
            .map { it.sessionId }

        inactiveSessions.forEach { sessionId ->
            removeAllSubscriptions(sessionId)
            logger.info("Cleaned up inactive session {}", sessionId)
        }

        if (inactiveSessions.isNotEmpty()) {
            logger.info("Cleaned up {} inactive sessions", inactiveSessions.size)
        }
    }

    /**
     * Get stock name - placeholder implementation
     */
    private fun getStockName(stockCode: String): String {
        return when (stockCode) {
            "KOSPI" -> "코스피"
            "005930" -> "삼성전자"
            "000660" -> "SK하이닉스"
            "035420" -> "NAVER"
            "035720" -> "카카오"
            else -> stockCode
        }
    }
}