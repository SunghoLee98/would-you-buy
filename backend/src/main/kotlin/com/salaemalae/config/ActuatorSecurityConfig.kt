package com.salaemalae.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.core.annotation.Order
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.web.SecurityFilterChain
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty

/**
 * Actuator 엔드포인트 보안 설정
 * 프로덕션 환경에서 Actuator 엔드포인트에 대한 접근을 제한합니다.
 */
@Configuration
@EnableWebSecurity
@Order(1) // 높은 우선순위로 Actuator 경로를 먼저 처리
class ActuatorSecurityConfig {

    /**
     * Actuator 엔드포인트용 보안 필터 체인
     * - /actuator/health와 /actuator/info는 공개
     * - /actuator/prometheus는 내부 네트워크에서만 접근 가능 (Prometheus 서버용)
     * - 기타 엔드포인트는 인증 필요
     */
    @Bean
    @Order(1)
    fun actuatorSecurityFilterChain(http: HttpSecurity): SecurityFilterChain {
        return http
            .securityMatcher("/actuator/**")
            .authorizeHttpRequests { authorize ->
                authorize
                    // health와 info는 공개 (기본 상태 체크용)
                    .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                    // prometheus는 내부 IP에서만 접근 가능
                    // 실제 환경에서는 네트워크 레벨에서 추가 보안 필요
                    .requestMatchers("/actuator/prometheus").hasIpAddress("127.0.0.1")
                    // 기타 모든 actuator 엔드포인트는 ADMIN 권한 필요
                    .anyRequest().hasRole("ADMIN")
            }
            .sessionManagement { session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            }
            .csrf { csrf ->
                csrf.disable() // Actuator 엔드포인트는 CSRF 비활성화
            }
            .build()
    }
}

/**
 * 프로덕션 환경 IP 접근 제한 설정
 * application-prod.yml에서 활성화됨
 */
@Configuration
@ConditionalOnProperty(name = ["spring.profiles.active"], havingValue = "prod")
class ProductionActuatorSecurityConfig {

    companion object {
        // 허용된 IP 주소 목록 (Prometheus, 모니터링 서버 등)
        private val ALLOWED_IPS = listOf(
            "127.0.0.1",
            "::1", // IPv6 localhost
            "10.0.0.0/8", // 내부 네트워크
            "172.16.0.0/12", // Docker 네트워크
            "192.168.0.0/16" // 사설 네트워크
        )
    }

    /**
     * IP 기반 접근 제어를 위한 커스텀 설정
     * 프로덕션 환경에서는 화이트리스트 IP만 /actuator/prometheus 접근 가능
     */
    fun configureIpWhitelist(): List<String> {
        return ALLOWED_IPS
    }
}