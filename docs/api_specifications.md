# API Specifications - 살래말래 Platform

## Authentication & User Management API

### Base URL
```
http://localhost:7070/api/v1
```

### Authentication Method
JWT (JSON Web Token) based authentication with Bearer token in Authorization header.

---

## 1. User Registration API

### 1.1 Register New User

**Endpoint:** `POST /auth/register`

**Description:** 새로운 사용자 계정 생성

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "string",
  "password": "string",
  "username": "string",
  "termsAccepted": boolean
}
```

**Field Validations:**
- `email`: Required, valid email format, unique in system
- `password`: Required, minimum 8 characters, must contain uppercase, lowercase, number, and special character
- `username`: Required, 2-20 characters, Korean/English/numbers only, unique in system
- `termsAccepted`: Required, must be true

**Response - Success (201 Created):**
```json
{
  "success": true,
  "message": "회원가입이 완료되었습니다.",
  "data": {
    "userId": "uuid",
    "email": "string",
    "username": "string",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

**Response - Error (400 Bad Request):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "입력값이 올바르지 않습니다.",
    "details": {
      "email": "이미 사용중인 이메일입니다.",
      "password": "비밀번호는 최소 8자 이상이어야 합니다."
    }
  }
}
```

---

## 2. Authentication API

### 2.1 User Login

**Endpoint:** `POST /auth/login`

**Description:** 사용자 로그인 및 JWT 토큰 발급

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response - Success (200 OK):**
```json
{
  "success": true,
  "message": "로그인 성공",
  "data": {
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token",
    "tokenType": "Bearer",
    "expiresIn": 3600,
    "user": {
      "userId": "uuid",
      "email": "string",
      "username": "string",
      "role": "USER"
    }
  }
}
```

**Response - Error (401 Unauthorized):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "이메일 또는 비밀번호가 올바르지 않습니다."
  }
}
```

### 2.2 Refresh Access Token

**Endpoint:** `POST /auth/refresh`

**Description:** Refresh token을 사용하여 새로운 access token 발급

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "refreshToken": "string"
}
```

**Response - Success (200 OK):**
```json
{
  "success": true,
  "message": "토큰이 갱신되었습니다.",
  "data": {
    "accessToken": "new_jwt_access_token",
    "tokenType": "Bearer",
    "expiresIn": 3600
  }
}
```

### 2.3 Logout

**Endpoint:** `POST /auth/logout`

**Description:** 사용자 로그아웃 및 refresh token 무효화

**Request Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "refreshToken": "string"
}
```

**Response - Success (200 OK):**
```json
{
  "success": true,
  "message": "로그아웃되었습니다."
}
```

---

## 3. User Profile API

### 3.1 Get Current User Profile

**Endpoint:** `GET /users/me`

**Description:** 현재 로그인한 사용자 정보 조회

**Request Headers:**
```
Authorization: Bearer {access_token}
```

