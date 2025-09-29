/**
 * 🔥 Streak Service
 * 사용자 연속 예측 기록 관리 서비스
 */

import { apiClient } from './api-client';
import {
  UserStreak,
  DailyPrediction,
  StreakResponse,
  StreakCalendarResponse,
  StreakMilestone,
  BadgeLevel
} from '../types/streak.types';

class StreakService {
  private readonly BASE_URL = '/api/v1/streaks';

  /**
   * 사용자의 현재 연속 기록 조회
   */
  async getCurrentStreak(): Promise<UserStreak> {
    try {
      return await apiClient.getCurrentStreak();
    } catch (error: any) {
      console.error('Failed to fetch current streak:', error);
      throw error;
    }
  }

  /**
   * 특정 기간의 예측 기록 조회 (달력용)
   * @param startDate 시작 날짜 (YYYY-MM-DD)
   * @param endDate 종료 날짜 (YYYY-MM-DD)
   */
  async getPredictionHistory(startDate: string, endDate: string): Promise<DailyPrediction[]> {
    try {
      return await apiClient.getStreakCalendar(startDate, endDate);
    } catch (error: any) {
      console.error('Failed to fetch prediction history:', error);
      throw error;
    }
  }

  /**
   * 최근 365일 예측 기록 조회 (GitHub 스타일 달력용)
   */
  async getYearlyPredictions(): Promise<DailyPrediction[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 365);

    return this.getPredictionHistory(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );
  }

  /**
   * 사용자의 마일스톤 달성 현황 조회
   */
  async getMilestones(): Promise<StreakMilestone[]> {
    try {
      const streak = await this.getCurrentStreak();

      const milestones: StreakMilestone[] = [
        {
          days: 7,
          achieved: streak.longestStreak >= 7,
          badgeIcon: '🔥',
          title: '일주일 연속',
          description: '7일 연속 예측 성공!'
        },
        {
          days: 30,
          achieved: streak.longestStreak >= 30,
          badgeIcon: '🏆',
          title: '한 달 연속',
          description: '30일 연속 예측 성공!'
        },
        {
          days: 100,
          achieved: streak.longestStreak >= 100,
          badgeIcon: '💎',
          title: '백일 연속',
          description: '100일 연속 예측 성공!'
        },
        {
          days: 365,
          achieved: streak.longestStreak >= 365,
          badgeIcon: '👑',
          title: '일 년 연속',
          description: '365일 연속 예측 성공!'
        }
      ];

      return milestones;
    } catch (error: any) {
      console.error('Failed to fetch milestones:', error);
      return [];
    }
  }

  /**
   * 연속 기록에 따른 뱃지 레벨 계산
   */
  getBadgeLevel(streakDays: number): BadgeLevel {
    if (streakDays >= 365) return BadgeLevel.PLATINUM;
    if (streakDays >= 100) return BadgeLevel.GOLD;
    if (streakDays >= 30) return BadgeLevel.SILVER;
    if (streakDays >= 7) return BadgeLevel.BRONZE;
    return BadgeLevel.BRONZE;
  }

  /**
   * 성공률에 따른 동기부여 메시지 생성
   */
  getMotivationalMessage(successRate: number, currentStreak: number): string {
    if (currentStreak === 0) {
      return '오늘부터 새로운 연속 기록을 시작하세요! 💪';
    }

    if (successRate >= 80) {
      return `놀라운 예측력이에요! 정확도 ${successRate.toFixed(1)}%! 🎯`;
    } else if (successRate >= 60) {
      return `훌륭한 성과입니다! 계속 도전하세요! 🚀`;
    } else if (successRate >= 40) {
      return `꾸준히 성장하고 있어요! 화이팅! 📈`;
    } else {
      return `포기하지 마세요! 매일이 새로운 기회입니다! 🌟`;
    }
  }

  /**
   * 날짜별 색상 강도 계산 (GitHub 스타일)
   */
  getIntensityLevel(accuracy: number | undefined): number {
    if (accuracy === undefined) return 0; // 활동 없음
    if (accuracy === 0) return -1;         // 완전 실패
    if (accuracy < 30) return 1;           // 낮은 성공률
    if (accuracy < 60) return 2;           // 중간 성공률
    if (accuracy < 90) return 3;           // 높은 성공률
    return 4;                              // 완벽한 성공
  }

  /**
   * 연속 기록 갱신 (투표 후 자동 호출)
   */
  async updateStreak(): Promise<UserStreak> {
    try {
      return await apiClient.updateStreak();
    } catch (error: any) {
      console.error('Failed to update streak:', error);
      throw error;
    }
  }
}

export default new StreakService();