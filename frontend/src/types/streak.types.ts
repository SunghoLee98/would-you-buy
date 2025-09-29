/**
 * 🔥 Streak System Type Definitions
 * 사용자 연속 예측 시스템 타입 정의
 */

// 연속 기록 통계
export interface UserStreak {
  currentStreak: number;        // 현재 연속 성공 일수
  longestStreak: number;        // 최장 연속 성공 일수
  totalPredictions: number;      // 전체 예측 횟수
  successfulPredictions: number; // 성공한 예측 횟수
  lastPredictionDate: string;    // 마지막 예측 날짜 (ISO 8601)
  streakStartDate: string | null; // 현재 연속 시작 날짜
}

// 일별 예측 기록
export interface DailyPrediction {
  date: string;           // 예측 날짜 (YYYY-MM-DD)
  success: boolean;       // 성공 여부
  voteCount: number;      // 해당 날짜 투표 수
  correctCount: number;   // 정답 수
  accuracy: number;       // 정확도 (0-100)
  kospiCorrect?: boolean; // KOSPI 예측 성공 여부
}

// 연속 기록 달력 데이터
export interface StreakCalendarData {
  year: number;
  month: number;
  predictions: DailyPrediction[];
}

// 연속 기록 마일스톤
export interface StreakMilestone {
  days: number;          // 마일스톤 일수 (7, 30, 100 등)
  achieved: boolean;     // 달성 여부
  achievedDate?: string; // 달성 날짜
  badgeIcon: string;     // 뱃지 아이콘 이모지
  title: string;         // 마일스톤 제목
  description: string;   // 마일스톤 설명
}

// API 응답 타입
export interface StreakResponse {
  success: boolean;
  data: UserStreak;
  message?: string;
}

export interface StreakCalendarResponse {
  success: boolean;
  data: {
    predictions: DailyPrediction[];
    summary: {
      totalDays: number;
      activeDays: number;
      successRate: number;
    };
  };
  message?: string;
}

// 동기부여 메시지
export interface MotivationalMessage {
  level: 'beginner' | 'intermediate' | 'expert' | 'master';
  message: string;
  emoji: string;
}

// 연속 기록 상태
export enum StreakStatus {
  NONE = 'NONE',           // 연속 기록 없음
  ACTIVE = 'ACTIVE',       // 활성 연속 기록
  BROKEN = 'BROKEN',       // 연속 기록 깨짐
  LEGENDARY = 'LEGENDARY'  // 전설적 연속 기록 (100일 이상)
}

// 뱃지 레벨
export enum BadgeLevel {
  BRONZE = 'BRONZE',     // 7일
  SILVER = 'SILVER',     // 30일
  GOLD = 'GOLD',         // 100일
  PLATINUM = 'PLATINUM', // 365일
}

// 색상 강도 (GitHub 스타일)
export enum IntensityLevel {
  NONE = 0,      // 활동 없음 (회색)
  LOW = 1,       // 낮은 성공률 (연한 초록)
  MEDIUM = 2,    // 중간 성공률 (중간 초록)
  HIGH = 3,      // 높은 성공률 (진한 초록)
  PERFECT = 4,   // 완벽한 성공 (매우 진한 초록)
  FAILED = -1    // 실패 (빨간색)
}