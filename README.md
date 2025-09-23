# 🏷️ 살래말래 (Would You Buy)

> **한국 주식 예측 투표 플랫폼** - 매일 주요 한국 주식의 등락을 예측하고 순위를 겨루는 게임형 커뮤니티 서비스

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.0-6DB33F?style=flat-square&logo=spring&logoColor=white)](https://spring.io/projects/spring-boot)
[![Kotlin](https://img.shields.io/badge/Kotlin-1.9.20-7F52FF?style=flat-square&logo=kotlin&logoColor=white)](https://kotlinlang.org/)
[![React](https://img.shields.io/badge/React-19.1.1-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9.5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

## 📋 프로젝트 개요

**살래말래**는 한국 주식 시장의 주요 종목들의 다음 거래일 등락을 예측하는 투표 플랫폼입니다. 사용자들은 매일 KOSPI 지수와 주요 종목들(삼성전자, SK하이닉스, 네이버, 카카오 등)에 대해 **상승(UP)** 또는 **하락(DOWN)**을 예측하고, 정확도에 따라 포인트를 획득하며 순위를 경쟁합니다.

### 🎯 핵심 가치
- **📈 실전 감각**: 실제 자금 없이 주식 시장 감각 연마
- **🎮 게임화**: 포인트, 랭킹, 연속 적중 등 재미있는 요소
- **🇰🇷 한국 시장**: 한국인을 위한 한국 주식 중심 서비스
- **👥 커뮤니티**: 예측 근거 공유 및 투자자들 간 소통

## ✨ 주요 기능

### 🗳️ 일일 투표 시스템
- **KOSPI 지수** 예측 (메인 하이라이트, 보너스 포인트)
- **주요 종목** 8-10개 선별 제공
- **간단한 UP/DOWN** 예측 투표
- **투표 시간**: 장 마감(오후 3시 30분) ~ 다음날 장 시작(오전 9시)

### 👤 사용자 관리
- **간편 가입**: 이메일/소셜 로그인 (구글, 카카오, 네이버)
- **프로필 관리**: 사용자명, 예측 통계, 랭킹 정보
- **게스트 모드**: 비회원도 결과 조회 가능

### 🏆 점수 시스템
- **기본 점수**: 정답 +10점, 오답 -5점
- **KOSPI 보너스**: 코스피 정답 시 +15점 (높은 가중치)
- **정확도 추적**: 전체 승률 퍼센트 표시
- **연속 적중**: 연속 정답 시 보너스 포인트

### 📊 결과 및 랭킹
- **일일 결과**: 실제 주식 성과 vs 예측 결과
- **리더보드**: 전체 정확도, 주간 톱 퍼포머, 최장 연속 적중
- **개인 통계**: 개인별 예측 히스토리 및 성과

### 💬 커뮤니티 기능
- **투표 현황**: UP vs DOWN 투표 비율 실시간 표시
- **간단한 코멘트**: 예측 근거 공유 (선택사항)

## 🛠️ 기술 스택

### Backend
- **Framework**: Spring Boot 3.2.0 + Kotlin
- **Database**: PostgreSQL
- **Security**: Spring Security + JWT
- **Build Tool**: Gradle with Kotlin DSL
- **Migration**: Flyway
- **Cache**: Caffeine

### Frontend
- **Framework**: React 19.1.1 + TypeScript
- **Styling**: Emotion
- **Form Management**: React Hook Form + Yup
- **Routing**: React Router DOM
- **HTTP Client**: Axios

### Infrastructure
- **Database**: PostgreSQL (Port: 5432)
- **Backend Server**: localhost:7070
- **Frontend Server**: localhost:3001

### Testing
- **Backend**: JUnit 5, Mockito, Spring Boot Test
- **Frontend**: Jest, React Testing Library
- **E2E**: Playwright (./e2e 디렉토리)

## 🚀 시작하기

### 필수 요구사항
- **Java 17+**
- **Node.js 16+**
- **PostgreSQL 14+**
- **Git**

### 설치 및 실행

1. **저장소 클론**
```bash
git clone <repository-url>
cd would-you-buy-project
```

2. **데이터베이스 설정**
```bash
# PostgreSQL 실행 (port: 5432)
createdb salaemalae
```

3. **백엔드 실행**
```bash
cd backend
./gradlew bootRun
# 서버가 localhost:7070에서 실행됩니다
```

4. **프론트엔드 실행**
```bash
cd frontend
npm install
npm start
# 서버가 localhost:3001에서 실행됩니다
```

5. **E2E 테스트 실행**
```bash
cd e2e
npm install
npm test
```

## 📁 프로젝트 구조

```
would-you-buy-project/
├── backend/                 # Spring Boot + Kotlin 백엔드
│   ├── src/main/kotlin/    # 메인 소스코드
│   ├── src/test/kotlin/    # 테스트 코드
│   └── build.gradle.kts    # 빌드 설정
├── frontend/               # React + TypeScript 프론트엔드
│   ├── src/                # 메인 소스코드
│   ├── public/             # 정적 파일
│   └── package.json        # 패키지 설정
├── e2e/                    # Playwright E2E 테스트
├── docs/                   # 프로젝트 문서
│   ├── api_specifications.md
│   └── data_models.md
└── CLAUDE.md               # 개발 워크플로우 및 아키텍처 결정사항
```

## 🎯 타겟 사용자

- **한국 개인투자자** (20-40세)
- **주식 시장 관심자 및 입문자**
- **실제 투자는 부담스러우나 시장 트렌드에 관심 있는 사용자**

## 📈 성공 지표

### 사용자 참여도
- **일일 활성 사용자**: 3개월 내 1000+ DAU
- **유지율**: 주간 유지율 30%
- **투표 참여율**: 일일 사용자의 80%가 3개 이상 예측

### 플랫폼 성장
- **회원 가입**: 첫 분기 5000+ 등록 사용자
- **커뮤니티 규모**: 2000+ 정기 참여 사용자

## 🏗️ 아키텍처 특징

### 보안
- **JWT 기반 인증**: 이중 토큰 전략 (액세스 + 리프레시)
- **BCrypt 암호화**: 강도 12 설정
- **레이트 리미팅**: IP별, 사용자별 제한
- **포괄적 감사 로깅**: 보안 이벤트 추적

### 성능
- **연결 풀링**: HikariCP (최대 20 연결)
- **캐싱 전략**: Caffeine 캐시 (사용자 프로필, JWT 검증)
- **비동기 처리**: 논블로킹 작업을 위한 스레드 풀

### 확장성
- **UUID 기본 키**: 분산 시스템 호환성
- **마이크로서비스 준비**: 인증 서비스 분리 가능
- **API 게이트웨이 준비**: Spring Cloud Gateway 통합 대비

## 🤝 기여하기

1. 이슈 생성 또는 기존 이슈 선택
2. 브랜치 생성: `feature/{이슈번호}-{간단한-설명}`
3. 개발 및 테스트
4. Pull Request 생성

### 브랜치 전략
- **main**: 프로덕션 배포 브랜치
- **feature/**: 새로운 기능 개발
- **hotfix/**: 긴급 버그 수정

## 📝 라이선스

This project is private and proprietary.

## 📞 연락처

프로젝트 관련 문의사항이 있으시면 이슈를 통해 연락 부탁드립니다.

---

> **⚠️ 주의사항**: 이 서비스는 교육 및 엔터테인먼트 목적으로만 제공되며, 실제 투자 조언이 아닙니다. 실제 투자 결정은 전문가와 상담 후 신중히 하시기 바랍니다.