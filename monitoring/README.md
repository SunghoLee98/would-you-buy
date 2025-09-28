# 살래말래 서비스 모니터링 설정 가이드

## 🚀 개요

이 가이드는 살래말래(주식 예측 투표) 서비스를 위한 종합 모니터링 시스템 설정을 다룹니다.

### 모니터링 스택
- **Grafana**: 대시보드 및 시각화
- **Prometheus**: 메트릭 수집 및 저장
- **Loki**: 로그 수집 및 저장
- **Promtail**: 로그 수집기

## 📋 설정 완료 항목

### ✅ 백엔드 모니터링 설정
1. **Spring Boot Actuator 활성화**
   - `micrometer-registry-prometheus` 의존성 추가
   - `/actuator/prometheus` 엔드포인트 활성화
   - 서비스별 태그 설정 (`salae-malae-backend`)

2. **로그 설정**
   - 구조화된 로그 포맷 (trace ID 포함)
   - 로그 파일 경로: `./logs/salae-malae-backend.log`
   - 로그 로테이션 설정 (100MB, 10개 파일 유지)

### ✅ Prometheus 설정
- 살래말래 백엔드 타겟 추가 (`host.docker.internal:7070`)
- 10초 간격 메트릭 수집
- 5초 타임아웃 설정

### ✅ Promtail 로그 수집
- 살래말래 백엔드 로그 수집 설정
- 로그 파싱 및 라벨링 (`job=salae-malae-backend`)
- 프론트엔드 로그 수집 준비

### ✅ Grafana 대시보드
**1. 인프라 모니터링 대시보드** (`salae-malae-dashboard.json`)
- 서비스 상태 모니터링
- API 응답시간 및 에러율
- JVM 메트릭 (메모리, GC, 스레드)
- 데이터베이스 연결 풀 상태
- 로그 스트림 (에러/경고)

**2. 비즈니스 메트릭 대시보드** (`salae-malae-business-dashboard.json`)
- 일일 투표 현황
- 활성 사용자 수
- KOSPI 투표 분포
- 인기 종목 순위
- 예측 정확도 추이
- 사용자 참여율

### ✅ 알림 룰 설정
**Prometheus 알림 룰 파일**: `prometheus-alert-rules.yml`

**인프라 알림**:
- 서비스 다운타임 (1분)
- 높은 에러율 (5% 이상, 5분)
- API 응답 지연 (2초 이상, 10분)
- 높은 메모리 사용량 (80% 이상, 5분)
- DB 연결 풀 고갈 (100%, 1분)
- 디스크 공간 부족 (10% 미만, 5분)
- 배치 작업 실패

**비즈니스 알림**:
- 로그인 실패율 높음 (15분)
- 투표 활동 저하 (1시간)
- 활성 사용자 감소 (100명 미만, 30분)
- WebSocket 연결 급증 (분당 100건, 5분)
- 낮은 캐시 히트율 (50% 미만, 15분)
- 낮은 예측 정확도 (30% 미만, 1시간)

## 🔧 설정 파일 위치

```
📁 모니터링 설정
├── monitoring/
│   ├── salae-malae-dashboard.json           # 인프라 대시보드
│   ├── salae-malae-business-dashboard.json  # 비즈니스 대시보드
│   ├── prometheus-alert-rules.yml          # Prometheus 알림 룰
│   └── README.md                           # 이 가이드
├── backend/
│   ├── build.gradle.kts                    # 모니터링 의존성 추가
│   ├── src/main/resources/
│   │   ├── application.yml                 # 기본 설정
│   │   ├── application-dev.yml             # 개발 환경 설정
│   │   └── application-prod.yml            # 프로덕션 환경 설정
│   └── src/main/kotlin/com/salaemalae/
│       └── metrics/                        # 메트릭 수집 구현
│           ├── VotingMetrics.kt            # 비즈니스 메트릭
│           ├── MetricsInterceptor.kt       # API 메트릭 인터셉터
│           └── MetricsConfig.kt            # 메트릭 설정
└── logs/                                   # 로그 파일 저장 위치
```

## 📊 대시보드 접근

### Grafana 대시보드 가져오기
1. Grafana 접속: http://localhost:3000 (admin/admin)
2. **+** → **Import** 클릭
3. **Upload JSON file** 선택
4. 다음 파일들 순서대로 업로드:
   - `salae-malae-dashboard.json` (인프라 모니터링)
   - `salae-malae-business-dashboard.json` (비즈니스 메트릭)

### 데이터 소스 설정 확인
- **Prometheus**: http://prometheus:9090
- **Loki**: http://loki:3100

