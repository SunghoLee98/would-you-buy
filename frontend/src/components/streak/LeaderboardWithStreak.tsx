/**
 * Leaderboard with Streak Display Component
 */

import React from 'react';
import { STREAK_EMOJIS, STREAK_MILESTONES } from '../../constants/streak.constants';

interface LeaderboardUser {
  userId: string;
  name: string;
  accuracy: number;
  streak: number;
}

export const LeaderboardWithStreak: React.FC = () => {
  // 리더보드 데이터 (예제)
  const leaderboardData: LeaderboardUser[] = [
    { userId: 'user1', name: '김철수', accuracy: 82.5, streak: 45 },
    { userId: 'user2', name: '이영희', accuracy: 78.3, streak: 23 },
    { userId: 'user3', name: '박민수', accuracy: 75.1, streak: 7 },
  ];

  const getStreakEmoji = (days: number) => {
    if (days === 0) return STREAK_EMOJIS.INACTIVE;
    if (days >= STREAK_MILESTONES.MONTH) return STREAK_EMOJIS.MONTH;
    if (days >= STREAK_MILESTONES.WEEK) return STREAK_EMOJIS.WEEK;
    return STREAK_EMOJIS.STARTER;
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
    }}>
      <h2 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: 'bold' }}>
        🏆 리더보드
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {leaderboardData.map((user, index) => (
          <div
            key={user.userId}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px',
              background: index === 0
                ? 'linear-gradient(135deg, #ffd700, #ffed4e)'
                : index === 1
                  ? 'linear-gradient(135deg, #c0c0c0, #d3d3d3)'
                  : index === 2
                    ? 'linear-gradient(135deg, #cd7f32, #d4a574)'
                    : '#f8f9fa',
              borderRadius: '8px',
              gap: '16px',
              transition: 'transform 0.2s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {/* 순위 */}
            <div style={{
              fontSize: '20px',
              fontWeight: 'bold',
              minWidth: '30px',
              color: index < 3 ? (index === 0 ? '#b8860b' : index === 1 ? '#808080' : '#8b4513') : '#666'
            }}>
              {index + 1}
            </div>

            {/* 사용자 정보 */}
            <div style={{ flex: 1 }}>
              <div style={{
                fontWeight: '600',
                fontSize: '16px',
                color: index < 3 ? '#333' : '#666'
              }}>
                {user.name}
              </div>
              <div style={{
                fontSize: '14px',
                color: index < 3 ? '#555' : '#999'
              }}>
                정확도: {user.accuracy}%
              </div>
            </div>

            {/* 연속 기록 뱃지 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 12px',
              background: 'rgba(255, 255, 255, 0.8)',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#333'
            }}>
              <span>{getStreakEmoji(user.streak)}</span>
              <span>{user.streak}일</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeaderboardWithStreak;