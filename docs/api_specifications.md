# API Specifications - 살래말래 Platform

## 목차
1. [공통 사항 (Common Specifications)](#1-공통-사항-common-specifications)
2. [인증 도메인 (Authentication Domain)](#2-인증-도메인-authentication-domain)
3. [사용자 도메인 (User Domain)](#3-사용자-도메인-user-domain)
4. [투표 도메인 (Voting Domain)](#4-투표-도메인-voting-domain)
5. [리더보드 도메인 (Leaderboard Domain)](#5-리더보드-도메인-leaderboard-domain)
6. [실시간 통신 (WebSocket)](#6-실시간-통신-websocket)
7. [타입 정의 (Type Definitions)](#7-타입-정의-type-definitions)

---

# 1. 공통 사항 (Common Specifications)

## Base Configuration
- **Base URL**: `http://localhost:7070/api/v1`
- **Content-Type**: `application/json`
- **Authentication**: JWT Bearer Token
- **Charset**: UTF-8
- **Locale**: Korean (ko-KR)

## Standard Response Format
모든 API 응답은 다음 표준 형식을 따릅니다:

```json
{
  "success": boolean,
  "message": string,
  "data": object | array | null,
  "timestamp": "ISO-8601 DateTime",
  "errors": array | null
}
```

### Success Response Example
```json
{
  "success": true,
  "message": "요청이 성공적으로 처리되었습니다",
  "data": { ... },
  "timestamp": "2024-01-15T10:30:00Z",
  "errors": null
}
```

### Error Response Example
```json
{
  "success": false,
  "message": "요청 처리 중 오류가 발생했습니다",
  "data": null,
  "timestamp": "2024-01-15T10:30:00Z",
  "errors": [
    {
      "code": "VALIDATION_ERROR",
      "field": "email",
      "message": "이메일 형식이 올바르지 않습니다"
    }
  ]
}
```

## Authentication
- **Type**: JWT (JSON Web Token)
- **Header**: `Authorization: Bearer {access_token}`
- **Token Expiration**: Access Token 1시간, Refresh Token 30일
- **Renewal**: Refresh Token을 통한 자동 갱신

## Error Codes
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | 입력값 검증 실패 |
| `UNAUTHORIZED` | 401 | 인증 실패 |
| `FORBIDDEN` | 403 | 권한 없음 |
| `NOT_FOUND` | 404 | 리소스를 찾을 수 없음 |
| `CONFLICT` | 409 | 리소스 충돌 (중복 등) |
| `RATE_LIMIT_EXCEEDED` | 429 | 요청 한도 초과 |
| `INTERNAL_SERVER_ERROR` | 500 | 서버 내부 오류 |

## Rate Limiting
- **Authentication**: 10 requests/minute/IP
- **Voting**: 20 requests/minute/user
- **General API**: 100 requests/minute/user
- **WebSocket**: 1 connection/user

## Security Headers
모든 응답에 다음 보안 헤더가 포함됩니다:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

---

# 2. 인증 도메인 (Authentication Domain)

## 2.1 사용자 등록

### `POST /auth/register`
새로운 사용자 계정을 생성합니다.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "username": "사용자닉네임",
  "termsAccepted": true
}
```

**Validation Rules:**
- `email`: 필수, 유효한 이메일 형식, 시스템 내 유일
- `password`: 필수, 최소 8자, 대소문자/숫자/특수문자 포함
- `username`: 필수, 2-20자, 한글/영문/숫자만 허용, 시스템 내 유일
- `termsAccepted`: 필수, true 값만 허용

**Success Response (201):**
```json
{
  "success": true,
  "message": "회원가입이 완료되었습니다",
  "data": {
    "userId": "uuid-string",
    "email": "user@example.com",
    "username": "사용자닉네임",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "errors": null
}
```

## 2.2 로그인

### `POST /auth/login`
사용자 로그인 및 JWT 토큰 발급

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "로그인이 완료되었습니다",
  "data": {
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token",
    "tokenType": "Bearer",
    "expiresIn": 3600,
    "user": {
      "userId": "uuid-string",
      "email": "user@example.com",
      "username": "사용자닉네임",
      "role": "USER"
    }
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "errors": null
}
```

## 2.3 토큰 갱신

### `POST /auth/refresh`
Refresh Token을 사용하여 새로운 Access Token 발급

**Request Body:**
```json
{
  "refreshToken": "jwt-refresh-token"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "토큰이 갱신되었습니다",
  "data": {
    "accessToken": "new-jwt-access-token",
    "tokenType": "Bearer",
    "expiresIn": 3600
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "errors": null
}
```

## 2.4 로그아웃

### `POST /auth/logout`
사용자 로그아웃 및 Refresh Token 무효화

**Headers:** `Authorization: Bearer {access_token}`

**Request Body:**
```json
{
  "refreshToken": "jwt-refresh-token"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "로그아웃되었습니다",
  "data": null,
  "timestamp": "2024-01-15T10:30:00Z",
  "errors": null
}
```

---

# 3. 사용자 도메인 (User Domain)

## 3.1 현재 사용자 정보 조회

### `GET /users/me`
현재 로그인한 사용자의 정보를 조회합니다.

**Headers:** `Authorization: Bearer {access_token}`

**Success Response (200):**
```json
{
  "success": true,
  "message": "사용자 정보를 조회했습니다",
  "data": {
    "userId": "uuid-string",
    "email": "user@example.com",
    "username": "사용자닉네임",
    "role": "USER",
    "statistics": {
      "totalPredictions": 25,
      "correctPredictions": 15,
      "accuracyRate": 60.0,
      "totalPoints": 150,
      "currentStreak": 3,
      "longestStreak": 7
    },
    "createdAt": "2024-01-01T00:00:00Z",
    "lastLoginAt": "2024-01-15T10:30:00Z"
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "errors": null
}
```

## 3.2 이메일 중복 확인

### `GET /auth/check-email?email={email}`
이메일 사용 가능 여부를 확인합니다.

**Query Parameters:**
- `email`: 확인할 이메일 주소 (필수)

**Success Response (200):**
```json
{
  "success": true,
  "message": "이메일 확인이 완료되었습니다",
  "data": {
    "available": true,
    "message": "사용 가능한 이메일입니다"
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "errors": null
}
```

## 3.3 사용자명 중복 확인

### `GET /auth/check-username?username={username}`
사용자명 사용 가능 여부를 확인합니다.

**Query Parameters:**
- `username`: 확인할 사용자명 (필수)

**Success Response (200):**
```json
{
  "success": true,
  "message": "사용자명 확인이 완료되었습니다",
  "data": {
    "available": true,
    "message": "사용 가능한 닉네임입니다"
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "errors": null
}
```

---

# 4. 투표 도메인 (Voting Domain)

## 4.1 투표 대시보드 조회

### `GET /stocks/voting`
투표 가능한 주식 목록과 통계를 조회합니다. (비로그인 사용자용)

**Success Response (200):**
```json
{
  "success": true,
  "message": "투표 가능한 주식 목록을 조회했습니다",
  "data": {
    "votingDate": "2024-01-16",
    "items": [
      {
        "stock": {
          "code": "KOSPI",
          "koreanName": "코스피",
          "englishName": "KOSPI Index",
          "currentPrice": 2650.50,
          "changeRate": 1.25,
          "changeAmount": 32.75,
          "isPrimary": true,
          "displayOrder": 1,
          "marketType": "INDEX",
          "lastUpdated": "2024-01-15T15:30:00Z",
          "isVotingEligible": true,
          "priceTrend": "UP",
          "formattedChangeRate": "+1.25%",
          "formattedChangeAmount": "+32.75"
        },
        "voteStatistics": {
          "stockCode": "KOSPI",
          "votingDate": "2024-01-16",
          "upVotes": 1250,
          "downVotes": 875,
          "totalVotes": 2125,
          "upPercentage": 58.8,
          "downPercentage": 41.2,
          "majorityVote": "UP",
          "hasClearMajority": false,
          "majorityVoteText": "상승",
          "consensusStrength": "약간의 의견 차이"
        },
        "userVote": null
      },
      {
        "stock": {
          "code": "005930",
          "koreanName": "삼성전자",
          "englishName": "Samsung Electronics",
          "currentPrice": 75000,
          "changeRate": -0.8,
          "changeAmount": -600,
          "isPrimary": false,
          "displayOrder": 2,
          "marketType": "KOSPI",
          "lastUpdated": "2024-01-15T15:30:00Z",
          "isVotingEligible": true,
          "priceTrend": "DOWN",
          "formattedChangeRate": "-0.8%",
          "formattedChangeAmount": "-600"
        },
        "voteStatistics": {
          "stockCode": "005930",
          "votingDate": "2024-01-16",
          "upVotes": 980,
          "downVotes": 720,
          "totalVotes": 1700,
          "upPercentage": 57.6,
          "downPercentage": 42.4,
          "majorityVote": "UP",
          "hasClearMajority": false,
          "majorityVoteText": "상승",
          "consensusStrength": "약간의 의견 차이"
        },
        "userVote": null
      }
    ],
    "totalActiveStocks": 10,
    "votingWindowOpen": true,
    "marketStatus": "시장 폐장",
    "kospiItem": {
      "stock": { /* KOSPI 주식 정보 */ },
      "voteStatistics": { /* KOSPI 투표 통계 */ },
      "userVote": null
    },
    "featuredStocks": [
      { /* 삼성전자 등 주요 종목들 */ }
    ]
  },
  "timestamp": "2024-01-15T15:35:00Z",
  "errors": null
}
```

### `GET /stocks/voting/dashboard`
투표 대시보드 조회 (로그인 사용자용, 사용자 투표 정보 포함)

**Headers:** `Authorization: Bearer {access_token}`

**Query Parameters:**
- `date`: 조회할 날짜 (YYYY-MM-DD, 선택적, 기본값: 내일)

**Success Response (200):**
위의 응답과 동일하나, `userVote` 필드에 사용자의 투표 정보가 포함됩니다.

```json
"userVote": {
  "id": "uuid-string",
  "stockCode": "005930",
  "stockName": "삼성전자",
  "voteType": "UP",
  "voteTypeText": "상승",
  "votingDate": "2024-01-16",
  "confidenceLevel": 4,
  "predictionReason": "실적 개선 기대",
  "canChangeVote": true,
  "isResultCalculated": false,
  "isCorrect": null,
  "pointsEarned": null,
  "createdAt": "2024-01-15T16:00:00Z",
  "updatedAt": "2024-01-15T16:00:00Z"
}
```

## 4.2 투표 제출

### `POST /votes`
특정 주식에 대한 투표를 제출합니다.

**Headers:** `Authorization: Bearer {access_token}`

**Request Body:**
```json
{
  "stockCode": "005930",
  "voteType": "UP",
  "confidenceLevel": 4,
  "predictionReason": "실적 개선 기대"
}
```

**Validation Rules:**
- `stockCode`: 필수, 존재하는 주식 코드
- `voteType`: 필수, "UP" 또는 "DOWN"
- `confidenceLevel`: 선택적, 1-5 정수
- `predictionReason`: 선택적, 최대 200자

**Success Response (201):**
```json
{
  "success": true,
  "message": "투표가 성공적으로 등록되었습니다",
  "data": {
    "success": true,
    "voteId": "uuid-string",
    "message": "투표가 등록되었습니다",
    "vote": {
      "id": "uuid-string",
      "stockCode": "005930",
      "stockName": "삼성전자",
      "voteType": "UP",
      "voteTypeText": "상승",
      "votingDate": "2024-01-16",
      "confidenceLevel": 4,
      "predictionReason": "실적 개선 기대",
      "canChangeVote": true,
      "isResultCalculated": false,
      "isCorrect": null,
      "pointsEarned": null,
      "createdAt": "2024-01-15T16:00:00Z",
      "updatedAt": "2024-01-15T16:00:00Z"
    }
  },
  "timestamp": "2024-01-15T16:00:00Z",
  "errors": null
}
```

**Error Response - Already Voted (409):**
```json
{
  "success": false,
  "message": "이미 해당 주식에 투표하셨습니다",
  "data": null,
  "timestamp": "2024-01-15T16:00:00Z",
  "errors": [
    {
      "code": "ALREADY_VOTED",
      "field": "stockCode",
      "message": "오늘 이미 005930 주식에 투표하셨습니다"
    }
  ]
}
```

## 4.3 투표 수정

### `PUT /votes/{voteId}`
기존 투표를 수정합니다.

**Headers:** `Authorization: Bearer {access_token}`

**Path Parameters:**
- `voteId`: 수정할 투표의 UUID (필수)

**Request Body:**
```json
{
  "voteType": "DOWN",
  "confidenceLevel": 3,
  "predictionReason": "시장 환경 악화 우려"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "투표가 성공적으로 수정되었습니다",
  "data": {
    "success": true,
    "message": "투표가 수정되었습니다",
    "vote": {
      "id": "uuid-string",
      "stockCode": "005930",
      "stockName": "삼성전자",
      "voteType": "DOWN",
      "voteTypeText": "하락",
      "votingDate": "2024-01-16",
      "confidenceLevel": 3,
      "predictionReason": "시장 환경 악화 우려",
      "canChangeVote": true,
      "isResultCalculated": false,
      "isCorrect": null,
      "pointsEarned": null,
      "createdAt": "2024-01-15T16:00:00Z",
      "updatedAt": "2024-01-15T16:30:00Z"
    }
  },
  "timestamp": "2024-01-15T16:30:00Z",
  "errors": null
}
```

## 4.4 사용자 투표 내역 조회

### `GET /votes/my-votes`
현재 사용자의 투표 내역을 조회합니다.

**Headers:** `Authorization: Bearer {access_token}`

**Query Parameters:**
- `page`: 페이지 번호 (기본값: 0)
- `size`: 페이지 크기 (기본값: 20)
- `stockCode`: 특정 주식 코드로 필터링 (선택적)
- `startDate`: 시작 날짜 (YYYY-MM-DD, 선택적)
- `endDate`: 종료 날짜 (YYYY-MM-DD, 선택적)

**Success Response (200):**
```json
{
  "success": true,
  "message": "투표 내역을 조회했습니다",
  "data": [
    {
      "id": "uuid-string",
      "stockCode": "KOSPI",
      "stockName": "코스피",
      "voteType": "UP",
      "voteTypeText": "상승",
      "votingDate": "2024-01-15",
      "confidenceLevel": 5,
      "predictionReason": "긍정적 시장 전망",
      "canChangeVote": false,
      "isResultCalculated": true,
      "isCorrect": true,
      "pointsEarned": 15,
      "createdAt": "2024-01-14T16:00:00Z",
      "updatedAt": "2024-01-14T16:00:00Z"
    }
  ],
  "timestamp": "2024-01-15T16:00:00Z",
  "errors": null
}
```

## 4.5 오늘의 투표 현황 조회

### `GET /votes/my-votes/today`
오늘(현재 투표일)의 사용자 투표 현황을 조회합니다.

**Headers:** `Authorization: Bearer {access_token}`

**Success Response (200):**
```json
{
  "success": true,
  "message": "오늘의 투표 현황을 조회했습니다",
  "data": [
    {
      "id": "uuid-string",
      "stockCode": "KOSPI",
      "stockName": "코스피",
      "voteType": "UP",
      "voteTypeText": "상승",
      "votingDate": "2024-01-16",
      "confidenceLevel": 4,
      "predictionReason": null,
      "canChangeVote": true,
      "isResultCalculated": false,
      "isCorrect": null,
      "pointsEarned": null,
      "createdAt": "2024-01-15T16:00:00Z",
      "updatedAt": "2024-01-15T16:00:00Z"
    }
  ],
  "timestamp": "2024-01-15T16:00:00Z",
  "errors": null
}
```

## 4.6 사용자 통계 조회

### `GET /votes/my-stats`
사용자의 투표 성과 통계를 조회합니다.

**Headers:** `Authorization: Bearer {access_token}`

**Success Response (200):**
```json
{
  "success": true,
  "message": "사용자 통계를 조회했습니다",
  "data": {
    "totalPredictions": 25,
    "correctPredictions": 15,
    "accuracyRate": 60.0,
    "totalPoints": 150,
    "currentStreak": 3,
    "longestStreak": 7,
    "rank": 42,
    "weeklyRank": 15,
    "weeklyPoints": 45
  },
  "timestamp": "2024-01-15T16:00:00Z",
  "errors": null
}
```

---

# 5. 리더보드 도메인 (Leaderboard Domain)

## 5.1 전체 리더보드 조회

### `GET /leaderboard`
전체 사용자 리더보드를 조회합니다.

**Query Parameters:**
- `type`: 리더보드 유형 (`points`, `accuracy`, `streak`) (기본값: `points`)
- `period`: 기간 (`all`, `weekly`, `monthly`) (기본값: `all`)
- `page`: 페이지 번호 (기본값: 0)
- `size`: 페이지 크기 (기본값: 20)

**Success Response (200):**
```json
{
  "success": true,
  "message": "리더보드를 조회했습니다",
  "data": {
    "type": "POINTS",
    "period": "ALL",
    "entries": [
      {
        "rank": 1,
        "userId": "uuid-string",
        "username": "투자고수",
        "totalPoints": 2500,
        "accuracyRate": 75.5,
        "totalPredictions": 200,
        "correctPredictions": 151,
        "currentStreak": 15,
        "avatar": null
      }
    ],
    "totalEntries": 1337,
    "userRank": 42,
    "lastUpdated": "2024-01-15T16:00:00Z"
  },
  "timestamp": "2024-01-15T16:00:00Z",
  "errors": null
}
```

---

# 6. 실시간 통신 (WebSocket)

## 6.1 연결 및 인증

### WebSocket Endpoint
`ws://localhost:7070/api/v1/ws/votes`

**Connection Headers:**
```
Authorization: Bearer {access_token}
```

## 6.2 구독 메시지

### 투표 통계 실시간 업데이트 구독
```json
{
  "action": "subscribe",
  "type": "vote_statistics",
  "stockCodes": ["KOSPI", "005930", "000660"]
}
```

## 6.3 실시간 업데이트 메시지

### 투표 통계 업데이트
```json
{
  "type": "vote_statistics_update",
  "data": {
    "stockCode": "005930",
    "stockName": "삼성전자",
    "upVotes": 981,
    "downVotes": 720,
    "totalVotes": 1701,
    "upPercentage": 57.7,
    "downPercentage": 42.3,
    "majorityVote": "UP",
    "hasClearMajority": false
  },
  "timestamp": "2024-01-15T16:00:00Z"
}
```

---

# 7. 타입 정의 (Type Definitions)

## 7.1 기본 타입

### VoteType (Enum)
```
UP     - 상승 예측
DOWN   - 하락 예측
```

### PriceTrend (Enum)
```
UP       - 상승 추세
DOWN     - 하락 추세
STABLE   - 보합 추세
```

### MarketStatus (Enum)
```
시장 개장 전
시장 개장 중
시장 폐장
```

### UserRole (Enum)
```
USER   - 일반 사용자
ADMIN  - 관리자
```

## 7.2 Request DTOs

### SubmitVoteRequest
```json
{
  "stockCode": "string (required)",
  "voteType": "UP | DOWN (required)",
  "confidenceLevel": "number (1-5, optional)",
  "predictionReason": "string (max 200, optional)"
}
```

### UpdateVoteRequest
```json
{
  "voteType": "UP | DOWN (required)",
  "confidenceLevel": "number (1-5, optional)",
  "predictionReason": "string (max 200, optional)"
}
```

### GetVotingStocksRequest
```json
{
  "date": "YYYY-MM-DD (optional)",
  "includeUserVotes": "boolean (optional, default: true)"
}
```

## 7.3 Response DTOs

### StockInfo
```json
{
  "code": "string",
  "koreanName": "string",
  "englishName": "string | null",
  "currentPrice": "number | null",
  "changeRate": "number | null",
  "changeAmount": "number | null",
  "isPrimary": "boolean",
  "displayOrder": "number",
  "marketType": "string",
  "lastUpdated": "ISO-8601 DateTime | null",
  "isVotingEligible": "boolean",
  "priceTrend": "UP | DOWN | STABLE",
  "formattedChangeRate": "string | null",
  "formattedChangeAmount": "string | null"
}
```

### VoteStatistics
```json
{
  "stockCode": "string",
  "votingDate": "YYYY-MM-DD",
  "upVotes": "number",
  "downVotes": "number",
  "totalVotes": "number",
  "upPercentage": "number",
  "downPercentage": "number",
  "majorityVote": "UP | DOWN | null",
  "hasClearMajority": "boolean",
  "majorityVoteText": "상승 | 하락 | null",
  "consensusStrength": "string"
}
```

### UserVote
```json
{
  "id": "uuid-string",
  "stockCode": "string",
  "stockName": "string",
  "voteType": "UP | DOWN",
  "voteTypeText": "상승 | 하락",
  "votingDate": "YYYY-MM-DD",
  "confidenceLevel": "number | null",
  "predictionReason": "string | null",
  "canChangeVote": "boolean",
  "isResultCalculated": "boolean",
  "isCorrect": "boolean | null",
  "pointsEarned": "number | null",
  "createdAt": "ISO-8601 DateTime",
  "updatedAt": "ISO-8601 DateTime"
}
```

### VotingDashboardItem
```json
{
  "stock": "StockInfo",
  "voteStatistics": "VoteStatistics",
  "userVote": "UserVote | null"
}
```

### VotingDashboardResponse
```json
{
  "votingDate": "YYYY-MM-DD",
  "items": "VotingDashboardItem[]",
  "totalActiveStocks": "number",
  "votingWindowOpen": "boolean",
  "marketStatus": "string",
  "kospiItem": "VotingDashboardItem",
  "featuredStocks": "VotingDashboardItem[]"
}
```

## 7.4 Validation Rules

### Email Validation
- 정규식: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- 최대 길이: 100자
- 중복 불허

### Password Validation
- 최소 길이: 8자
- 최대 길이: 128자
- 필수 포함: 대문자, 소문자, 숫자, 특수문자

### Username Validation
- 길이: 2-20자
- 허용 문자: 한글, 영문, 숫자
- 중복 불허
- 금지어 필터링

### StockCode Validation
- 형식: `KOSPI` 또는 6자리 숫자 (`005930`)
- 시스템에 등록된 주식만 허용

---

# 8. 개발자 가이드

## 8.1 환경별 설정
- **개발환경**: `http://localhost:7070/api/v1`
- **테스트환경**: `https://test-api.wouldyoubuy.kr/api/v1`
- **운영환경**: `https://api.wouldyoubuy.kr/api/v1`

## 8.2 API 버전 관리
- 현재 버전: `v1`
- 하위 호환성: 6개월 보장
- 버전 헤더: `Accept: application/vnd.wouldyoubuy.v1+json`

## 8.3 디버깅 및 모니터링
- 요청 추적: `X-Request-ID` 헤더 자동 생성
- 로그 레벨: `ERROR`, `WARN`, `INFO`, `DEBUG`
- 성능 모니터링: 응답 시간 목표 200ms 이내

---

**문서 버전**: 2.0
**최종 업데이트**: 2024-01-15
**담당자**: API 설계팀