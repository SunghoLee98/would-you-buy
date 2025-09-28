package com.salaemalae.metrics

import io.micrometer.core.instrument.Counter
import io.micrometer.core.instrument.MeterRegistry
import io.micrometer.core.instrument.Timer
import org.springframework.stereotype.Component
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicInteger

/**
 * 비즈니스 메트릭 수집을 위한 컴포넌트
 * Grafana 대시보드에서 참조하는 커스텀 메트릭들을 구현합니다.
 */
@Component
class VotingMetrics(private val meterRegistry: MeterRegistry) {

    private val activeUsers = AtomicInteger(0)
    private val predictionAccuracyMap = ConcurrentHashMap<String, Double>()

    init {
        // 활성 사용자 수 게이지 등록
        meterRegistry.gauge("salae_malae_active_users", activeUsers)

        // 예측 정확도 게이지 등록
        meterRegistry.gauge("salae_malae_prediction_accuracy_ratio", this) {
            calculateOverallAccuracy()
        }
    }

    /**
     * 투표 기록 메트릭
     * @param stockCode 주식 코드
     * @param direction 투표 방향 (UP/DOWN)
     */
    fun recordVote(stockCode: String, direction: String) {
        Counter.builder("salae_malae_votes_total")
            .description("총 투표 수")
            .tag("stock_code", stockCode)
            .tag("direction", direction)
            .register(meterRegistry)
            .increment()
    }

    /**
     * KOSPI 투표 기록 메트릭
     * @param direction 투표 방향 (UP/DOWN)
     */
    fun recordKospiVote(direction: String) {
        Counter.builder("salae_malae_kospi_votes_total")
            .description("KOSPI 지수 투표 수")
            .tag("direction", direction)
            .register(meterRegistry)
            .increment()
    }

    /**
     * API 응답 시간 측정
     * @param endpoint API 엔드포인트 경로
     * @param method HTTP 메소드
     * @return Timer.Sample
     */
    fun startApiTimer(endpoint: String, method: String): Timer.Sample {
        return Timer.start(meterRegistry)
    }

    /**
     * API 응답 시간 기록
     * @param sample Timer.Sample
     * @param endpoint API 엔드포인트
     * @param method HTTP 메소드
     * @param status HTTP 상태 코드
     */
    fun recordApiResponse(sample: Timer.Sample, endpoint: String, method: String, status: String) {
        sample.stop(
            Timer.builder("salae_malae_api_response_time")
                .description("API 응답 시간")
                .tag("endpoint", endpoint)
                .tag("method", method)
                .tag("status", status)
                .register(meterRegistry)
        )
    }

    /**
     * 로그인 이벤트 기록
     * @param success 로그인 성공 여부
     * @param provider 로그인 제공자 (local, kakao, google, naver)
     */
    fun recordLoginEvent(success: Boolean, provider: String) {
        Counter.builder("salae_malae_login_attempts_total")
            .description("로그인 시도 수")
            .tag("success", success.toString())
            .tag("provider", provider)
            .register(meterRegistry)
            .increment()
    }

    /**
     * 사용자 등록 이벤트 기록
     * @param provider 가입 경로 (local, kakao, google, naver)
     */
    fun recordUserRegistration(provider: String) {
        Counter.builder("salae_malae_user_registrations_total")
            .description("사용자 가입 수")
            .tag("provider", provider)
            .register(meterRegistry)
            .increment()
    }

    /**
     * 예측 결과 기록
     * @param userId 사용자 ID
     * @param stockCode 주식 코드
     * @param correct 예측 성공 여부
     */
    fun recordPredictionResult(userId: String, stockCode: String, correct: Boolean) {
        Counter.builder("salae_malae_predictions_total")
            .description("예측 결과")
            .tag("stock_code", stockCode)
            .tag("result", if (correct) "correct" else "incorrect")
            .register(meterRegistry)
            .increment()
    }

    /**
     * 일일 활성 사용자 업데이트
     * @param count 활성 사용자 수
     */
    fun updateActiveUsers(count: Int) {
        activeUsers.set(count)
    }

    /**
     * 사용자별 예측 정확도 업데이트
     * @param userId 사용자 ID
     * @param accuracy 정확도 (0.0 ~ 1.0)
     */
    fun updateUserAccuracy(userId: String, accuracy: Double) {
        predictionAccuracyMap[userId] = accuracy
    }

    /**
     * 전체 예측 정확도 계산
     */
    private fun calculateOverallAccuracy(): Double {
        if (predictionAccuracyMap.isEmpty()) {
            return 0.0
        }
        return predictionAccuracyMap.values.average()
    }

    /**
     * 오류 발생 기록
     * @param errorType 오류 유형
     * @param endpoint 발생 엔드포인트
     */
    fun recordError(errorType: String, endpoint: String) {
        Counter.builder("salae_malae_errors_total")
            .description("오류 발생 수")
            .tag("type", errorType)
            .tag("endpoint", endpoint)
            .register(meterRegistry)
            .increment()
    }

    /**
     * 캐시 히트율 기록
     * @param cacheName 캐시 이름
     * @param hit 캐시 히트 여부
     */
    fun recordCacheAccess(cacheName: String, hit: Boolean) {
        Counter.builder("salae_malae_cache_access_total")
            .description("캐시 접근 수")
            .tag("cache", cacheName)
            .tag("result", if (hit) "hit" else "miss")
            .register(meterRegistry)
            .increment()
    }

    /**
     * WebSocket 연결 수 기록
     * @param action 연결 액션 (connect/disconnect)
     */
    fun recordWebSocketConnection(action: String) {
        Counter.builder("salae_malae_websocket_connections_total")
            .description("WebSocket 연결 수")
            .tag("action", action)
            .register(meterRegistry)
            .increment()
    }

    /**
     * 배치 작업 실행 시간 측정
     * @param jobName 작업 이름
     * @return Timer.Sample
     */
    fun startBatchJob(jobName: String): Timer.Sample {
        return Timer.start(meterRegistry)
    }

    /**
     * 배치 작업 완료 기록
     * @param sample Timer.Sample
     * @param jobName 작업 이름
     * @param success 성공 여부
     */
    fun recordBatchJobCompletion(sample: Timer.Sample, jobName: String, success: Boolean) {
        sample.stop(
            Timer.builder("salae_malae_batch_job_duration")
                .description("배치 작업 실행 시간")
                .tag("job", jobName)
                .tag("status", if (success) "success" else "failure")
                .register(meterRegistry)
        )
    }
}