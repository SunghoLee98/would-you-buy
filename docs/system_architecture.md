# System Architecture - 살래말래 Platform

## 1. Overview

### 1.1 Architecture Style
- **Pattern:** Layered Architecture with Domain-Driven Design (DDD) principles
- **API Style:** RESTful with JWT authentication
- **Framework:** Spring Boot 3.x with Kotlin
- **Database:** PostgreSQL 15+

### 1.2 Core Design Principles
- **Security First:** All endpoints secured by default, explicit public access
- **Stateless Authentication:** JWT tokens for horizontal scalability
- **Clean Architecture:** Clear separation of concerns between layers
- **Fail-Safe Design:** Graceful error handling and circuit breakers
- **Korean Market Focus:** All user-facing messages in Korean

---

## 2. Authentication Architecture

### 2.1 Authentication Flow

```
┌──────────┐      ┌──────────┐      ┌──────────────┐      ┌──────────┐
│  Client  │──────│   API    │──────│   Service    │──────│    DB    │
│(Frontend)│      │ Gateway  │      │    Layer     │      │PostgreSQL│
└──────────┘      └──────────┘      └──────────────┘      └──────────┘
     │                 │                    │                    │
     │   1. Login      │                    │                    │
     │   Request       │                    │                    │
     │────────────────>│                    │                    │
     │                 │  2. Validate       │                    │
     │                 │  Credentials       │                    │
     │                 │───────────────────>│                    │
     │                 │                    │  3. Query User    │
     │                 │                    │───────────────────>│
     │                 │                    │<───────────────────│
     │                 │                    │  4. User Data     │
     │                 │  5. Generate       │                    │
     │                 │  JWT Tokens        │                    │
     │                 │<───────────────────│                    │
     │  6. Return      │                    │                    │
     │  Tokens         │                    │                    │
     │<────────────────│                    │                    │
     │                 │                    │                    │
     │  7. API Call    │                    │                    │
     │  with Token     │                    │                    │
     │────────────────>│                    │                    │
     │                 │  8. Validate JWT   │                    │
     │                 │───────────────────>│                    │
     │                 │  9. Process        │                    │
     │                 │  Request           │                    │
     │                 │───────────────────>│                    │
     │<────────────────│                    │                    │
     │  10. Response   │                    │                    │
```

### 2.2 JWT Token Strategy

#### Token Structure
```kotlin
data class JwtTokenPair(
    val accessToken: String,      // Short-lived (1 hour)
    val refreshToken: String,      // Long-lived (30 days)
    val tokenType: String = "Bearer",
    val expiresIn: Long = 3600
)

data class JwtClaims(
    val sub: String,           // User ID (UUID)
    val email: String,
    val username: String,
    val role: String,
    val iat: Long,            // Issued at
    val exp: Long             // Expiration
)
```

#### Token Lifecycle
1. **Initial Login:** Generate access + refresh tokens
2. **API Calls:** Use access token in Authorization header
3. **Token Expiry:** Use refresh token to get new access token
4. **Logout:** Invalidate refresh token in database
5. **Security:** Rotate refresh tokens on use

### 2.3 Spring Security Configuration

```kotlin
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
class SecurityConfig(
    private val jwtAuthenticationFilter: JwtAuthenticationFilter,
    private val jwtAuthenticationEntryPoint: JwtAuthenticationEntryPoint
) {

    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        return http
            .cors { it.configurationSource(corsConfigurationSource()) }
            .csrf { it.disable() }
            .sessionManagement {
                it.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            }
            .authorizeHttpRequests { auth ->
                auth
                    .requestMatchers("/api/v1/auth/**").permitAll()
                    .requestMatchers("/api/v1/health").permitAll()
                    .requestMatchers("/api/v1/docs/**").permitAll()
                    .anyRequest().authenticated()
            }
            .exceptionHandling {
                it.authenticationEntryPoint(jwtAuthenticationEntryPoint)
            }
            .addFilterBefore(
                jwtAuthenticationFilter,
                UsernamePasswordAuthenticationFilter::class.java
            )
            .build()
    }

    @Bean
    fun passwordEncoder(): PasswordEncoder = BCryptPasswordEncoder(12)

    @Bean
    fun corsConfigurationSource(): CorsConfigurationSource {
        val configuration = CorsConfiguration()
        configuration.allowedOrigins = listOf("http://localhost:5000")
        configuration.allowedMethods = listOf("GET", "POST", "PUT", "DELETE", "OPTIONS")
        configuration.allowedHeaders = listOf("*")
        configuration.allowCredentials = true

        val source = UrlBasedCorsConfigurationSource()
        source.registerCorsConfiguration("/**", configuration)
        return source
    }
}
```

