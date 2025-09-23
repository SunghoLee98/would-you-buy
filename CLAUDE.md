# project introduction
- This project is for archiving and sharing knowledge about agent prompt.

# development workflow

1. architect agent: design API specifications, data models, and system architecture
- write result to 'docs/api_specifications.md', 'docs/data_models.md', 'docs/system_architecture.md'
- Any important decisions MUST be documented in CLAUDE.md
- All the main features MUST be written down in CLAUDE.md
- if issue referenced by github issue, create branch with format 'feature/ISSUE_ID-short-description', e.g. 'feature/1-user-authentication'
- if issue referenced by github issue, create pull request end of the feature implementation

2. backend developer agent: implement features based on the architect's designs
- All the backend source code MUST be stored in './backend' directory
- MUST implement features according to the specifications in 'docs/api_specifications.md', 'docs/data_models.md', and 'docs/system_architecture.md'
- MUSH write test code for each feature and make sure all tests pass
- Use context 7 mcp to reference official manual
- Every feature MUST be committed to the git repository with clear commit messages

3. frontend developer agent: design and implement the user interface
- All the frontend source code MUST be stored in './frontend' directory
- Every feature MUST be committed to the git repository with clear commit messages
- Use context 7 mcp to reference official manual
- MUST implement the frontend according to the API specifications in 'docs/api_specifications.md'

4. tester agent: write and execute test cases based on playwrite to ensure the quality of the code
- MUST write E2E tests for the entire system
- use directory './e2e' to store all the e2e test cases
- NEVER modify the implementation code, only write and run tests
- All the tests MUST pass before the project is considered complete

5. rotate roles and repeat steps 1-4 until the e2e tests pass

# environment

- backend: localhost:7070
- frontend: localhost:5001
- database: localhost:5432

# technical stack

- backend: spring boot with kotlin
- database: PostgreSQL
- frontend: React with TypeScript


## 1. Project Overview

### 1.1 Project Name
**살래말래** - Daily Stock Prediction Voting Platform

### 1.2 Project Description
A web-based service where users vote on whether major Korean stocks will rise or fall the next trading day. Users compete for accuracy rankings and earn points based on their prediction success rate.

### 1.3 Core Concept
Transform stock market prediction into an engaging, gamified community experience where users can test their market intuition without financial risk.

## 2. Target Market & Users

### 2.1 Primary Target Users
- Korean retail investors (ages 20-40)
- Stock market enthusiasts and beginners
- People interested in market trends but hesitant to invest real money

### 2.2 Language Requirements
**The service will be provided in Korean language** for the Korean market.

## 3. Core Features (MVP)

### 3.1 Daily Voting System
- **Primary Feature**: KOSPI Index as main highlight with prominent display
- **Featured Stocks**: Display 8-10 major Korean stocks (Samsung Electronics, SK Hynix, Naver, Kakao, etc.)
- **Binary Voting**: Simple UP/DOWN prediction for next trading day
- **Voting Window**: Available from market close (3:30 PM) until market open next day (9:00 AM)
- **Stock Information**: Minimal info - current price, simple % change indicator

### 3.2 User Management
- **Simple Registration**: Email/social login
- **User Profiles**: Username, prediction stats, ranking
- **Guest Mode**: Allow non-registered users to view results

### 3.3 Scoring System
- **Base Points**: +10 points for correct prediction, -5 for incorrect
- **KOSPI Bonus**: +15 points for correct KOSPI prediction (higher weight)
- **Accuracy Tracking**: Overall win rate percentage
- **Daily Streaks**: Bonus points for consecutive correct days

### 3.4 Results & Rankings
- **Daily Results**: Show actual stock performance vs predictions
- **Leaderboards**:
    - Overall accuracy ranking
    - Weekly top performers
    - Longest streak holders
- **Personal Stats**: Individual prediction history and performance

### 3.5 Basic Social Features
- **Community Voting Results**: Show percentage of users who voted UP vs DOWN
- **Simple Comments**: Allow users to share brief reasoning (optional)

## 4. Technical Requirements

### 4.1 Frontend
- **Framework**: React.js or Vue.js
- **Responsive Design**: Web-first approach with mobile responsive optimization
- **Real-time Updates**: WebSocket for live voting counts
- **Animations**: Smooth transitions, voting feedback animations, celebration effects

### 4.2 Backend
- **Framework**: Spring Boot + Kotlin
- **Database**: PostgreSQL for user data and predictions
- **APIs**: Integration with Korea Investment Securities Open API
- **Authentication**: JWT-based user sessions with Spring Security
- **Build Tool**: Gradle with Kotlin DSL

### 4.3 Data Sources
- **Primary API**: Korea Investment Securities Open API for real-time stock data
- **Market Index**: KOSPI index as primary feature with real-time updates
- **Individual Stocks**: Major Korean stocks (Samsung Electronics, SK Hynix, Naver, etc.)
- **Historical Data**: For result verification and user statistics tracking

### 4.4 Infrastructure
- **Hosting**: Cloud platform (AWS/GCP/Azure)
- **CDN**: For fast image and static content delivery
- **Monitoring**: Basic analytics and error tracking

## 5. User Experience & Design

### 5.1 Design Philosophy
- **Game-like Interface**: Colorful, playful design with card-based layout
- **Minimal Information**: Clean, uncluttered interface focusing on essential data only
- **User-friendly**: Intuitive navigation with clear visual feedback
- **Web-first Design**: Optimized for desktop/laptop experience with responsive mobile adaptation

