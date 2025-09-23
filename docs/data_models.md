# Data Models - 살래말래 Platform

## Database Configuration
- **Database Type:** PostgreSQL
- **Connection:** localhost:5432
- **Database Name:** salae_malae_db
- **Schema:** public

---

## 1. User Management Models

### 1.1 User Entity

**Table Name:** `users`

**Description:** 사용자 계정 정보 저장

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    is_active BOOLEAN DEFAULT true,
    is_email_verified BOOLEAN DEFAULT false,
    terms_accepted_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_created_at ON users(created_at);
```

**Kotlin Data Class:**
```kotlin
@Entity
@Table(name = "users")
data class User(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID = UUID.randomUUID(),

    @Column(unique = true, nullable = false)
    val email: String,

    @Column(unique = true, nullable = false, length = 50)
    val username: String,

    @Column(name = "password_hash", nullable = false)
    val passwordHash: String,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    val role: UserRole = UserRole.USER,

    @Column(name = "is_active")
    val isActive: Boolean = true,

    @Column(name = "is_email_verified")
    val isEmailVerified: Boolean = false,

    @Column(name = "terms_accepted_at")
    val termsAcceptedAt: LocalDateTime? = null,

    @Column(name = "created_at", nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    val updatedAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "deleted_at")
    val deletedAt: LocalDateTime? = null
)

enum class UserRole {
    USER,
    PREMIUM,
    ADMIN
}
```

### 1.2 User Profile Entity

**Table Name:** `user_profiles`

**Description:** 사용자 프로필 및 통계 정보

```sql
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    avatar_url VARCHAR(500),
    bio VARCHAR(500),
    total_predictions INTEGER DEFAULT 0,
    correct_predictions INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_prediction_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_total_points ON user_profiles(total_points DESC);