---

## 3. System Layers

### 3.1 Layer Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Presentation Layer                     │
│            (REST Controllers, DTO, Validation)           │
├─────────────────────────────────────────────────────────┤
│                    Application Layer                     │
│          (Services, Business Logic, Use Cases)           │
├─────────────────────────────────────────────────────────┤
│                      Domain Layer                        │
│            (Entities, Domain Logic, Events)              │
├─────────────────────────────────────────────────────────┤
│                  Infrastructure Layer                    │
│      (Repositories, External Services, Security)         │
├─────────────────────────────────────────────────────────┤
│                     Database Layer                       │
│              (PostgreSQL, Connection Pool)               │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Package Structure

```
com.salaemalae
├── SalaeMalaeApplication.kt
├── config/
│   ├── SecurityConfig.kt
│   ├── JwtConfig.kt
│   ├── DatabaseConfig.kt
│   ├── CacheConfig.kt
│   └── AsyncConfig.kt
├── auth/
│   ├── controller/
│   │   ├── AuthController.kt
│   │   └── UserController.kt
│   ├── service/
│   │   ├── AuthService.kt
│   │   ├── JwtService.kt
│   │   └── UserService.kt
│   ├── dto/
│   │   ├── LoginRequest.kt
│   │   ├── RegisterRequest.kt
│   │   ├── TokenResponse.kt
│   │   └── UserResponse.kt
│   ├── domain/
│   │   ├── User.kt
│   │   ├── UserProfile.kt
│   │   └── RefreshToken.kt
│   ├── repository/
│   │   ├── UserRepository.kt
│   │   ├── UserProfileRepository.kt
│   │   └── RefreshTokenRepository.kt
│   ├── security/
│   │   ├── JwtAuthenticationFilter.kt
│   │   ├── JwtTokenProvider.kt
│   │   └── CustomUserDetailsService.kt
│   └── exception/
│       ├── AuthException.kt
│       └── UserNotFoundException.kt
├── common/
│   ├── exception/
│   │   ├── GlobalExceptionHandler.kt
│   │   └── ApiException.kt
│   ├── response/
│   │   ├── ApiResponse.kt
│   │   └── ErrorResponse.kt
│   ├── validation/
│   │   └── ValidationMessages.kt
│   └── util/
│       ├── DateTimeUtil.kt
│       └── StringUtil.kt
└── resources/
    ├── application.yml
    ├── application-dev.yml
    ├── application-prod.yml
    └── db/migration/
        └── V1__create_user_tables.sql
```

---

## 4. Security Architecture

### 4.1 Security Layers

```
┌─────────────────────────────────────────────────────┐
│                  Client Request                      │
└──────────────────────┬───────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────┐
│              CORS Filter                             │
│        (Cross-Origin Request Validation)             │
└──────────────────────┬───────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────┐
│           Rate Limiting Filter                       │
│         (Request Throttling per IP/User)             │
└──────────────────────┬───────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────┐
│         JWT Authentication Filter                    │
│          (Token Validation & Parsing)                │
└──────────────────────┬───────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────┐
│           Authorization Check                        │
│          (Role & Permission Validation)              │
└──────────────────────┬───────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────┐
│            Business Logic Execution                  │
└───────────────────────────────────────────────────────┘
```

### 4.2 Security Measures

#### Password Security
- **Algorithm:** BCrypt with strength 12
- **Validation:** Min 8 chars, uppercase, lowercase, number, special char
- **Storage:** Only hashed passwords stored
- **Reset:** Time-limited tokens (1 hour expiry)

