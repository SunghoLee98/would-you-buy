package com.salaemalae.voting.service

import com.salaemalae.metrics.VotingMetrics
import org.springframework.stereotype.Service

/**
 * VotingService에서 메트릭을 수집하는 예시 서비스
 * 실제 VotingService가 구현될 때 이 패턴을 참고하여 메트릭을 통합할 수 있습니다.
 */
@Service
class VotingServiceWithMetrics(
    private val votingMetrics: VotingMetrics
) {

    /**
     * 주식 투표 처리
     * @param userId 사용자 ID
     * @param stockCode 주식 코드
     * @param direction 투표 방향 (UP/DOWN)
     */
    fun castVote(userId: String, stockCode: String, direction: String) {
        // 투표 메트릭 기록
        votingMetrics.recordVote(stockCode, direction)

        // KOSPI 지수인 경우 별도 메트릭 기록
        if (stockCode == "KOSPI") {
            votingMetrics.recordKospiVote(direction)
        }

        // TODO: 실제 투표 로직 구현
        // - 데이터베이스에 투표 저장
        // - 중복 투표 검증
        // - 투표 시간 검증
    }

    /**
     * 예측 결과 처리
     * @param userId 사용자 ID
     * @param stockCode 주식 코드
     * @param userPrediction 사용자 예측
     * @param actualResult 실제 결과
     */
    fun processPredictionResult(
        userId: String,
        stockCode: String,
        userPrediction: String,
        actualResult: String
    ) {
        val correct = userPrediction == actualResult

        // 예측 결과 메트릭 기록
        votingMetrics.recordPredictionResult(userId, stockCode, correct)

        // TODO: 실제 결과 처리 로직
        // - 포인트 계산 및 업데이트
        // - 연속 예측 성공 체크
        // - 랭킹 업데이트
    }

    /**
     * 일일 활성 사용자 수 업데이트
     * 배치 작업이나 스케줄러에서 호출
     */
    fun updateDailyActiveUsers() {
        val jobSample = votingMetrics.startBatchJob("daily_active_users")

        try {
            // TODO: 실제 활성 사용자 수 계산
            val activeUserCount = calculateActiveUsers()
            votingMetrics.updateActiveUsers(activeUserCount)

            votingMetrics.recordBatchJobCompletion(jobSample, "daily_active_users", true)
        } catch (e: Exception) {
            votingMetrics.recordBatchJobCompletion(jobSample, "daily_active_users", false)
            votingMetrics.recordError("BatchJobError", "daily_active_users")
            throw e
        }
    }

    /**
     * 사용자 정확도 업데이트
     * @param userId 사용자 ID
     */
    fun updateUserAccuracy(userId: String) {
        // TODO: 실제 정확도 계산 로직
        val accuracy = calculateUserAccuracy(userId)
        votingMetrics.updateUserAccuracy(userId, accuracy)
    }

    // 예시 메서드들 (실제 구현 필요)
    private fun calculateActiveUsers(): Int {
        // TODO: 데이터베이스에서 활성 사용자 수 조회
        return 0
    }

    private fun calculateUserAccuracy(userId: String): Double {
        // TODO: 사용자의 예측 정확도 계산
        return 0.0
    }
}