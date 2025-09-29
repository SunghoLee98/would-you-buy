/**
 * Voting Dashboard with Streak Widget Component
 */

import React from 'react';
import useStreak from '../../hooks/useStreak';

export const VotingDashboardWithStreak: React.FC = () => {
  const { streak, isOnStreak, daysToNextMilestone, refresh } = useStreak({
    fetchOnMount: true,
    autoRefresh: true,
    refreshInterval: 60000
  });

  return (
    <div>
      {/* 연속 기록 위젯 */}
      {streak && (
        <div style={{
          background: isOnStreak
            ? 'linear-gradient(135deg, #ff6b6b, #ffd93d)'
            : 'linear-gradient(135deg, #95a5a6, #7f8c8d)',
          color: 'white',
          padding: '16px',
          borderRadius: '12px',
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
            {isOnStreak ? '🔥' : '💤'} {streak.currentStreak}일 연속!
          </div>
          {daysToNextMilestone && (
            <div style={{ fontSize: '14px', opacity: 0.9 }}>
              다음 마일스톤까지 {daysToNextMilestone}일 남았어요!
            </div>
          )}
        </div>
      )}

      {/* 기존 투표 컴포넌트들... */}
    </div>
  );
};

export default VotingDashboardWithStreak;