**Response - Success (200 OK):**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "email": "string",
    "username": "string",
    "role": "USER",
    "statistics": {
      "totalPredictions": 0,
      "correctPredictions": 0,
      "accuracyRate": 0.0,
      "totalPoints": 0,
      "currentStreak": 0,
      "longestStreak": 0
    },
    "createdAt": "2024-01-01T00:00:00Z",
    "lastLoginAt": "2024-01-01T00:00:00Z"
  }
}
```

### 3.2 Check Email Availability

**Endpoint:** `GET /auth/check-email`

**Description:** 이메일 중복 확인

**Query Parameters:**
- `email`: string (required)

**Response - Success (200 OK):**
```json
{
  "success": true,
  "data": {
    "available": boolean,
    "message": "사용 가능한 이메일입니다." // or "이미 사용중인 이메일입니다."
  }
}
```

### 3.3 Check Username Availability

**Endpoint:** `GET /auth/check-username`

**Description:** 사용자명 중복 확인

**Query Parameters:**
- `username`: string (required)

**Response - Success (200 OK):**
```json
{
  "success": true,
  "data": {
    "available": boolean,
    "message": "사용 가능한 닉네임입니다." // or "이미 사용중인 닉네임입니다."
  }
}
```

---

## 4. Password Management API

### 4.1 Request Password Reset

**Endpoint:** `POST /auth/forgot-password`

**Description:** 비밀번호 재설정 요청 (이메일 발송)

**Request Body:**
```json
{
  "email": "string"
}
```

**Response - Success (200 OK):**
```json
{
  "success": true,
  "message": "비밀번호 재설정 링크가 이메일로 발송되었습니다."
}
```

### 4.2 Reset Password

**Endpoint:** `POST /auth/reset-password`

**Description:** 새 비밀번호 설정

**Request Body:**
```json
{
  "token": "string",
  "newPassword": "string"
}
```

**Response - Success (200 OK):**
```json
{
  "success": true,
  "message": "비밀번호가 성공적으로 변경되었습니다."
}
```

---

## 5. Social Login API (OAuth 2.0)

### 5.1 Social Login Initiation

**Endpoint:** `GET /auth/oauth/{provider}`

**Description:** 소셜 로그인 시작 (리다이렉트)

**Path Parameters:**
- `provider`: string (google, kakao, naver)

**Response:** 302 Redirect to OAuth provider

### 5.2 OAuth Callback

**Endpoint:** `GET /auth/oauth/{provider}/callback`

**Description:** OAuth 제공자로부터의 콜백 처리

**Query Parameters:**
- `code`: string
- `state`: string

**Response - Success:** Redirect to frontend with tokens in URL parameters

---

## Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 입력값 검증 실패 | 400 |
| `INVALID_CREDENTIALS` | 잘못된 로그인 정보 | 401 |
| `TOKEN_EXPIRED` | 토큰 만료 | 401 |
| `TOKEN_INVALID` | 유효하지 않은 토큰 | 401 |
| `USER_NOT_FOUND` | 사용자를 찾을 수 없음 | 404 |
| `EMAIL_ALREADY_EXISTS` | 이메일 중복 | 409 |
| `USERNAME_ALREADY_EXISTS` | 사용자명 중복 | 409 |
| `RATE_LIMIT_EXCEEDED` | 요청 한도 초과 | 429 |
| `INTERNAL_SERVER_ERROR` | 서버 내부 오류 | 500 |

---

## Rate Limiting

- Registration: 5 requests per IP per hour
- Login: 10 attempts per email per hour
- Password reset: 3 requests per email per day
- API calls with valid token: 1000 requests per hour

---

## Security Headers

All API responses include:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

---

## JWT Token Structure

### Access Token Claims
```json
{
  "sub": "user_id",
  "email": "user_email",
  "username": "username",
  "role": "USER",
  "iat": 1234567890,
  "exp": 1234571490
}
```

### Token Expiration
- Access Token: 1 hour
- Refresh Token: 30 days

---

## CORS Configuration

Allowed Origins:
- `http://localhost:5000` (frontend development)
- Production frontend URL (to be configured)

Allowed Methods: GET, POST, PUT, DELETE, OPTIONS
Allowed Headers: Authorization, Content-Type, X-Requested-With

---

# Voting Dashboard API Specifications

## Overview
This section outlines the REST API specifications for the voting dashboard feature, allowing users to vote on stock price predictions.

## Base Configuration
- **Base URL**: `http://localhost:7070/api/v1`
- **Authentication**: JWT Bearer token (for user-specific operations)
- **Content-Type**: `application/json`
- **Response Format**: JSON with consistent structure

## Common Response Structure
```json
{
  "success": boolean,
  "message": string,
  "data": object | array | null,
  "timestamp": "2024-01-15T10:30:00Z",
  "errors": array | null
}
```

## 1. Stock Information APIs

### 1.1 Get Current Voting Stocks
Retrieves the list of stocks available for voting, with KOSPI as the primary highlight.

**Endpoint**: `GET /stocks/voting`

**Response**:
```json
{
  "success": true,
  "message": "투표 가능한 주식 목록을 성공적으로 조회했습니다",
  "data": {
    "kospi": {
      "code": "KOSPI",
      "name": "코스피",
      "current_price": 2650.50,
      "change_rate": 1.25,
      "change_amount": 32.75,
      "is_primary": true,
      "last_updated": "2024-01-15T15:30:00Z"
    },
    "stocks": [
      {
        "code": "005930",
        "name": "삼성전자",
        "current_price": 75000,
        "change_rate": -0.8,
        "change_amount": -600,
        "is_primary": false,
        "last_updated": "2024-01-15T15:30:00Z"
      },
      {
        "code": "000660",
        "name": "SK하이닉스",
        "current_price": 125000,
        "change_rate": 2.1,
        "change_amount": 2575,
        "is_primary": false,
        "last_updated": "2024-01-15T15:30:00Z"
      }
    ]
  },
  "timestamp": "2024-01-15T15:35:00Z"
}
```