### 5.2 Key UI Components
- **KOSPI Hero Card**: Large, prominent card at top with animated price movements
- **Stock Cards**: Simple, game-like cards with UP/DOWN buttons and minimal info
- **Voting Animations**:
    - Button press feedback with haptic-like visual effects
    - Confetti/celebration animations for correct predictions
    - Smooth transitions between states
- **Progress Indicators**: Animated progress bars for community voting percentages
- **Ranking Display**: Leaderboard with playful avatars and achievement badges

### 5.3 Animation Requirements
- **Micro-interactions**: Button hover states, loading spinners, form feedback
- **Page Transitions**: Smooth slide/fade animations between sections
- **Voting Feedback**: Immediate visual confirmation with color changes and icons
- **Results Reveal**: Dramatic unveiling animations for daily results
- **Achievement Celebrations**: Particle effects for streaks and ranking improvements

### 5.4 Responsive Design Considerations
- **Desktop/Laptop**: Primary design focus with spacious layout and detailed animations
- **Tablet**: Adapted layout maintaining core functionality
- **Mobile**: Simplified but fully functional version with touch-optimized interactions

### 5.5 Daily User Journey
1. **Landing Page**: View KOSPI status and today's featured stocks
2. **Quick Voting**: Simple click/tap UP/DOWN with immediate visual feedback
3. **Community View**: See voting percentages with animated progress bars
4. **Next Day**: Animated results reveal with celebration for correct predictions
5. **Repeat**: Seamless return to new day's voting

## 6. Success Metrics

### 6.1 User Engagement
- **Daily Active Users**: Target 1000+ DAU within 3 months
- **Retention Rate**: 30% weekly retention rate
- **Voting Participation**: 80% of daily users make at least 3 predictions
- **Session Duration**: Average 3-5 minutes per session (quick, engaging experience)

### 6.2 Platform Growth
- **User Registration**: 5000+ registered users in first quarter
- **Community Size**: Active user base of 2000+ regular participants
- **Content Engagement**: Average 5+ stocks voted per user per day

## 7. Revenue Model (Future Consideration)

### 7.1 Potential Monetization
- **Premium Features**: Advanced analytics, more stocks, extended history
- **Advertising**: Financial service partnerships
- **Virtual Currency**: Premium points or cosmetic upgrades
- **Educational Content**: Stock market learning resources

## 8. Sprint 1: Authentication System - Architectural Decisions

### 8.1 Core Architectural Decisions

#### JWT-Based Authentication Strategy
- **Decision**: Use JWT tokens with dual-token approach (access + refresh)
- **Rationale**:
  - Enables horizontal scalability without server-side session storage
  - Stateless authentication suitable for future microservices architecture
  - Industry standard for modern web applications
- **Trade-offs**: Token size overhead vs session scalability

#### Database Design Philosophy
- **Decision**: PostgreSQL with UUID primary keys and audit fields
- **Rationale**:
  - UUID provides better distributed system compatibility
  - Built-in audit fields (created_at, updated_at) for compliance
  - PostgreSQL's JSONB for flexible OAuth provider data storage
- **Implementation**: All tables include standard audit columns

#### Security Architecture
- **Decision**: Spring Security with custom JWT filter chain
- **Key Features**:
  - BCrypt (strength 12) for password hashing
  - Rate limiting per IP and per user
  - Refresh token rotation on use
  - Comprehensive audit logging for security events
- **Korean Market Adaptation**: All error messages in Korean

### 8.2 API Design Standards

#### RESTful Conventions
- **Consistent Response Format**: All APIs return standardized response structure
- **Error Handling**: Detailed error codes with Korean messages
- **Versioning**: URL path versioning (/api/v1/)
- **Documentation**: OpenAPI 3.0 specification ready

#### Performance Considerations
- **Connection Pooling**: HikariCP with 20 max connections
- **Caching Strategy**: Caffeine cache for user profiles and JWT validation
- **Async Processing**: Thread pool for non-blocking operations
- **Response Time Target**: <200ms for authentication endpoints

### 8.3 Development Standards

#### Code Organization
- **Package Structure**: Domain-driven design with clear layer separation
- **Dependency Direction**: Controllers → Services → Repositories
- **DTO Pattern**: Separate request/response DTOs from domain entities
- **Exception Hierarchy**: Custom exception classes with proper HTTP status mapping

#### Testing Requirements
- **Unit Tests**: Minimum 80% code coverage for services
- **Integration Tests**: Full authentication flow testing
- **Security Tests**: Penetration testing for authentication endpoints
- **Performance Tests**: Load testing for 1000 concurrent users

### 8.4 OAuth Integration Strategy
- **Supported Providers**: Google, Kakao, Naver (Korean market focus)
- **User Linking**: Automatic account linking via email
- **Profile Sync**: Initial profile data from OAuth providers
- **Token Management**: Provider tokens stored encrypted

### 8.5 Database Migration Strategy
- **Tool**: Flyway for version-controlled migrations
- **Naming Convention**: V{version}__{description}.sql
- **Rollback Support**: Separate rollback scripts for each migration
- **Initial Tables**: Users, profiles, tokens, OAuth accounts, audit logs

### 8.6 Monitoring & Observability
- **Health Endpoints**: /health and /ready for container orchestration
- **Metrics Collection**: Authentication success rates, token generation time
- **Logging Strategy**: Structured logging with correlation IDs
- **Audit Trail**: Comprehensive security event logging

### 8.7 Future Scalability Paths
- **Redis Integration**: Ready for distributed session cache
- **API Gateway**: Prepared for Spring Cloud Gateway integration
- **Microservices Split**: Authentication service can be extracted
- **Multi-tenancy**: UUID strategy supports future multi-tenant needs

