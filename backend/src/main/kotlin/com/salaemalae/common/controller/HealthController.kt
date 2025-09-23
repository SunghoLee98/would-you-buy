package com.salaemalae.common.controller

import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.time.LocalDateTime

@RestController
@RequestMapping("/api/v1/health")
class HealthController {

    @GetMapping
    fun health(): ResponseEntity<Map<String, Any>> {
        return ResponseEntity.ok(
            mapOf(
                "status" to "UP",
                "timestamp" to LocalDateTime.now(),
                "service" to "salae-malae-auth"
            )
        )
    }

    @GetMapping("/ready")
    fun readiness(): ResponseEntity<Map<String, Any>> {
        // TODO: Add database connection check and external service checks
        return ResponseEntity.ok(
            mapOf("status" to "READY")
        )
    }
}