### 1.2 Get Stock Details
Retrieves detailed information for a specific stock.

**Endpoint**: `GET /stocks/{stockCode}`

**Path Parameters**:
- `stockCode`: Stock code (e.g., "005930", "KOSPI")

**Response**:
```json
{
  "success": true,
  "message": "주식 정보를 성공적으로 조회했습니다",
  "data": {
    "code": "005930",
    "name": "삼성전자",
    "current_price": 75000,
    "change_rate": -0.8,
    "change_amount": -600,
    "is_primary": false,
    "market_cap": "447조원",
    "volume": 12500000,
    "last_updated": "2024-01-15T15:30:00Z"
  },
  "timestamp": "2024-01-15T15:35:00Z"
}
```

## 2. Voting APIs

### 2.1 Get Vote Statistics
Retrieves voting statistics for all stocks or a specific stock.

**Endpoint**: `GET /votes/statistics`

**Query Parameters** (Optional):
- `stockCode`: Filter by specific stock code

**Response**:
```json
{
  "success": true,
  "message": "투표 통계를 성공적으로 조회했습니다",
  "data": [
    {
      "stock_code": "KOSPI",
      "stock_name": "코스피",
      "up_votes": 1250,
      "down_votes": 875,
      "total_votes": 2125,
      "up_ratio": 58.8,
      "down_ratio": 41.2,
      "rank": 1,
      "is_primary": true
    },
    {
      "stock_code": "005930",
      "stock_name": "삼성전자",
      "up_votes": 980,
      "down_votes": 720,
      "total_votes": 1700,
      "up_ratio": 57.6,
      "down_ratio": 42.4,
      "rank": 2,
      "is_primary": false
    }
  ],
  "timestamp": "2024-01-15T15:35:00Z"
}
```

### 2.2 Submit Vote
Submits a user's vote for a specific stock.

**Endpoint**: `POST /votes`

**Authentication**: Required (JWT Bearer token)

**Request Body**:
```json
{
  "stock_code": "005930",
  "vote_type": "UP"
}
```

**Request Fields**:
- `stock_code`: Stock code (required)
- `vote_type`: "UP" or "DOWN" (required)

**Response** (Success):
```json
{
  "success": true,
  "message": "투표가 성공적으로 등록되었습니다",
  "data": {
    "vote_id": "123e4567-e89b-12d3-a456-426614174000",
    "stock_code": "005930",
    "stock_name": "삼성전자",
    "vote_type": "UP",
    "voted_at": "2024-01-15T15:35:00Z",
    "can_change_vote": true
  },
  "timestamp": "2024-01-15T15:35:00Z"
}
```

**Error Response** (Already voted):
```json
{
  "success": false,
  "message": "이미 해당 주식에 투표하셨습니다",
  "data": null,
  "timestamp": "2024-01-15T15:35:00Z",
  "errors": [
    {
      "code": "ALREADY_VOTED",
      "field": "stock_code",
      "message": "오늘 이미 005930 주식에 투표하셨습니다"
    }
  ]
}
```

### 2.3 Update Vote
Updates a user's existing vote for a specific stock.

**Endpoint**: `PUT /votes/{voteId}`

**Authentication**: Required (JWT Bearer token)

**Path Parameters**:
- `voteId`: UUID of the vote to update

**Request Body**:
```json
{
  "vote_type": "DOWN"
}
```

**Response**:
```json
{
  "success": true,
  "message": "투표가 성공적으로 수정되었습니다",
  "data": {
    "vote_id": "123e4567-e89b-12d3-a456-426614174000",
    "stock_code": "005930",
    "stock_name": "삼성전자",
    "vote_type": "DOWN",
    "voted_at": "2024-01-15T15:35:00Z",
    "updated_at": "2024-01-15T15:40:00Z"
  },
  "timestamp": "2024-01-15T15:40:00Z"
}
```

### 2.4 Get User's Votes
Retrieves the current user's votes for today.

**Endpoint**: `GET /votes/my-votes`

**Authentication**: Required (JWT Bearer token)

**Query Parameters** (Optional):
- `date`: Filter by specific date (format: YYYY-MM-DD, default: today)

