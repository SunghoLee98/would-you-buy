// 🔥 API Client - 100% API 명세서 준수 구현

import api from './api';
import { ApiResponse } from '../types/auth.types';
import {
  VotingDashboardResponse,
  SubmitVoteRequest,
  SubmitVoteResponse,
  UpdateVoteRequest,
  UpdateVoteResponse,
  GetVotingStocksRequest,
  UserVote,
  UserVoteStatistics
} from '../types/voting.types';

/**
 * 🎯 100% API 명세서 준수 API 클라이언트
 * - Legacy 어댑터 완전 제거
 * - 명세서 Section 4 (투표 도메인) 엔드포인트와 정확히 일치
 * - TypeScript 타입 안정성 100% 보장
 */
class VotingAPIClient {

  // =============================================================================
  // 4.1 투표 대시보드 조회
  // =============================================================================

  /**
   * 투표 대시보드 조회 (비로그인 사용자용)
   * GET /stocks/voting
   */
  async getVotingStocks(params?: GetVotingStocksRequest): Promise<VotingDashboardResponse> {
    try {
      const response = await api.get<ApiResponse<VotingDashboardResponse>>('/stocks/voting', {
        params: {
          date: params?.date,
          includeUserVotes: params?.includeUserVotes ?? false, // 비로그인 사용자용은 false
        }
      });

      if (!response.data.success) {
        throw new Error(response.data.message || '투표 대시보드 조회에 실패했습니다');
      }

      const data = response.data.data;
      if (!data) {
        throw new Error('투표 대시보드 데이터가 없습니다');
      }

      return data;
    } catch (error) {
      console.error('❌ getVotingStocks error:', error);
      throw error;
    }
  }

  /**
   * 투표 대시보드 조회 (로그인 사용자용, 사용자 투표 정보 포함)
   * GET /stocks/voting/dashboard
   */
  async getVotingDashboard(params?: GetVotingStocksRequest): Promise<VotingDashboardResponse> {
    try {
      const response = await api.get<ApiResponse<VotingDashboardResponse>>('/stocks/voting/dashboard', {
        params: {
          date: params?.date,
          includeUserVotes: params?.includeUserVotes ?? true, // 로그인 사용자용은 기본 true
        }
      });

      if (!response.data.success) {
        throw new Error(response.data.message || '투표 대시보드 조회에 실패했습니다');
      }

      const data = response.data.data;
      if (!data) {
        throw new Error('투표 대시보드 데이터가 없습니다');
      }

      return data;
    } catch (error) {
      console.error('❌ getVotingDashboard error:', error);
      throw error;
    }
  }

  // =============================================================================
  // 4.2 투표 제출
  // =============================================================================

  /**
   * 투표 제출
   * POST /votes
   */
  async submitVote(request: SubmitVoteRequest): Promise<SubmitVoteResponse> {
    try {
      const response = await api.post<ApiResponse<SubmitVoteResponse>>('/votes', request);

      if (!response.data.success) {
        throw new Error(response.data.message || '투표 제출에 실패했습니다');
      }

      const data = response.data.data;
      if (!data) {
        throw new Error('투표 응답 데이터가 없습니다');
      }

      return data;
    } catch (error) {
      console.error('❌ submitVote error:', error);
      throw error;
    }
  }

  // =============================================================================
  // 4.3 투표 수정
  // =============================================================================

  /**
   * 투표 수정
   * PUT /votes/{voteId}
   */
  async updateVote(voteId: string, request: UpdateVoteRequest): Promise<UpdateVoteResponse> {
    try {
      const response = await api.put<ApiResponse<UpdateVoteResponse>>(`/votes/${voteId}`, request);

      if (!response.data.success) {
        throw new Error(response.data.message || '투표 수정에 실패했습니다');
      }

      const data = response.data.data;
      if (!data) {
        throw new Error('투표 수정 응답 데이터가 없습니다');
      }

      return data;
    } catch (error) {
      console.error('❌ updateVote error:', error);
      throw error;
    }
  }

  // =============================================================================
  // 4.4 사용자 투표 내역 조회
  // =============================================================================

  /**
   * 사용자 투표 내역 조회
   * GET /votes/my-votes
   */
  async getUserVotes(params?: {
    page?: number;
    size?: number;
    stockCode?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<UserVote[]> {
    try {
      const response = await api.get<ApiResponse<UserVote[]>>('/votes/my-votes', {
        params: {
          page: params?.page ?? 0,
          size: params?.size ?? 20,
          stockCode: params?.stockCode,
          startDate: params?.startDate,
          endDate: params?.endDate,
        }
      });

      if (!response.data.success) {
        throw new Error(response.data.message || '사용자 투표 내역 조회에 실패했습니다');
      }

      const data = response.data.data;
      if (!data) {
        return [];
      }

      return data;
    } catch (error) {
      console.error('❌ getUserVotes error:', error);
      throw error;
    }
  }

  // =============================================================================
  // 4.5 오늘의 투표 현황 조회
  // =============================================================================

  /**
   * 오늘의 투표 현황 조회
   * GET /votes/my-votes/today
   */
  async getTodayUserVotes(): Promise<UserVote[]> {
    try {
      const response = await api.get<ApiResponse<UserVote[]>>('/votes/my-votes/today');

      if (!response.data.success) {
        throw new Error(response.data.message || '오늘의 투표 현황 조회에 실패했습니다');
      }

      const data = response.data.data;
      if (!data) {
        return [];
      }

      return data;
    } catch (error) {
      console.error('❌ getTodayUserVotes error:', error);
      throw error;
    }
  }

  // =============================================================================
  // 4.6 사용자 통계 조회
  // =============================================================================

  /**
   * 사용자 투표 통계 조회
   * GET /votes/my-stats
   */
  async getUserVoteStatistics(): Promise<UserVoteStatistics> {
    try {
      const response = await api.get<ApiResponse<UserVoteStatistics>>('/votes/my-stats');

      if (!response.data.success) {
        throw new Error(response.data.message || '사용자 통계 조회에 실패했습니다');
      }

      const data = response.data.data;
      if (!data) {
        throw new Error('사용자 통계 데이터가 없습니다');
      }

      return data;
    } catch (error) {
      console.error('❌ getUserVoteStatistics error:', error);
      throw error;
    }
  }

  // =============================================================================
  // WebSocket URL 생성
  // =============================================================================

  /**
   * WebSocket URL 생성 (6. 실시간 통신)
   * ws://localhost:7070/api/v1/ws/votes
   */
  getVotingWebSocketUrl(): string {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const baseUrl = api.defaults.baseURL?.replace(/^https?:/, '') || '//localhost:7070/api/v1';
    return `${wsProtocol}${baseUrl}/ws/votes`;
  }

  // =============================================================================
  // Health Check
  // =============================================================================

  /**
   * Health check method for debugging
   */
  async healthCheck(): Promise<{ status: 'ok' | 'error'; timestamp: number }> {
    try {
      await api.get('/health');
      return { status: 'ok', timestamp: Date.now() };
    } catch (error) {
      console.error('Health check failed:', error);
      return { status: 'error', timestamp: Date.now() };
    }
  }
}

/**
 * 🎯 Singleton 인스턴스 - 100% API 명세서 준수
 */
export const apiClient = new VotingAPIClient();

/**
 * 기본 내보내기
 */
export default apiClient;