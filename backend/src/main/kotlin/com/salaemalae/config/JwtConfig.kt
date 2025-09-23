package com.salaemalae.config

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.context.annotation.Configuration

@Configuration
@ConfigurationProperties(prefix = "jwt")
data class JwtConfig(
    var secret: String = "",
    var accessTokenExpiration: Long = 3600000, // 1 hour
    var refreshTokenExpiration: Long = 2592000000 // 30 days
)