#### Token Security
- **Algorithm:** HMAC SHA-256
- **Secret Management:** Environment variables, rotated regularly
- **Token Rotation:** Refresh tokens rotated on use
- **Blacklisting:** Revoked tokens tracked in database

#### API Security
- **HTTPS Only:** TLS 1.3 enforced in production
- **Rate Limiting:** Per endpoint, per user/IP
- **Input Validation:** DTO validation with Jakarta Validation
- **SQL Injection:** Parameterized queries via JPA
- **XSS Protection:** Content-Type validation, output encoding

---

## 5. Database Architecture

### 5.1 Connection Pool Configuration

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/salae_malae_db
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
```

### 5.2 Transaction Management

```kotlin
@Service
@Transactional
class AuthService {

    @Transactional(propagation = Propagation.REQUIRED)
    fun register(request: RegisterRequest): User {
        // Transaction for user creation
    }

    @Transactional(
        isolation = Isolation.READ_COMMITTED,
        timeout = 5
    )
    fun login(request: LoginRequest): TokenResponse {
        // Transaction with specific isolation level
    }
}
```

### 5.3 Database Migration Strategy

Using Flyway for version control:
- **Location:** `resources/db/migration/`
- **Naming:** `V{version}__{description}.sql`
- **Rollback:** Separate rollback scripts
- **Validation:** Checksum validation on startup

---

## 6. Error Handling Architecture

### 6.1 Exception Hierarchy

```kotlin
sealed class ApiException(
    val code: String,
    override val message: String,
    val httpStatus: HttpStatus
) : RuntimeException(message)

class AuthenticationException(
    message: String = "인증에 실패했습니다."
) : ApiException("AUTH_FAILED", message, HttpStatus.UNAUTHORIZED)

class ValidationException(
    val errors: Map<String, String>
) : ApiException("VALIDATION_ERROR", "입력값이 올바르지 않습니다.", HttpStatus.BAD_REQUEST)

class UserNotFoundException(
    message: String = "사용자를 찾을 수 없습니다."
) : ApiException("USER_NOT_FOUND", message, HttpStatus.NOT_FOUND)
```

### 6.2 Global Exception Handler

```kotlin
@RestControllerAdvice
class GlobalExceptionHandler {

    @ExceptionHandler(ApiException::class)
    fun handleApiException(ex: ApiException): ResponseEntity<ErrorResponse> {
        val errorResponse = ErrorResponse(
            success = false,
            error = ErrorDetail(
                code = ex.code,
                message = ex.message
            )
        )
        return ResponseEntity(errorResponse, ex.httpStatus)
    }

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidationException(
        ex: MethodArgumentNotValidException
    ): ResponseEntity<ErrorResponse> {
        val errors = ex.bindingResult.fieldErrors.associate {
            it.field to (it.defaultMessage ?: "Invalid value")
        }

        val errorResponse = ErrorResponse(
            success = false,
            error = ErrorDetail(
                code = "VALIDATION_ERROR",
                message = "입력값이 올바르지 않습니다.",
                details = errors
            )
        )
        return ResponseEntity(errorResponse, HttpStatus.BAD_REQUEST)
    }
}
```

---

## 7. Performance Optimization

### 7.1 Caching Strategy

```kotlin
@Configuration
@EnableCaching
class CacheConfig {

    @Bean
    fun cacheManager(): CacheManager {
        val cacheManager = CaffeineCacheManager(
            "users",
            "userProfiles",
            "jwtValidation"
        )
        cacheManager.setCaffeine(
            Caffeine.newBuilder()
                .maximumSize(1000)
                .expireAfterWrite(5, TimeUnit.MINUTES)
        )
        return cacheManager
    }
}
```

### 7.2 Async Processing

```kotlin
@Configuration
@EnableAsync
class AsyncConfig {

    @Bean
    fun taskExecutor(): ThreadPoolTaskExecutor {
        val executor = ThreadPoolTaskExecutor()
        executor.corePoolSize = 2
        executor.maxPoolSize = 10
        executor.queueCapacity = 100
        executor.setThreadNamePrefix("Async-")
        executor.initialize()
        return executor
    }
}
```

---

## 8. Monitoring & Observability

### 8.1 Health Checks

```kotlin
@RestController
@RequestMapping("/api/v1/health")
class HealthController {