```

**Kotlin Data Class:**
```kotlin
@Entity
@Table(name = "user_profiles")
data class UserProfile(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID = UUID.randomUUID(),

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    val user: User,

    @Column(name = "avatar_url", length = 500)
    val avatarUrl: String? = null,

    @Column(length = 500)
    val bio: String? = null,

    @Column(name = "total_predictions")
    val totalPredictions: Int = 0,

    @Column(name = "correct_predictions")
    val correctPredictions: Int = 0,

    @Column(name = "total_points")
    val totalPoints: Int = 0,

    @Column(name = "current_streak")
    val currentStreak: Int = 0,

    @Column(name = "longest_streak")
    val longestStreak: Int = 0,

    @Column(name = "last_prediction_date")
    val lastPredictionDate: LocalDate? = null,

    @Column(name = "created_at", nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    val updatedAt: LocalDateTime = LocalDateTime.now()
) {
    val accuracyRate: Double
        get() = if (totalPredictions > 0) {
            (correctPredictions.toDouble() / totalPredictions) * 100
        } else 0.0
}
```

---

## 2. Authentication Models

### 2.1 Refresh Token Entity

**Table Name:** `refresh_tokens`

**Description:** JWT refresh token 저장 및 관리

```sql
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    device_info VARCHAR(255),
    ip_address INET,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
```

**Kotlin Data Class:**
```kotlin
@Entity
@Table(name = "refresh_tokens")
data class RefreshToken(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID = UUID.randomUUID(),

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    val user: User,

    @Column(unique = true, nullable = false, length = 500)
    val token: String,

    @Column(name = "device_info")
    val deviceInfo: String? = null,

    @Column(name = "ip_address")
    val ipAddress: String? = null,

    @Column(name = "expires_at", nullable = false)
    val expiresAt: LocalDateTime,

    @Column(name = "revoked_at")
    val revokedAt: LocalDateTime? = null,

    @Column(name = "created_at", nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
) {
    fun isExpired(): Boolean = LocalDateTime.now().isAfter(expiresAt)
    fun isRevoked(): Boolean = revokedAt != null
    fun isValid(): Boolean = !isExpired() && !isRevoked()
}
```

### 2.2 Password Reset Token Entity

**Table Name:** `password_reset_tokens`

**Description:** 비밀번호 재설정 토큰 관리

```sql
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
```

**Kotlin Data Class:**
```kotlin
@Entity
@Table(name = "password_reset_tokens")
data class PasswordResetToken(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID = UUID.randomUUID(),

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    val user: User,

    @Column(unique = true, nullable = false)
    val token: String,

    @Column(name = "expires_at", nullable = false)
    val expiresAt: LocalDateTime,

    @Column(name = "used_at")
    val usedAt: LocalDateTime? = null,

    @Column(name = "created_at", nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
) {
    fun isExpired(): Boolean = LocalDateTime.now().isAfter(expiresAt)
    fun isUsed(): Boolean = usedAt != null
    fun isValid(): Boolean = !isExpired() && !isUsed()
}
```

### 2.3 Login History Entity

**Table Name:** `login_history`

**Description:** 사용자 로그인 기록

```sql
CREATE TABLE login_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,
    login_type VARCHAR(20) NOT NULL,
    success BOOLEAN NOT NULL,
    failure_reason VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_login_history_user_id ON login_history(user_id);
CREATE INDEX idx_login_history_created_at ON login_history(created_at DESC);
```

**Kotlin Data Class:**
```kotlin
@Entity
@Table(name = "login_history")
data class LoginHistory(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID = UUID.randomUUID(),

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    val user: User,

    @Column(name = "ip_address")
    val ipAddress: String? = null,

    @Column(name = "user_agent", columnDefinition = "TEXT")
    val userAgent: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "login_type", nullable = false, length = 20)
    val loginType: LoginType,

    @Column(nullable = false)
    val success: Boolean,

    @Column(name = "failure_reason", length = 100)
    val failureReason: String? = null,

    @Column(name = "created_at", nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
)

enum class LoginType {
    EMAIL,
    GOOGLE,
    KAKAO,
    NAVER
}
```

---

## 3. OAuth Integration Models

### 3.1 OAuth Account Entity

**Table Name:** `oauth_accounts`

**Description:** 소셜 로그인 계정 연동 정보

```sql
CREATE TABLE oauth_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(20) NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    name VARCHAR(100),
    avatar_url VARCHAR(500),
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider, provider_user_id)
);

CREATE INDEX idx_oauth_accounts_user_id ON oauth_accounts(user_id);
CREATE INDEX idx_oauth_accounts_provider ON oauth_accounts(provider, provider_user_id);
```

**Kotlin Data Class:**
```kotlin
@Entity
@Table(
    name = "oauth_accounts",
    uniqueConstraints = [
        UniqueConstraint(columnNames = ["provider", "provider_user_id"])
    ]
)
data class OAuthAccount(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID = UUID.randomUUID(),

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    val user: User,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    val provider: OAuthProvider,

    @Column(name = "provider_user_id", nullable = false)
    val providerUserId: String,

    @Column
    val email: String? = null,

    @Column(length = 100)
    val name: String? = null,

    @Column(name = "avatar_url", length = 500)
    val avatarUrl: String? = null,

    @Column(name = "access_token", columnDefinition = "TEXT")
    val accessToken: String? = null,

    @Column(name = "refresh_token", columnDefinition = "TEXT")
    val refreshToken: String? = null,

    @Column(name = "token_expires_at")
    val tokenExpiresAt: LocalDateTime? = null,

    @Column(name = "created_at", nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    val updatedAt: LocalDateTime = LocalDateTime.now()
)

enum class OAuthProvider {
    GOOGLE,
    KAKAO,
    NAVER
}
```

---

## 4. Audit and Security Models

### 4.1 Audit Log Entity

**Table Name:** `audit_logs`

**Description:** 시스템 감사 로그

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id VARCHAR(100),
    old_value JSONB,
    new_value JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

### 4.2 Rate Limit Entity

**Table Name:** `rate_limits`

**Description:** API 요청 제한 추적

```sql
CREATE TABLE rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier VARCHAR(255) NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMP NOT NULL,
    window_end TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(identifier, endpoint, window_start)
);

CREATE INDEX idx_rate_limits_identifier ON rate_limits(identifier, endpoint);
CREATE INDEX idx_rate_limits_window ON rate_limits(window_end);
```

---

## 5. Database Relationships

### Entity Relationship Diagram (ERD)

```
users (1) ─────── (1) user_profiles
  │
  ├─── (1) ─────── (N) refresh_tokens
  │
  ├─── (1) ─────── (N) password_reset_tokens
  │
  ├─── (1) ─────── (N) login_history
  │
  ├─── (1) ─────── (N) oauth_accounts
  │
  └─── (1) ─────── (N) audit_logs
```

---

## 6. Database Indexes Strategy

### Performance Optimization Indexes
1. **Primary Keys**: UUID with automatic indexing
2. **Foreign Keys**: Indexed for join operations
3. **Unique Constraints**: Email, username, tokens
4. **Query Optimization**: Created_at for temporal queries
5. **Ranking Queries**: Total_points for leaderboard

---

## 7. Data Types and Constraints

### Validation Rules
- **Email**: RFC 5322 compliant email validation
- **Username**: 2-20 characters, alphanumeric + Korean
- **Password**: Bcrypt hashed, never stored in plain text
- **UUID**: Version 4 UUID for all primary keys
- **Timestamps**: UTC timezone, ISO 8601 format

### Default Values
- `created_at`: CURRENT_TIMESTAMP
- `updated_at`: CURRENT_TIMESTAMP (with trigger for updates)
- `is_active`: true
- `role`: 'USER'
- Statistical fields: 0

---

## 8. Migration Strategy

### Initial Migration Order
1. Create users table
2. Create user_profiles table with foreign key
3. Create authentication related tables
4. Create oauth_accounts table
5. Create audit and security tables
6. Add indexes and constraints

### Rollback Strategy
- Each migration must have corresponding rollback script
- Test rollback in staging before production deployment
- Maintain migration version history