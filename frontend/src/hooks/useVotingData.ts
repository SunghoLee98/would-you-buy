// 🔥 Voting Data Hook - 100% API 명세서 준수 구현

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/api-client';
import {
  VotingDashboardResponse,
  GetVotingStocksRequest,
  VotingDashboardItem,
  UserVote
} from '../types/voting.types';

// =============================================================================
// Cache for Suspense-like behavior
// =============================================================================

const votingDataCache = new Map<string, Promise<VotingDashboardResponse>>();

/**
 * Create cache key for the request
 */
function createCacheKey(params?: GetVotingStocksRequest, isAuthenticated?: boolean): string {
  const key = {
    date: params?.date || 'today',
    includeUserVotes: params?.includeUserVotes ?? true,
    authenticated: !!isAuthenticated,
  };
  return JSON.stringify(key);
}

/**
 * 🎯 Suspense-compatible data fetching function
 * - Legacy 어댑터 완전 제거
 * - VotingDashboardResponse 직접 사용
 */
function fetchVotingData(params?: GetVotingStocksRequest, isAuthenticated?: boolean): VotingDashboardResponse {
  const cacheKey = createCacheKey(params, isAuthenticated);

  if (!votingDataCache.has(cacheKey)) {
    // Choose appropriate API method based on authentication
    const promise = isAuthenticated
      ? apiClient.getVotingDashboard(params)
      : apiClient.getVotingStocks(params);

    votingDataCache.set(cacheKey, promise);

    // Clear cache after 30 seconds
    setTimeout(() => {
      votingDataCache.delete(cacheKey);
    }, 30000);
  }

  const promise = votingDataCache.get(cacheKey)!;

  // Check if promise is resolved
  if (promise && typeof (promise as any)._result !== 'undefined') {
    const result = (promise as any)._result;
    if (result instanceof Error) {
      throw result;
    }
    return result;
  }

  // Suspend by throwing the promise
  throw promise.then(
    (data) => {
      // Store result in the promise for next access
      (promise as any)._result = data;
      return data;
    },
    (error) => {
      // Store error in the promise
      (promise as any)._result = error;
      throw error;
    }
  );
}

// =============================================================================
// Main Hook - Suspense Version
// =============================================================================

/**
 * 🎯 Hook for Suspense-based voting data fetching
 * - 100% API 명세서 준수
 * - Legacy 어댑터 제거
 * - 새로운 VotingDashboardResponse 구조 직접 사용
 */
export function useVotingData(params?: GetVotingStocksRequest) {
  const { user } = useAuth();
  const isAuthenticated = !!user;

  // Adjust params based on user authentication
  const requestParams: GetVotingStocksRequest = {
    ...params,
    includeUserVotes: isAuthenticated,
  };

  // This will suspend the component until data is available
  const data = fetchVotingData(requestParams, isAuthenticated);

  // Derived data for convenience - 새로운 구조 사용
  const kospiItem = data.kospiItem;
  const featuredStocks = data.featuredStocks;
  const allItems = data.items;

  // Refetch function to invalidate cache
  const refetch = useCallback(() => {
    const cacheKey = createCacheKey(requestParams, isAuthenticated);
    votingDataCache.delete(cacheKey);
  }, [requestParams, isAuthenticated]);

  // Helper functions
  const getUserVote = useCallback((stockCode: string): UserVote | null => {
    const item = allItems.find(item => item.stock.code === stockCode);
    return item?.userVote || null;
  }, [allItems]);

  const hasUserVoted = useCallback((stockCode: string): boolean => {
    const userVote = getUserVote(stockCode);
    return userVote !== null;
  }, [getUserVote]);

  return {
    // Raw data - 새로운 구조
    data,
    kospiItem,
    featuredStocks,
    allItems,

    // State flags
    isAuthenticated,
    isVotingActive: data.votingWindowOpen,

    // Helper functions
    getUserVote,
    hasUserVoted,
    refetch,

    // Computed properties
    totalActiveStocks: data.totalActiveStocks,
    marketStatus: data.marketStatus,
    votingDate: data.votingDate,
  };
}