## 🚦 서비스 시작 순서

**중요**: 프론트/백엔드 서비스 재기동이 필요합니다 (새 의존성 적용을 위해)

1. **데이터베이스 시작**
   ```bash
   # PostgreSQL이 실행 중인지 확인
   docker ps | grep postgres
   ```

2. **백엔드 서비스 시작**
   ```bash
   cd backend
   ./gradlew bootRun
   ```
   - 새 Actuator 엔드포인트가 활성화됩니다
   - `/actuator/prometheus` 에서 메트릭 확인 가능

3. **프론트엔드 서비스 시작**
   ```bash
   cd frontend
   npm start
   ```

4. **메트릭 수집 확인**
   ```bash
   # Prometheus 타겟 상태 확인
   curl http://localhost:9091/api/v1/targets

   # 살래말래 백엔드 메트릭 확인
   curl http://localhost:7070/actuator/prometheus
   ```

## 📈 비즈니스 메트릭 구현

### ✅ 구현 완료된 메트릭

`VotingMetrics` 컴포넌트가 다음 메트릭들을 수집합니다:

**투표 관련 메트릭**:
- `salae_malae_votes_total`: 총 투표 수 (stock_code, direction 태그)
- `salae_malae_kospi_votes_total`: KOSPI 지수 투표 수 (direction 태그)
- `salae_malae_predictions_total`: 예측 결과 (stock_code, result 태그)
- `salae_malae_prediction_accuracy_ratio`: 전체 예측 정확도 비율

**사용자 관련 메트릭**:
- `salae_malae_active_users`: 활성 사용자 수 (게이지)
- `salae_malae_login_attempts_total`: 로그인 시도 수 (success, provider 태그)
- `salae_malae_user_registrations_total`: 사용자 가입 수 (provider 태그)

**성능 관련 메트릭**:
- `salae_malae_api_response_time`: API 응답 시간 (endpoint, method, status 태그)
- `salae_malae_cache_access_total`: 캐시 접근 수 (cache, result 태그)
- `salae_malae_batch_job_duration`: 배치 작업 실행 시간 (job, status 태그)

**시스템 관련 메트릭**:
- `salae_malae_errors_total`: 오류 발생 수 (type, endpoint 태그)
- `salae_malae_websocket_connections_total`: WebSocket 연결 수 (action 태그)

### 사용 예시

```kotlin
@Service
class YourService(
    private val votingMetrics: VotingMetrics
) {
    fun processVote(userId: String, stockCode: String, direction: String) {
        // 투표 메트릭 기록
        votingMetrics.recordVote(stockCode, direction)

        // KOSPI인 경우 별도 기록
        if (stockCode == "KOSPI") {
            votingMetrics.recordKospiVote(direction)
        }
    }
}
```

## 🔔 알림 설정

### Prometheus 알림 룰 적용

1. **알림 룰 파일 복사**:
   ```bash
   cp monitoring/prometheus-alert-rules.yml prometheus/rules/
   ```

2. **Prometheus 설정 업데이트** (`prometheus.yml`):
   ```yaml
   rule_files:
     - "rules/*.yml"
   ```

3. **Prometheus 재시작**:
   ```bash
   docker restart prometheus
   ```

### Alertmanager 설정 (선택사항)

실제 알림을 받으려면:
1. **Alertmanager 설정** 파일 생성
2. **Slack/Email 통합** 설정
3. **알림 채널** 구성

## 🐛 트러블슈팅

### 메트릭이 수집되지 않는 경우
1. 백엔드 서비스가 실행 중인지 확인
2. `/actuator/prometheus` 엔드포인트 접근 가능한지 확인
3. Prometheus 설정 리로드: `curl -X POST http://localhost:9091/-/reload`

### 로그가 수집되지 않는 경우
1. 로그 파일 경로 확인: `./logs/salae-malae-backend.log`
2. Promtail 컨테이너 재시작: `docker restart promtail`
3. 로그 파일 권한 확인

### Grafana 대시보드가 데이터를 표시하지 않는 경우
1. 데이터 소스 연결 상태 확인
2. 시간 범위 설정 확인
3. 메트릭 이름 일치 여부 확인

## 📝 다음 단계

1. **커스텀 메트릭 구현**: 비즈니스 로직에 맞는 메트릭 추가
2. **알림 채널 설정**: 실제 운영을 위한 알림 시스템 구축
3. **성능 튜닝**: 메트릭 수집 주기 및 보존 정책 최적화
4. **보안 설정**: Grafana 인증 및 권한 관리

---

**문의사항이나 이슈가 있으면 개발팀에 연락해주세요! 🚀**