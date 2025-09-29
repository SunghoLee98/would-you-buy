/**
 * User Profile with Streak Badge Component
 */

import React from 'react';
import { StreakBadge } from './index';

interface UserProfileWithStreakProps {
  userId: string;
}

export const UserProfileWithStreak: React.FC<UserProfileWithStreakProps> = ({ userId }) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '16px',
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
    }}>
      {/* 사용자 정보 */}
      <div style={{ flex: 1 }}>
        <h3>사용자 프로필</h3>
        <p>ID: {userId}</p>
      </div>

      {/* 연속 기록 뱃지 */}
      <StreakBadge
        userId={userId}
        compact={true}
        onStreakClick={() => window.location.href = '/streak'}
      />
    </div>
  );
};

export default UserProfileWithStreak;