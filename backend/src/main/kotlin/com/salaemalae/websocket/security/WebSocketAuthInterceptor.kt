package com.salaemalae.websocket.security

import com.salaemalae.auth.security.JwtTokenProvider
import org.slf4j.LoggerFactory
import org.springframework.messaging.Message
import org.springframework.messaging.MessageChannel
import org.springframework.messaging.simp.stomp.StompCommand
import org.springframework.messaging.simp.stomp.StompHeaderAccessor
import org.springframework.messaging.support.ChannelInterceptor
import org.springframework.messaging.support.MessageHeaderAccessor
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.stereotype.Component

/**
 * WebSocket authentication interceptor
 *
 * Intercepts WebSocket messages to authenticate users via JWT tokens
 * and set the security context for WebSocket sessions.
 */
@Component
class WebSocketAuthInterceptor(
    private val jwtTokenProvider: JwtTokenProvider
) : ChannelInterceptor {

    private val logger = LoggerFactory.getLogger(WebSocketAuthInterceptor::class.java)

    override fun preSend(message: Message<*>, channel: MessageChannel): Message<*>? {
        val accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor::class.java)

        if (accessor != null && StompCommand.CONNECT == accessor.command) {
            // Extract JWT token from CONNECT frame
            val token = extractTokenFromHeaders(accessor)

            if (token != null && jwtTokenProvider.validateToken(token)) {
                // Get user information from token
                val userId = jwtTokenProvider.getUserIdFromToken(token)
                val username = jwtTokenProvider.getUsernameFromToken(token)
                val role = jwtTokenProvider.getRoleFromToken(token)

                if (userId != null && username != null) {
                    // Create authentication object
                    val authorities = listOf(SimpleGrantedAuthority("ROLE_${role ?: "USER"}"))
                    val authentication = UsernamePasswordAuthenticationToken(
                        userId, // Use userId as principal
                        null,
                        authorities
                    )

                    // Set user in the STOMP session
                    accessor.user = authentication

                    logger.info("WebSocket authenticated user: {} ({})", username, userId)
                } else {
                    logger.warn("Invalid JWT token format for WebSocket connection")
                }
            } else {
                logger.debug("WebSocket connection without valid JWT token - allowing anonymous access")
                // Allow anonymous connections for public voting data
            }
        }

        return message
    }

    /**
     * Extract JWT token from WebSocket headers
     * Supports both Authorization header and custom token parameter
     */
    private fun extractTokenFromHeaders(accessor: StompHeaderAccessor): String? {
        // Try Authorization header first
        val authHeader = accessor.getFirstNativeHeader("Authorization")
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7)
        }

        // Try custom token parameter
        val tokenParam = accessor.getFirstNativeHeader("token")
        if (tokenParam != null) {
            return tokenParam
        }

        // Try query parameter style (for SockJS compatibility)
        val accessToken = accessor.getFirstNativeHeader("access_token")
        if (accessToken != null) {
            return accessToken
        }

        return null
    }
}