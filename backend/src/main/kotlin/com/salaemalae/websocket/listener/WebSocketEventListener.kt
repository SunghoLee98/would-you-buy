package com.salaemalae.websocket.listener

import com.salaemalae.websocket.controller.VotingWebSocketController
import com.salaemalae.websocket.service.WebSocketBroadcastService
import org.slf4j.LoggerFactory
import org.springframework.context.event.EventListener
import org.springframework.messaging.simp.stomp.StompHeaderAccessor
import org.springframework.stereotype.Component
import org.springframework.web.socket.messaging.SessionConnectedEvent
import org.springframework.web.socket.messaging.SessionDisconnectEvent
import org.springframework.web.socket.messaging.SessionSubscribeEvent
import org.springframework.web.socket.messaging.SessionUnsubscribeEvent

/**
 * WebSocket event listener for handling connection lifecycle events
 *
 * Manages user connections, subscriptions, and broadcasts connection
 * status updates to maintain real-time user presence information.
 */
@Component
class WebSocketEventListener(
    private val webSocketBroadcastService: WebSocketBroadcastService,
    private val votingWebSocketController: VotingWebSocketController
) {
    private val logger = LoggerFactory.getLogger(WebSocketEventListener::class.java)

    /**
     * Handle new WebSocket connections
     */
    @EventListener
    fun handleWebSocketConnectListener(event: SessionConnectedEvent) {
        val headerAccessor = StompHeaderAccessor.wrap(event.message)
        val sessionId = headerAccessor.sessionId
        val principal = headerAccessor.user

        logger.info("New WebSocket connection established: sessionId={}, user={}",
            sessionId, principal?.name)

        // Broadcast connection status update
        try {
            webSocketBroadcastService.broadcastConnectionStatus()
        } catch (e: Exception) {
            logger.error("Failed to broadcast connection status: {}", e.message)
        }
    }

    /**
     * Handle WebSocket disconnections
     */
    @EventListener
    fun handleWebSocketDisconnectListener(event: SessionDisconnectEvent) {
        val headerAccessor = StompHeaderAccessor.wrap(event.message)
        val sessionId = headerAccessor.sessionId
        val principal = headerAccessor.user

        logger.info("WebSocket connection closed: sessionId={}, user={}",
            sessionId, principal?.name)

        // Clean up subscriptions for disconnected session
        if (sessionId != null) {
            try {
                votingWebSocketController.handleDisconnection(sessionId)

                // Broadcast updated connection status
                webSocketBroadcastService.broadcastConnectionStatus()
            } catch (e: Exception) {
                logger.error("Failed to handle disconnection for session {}: {}", sessionId, e.message)
            }
        }
    }

    /**
     * Handle subscription events
     */
    @EventListener
    fun handleSubscriptionListener(event: SessionSubscribeEvent) {
        val headerAccessor = StompHeaderAccessor.wrap(event.message)
        val sessionId = headerAccessor.sessionId
        val destination = headerAccessor.destination
        val principal = headerAccessor.user

        logger.debug("New subscription: sessionId={}, destination={}, user={}",
            sessionId, destination, principal?.name)

        // Extract stock code from destination if it's a stock-specific subscription
        if (destination != null && destination.startsWith("/topic/votes/")) {
            val stockCode = destination.substringAfterLast("/")
            if (stockCode != "all" && sessionId != null) {
                logger.info("User {} subscribed to stock {} updates", principal?.name ?: "anonymous", stockCode)
            }
        }
    }

    /**
     * Handle unsubscription events
     */
    @EventListener
    fun handleUnsubscriptionListener(event: SessionUnsubscribeEvent) {
        val headerAccessor = StompHeaderAccessor.wrap(event.message)
        val sessionId = headerAccessor.sessionId
        val subscriptionId = headerAccessor.subscriptionId
        val principal = headerAccessor.user

        logger.debug("Unsubscribed: sessionId={}, subscriptionId={}, user={}",
            sessionId, subscriptionId, principal?.name)
    }
}