package com.salaemalae.config

import com.salaemalae.websocket.security.WebSocketAuthInterceptor
import org.springframework.context.annotation.Configuration
import org.springframework.messaging.simp.config.ChannelRegistration
import org.springframework.messaging.simp.config.MessageBrokerRegistry
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker
import org.springframework.web.socket.config.annotation.StompEndpointRegistry
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer

/**
 * WebSocket configuration for real-time voting updates
 *
 * Configures STOMP messaging over WebSocket for broadcasting
 * voting statistics and updates to connected clients.
 */
@Configuration
@EnableWebSocketMessageBroker
class WebSocketConfig(
    private val webSocketAuthInterceptor: WebSocketAuthInterceptor
) : WebSocketMessageBrokerConfigurer {

    /**
     * Configure message broker for pub/sub messaging
     */
    override fun configureMessageBroker(config: MessageBrokerRegistry) {
        // Enable simple broker for topic-based messaging
        config.enableSimpleBroker("/topic")

        // Set application destination prefix for @MessageMapping
        config.setApplicationDestinationPrefixes("/app")

        // Set user destination prefix for user-specific messages
        config.setUserDestinationPrefix("/user")
    }

    /**
     * Register STOMP endpoints for WebSocket connections
     */
    override fun registerStompEndpoints(registry: StompEndpointRegistry) {
        // Main WebSocket endpoint
        registry.addEndpoint("/ws/voting")
            .setAllowedOrigins("http://localhost:5001") // Frontend URL
            .withSockJS() // Enable SockJS fallback for browsers that don't support WebSocket

        // Additional endpoint without SockJS for native WebSocket clients
        registry.addEndpoint("/ws/voting")
            .setAllowedOrigins("http://localhost:5001")
    }

    /**
     * Configure client inbound channel interceptors for authentication
     */
    override fun configureClientInboundChannel(registration: ChannelRegistration) {
        registration.interceptors(webSocketAuthInterceptor)
    }
}