// =============================================================================
// Async Hook - Non-Suspense Version
// =============================================================================

/**
 * 🎯 Alternative hook for non-Suspense usage (fallback)
 * - 100% API 명세서 준수
 * - Legacy 어댑터 완전 제거
 */
export function useVotingDataAsync(params?: GetVotingStocksRequest) {
  const { user } = useAuth();
  const isAuthenticated = !!user;

  const [data, setData] = useState<VotingDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const fetchCountRef = useRef(0);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const currentFetch = ++fetchCountRef.current;

      const requestParams: GetVotingStocksRequest = {
        ...params,
        includeUserVotes: isAuthenticated,
      };

      // Choose appropriate API method based on authentication
      const result = isAuthenticated
        ? await apiClient.getVotingDashboard(requestParams)
        : await apiClient.getVotingStocks(requestParams);

      // Only update if this is still the latest fetch
      if (currentFetch === fetchCountRef.current) {
        setData(result);
      }
    } catch (err) {
      if (fetchCountRef.current === fetchCountRef.current) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      }
    } finally {
      if (fetchCountRef.current === fetchCountRef.current) {
        setLoading(false);
      }
    }
  }, [params, isAuthenticated]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Helper functions
  const getUserVote = useCallback((stockCode: string): UserVote | null => {
    if (!data) return null;
    const item = data.items.find(item => item.stock.code === stockCode);
    return item?.userVote || null;
  }, [data]);

  const hasUserVoted = useCallback((stockCode: string): boolean => {
    const userVote = getUserVote(stockCode);
    return userVote !== null;
  }, [getUserVote]);

  return {
    // Raw data - 새로운 구조
    data,
    kospiItem: data?.kospiItem || null,
    featuredStocks: data?.featuredStocks || [],
    allItems: data?.items || [],

    // State
    loading,
    error,

    // State flags
    isAuthenticated,
    isVotingActive: data?.votingWindowOpen || false,

    // Helper functions
    getUserVote,
    hasUserVoted,
    refetch: fetchData,

    // Computed properties
    totalActiveStocks: data?.totalActiveStocks || 0,
    marketStatus: data?.marketStatus || '',
    votingDate: data?.votingDate || '',
  };
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Clear all cached voting data
 */
export function clearVotingDataCache() {
  votingDataCache.clear();
}

/**
 * Preload voting data (for performance optimization)
 */
export function preloadVotingData(params?: GetVotingStocksRequest, isAuthenticated?: boolean) {
  const cacheKey = createCacheKey(params, isAuthenticated);

  if (!votingDataCache.has(cacheKey)) {
    const promise = isAuthenticated
      ? apiClient.getVotingDashboard(params)
      : apiClient.getVotingStocks(params);

    votingDataCache.set(cacheKey, promise);

    // Clear cache after 30 seconds
    setTimeout(() => {
      votingDataCache.delete(cacheKey);
    }, 30000);
  }

  return votingDataCache.get(cacheKey)!;
}

// =============================================================================
// WebSocket Hook for Real-time Updates
// =============================================================================

/**
 * 🎯 Hook for real-time voting updates
 * - 6. 실시간 통신 WebSocket 지원
 */
export function useVotingUpdates() {
  const [updates, setUpdates] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    try {
      const wsUrl = apiClient.getVotingWebSocketUrl();
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('✅ WebSocket connected for voting updates');
        setConnected(true);

        // Subscribe to vote statistics updates
        ws.send(JSON.stringify({
          action: 'subscribe',
          type: 'vote_statistics',
          stockCodes: ['KOSPI'] // Can be extended to more stocks
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'vote_statistics_update') {
            setUpdates(prev => [...prev, message]);
          }
        } catch (err) {
          console.error('❌ Failed to parse WebSocket message:', err);
        }
      };

      ws.onclose = () => {
        console.log('❌ WebSocket disconnected');
        setConnected(false);
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setConnected(false);
      };

      return () => {
        ws.close();
      };
    } catch (error) {
      console.error('❌ Failed to initialize WebSocket:', error);
    }
  }, []);

  return {
    updates,
    connected
  };
}