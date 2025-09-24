// 🔥 Validators - 100% API 명세서 준수 구현

import { z } from 'zod';
import {
  VotingDashboardResponse,
  StockInfo,
  VoteStatistics,
  UserVote,
  VotingDashboardItem,
  VoteType,
  PriceTrend
} from '../types/voting.types';

// =============================================================================
// Custom Error Class
// =============================================================================

export class APIValidationError extends Error {
  constructor(message: string, public zodError?: z.ZodError) {
    super(message);
    this.name = 'APIValidationError';
  }
}

// =============================================================================
// Zod Schemas - 100% API 명세서 준수 (7.3 Response DTOs)
// =============================================================================

/**
 * StockInfo Schema - API 명세서 7.3 Response DTOs와 정확히 일치
 */
const StockInfoSchema = z.object({
  code: z.string(),
  koreanName: z.string(),
  englishName: z.string().nullable(),
  currentPrice: z.number().nullable(),
  changeRate: z.number().nullable(),
  changeAmount: z.number().nullable(),
  isPrimary: z.boolean(),
  displayOrder: z.number(),
  marketType: z.string(),
  lastUpdated: z.string().nullable(), // ISO-8601 DateTime
  isVotingEligible: z.boolean(),
  priceTrend: z.enum(['UP', 'DOWN', 'STABLE'] as const),
  formattedChangeRate: z.string().nullable(),
  formattedChangeAmount: z.string().nullable(),
});

/**
 * VoteStatistics Schema - API 명세서 7.3 Response DTOs와 정확히 일치
 */
const VoteStatisticsSchema = z.object({
  stockCode: z.string(),
  votingDate: z.string(), // YYYY-MM-DD
  upVotes: z.number(),
  downVotes: z.number(),
  totalVotes: z.number(),
  upPercentage: z.number(),
  downPercentage: z.number(),
  majorityVote: z.enum(['UP', 'DOWN'] as const).nullable(),
  hasClearMajority: z.boolean(),
  majorityVoteText: z.string().nullable(), // "상승" | "하락" | null
  consensusStrength: z.string(),
});

/**
 * UserVote Schema - API 명세서 7.3 Response DTOs와 정확히 일치
 * 모든 필드 required로 수정 (명세서 준수)
 */
const UserVoteSchema = z.object({
  id: z.string(), // uuid-string
  stockCode: z.string(),
  stockName: z.string(),
  voteType: z.enum(['UP', 'DOWN'] as const),
  voteTypeText: z.string(), // "상승" | "하락"
  votingDate: z.string(), // YYYY-MM-DD
  confidenceLevel: z.number().nullable(),
  predictionReason: z.string().nullable(),
  canChangeVote: z.boolean(),
  isResultCalculated: z.boolean(),
  isCorrect: z.boolean().nullable(),
  pointsEarned: z.number().nullable(),
  createdAt: z.string(), // ISO-8601 DateTime
  updatedAt: z.string(), // ISO-8601 DateTime
});

/**
 * VotingDashboardItem Schema - API 명세서 7.3 Response DTOs와 정확히 일치
 */
const VotingDashboardItemSchema = z.object({
  stock: StockInfoSchema,
  voteStatistics: VoteStatisticsSchema,
  userVote: UserVoteSchema.nullable(),
});

/**
 * VotingDashboardResponse Schema - API 명세서 7.3 Response DTOs와 정확히 일치
 */
const VotingDashboardResponseSchema = z.object({
  votingDate: z.string(), // YYYY-MM-DD
  items: z.array(VotingDashboardItemSchema),
  totalActiveStocks: z.number(),
  votingWindowOpen: z.boolean(),
  marketStatus: z.string(),
  kospiItem: VotingDashboardItemSchema,
  featuredStocks: z.array(VotingDashboardItemSchema),
});

// =============================================================================
// API Response Wrapper Schema
// =============================================================================

const ApiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.unknown().optional(),
  timestamp: z.string(), // ISO-8601 DateTime
  errors: z.array(z.object({
    code: z.string(),
    field: z.string().optional(),
    message: z.string(),
  })).nullable(),
});

// =============================================================================
// Main Validation Functions
// =============================================================================

/**
 * 🎯 투표 대시보드 응답 검증 - 100% API 명세서 준수
 */
export const validateVotingDashboardResponse = (data: unknown): VotingDashboardResponse => {
  try {
    return VotingDashboardResponseSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ VotingDashboardResponse Validation Error:', error.issues);
      throw new APIValidationError('Invalid voting dashboard response format', error);
    }
    throw error;
  }
};

/**
 * API 응답 래퍼 검증
 */
export const validateApiResponse = (data: unknown) => {
  try {
    return ApiResponseSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ API Response Validation Error:', error.issues);
      throw new APIValidationError('Invalid API response format', error);
    }
    throw error;
  }
};

