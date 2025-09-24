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

---

## 9. Voting System Models

### 9.1 Stock Entity

**Table Name:** `stocks`

**Description:** 주식 정보 및 한국 주식 시장 데이터

```sql
CREATE TABLE stocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL,
    korean_name VARCHAR(100) NOT NULL,
    english_name VARCHAR(100),
    current_price DECIMAL(15,2),
    change_rate DECIMAL(8,4),
    change_amount DECIMAL(15,2),
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    market_type VARCHAR(20) DEFAULT 'KOSPI',
    last_updated TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stocks_code ON stocks(code);
CREATE INDEX idx_stocks_is_primary ON stocks(is_primary);
CREATE INDEX idx_stocks_is_active ON stocks(is_active);
CREATE INDEX idx_stocks_display_order ON stocks(display_order);
CREATE INDEX idx_stocks_market_type ON stocks(market_type);
CREATE INDEX idx_stocks_last_updated ON stocks(last_updated);
```

**Kotlin Data Class:**
```kotlin
@Entity
@Table(name = "stocks")
data class Stock(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID = UUID.randomUUID(),

    @Column(unique = true, nullable = false, length = 20)
    val code: String,

    @Column(name = "korean_name", nullable = false, length = 100)
    val koreanName: String,

    @Column(name = "english_name", length = 100)
    val englishName: String? = null,

    @Column(name = "current_price", precision = 15, scale = 2)
    val currentPrice: BigDecimal? = null,

    @Column(name = "change_rate", precision = 8, scale = 4)
    val changeRate: BigDecimal? = null,

    @Column(name = "change_amount", precision = 15, scale = 2)
    val changeAmount: BigDecimal? = null,

    @Column(name = "is_primary")
    val isPrimary: Boolean = false,

    @Column(name = "is_active")
    val isActive: Boolean = true,

    @Column(name = "display_order")
    val displayOrder: Int = 0,

    @Column(name = "market_type", length = 20)
    val marketType: String = "KOSPI",

    @Column(name = "last_updated")
    val lastUpdated: LocalDateTime? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
)
```

**Business Rules:**
- `is_primary = true` for KOSPI index (featured prominently)
- `display_order` determines ranking in UI (lower = higher priority)
- Korean names required for Korean market localization
- Price data updated via external API integration

### 9.2 Vote Entity

**Table Name:** `votes`

**Description:** 사용자 주식 예측 투표 정보

```sql
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stock_code VARCHAR(20) NOT NULL,
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('UP', 'DOWN')),
    voting_date DATE NOT NULL,
    can_change_vote BOOLEAN DEFAULT true,
    confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 5),
    prediction_reason VARCHAR(500),
    is_result_calculated BOOLEAN DEFAULT false,
    is_correct BOOLEAN,
    points_earned INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, stock_code, voting_date)
);

CREATE INDEX idx_votes_user_id ON votes(user_id);
CREATE INDEX idx_votes_stock_code ON votes(stock_code);
CREATE INDEX idx_votes_voting_date ON votes(voting_date);
CREATE INDEX idx_votes_vote_type ON votes(vote_type);
CREATE INDEX idx_votes_is_result_calculated ON votes(is_result_calculated);
CREATE INDEX idx_votes_user_voting_date ON votes(user_id, voting_date);
CREATE INDEX idx_votes_stock_voting_date ON votes(stock_code, voting_date);
```

**Kotlin Data Class:**
```kotlin
@Entity
@Table(
    name = "votes",
    uniqueConstraints = [
        UniqueConstraint(columnNames = ["user_id", "stock_code", "voting_date"])
    ]
)
data class Vote(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID = UUID.randomUUID(),

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    val user: User,

    @Column(name = "stock_code", nullable = false, length = 20)
    val stockCode: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "vote_type", nullable = false, length = 10)
    val voteType: VoteType,

    @Column(name = "voting_date", nullable = false)
    val votingDate: LocalDate,

    @Column(name = "can_change_vote")
    val canChangeVote: Boolean = true,

    @Column(name = "confidence_level")
    val confidenceLevel: Int? = null,

    @Column(name = "prediction_reason", length = 500)
    val predictionReason: String? = null,

    @Column(name = "is_result_calculated")
    val isResultCalculated: Boolean = false,

    @Column(name = "is_correct")
    val isCorrect: Boolean? = null,

    @Column(name = "points_earned")
    val pointsEarned: Int? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
)

enum class VoteType {
    UP,
    DOWN;

    companion object {
        const val CORRECT_POINTS = 10
        const val KOSPI_POINTS = 15
        const val INCORRECT_PENALTY = -5
    }
}
```

