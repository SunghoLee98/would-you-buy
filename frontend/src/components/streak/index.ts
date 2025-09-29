/**
 * 🔥 Streak Components Export
 * 연속 기록 컴포넌트 통합 내보내기
 */

export { default as StreakCalendar } from './StreakCalendar';
export { default as StreakStats } from './StreakStats';
export { default as StreakBadge } from './StreakBadge';
export { default as ConfettiEffect } from './ConfettiEffect';

// Split integration components
export { UserProfileWithStreak } from './UserProfileWithStreak';
export { VotingDashboardWithStreak } from './VotingDashboardWithStreak';
export { VoteSubmitWithStreakUpdate } from './VoteSubmitWithStreakUpdate';
export { LeaderboardWithStreak } from './LeaderboardWithStreak';

// 타입도 함께 내보내기
export * from '../../types/streak.types';