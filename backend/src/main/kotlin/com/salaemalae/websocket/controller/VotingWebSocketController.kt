package com.salaemalae.websocket.controller

import com.salaemalae.websocket.dto.*
import com.salaemalae.websocket.service.WebSocketBroadcastService
import org.slf4j.LoggerFactory
import org.springframework.messaging.handler.annotation.MessageMapping
import org.springframework.messaging.handler.annotation.Payload
import org.springframework.messaging.simp.SimpMessageHeaderAccessor
import org.springframework.messaging.simp.annotation.SubscribeMapping
import org.springframework.stereotype.Controller
import java.security.Principal

/**
 * WebSocket controller for handling real-time voting communications
 *
 * Manages client subscriptions, broadcasts voting updates,
 * and handles WebSocket message routing for the voting system.
 */
@Controller
class VotingWebSocketController(
    private val webSocketBroadcastService: WebSocketBroadcastService
) {
    private val logger = LoggerFactory.getLogger(VotingWebSocketController::class.java)

    /**
     * Handle client subscription to all voting updates
     * Called when client subscribes to /topic/votes/all
     */
    @SubscribeMapping("/votes/all")
    fun subscribeToAllVotes(headerAccessor: SimpMessageHeaderAccessor): WebSocketMessage {
        val sessionId = headerAccessor.sessionId ?: "unknown"
        val principal = headerAccessor.user

        logger.info("Client {} subscribed to all voting updates", sessionId)

        // Register subscription
        webSocketBroadcastService.registerSubscription(sessionId, "ALL", principal?.name ?: "anonymous")

        // Send welcome message with connection status
        return WebSocketMessageFactory.createConnectionStatus(
            connected = true,
            connectedUsers = webSocketBroadcastService.getConnectedUsersCount()
        )
    }

    /**
     * Handle client subscription to specific stock voting updates
     * Called when client subscribes to /topic/votes/{stockCode}
     */
    @SubscribeMapping("/votes/{stockCode}")
    fun subscribeToStockVotes(
        @Payload stockCode: String,
        headerAccessor: SimpMessageHeaderAccessor
    ): WebSocketMessage {
        val sessionId = headerAccessor.sessionId ?: "unknown"
        val principal = headerAccessor.user

        logger.info("Client {} subscribed to voting updates for stock {}", sessionId, stockCode)

        // Register subscription for specific stock
        webSocketBroadcastService.registerSubscription(sessionId, stockCode, principal?.name ?: "anonymous")

        // Send current voting statistics for the stock
        return try {
            webSocketBroadcastService.getCurrentVoteStatistics(stockCode, principal?.name)
        } catch (e: Exception) {
            logger.error("Failed to get current statistics for stock {}: {}", stockCode, e.message)
            WebSocketMessageFactory.createError(
                code = "SUBSCRIPTION_ERROR",
                message = "구독 중 오류가 발생했습니다",
                details = e.message
            )
        }
    }

    /**
     * Handle subscription requests from clients
     * Called when client sends message to /app/subscribe
     */
    @MessageMapping("/subscribe")
    fun handleSubscription(
        @Payload request: SubscriptionRequest,
        headerAccessor: SimpMessageHeaderAccessor
    ) {
        val sessionId = headerAccessor.sessionId ?: "unknown"
        val principal = headerAccessor.user

        logger.info("Client {} requesting {} for stock {}",
            sessionId, request.action, request.stockCode ?: "ALL")

        when (request.action) {
            SubscriptionAction.SUBSCRIBE -> {
                val stockCode = request.stockCode ?: "ALL"
                webSocketBroadcastService.registerSubscription(sessionId, stockCode, principal?.name ?: "anonymous")

                // Send current statistics if subscribing to specific stock
                if (stockCode != "ALL") {
                    try {
                        val currentStats = webSocketBroadcastService.getCurrentVoteStatistics(
                            stockCode, principal?.name
                        )
                        webSocketBroadcastService.sendToSession(sessionId, currentStats)
                    } catch (e: Exception) {
                        logger.error("Failed to send current statistics to session {}: {}",
                            sessionId, e.message)
                    }
                }
            }
            SubscriptionAction.UNSUBSCRIBE -> {
                webSocketBroadcastService.removeSubscription(sessionId, request.stockCode)
            }
        }
    }

    /**
     * Handle heartbeat messages from clients
     * Called when client sends message to /app/heartbeat
     */
    @MessageMapping("/heartbeat")
    fun handleHeartbeat(headerAccessor: SimpMessageHeaderAccessor): WebSocketMessage {
        val sessionId = headerAccessor.sessionId ?: "unknown"
        logger.debug("Received heartbeat from client {}", sessionId)

        // Update last activity for session
        // TODO: Implement updateLastActivity method in WebSocketBroadcastService
        // webSocketBroadcastService.updateLastActivity(sessionId)

        return WebSocketMessageFactory.createHeartbeat()
    }

    /**
     * Handle client disconnection
     * This would be called by WebSocket event handlers
     */
    fun handleDisconnection(sessionId: String) {
        logger.info("Client {} disconnected", sessionId)
        webSocketBroadcastService.removeAllSubscriptions(sessionId)
    }
}