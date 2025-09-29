/**
 * Streak System Constants
 * 연속 예측 시스템 상수 정의
 */

export const STREAK_MILESTONES = {
  WEEK: 7,
  MONTH: 30,
  HUNDRED: 100,
  YEAR: 365
} as const;

export const STREAK_POINTS = {
  BASE_CORRECT: 10,
  BASE_INCORRECT: -5,
  KOSPI_BONUS: 15
} as const;

export const CONFETTI_CONFIG = {
  COLORS: ['#ff6b6b', '#ffd93d', '#6bcf7f', '#4dabf7', '#9775fa'],
  COUNT: 30,
  DURATION: 3000 // milliseconds
} as const;

export const ANIMATION_DURATION = {
  CELEBRATION: 3000,
  FADE_IN: 500,
  SLIDE: 300
} as const;

export const API_MOCK_CONFIG = {
  MIN_DELAY: 200,
  MAX_DELAY: 700,
  SUCCESS_RATE_MIN: 0.4,
  SUCCESS_RATE_MAX: 0.8,
  MAX_DAYS_LIMIT: 400 // Maximum days for calendar generation
} as const;

export const STORAGE_KEYS = {
  LAST_MILESTONE_CHECK: (userId: string) => `lastMilestoneCheck_${userId || 'default'}`
} as const;

// Badge emojis by streak level
export const STREAK_EMOJIS = {
  INACTIVE: '💤',
  STARTER: '✨',
  WEEK: '🔥',
  MONTH: '🏆',
  HUNDRED: '💎',
  YEAR: '👑'
} as const;

// 마일스톤 배지 정보
export const MILESTONE_BADGES = [
  { days: STREAK_MILESTONES.WEEK, icon: '🔥', label: '불꽃 시작' },
  { days: STREAK_MILESTONES.MONTH, icon: '🏆', label: '한달 달성' },
  { days: STREAK_MILESTONES.HUNDRED, icon: '💎', label: '100일 돌파' },
  { days: STREAK_MILESTONES.YEAR, icon: '👑', label: '1년 완주' }
] as const;