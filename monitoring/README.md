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
한국어 알림 메시지로 다음 항목 모니터링:
- 서비스 다운타임 (1분)
- 높은 에러율 (5% 이상, 3분)
- API 응답 지연 (1초 이상, 5분)
- 높은 메모리 사용량 (85% 이상, 5분)
- DB 연결 풀 사용량 높음 (80% 이상, 3분)
- 투표 활동 저하 (30분)
- 높은 GC 활동 (5분)

## 🔧 설정 파일 위치

```
📁 모니터링 설정
├── monitoring/
│   ├── salae-malae-dashboard.json           # 인프라 대시보드
│   ├── salae-malae-business-dashboard.json  # 비즈니스 대시보드
│   └── README.md                           # 이 가이드
├── backend/
│   ├── build.gradle.kts                    # 모니터링 의존성 추가
│   └── src/main/resources/application.yml  # Actuator 및 로그 설정
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

비즈니스 대시보드의 모든 메트릭이 작동하려면 다음 커스텀 메트릭을 백엔드에 구현해야 합니다:

```kotlin
// 예시: 투표 메트릭
@Component
class VotingMetrics {
    private val votesCounter = Counter.builder("salae_malae_votes_total")
        .description("Total number of votes")
        .tag("stock_code", "")
        .tag("direction", "")
        .register(Metrics.globalRegistry)

    private val kospiVotesCounter = Counter.builder("salae_malae_kospi_votes_total")
        .description("KOSPI votes")
        .tag("direction", "")
        .register(Metrics.globalRegistry)

    // 사용법
    fun recordVote(stockCode: String, direction: String) {
        votesCounter.increment(
            Tags.of("stock_code", stockCode, "direction", direction)
        )
    }
}
```

## 🔔 알림 설정

현재 Prometheus 알림 룰이 설정되어 있습니다. 실제 알림을 받으려면:

1. **Alertmanager 설정** (선택사항)
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