    @GetMapping
    fun health(): Map<String, Any> {
        return mapOf(
            "status" to "UP",
            "timestamp" to LocalDateTime.now(),
            "service" to "salae-malae-auth"
        )
    }

    @GetMapping("/ready")
    fun readiness(): ResponseEntity<Map<String, Any>> {
        // Check database connection, external services
        return ResponseEntity.ok(
            mapOf("status" to "READY")
        )
    }
}
```

### 8.2 Logging Strategy

```yaml
logging:
  level:
    com.salaemalae: DEBUG
    org.springframework.security: DEBUG
    org.hibernate.SQL: DEBUG
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} - %logger{36} - %msg%n"
    file: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
```

### 8.3 Metrics Collection

- **Authentication Metrics:** Success/failure rates, token generation time
- **Performance Metrics:** API response times, database query times
- **Business Metrics:** User registrations, login frequency
- **System Metrics:** JVM heap, thread pool usage

---

## 9. Deployment Architecture

### 9.1 Environment Configuration

```
Development:
- Backend: http://localhost:7070
- Frontend: http://localhost:5000
- Database: localhost:5432

Production:
- Backend: https://api.salaemalae.com
- Frontend: https://salaemalae.com
- Database: RDS PostgreSQL (Multi-AZ)
```

### 9.2 Docker Configuration

```dockerfile
FROM eclipse-temurin:17-jdk-alpine as builder
WORKDIR /app
COPY . .
RUN ./gradlew bootJar

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/build/libs/*.jar app.jar
EXPOSE 7070
ENTRYPOINT ["java", "-jar", "app.jar"]
```

---

## 10. Social Login Integration (OAuth 2.0)

### 10.1 OAuth Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  User    │────>│  Client  │────>│  OAuth   │────>│  OAuth   │
│          │     │(Frontend)│     │  Server  │     │ Provider │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
     │                │                 │                │
     │   1. Login     │                 │                │
     │   Request      │                 │                │
     │───────────────>│                 │                │
     │                │  2. Redirect    │                │
     │                │  to Provider    │                │
     │                │────────────────────────────────>│
     │                │                 │                │
     │  3. User       │                 │                │
     │  Authorization │                 │                │
     │<──────────────────────────────────────────────────│
     │                │                 │                │
     │  4. Auth Code  │                 │                │
     │───────────────────────────────────────────────────>│
     │                │                 │                │
     │                │  5. Code        │                │
     │                │  Exchange       │                │
     │                │<────────────────│                │
     │                │                 │  6. Token      │
     │                │                 │  Request       │
     │                │                 │───────────────>│
     │                │                 │<───────────────│
     │                │                 │  7. Tokens     │
     │                │  8. Create/     │                │
     │                │  Update User    │                │
     │                │<────────────────│                │
     │  9. JWT        │                 │                │
     │  Tokens        │                 │                │
     │<───────────────│                 │                │
```

### 10.2 Provider Configuration

```kotlin
@Configuration
class OAuth2Config {

    @Bean
    fun googleOAuth2Properties(): OAuth2Properties {
        return OAuth2Properties(
            clientId = "${GOOGLE_CLIENT_ID}",
            clientSecret = "${GOOGLE_CLIENT_SECRET}",
            redirectUri = "http://localhost:7070/api/v1/auth/oauth/google/callback",
            authorizationUri = "https://accounts.google.com/o/oauth2/v2/auth",
            tokenUri = "https://oauth2.googleapis.com/token",
            userInfoUri = "https://www.googleapis.com/oauth2/v3/userinfo"
        )
    }

    // Similar configurations for Kakao and Naver
}
```

---

## 11. Scalability Considerations

### 11.1 Horizontal Scaling Strategy
- **Stateless Design:** JWT tokens enable horizontal scaling
- **Database Pooling:** Connection pool shared across instances
- **Session Management:** No server-side sessions
- **Load Balancing:** Round-robin with health checks

### 11.2 Future Enhancements
- **Redis Cache:** For distributed caching
- **Message Queue:** For async processing
- **Microservices:** Split auth service when needed
- **API Gateway:** Kong or Spring Cloud Gateway