**Response**:
```json
{
  "success": true,
  "message": "내 투표 목록을 성공적으로 조회했습니다",
  "data": {
    "date": "2024-01-15",
    "votes": [
      {
        "vote_id": "123e4567-e89b-12d3-a456-426614174000",
        "stock_code": "KOSPI",
        "stock_name": "코스피",
        "vote_type": "UP",
        "voted_at": "2024-01-15T10:30:00Z",
        "can_change_vote": true
      },
      {
        "vote_id": "123e4567-e89b-12d3-a456-426614174001",
        "stock_code": "005930",
        "stock_name": "삼성전자",
        "vote_type": "DOWN",
        "voted_at": "2024-01-15T11:45:00Z",
        "can_change_vote": true
      }
    ],
    "total_votes": 2
  },
  "timestamp": "2024-01-15T15:35:00Z"
}
```

## 3. Mock Data Service APIs

### 3.1 Update Mock Stock Price
Updates mock stock price data (for development/testing).

**Endpoint**: `POST /mock/stocks/{stockCode}/price`

**Authentication**: Admin only (development environment)

**Path Parameters**:
- `stockCode`: Stock code to update

**Request Body**:
```json
{
  "current_price": 76000,
  "change_rate": 1.33,
  "change_amount": 1000
}
```

**Response**:
```json
{
  "success": true,
  "message": "모의 주식 가격이 성공적으로 업데이트되었습니다",
  "data": {
    "code": "005930",
    "name": "삼성전자",
    "current_price": 76000,
    "change_rate": 1.33,
    "change_amount": 1000,
    "last_updated": "2024-01-15T15:35:00Z"
  },
  "timestamp": "2024-01-15T15:35:00Z"
}
```

### 3.2 Reset Mock Data
Resets all mock data to default values.

**Endpoint**: `POST /mock/reset`

**Authentication**: Admin only (development environment)

**Response**:
```json
{
  "success": true,
  "message": "모의 데이터가 성공적으로 초기화되었습니다",
  "data": {
    "reset_stocks": 10,
    "reset_votes": 0,
    "reset_at": "2024-01-15T15:35:00Z"
  },
  "timestamp": "2024-01-15T15:35:00Z"
}
```

## 4. Real-time WebSocket APIs

### 4.1 Vote Statistics Updates
Real-time updates for vote statistics changes.

**WebSocket Endpoint**: `ws://localhost:7070/ws/votes`

**Authentication**: JWT token in connection header

**Subscription Message**:
```json
{
  "action": "subscribe",
  "type": "vote_statistics",
  "stock_codes": ["KOSPI", "005930", "000660"]
}
```

**Real-time Update Message**:
```json
{
  "type": "vote_statistics_update",
  "data": {
    "stock_code": "005930",
    "stock_name": "삼성전자",
    "up_votes": 981,
    "down_votes": 720,
    "total_votes": 1701,
    "up_ratio": 57.7,
    "down_ratio": 42.3,
    "rank": 2
  },
  "timestamp": "2024-01-15T15:35:00Z"
}
```

## 5. Error Codes (Voting Dashboard)

| Code | HTTP Status | Message | Description |
|------|-------------|---------|-------------|
| STOCK_NOT_FOUND | 404 | 주식을 찾을 수 없습니다 | Stock code does not exist |
| ALREADY_VOTED | 409 | 이미 해당 주식에 투표하셨습니다 | User already voted for this stock today |
| VOTE_NOT_FOUND | 404 | 투표를 찾을 수 없습니다 | Vote ID does not exist |
| VOTING_CLOSED | 400 | 투표 시간이 아닙니다 | Voting is only allowed after market close |
| INVALID_VOTE_TYPE | 400 | 올바르지 않은 투표 유형입니다 | Vote type must be UP or DOWN |
| MOCK_DATA_ERROR | 500 | 모의 데이터 처리 중 오류가 발생했습니다 | Error in mock data processing |

## 6. Rate Limiting (Voting Dashboard)

- **Voting**: 10 votes per minute per user
- **Statistics**: 60 requests per minute per IP
- **Stock Information**: 120 requests per minute per IP
- **WebSocket**: 1 connection per user
- **Mock Data Updates**: 5 requests per minute (admin only)

## 7. API Versioning

- Current version: `v1`
- Version header: `Accept: application/vnd.wouldyoubuy.v1+json`
- Backward compatibility maintained for 6 months after version release