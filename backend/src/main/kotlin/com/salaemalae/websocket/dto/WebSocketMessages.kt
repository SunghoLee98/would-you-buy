package com.salaemalae.websocket.dto

import com.fasterxml.jackson.annotation.JsonFormat
import java.time.LocalDate
import java.time.LocalDateTime

/**
 * WebSocket message types for real-time communication
 */
enum class WebSocketMessageType {
    VOTE_UPDATE,        // Voting statistics update
    CONNECTION_STATUS,  // Connection status update
    ERROR,             // Error message
    HEARTBEAT         // Keep-alive message
}

/**
 * Base WebSocket message structure
 */
data class WebSocketMessage(
    val type: WebSocketMessageType,
    val data: Any?,
    val timestamp: LocalDateTime = LocalDateTime.now(),
    val error: String? = null
)

/**
 * Vote update data for broadcasting voting statistics
 */
data class VoteUpdateData(
    val stockCode: String,
    val stockName: String,
    @JsonFormat(pattern = "yyyy-MM-dd")
    val votingDate: LocalDate,
    val upVotes: Long,
    val downVotes: Long,
    val totalVotes: Long,
    val upRatio: Double,
    val downRatio: Double,
    val hasUserVoted: Boolean = false,
    val userVoteType: String? = null
)

/**
 * Connection status data
 */
data class ConnectionStatusData(
    val connected: Boolean,
    val connectedUsers: Int? = null,
    val serverTime: LocalDateTime = LocalDateTime.now()
)

/**
 * Error data for WebSocket error messages
 */
data class ErrorData(
    val code: String,
    val message: String,
    val details: String? = null
)

/**
 * Heartbeat data for keep-alive messages
 */
data class HeartbeatData(
    val serverTime: LocalDateTime = LocalDateTime.now(),
    val status: String = "OK"
)

/**
 * Subscription request for specific stock updates
 */
data class SubscriptionRequest(
    val stockCode: String?,
    val action: SubscriptionAction
)

/**
 * Subscription actions
 */
enum class SubscriptionAction {
    SUBSCRIBE,
    UNSUBSCRIBE
}

/**
 * Helper functions for creating WebSocket messages
 */
object WebSocketMessageFactory {

    fun createVoteUpdate(
        stockCode: String,
        stockName: String,
        votingDate: LocalDate,
        upVotes: Long,
        downVotes: Long,
        totalVotes: Long,
        upRatio: Double,
        downRatio: Double,
        hasUserVoted: Boolean = false,
        userVoteType: String? = null
    ): WebSocketMessage {
        val data = VoteUpdateData(
            stockCode = stockCode,
            stockName = stockName,
            votingDate = votingDate,
            upVotes = upVotes,
            downVotes = downVotes,
            totalVotes = totalVotes,
            upRatio = upRatio,
            downRatio = downRatio,
            hasUserVoted = hasUserVoted,
            userVoteType = userVoteType
        )
        return WebSocketMessage(
            type = WebSocketMessageType.VOTE_UPDATE,
            data = data
        )
    }

    fun createConnectionStatus(connected: Boolean, connectedUsers: Int? = null): WebSocketMessage {
        val data = ConnectionStatusData(
            connected = connected,
            connectedUsers = connectedUsers
        )
        return WebSocketMessage(
            type = WebSocketMessageType.CONNECTION_STATUS,
            data = data
        )
    }

    fun createError(code: String, message: String, details: String? = null): WebSocketMessage {
        val data = ErrorData(
            code = code,
            message = message,
            details = details
        )
        return WebSocketMessage(
            type = WebSocketMessageType.ERROR,
            data = data,
            error = message
        )
    }

    fun createHeartbeat(): WebSocketMessage {
        return WebSocketMessage(
            type = WebSocketMessageType.HEARTBEAT,
            data = HeartbeatData()
        )
    }
}