// =============================================================================
// Type Guards & Utility Functions - 새로운 구조 사용
// =============================================================================

/**
 * 투표 창이 열려있는지 확인
 */
export const isVotingWindowOpen = (data: VotingDashboardResponse): boolean => {
  return data.votingWindowOpen;
};

/**
 * 특정 주식에 투표했는지 확인
 */
export const hasVotedForStock = (
  stockItem: VotingDashboardItem,
  stockCode: string
): boolean => {
  return stockItem.userVote !== null &&
         stockItem.userVote.stockCode === stockCode;
};

/**
 * 사용자가 투표한 항목들 가져오기
 */
export const getUserVotedItems = (data: VotingDashboardResponse): VotingDashboardItem[] => {
  return data.items.filter(item => item.userVote !== null);
};

/**
 * 사용자가 투표하지 않은 항목들 가져오기
 */
export const getUnvotedItems = (data: VotingDashboardResponse): VotingDashboardItem[] => {
  return data.items.filter(item => item.userVote === null);
};

/**
 * KOSPI 데이터 안전하게 가져오기
 */
export const getKospiItem = (data: VotingDashboardResponse): VotingDashboardItem => {
  return data.kospiItem;
};

/**
 * 주요 종목들 가져오기
 */
export const getFeaturedStocks = (data: VotingDashboardResponse): VotingDashboardItem[] => {
  return data.featuredStocks;
};

/**
 * 사용자 투표 데이터가 있는지 확인
 */
export const hasUserVoteData = (data: VotingDashboardResponse): boolean => {
  return data.items.some(item => item.userVote !== null);
};

/**
 * 투표 완료율 계산
 */
export const calculateCompletionRate = (data: VotingDashboardResponse): number => {
  const totalItems = data.items.length;
  const votedItems = getUserVotedItems(data).length;

  if (totalItems === 0) return 0;
  return Math.round((votedItems / totalItems) * 100);
};

/**
 * 투표 통계 요약
 */
export const getVotingSummary = (data: VotingDashboardResponse) => {
  const totalVotes = data.items.reduce((sum, item) => sum + item.voteStatistics.totalVotes, 0);
  const userVotedCount = getUserVotedItems(data).length;
  const completionRate = calculateCompletionRate(data);

  return {
    totalStocks: data.totalActiveStocks,
    totalVotes,
    userVotedCount,
    completionRate,
    isVotingActive: data.votingWindowOpen,
    marketStatus: data.marketStatus,
    votingDate: data.votingDate,
  };
};

// =============================================================================
// Type Guards for Stock Info
// =============================================================================

/**
 * KOSPI 종목인지 확인
 */
export const isKospiStock = (stock: StockInfo): boolean => {
  return stock.code === 'KOSPI' && stock.isPrimary === true;
};

/**
 * 주식 가격이 상승 중인지 확인
 */
export const isPriceRising = (stock: StockInfo): boolean => {
  return stock.priceTrend === 'UP' && (stock.changeRate || 0) > 0;
};

/**
 * 주식 가격이 하락 중인지 확인
 */
export const isPriceFalling = (stock: StockInfo): boolean => {
  return stock.priceTrend === 'DOWN' && (stock.changeRate || 0) < 0;
};

// =============================================================================
// Error Handling
// =============================================================================

/**
 * 검증 오류 처리
 */
export const handleValidationError = (error: unknown): never => {
  if (error instanceof APIValidationError) {
    console.error('API Validation failed:', error.message, error.zodError?.issues);
    throw new Error('서버 응답 형식이 올바르지 않습니다. 잠시 후 다시 시도해주세요.');
  }

  if (error instanceof z.ZodError) {
    console.error('Zod validation failed:', error.issues);
    throw new Error('데이터 형식이 올바르지 않습니다. 새로고침 후 다시 시도해주세요.');
  }

  throw error;
};

// =============================================================================
// Development Logging
// =============================================================================

/**
 * 개발 모드에서 검증 성공 로그
 */
export const logValidationSuccess = (data: VotingDashboardResponse) => {
  if (process.env.NODE_ENV === 'development') {
    const summary = getVotingSummary(data);
    console.log('✅ VotingDashboard validation passed:', {
      stockCount: data.items.length,
      votingWindowOpen: data.votingWindowOpen,
      marketStatus: data.marketStatus,
      kospiCode: data.kospiItem.stock.code,
      featuredStockCount: data.featuredStocks.length,
      totalVotes: summary.totalVotes,
      userVotedCount: summary.userVotedCount,
      completionRate: `${summary.completionRate}%`,
    });
  }
};

// =============================================================================
// Legacy Compatibility (임시 - 점진적 제거 예정)
// =============================================================================

/**
 * @deprecated - validateVotingResponse 대신 validateVotingDashboardResponse 사용
 */
export const validateVotingResponse = validateVotingDashboardResponse;