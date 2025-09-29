/**
 * 🪝 useStreak Hook
 * 연속 기록 데이터 관리를 위한 커스텀 훅
 */

import { useState, useEffect, useCallback } from 'react';
import streakService from '../services/streakService';
import {
  UserStreak,
  DailyPrediction,
  StreakMilestone,
  StreakStatus
} from '../types/streak.types';

interface UseStreakOptions {
  autoRefresh?: boolean;        // 자동 새로고침 활성화
  refreshInterval?: number;     // 새로고침 간격 (ms)
  fetchOnMount?: boolean;       // 마운트 시 자동 로드
}

interface UseStreakReturn {
  // 데이터
  streak: UserStreak | null;
  predictions: DailyPrediction[];
  milestones: StreakMilestone[];
  status: StreakStatus;

  // 상태
  loading: boolean;
  error: string | null;

  // 메서드
  refresh: () => Promise<void>;
  updateStreak: () => Promise<void>;
  getPredictionHistory: (startDate: string, endDate: string) => Promise<void>;

  // 계산된 값
  successRate: number;
  isOnStreak: boolean;
  nextMilestone: number | null;
  daysToNextMilestone: number | null;
}

export const useStreak = (options: UseStreakOptions = {}): UseStreakReturn => {
  const {
    autoRefresh = false,
    refreshInterval = 60000, // 1분
    fetchOnMount = true
  } = options;

  // 상태
  const [streak, setStreak] = useState<UserStreak | null>(null);
  const [predictions, setPredictions] = useState<DailyPrediction[]>([]);
  const [milestones, setMilestones] = useState<StreakMilestone[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 연속 기록 상태 계산
  const getStatus = useCallback((): StreakStatus => {
    if (!streak) return StreakStatus.NONE;
    if (streak.currentStreak === 0) return StreakStatus.BROKEN;
    if (streak.currentStreak >= 100) return StreakStatus.LEGENDARY;
    return StreakStatus.ACTIVE;
  }, [streak]);

  // 성공률 계산
  const getSuccessRate = useCallback((): number => {
    if (!streak || streak.totalPredictions === 0) return 0;
    return (streak.successfulPredictions / streak.totalPredictions) * 100;
  }, [streak]);

  // 다음 마일스톤 계산
  const getNextMilestone = useCallback((): number | null => {
    if (!streak) return null;
    const milestoneThresholds = [7, 30, 100, 365];

    for (const threshold of milestoneThresholds) {
      if (streak.currentStreak < threshold) {
        return threshold;
      }
    }

    return null; // 모든 마일스톤 달성
  }, [streak]);

  // 다음 마일스톤까지 남은 일수
  const getDaysToNextMilestone = useCallback((): number | null => {
    if (!streak) return null;
    const nextMilestone = getNextMilestone();
    if (!nextMilestone) return null;

    return nextMilestone - streak.currentStreak;
  }, [streak, getNextMilestone]);

  // 연속 기록 데이터 가져오기
  const fetchStreakData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [streakData, milestonesData] = await Promise.all([
        streakService.getCurrentStreak(),
        streakService.getMilestones()
      ]);

      setStreak(streakData);
      setMilestones(milestonesData);
    } catch (err: any) {
      const errorMessage = err.message || '연속 기록을 불러오는데 실패했습니다';
      setError(errorMessage);
      console.error('Failed to fetch streak data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 예측 기록 가져오기
  const fetchPredictionHistory = useCallback(async (startDate: string, endDate: string) => {
    try {
      setLoading(true);
      setError(null);

      const data = await streakService.getPredictionHistory(startDate, endDate);
      setPredictions(data);
    } catch (err: any) {
      const errorMessage = err.message || '예측 기록을 불러오는데 실패했습니다';
      setError(errorMessage);
      console.error('Failed to fetch prediction history:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 연속 기록 업데이트
  const updateStreak = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const updatedStreak = await streakService.updateStreak();
      setStreak(updatedStreak);

      // 마일스톤도 다시 가져오기
      const updatedMilestones = await streakService.getMilestones();
      setMilestones(updatedMilestones);
    } catch (err: any) {
      const errorMessage = err.message || '연속 기록 업데이트에 실패했습니다';
      setError(errorMessage);
      console.error('Failed to update streak:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 새로고침
  const refresh = useCallback(async () => {
    await fetchStreakData();
  }, [fetchStreakData]);

  // 마운트 시 자동 로드
  useEffect(() => {
    if (fetchOnMount) {
      fetchStreakData();
    }
  }, [fetchOnMount, fetchStreakData]);

  // 자동 새로고침
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchStreakData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchStreakData]);

  // 연속 기록 상태 변화 감지
  useEffect(() => {
    if (!streak) return;

    // 연속 기록이 깨졌을 때
    const lastCheck = localStorage.getItem('lastStreakCheck');
    const today = new Date().toISOString().split('T')[0];

    if (lastCheck !== today) {
      localStorage.setItem('lastStreakCheck', today);

      // 연속 기록이 깨졌는지 확인
      if (streak.lastPredictionDate) {
        const lastDate = new Date(streak.lastPredictionDate);
        const diffDays = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays > 1 && streak.currentStreak === 0) {
          // 연속 기록 깨짐 알림 (선택적)
          console.log('연속 기록이 깨졌습니다. 오늘부터 다시 시작하세요!');
        }
      }
    }
  }, [streak]);

  return {
    // 데이터
    streak,
    predictions,
    milestones,
    status: getStatus(),

    // 상태
    loading,
    error,

    // 메서드
    refresh,
    updateStreak,
    getPredictionHistory: fetchPredictionHistory,

    // 계산된 값
    successRate: getSuccessRate(),
    isOnStreak: streak ? streak.currentStreak > 0 : false,
    nextMilestone: getNextMilestone(),
    daysToNextMilestone: getDaysToNextMilestone()
  };
};

export default useStreak;