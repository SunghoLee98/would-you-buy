// 🔥 Voting Types - 100% API 명세서 준수 (7.3 Response DTOs)

// =============================================================================
// 7.1 기본 타입 (Enums)
// =============================================================================

export type VoteType = 'UP' | 'DOWN';
export type PriceTrend = 'UP' | 'DOWN' | 'STABLE';
export type MarketStatus = '시장 개장 전' | '시장 개장 중' | '시장 폐장';
export type UserRole = 'USER' | 'ADMIN';

// =============================================================================
// 7.3 Response DTOs - API 명세서 정확히 일치하는 타입
// =============================================================================

/**
 * StockInfo - 7.3 Response DTOs의 StockInfo와 정확히 일치
 */
export interface StockInfo {
  code: string;
  koreanName: string;
  englishName: string | null;
  currentPrice: number | null;
  changeRate: number | null;
  changeAmount: number | null;
  isPrimary: boolean;
  displayOrder: number;
  marketType: string;
  lastUpdated: string | null; // ISO-8601 DateTime
  isVotingEligible: boolean;
  priceTrend: PriceTrend;
  formattedChangeRate: string | null;
  formattedChangeAmount: string | null;
}

/**
 * VoteStatistics - 7.3 Response DTOs의 VoteStatistics와 정확히 일치
 */
export interface VoteStatistics {
  stockCode: string;
  votingDate: string; // YYYY-MM-DD
  upVotes: number;
  downVotes: number;
  totalVotes: number;
  upPercentage: number;
  downPercentage: number;
  majorityVote: VoteType | null;
  hasClearMajority: boolean;
  majorityVoteText: string | null; // "상승" | "하락" | null
  consensusStrength: string;
}

/**
 * UserVote - 7.3 Response DTOs의 UserVote와 정확히 일치
 * 모든 필드 required로 수정 (명세서 준수)
 */
export interface UserVote {
  id: string; // uuid-string
  stockCode: string;
  stockName: string;
  voteType: VoteType;
  voteTypeText: string; // "상승" | "하락"
  votingDate: string; // YYYY-MM-DD
  confidenceLevel: number | null;
  predictionReason: string | null;
  canChangeVote: boolean;
  isResultCalculated: boolean;
  isCorrect: boolean | null;
  pointsEarned: number | null;
  createdAt: string; // ISO-8601 DateTime
  updatedAt: string; // ISO-8601 DateTime
}

/**
 * VotingDashboardItem - 7.3 Response DTOs의 VotingDashboardItem과 정확히 일치
 */
export interface VotingDashboardItem {
  stock: StockInfo;
  voteStatistics: VoteStatistics;
  userVote: UserVote | null;
}

/**
 * VotingDashboardResponse - 7.3 Response DTOs의 VotingDashboardResponse와 정확히 일치
 */
export interface VotingDashboardResponse {
  votingDate: string; // YYYY-MM-DD
  items: VotingDashboardItem[];
  totalActiveStocks: number;
  votingWindowOpen: boolean;
  marketStatus: string;
  kospiItem: VotingDashboardItem;
  featuredStocks: VotingDashboardItem[];
}

// =============================================================================
// 7.2 Request DTOs - API 명세서 정확히 일치하는 타입
// =============================================================================

/**
 * SubmitVoteRequest - 7.2 Request DTOs의 SubmitVoteRequest와 정확히 일치
 */
export interface SubmitVoteRequest {
  stockCode: string; // required
  voteType: VoteType; // required
  confidenceLevel?: number; // optional (1-5)
  predictionReason?: string; // optional (max 200)
}

/**
 * UpdateVoteRequest - 7.2 Request DTOs의 UpdateVoteRequest와 정확히 일치
 */
export interface UpdateVoteRequest {
  voteType: VoteType; // required
  confidenceLevel?: number; // optional (1-5)
  predictionReason?: string; // optional (max 200)
}

/**
 * GetVotingStocksRequest - 7.2 Request DTOs의 GetVotingStocksRequest와 정확히 일치
 */
export interface GetVotingStocksRequest {
  date?: string; // YYYY-MM-DD (optional)
  includeUserVotes?: boolean; // optional, default: true
}

// =============================================================================
// API Response Wrapper Types
// =============================================================================

/**
 * 투표 제출 응답 - 4.2 투표 제출 API 응답과 정확히 일치
 */
export interface SubmitVoteResponse {
  success: boolean;
  voteId: string;
  message: string;
  vote: UserVote;
}

/**
 * 투표 수정 응답 - 4.3 투표 수정 API 응답과 정확히 일치
 */
export interface UpdateVoteResponse {
  success: boolean;
  message: string;
  vote: UserVote;
}

// =============================================================================
// User Statistics Types - 사용자 도메인
// =============================================================================

/**
 * 사용자 통계 - 3.1 현재 사용자 정보 조회 API의 statistics 부분
 */
export interface UserStatistics {
  totalPredictions: number;
  correctPredictions: number;
  accuracyRate: number;
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
}

/**
 * 사용자 투표 통계 - 4.6 사용자 통계 조회 API
 */
export interface UserVoteStatistics extends UserStatistics {
  rank: number;
  weeklyRank: number;
  weeklyPoints: number;
}

// =============================================================================
// WebSocket Types - 6. 실시간 통신
// =============================================================================

/**
 * WebSocket 구독 메시지
 */
export interface WebSocketSubscribeMessage {
  action: 'subscribe';
  type: 'vote_statistics';
  stockCodes: string[];
}

/**
 * 투표 통계 실시간 업데이트 메시지
 */
export interface VoteStatisticsUpdateMessage {
  type: 'vote_statistics_update';
  data: {
    stockCode: string;
    stockName: string;
    upVotes: number;
    downVotes: number;
    totalVotes: number;
    upPercentage: number;
    downPercentage: number;
    majorityVote: VoteType;
    hasClearMajority: boolean;
  };
  timestamp: string; // ISO-8601 DateTime
}

// =============================================================================
// Utility Types for Form Handling
// =============================================================================

/**
 * 투표 제출 폼 데이터
 */
export interface VoteFormData {
  stockCode: string;
  voteType: VoteType;
  confidenceLevel?: number;
  predictionReason?: string;
}

/**
 * 투표 수정 폼 데이터
 */
export interface UpdateVoteFormData {
  voteType: VoteType;
  confidenceLevel?: number;
  predictionReason?: string;
}