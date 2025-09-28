package com.salaemalae.config

import com.salaemalae.metrics.MetricsInterceptor
import org.springframework.context.annotation.Configuration
import org.springframework.web.servlet.config.annotation.InterceptorRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer

/**
 * 메트릭 수집 설정
 * MetricsInterceptor를 등록하여 모든 API 요청에 대한 메트릭을 자동 수집합니다.
 */
@Configuration
class MetricsConfig(
    private val metricsInterceptor: MetricsInterceptor
) : WebMvcConfigurer {

    override fun addInterceptors(registry: InterceptorRegistry) {
        registry.addInterceptor(metricsInterceptor)
            .addPathPatterns("/api/**")
            .excludePathPatterns(
                "/api/health/**",
                "/actuator/**"
            )
    }
}