**Business Rules:**
- One vote per user per stock per day (unique constraint)
- Voting window: market close (3:30 PM) to market open next day (9:00 AM)
- KOSPI predictions earn bonus points (15 vs 10)
- `can_change_vote` allows modification before market open
- Results calculated after market close next day

---

## 10. Voting System Relationships

### Entity Relationship Diagram (Voting Extension)

```
users (1) ─────── (N) votes
stocks (1) ─────── (N) votes [via stock_code]

user_profiles (1) ─────── calculated from votes statistics
```

### Relationship Details

1. **User → Votes**: One-to-Many relationship
   - User can have multiple votes across different dates and stocks
   - Cascade delete: votes removed if user deleted

2. **Stock → Votes**: One-to-Many via stock_code
   - Stock code used instead of FK for flexibility
   - Votes reference stock_code for easier querying

3. **User Profile Statistics**: Calculated from votes
   - `total_predictions`: Count of user's votes
   - `correct_predictions`: Count where `is_correct = true`
   - `total_points`: Sum of `points_earned`
   - `current_streak`: Consecutive correct predictions
   - `longest_streak`: Historical best streak
   - `last_prediction_date`: Most recent voting activity

---

## 11. Voting System Indexes and Performance

### Query Optimization Indexes

1. **Daily Voting Queries**:
   - `idx_votes_user_voting_date`: User's votes for specific date
   - `idx_votes_stock_voting_date`: Community votes for stock/date

2. **Statistics Calculations**:
   - `idx_votes_is_result_calculated`: Find unprocessed votes
   - `idx_votes_user_id`: User statistics aggregation

3. **Leaderboard Queries**:
   - `idx_user_profiles_total_points`: Ranking by points
   - Votes table supports accuracy calculations

### Performance Considerations

- Vote uniqueness enforced at database level
- Voting date stored as DATE for efficient daily queries
- Stock code as VARCHAR for flexible external API integration
- Separate result calculation flag for batch processing

---

## 12. Voting System Database Functions

### Vote Statistics Function

```sql
CREATE OR REPLACE FUNCTION get_vote_statistics(
    p_stock_code VARCHAR(20),
    p_voting_date DATE
)
RETURNS TABLE (
    up_votes BIGINT,
    down_votes BIGINT,
    total_votes BIGINT,
    up_percentage DECIMAL(5,2),
    down_percentage DECIMAL(5,2)
);
```

### User Accuracy Function

```sql
CREATE OR REPLACE FUNCTION calculate_user_accuracy(p_user_id UUID)
RETURNS TABLE (
    total_predictions BIGINT,
    correct_predictions BIGINT,
    accuracy_rate DECIMAL(5,2),
    total_points INTEGER
);
```

### Daily Voting Dashboard View

```sql
CREATE VIEW daily_voting_dashboard AS
SELECT
    s.code,
    s.korean_name,
    s.current_price,
    s.change_rate,
    s.is_primary,
    vote_statistics.*
FROM stocks s
LEFT JOIN vote_statistics ON s.code = vote_statistics.stock_code
WHERE s.is_active = true
ORDER BY s.is_primary DESC, s.display_order ASC;
```

---

## 13. Initial Stock Data

### Pre-loaded Korean Stocks

The system includes pre-loaded data for major Korean stocks:

1. **KOSPI Index** (Primary)
   - Code: "KOSPI"
   - Korean Name: "코스피"
   - `is_primary = true`

2. **Major Stocks** (Featured)
   - 삼성전자 (005930)
   - SK하이닉스 (000660)
   - 네이버 (035420)
   - 카카오 (035720)
   - LG화학 (051910)
   - 삼성SDI (006400)
   - 삼성바이오로직스 (207940)
   - 셀트리온 (068270)
   - 삼성물산 (028260)
   - LG전자 (066570)

All stocks include Korean names for proper localization and are ordered by `display_order` for consistent UI presentation.