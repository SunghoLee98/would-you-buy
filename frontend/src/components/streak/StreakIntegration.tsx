/**
 * 🔗 StreakIntegration Component
 * 기존 투표 시스템과 연속 기록 시스템 통합
 *
 * This file re-exports the split components for better code organization
 */

// Re-export individual components
export { UserProfileWithStreak } from './UserProfileWithStreak';
export { VotingDashboardWithStreak } from './VotingDashboardWithStreak';
export { VoteSubmitWithStreakUpdate } from './VoteSubmitWithStreakUpdate';
export { LeaderboardWithStreak } from './LeaderboardWithStreak';

// Default export for backward compatibility
export default {
  UserProfileWithStreak: require('./UserProfileWithStreak').UserProfileWithStreak,
  VotingDashboardWithStreak: require('./VotingDashboardWithStreak').VotingDashboardWithStreak,
  VoteSubmitWithStreakUpdate: require('./VoteSubmitWithStreakUpdate').VoteSubmitWithStreakUpdate,
  LeaderboardWithStreak: require('./LeaderboardWithStreak').LeaderboardWithStreak
};