// 🔥 VotingService - 100% API 명세서 준수 구현

import api from './api';
import { ApiResponse } from '../types/auth.types';
import {
  VotingDashboardResponse,
  SubmitVoteRequest,
  SubmitVoteResponse,
} from '../types/voting.types';

// =============================================================================
// VotingService Class - 100% API 명세서 준수
// =============================================================================

class VotingService {
  // Get voting dashboard data - API 명세서 준수: /stocks/voting/dashboard
  async getVotingDashboard(date?: string): Promise<ApiResponse<VotingDashboardResponse>> {
    const response = await api.get<ApiResponse<VotingDashboardResponse>>('/stocks/voting/dashboard', {
      params: { date },
    });
    return response.data;
  }

  // Submit a vote for a specific stock
  async submitVote(data: SubmitVoteRequest): Promise<ApiResponse<SubmitVoteResponse>> {
    const response = await api.post<ApiResponse<SubmitVoteResponse>>('/votes', data);
    return response.data;
  }

  // Update an existing vote (if allowed) - 새로운 API 구조 사용
  async updateVote(voteId: string, voteType: 'UP' | 'DOWN'): Promise<ApiResponse<SubmitVoteResponse>> {
    const response = await api.put<ApiResponse<SubmitVoteResponse>>(`/votes/${voteId}`, {
      voteType,
    });
    return response.data;
  }

  // Delete a vote (if allowed)
  async deleteVote(voteId: string): Promise<ApiResponse> {
    const response = await api.delete<ApiResponse>(`/votes/${voteId}`);
    return response.data;
  }

  // Legacy methods - deprecated, use getVotingDashboard instead
  // These are kept for backwards compatibility but should be removed in future

  /**
   * @deprecated Use getVotingDashboard instead
   */
  async getVotingStatistics(date?: string): Promise<ApiResponse<any>> {
    console.warn('getVotingStatistics is deprecated, use getVotingDashboard instead');
    const response = await api.get<ApiResponse<any>>('/votes/statistics', {
      params: { date },
    });
    return response.data;
  }

  /**
   * @deprecated Use getVotingDashboard instead
   */
  async getDailyResults(date: string): Promise<ApiResponse<any>> {
    console.warn('getDailyResults is deprecated, use getVotingDashboard instead');
    const response = await api.get<ApiResponse<any>>(`/votes/results/${date}`);
    return response.data;
  }

  // Get user's voting history - API 명세서 준수: /votes/my-votes
  async getUserVotes(page = 0, size = 20): Promise<ApiResponse<any>> {
    const response = await api.get<ApiResponse<any>>('/votes/my-votes', {
      params: { page, size },
    });
    return response.data;
  }

  // Get real-time voting updates (WebSocket endpoint info) - API 명세서 준수: /ws/votes
  getVotingWebSocketUrl(): string {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const baseUrl = api.defaults.baseURL?.replace(/^https?:/, '') || '//localhost:7070/api/v1';
    return `${wsProtocol}${baseUrl}/ws/votes`;
  }

  /**
   * @deprecated Voting status is included in getVotingDashboard response
   */
  async isVotingActive(): Promise<ApiResponse<{ active: boolean; timeRemaining?: number }>> {
    console.warn('isVotingActive is deprecated, voting status is included in getVotingDashboard');
    const response = await api.get<ApiResponse<{ active: boolean; timeRemaining?: number }>>('/votes/status');
    return response.data;
  }

  /**
   * @deprecated KOSPI data is included in getVotingDashboard response
   */
  async getKospiIndex(): Promise<ApiResponse<any>> {
    console.warn('getKospiIndex is deprecated, KOSPI data is included in getVotingDashboard');
    const response = await api.get<ApiResponse<any>>('/stocks/kospi');
    return response.data;
  }

  /**
   * @deprecated Trending stocks are included in getVotingDashboard response as featuredStocks
   */
  async getTrendingStocks(limit = 10): Promise<ApiResponse<any>> {
    console.warn('getTrendingStocks is deprecated, featured stocks are included in getVotingDashboard');
    const response = await api.get<ApiResponse<any>>('/stocks/trending', {
      params: { limit },
    });
    return response.data;
  }
}

const votingService = new VotingService();
export default votingService;