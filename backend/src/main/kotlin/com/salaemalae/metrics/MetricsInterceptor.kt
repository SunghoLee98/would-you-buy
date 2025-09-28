package com.salaemalae.metrics

import io.micrometer.core.instrument.Timer
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.stereotype.Component
import org.springframework.web.servlet.HandlerInterceptor

/**
 * API 메트릭 수집을 위한 인터셉터
 * 모든 HTTP 요청에 대한 응답 시간과 상태를 자동으로 기록합니다.
 */
@Component
class MetricsInterceptor(
    private val votingMetrics: VotingMetrics
) : HandlerInterceptor {

    companion object {
        private const val TIMER_ATTRIBUTE = "metrics.timer"
    }

    override fun preHandle(
        request: HttpServletRequest,
        response: HttpServletResponse,
        handler: Any
    ): Boolean {
        // API 타이머 시작
        val timer = votingMetrics.startApiTimer(
            endpoint = request.requestURI,
            method = request.method
        )
        request.setAttribute(TIMER_ATTRIBUTE, timer)
        return true
    }

    override fun afterCompletion(
        request: HttpServletRequest,
        response: HttpServletResponse,
        handler: Any,
        ex: Exception?
    ) {
        // API 응답 시간 기록
        val timer = request.getAttribute(TIMER_ATTRIBUTE) as? Timer.Sample
        timer?.let {
            votingMetrics.recordApiResponse(
                sample = it,
                endpoint = request.requestURI,
                method = request.method,
                status = response.status.toString()
            )
        }

        // 에러 발생시 에러 메트릭 기록
        ex?.let {
            votingMetrics.recordError(
                errorType = it.javaClass.simpleName,
                endpoint = request.requestURI
            )
        }
    }
}