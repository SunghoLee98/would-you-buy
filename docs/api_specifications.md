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