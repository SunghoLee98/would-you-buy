/**
 * 🔗 StreakIntegration Component
 * 기존 투표 시스템과 연속 기록 시스템 통합 예제
 */

import React, { useEffect } from 'react';
import { StreakBadge } from './index';
import useStreak from '../../hooks/useStreak';
import styles from '../../styles/streak.module.css';

interface StreakIntegrationProps {
  onVoteSubmit?: () => void; // 투표 제출 시 호출
  userId?: string;
}

/**
 * 사용자 프로필 카드에 연속 기록 뱃지 추가하는 예제
 */
export const UserProfileWithStreak: React.FC<{ userId: string }> = ({ userId }) => {
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

/**
 * 투표 대시보드에 연속 기록 위젯 추가하는 예제
 */
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

/**
 * 투표 제출 후 연속 기록 업데이트 예제
 */
export const VoteSubmitWithStreakUpdate: React.FC<StreakIntegrationProps> = ({
  onVoteSubmit,
  userId
}) => {
  const { updateStreak, streak, refresh } = useStreak({
    fetchOnMount: true
  });

  const handleVoteSubmit = async () => {
    try {
      // 1. 투표 제출 (기존 로직)
      if (onVoteSubmit) {
        onVoteSubmit();
      }

      // 2. 연속 기록 업데이트
      await updateStreak();

      // 3. 성공 메시지 표시
      showSuccessNotification();

      // 4. 데이터 새로고침
      await refresh();
    } catch (error) {
      console.error('Failed to submit vote:', error);
    }
  };

  const showSuccessNotification = () => {
    // 토스트 알림 또는 모달로 성공 메시지 표시
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #2ecc71, #27ae60);
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      z-index: 10000;
      animation: slideInRight 0.3s ease;
      font-weight: 600;
    `;
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 20px;">✅</span>
        <span>투표가 제출되었습니다!</span>
      </div>
      ${streak && streak.currentStreak > 0 ? `
        <div style="margin-top: 8px; font-size: 14px; opacity: 0.9;">
          🔥 ${streak.currentStreak + 1}일 연속 예측!
        </div>
      ` : ''}
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  };

  return (
    <button
      onClick={handleVoteSubmit}
      style={{
        padding: '12px 24px',
        background: 'linear-gradient(135deg, #667eea, #764ba2)',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
      }}
    >
      투표 제출하기
    </button>
  );
};

/**
 * 리더보드에 연속 기록 표시 예제
 */
export const LeaderboardWithStreak: React.FC = () => {
  // 리더보드 데이터 (예제)
  const leaderboardData = [
    { userId: 'user1', name: '김철수', accuracy: 82.5, streak: 45 },
    { userId: 'user2', name: '이영희', accuracy: 78.3, streak: 23 },
    { userId: 'user3', name: '박민수', accuracy: 75.1, streak: 7 },
  ];

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)'
    }}>
      <h2 style={{ marginBottom: '20px', color: '#2c3e50' }}>
        🏆 예측 리더보드
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {leaderboardData.map((user, index) => (
          <div
            key={user.userId}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px',
              background: index === 0 ? 'linear-gradient(135deg, #ffd700, #ffed4e)' :
                         index === 1 ? '#f8f9fa' :
                         index === 2 ? '#f8f9fa' : 'white',
              borderRadius: '8px',
              gap: '16px'
            }}
          >
            {/* 순위 */}
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: index === 0 ? 'white' : '#2c3e50',
              width: '40px',
              textAlign: 'center'
            }}>
              {index + 1}
            </div>

            {/* 사용자 정보 */}
            <div style={{ flex: 1 }}>
              <div style={{
                fontWeight: '600',
                color: index === 0 ? 'white' : '#2c3e50'
              }}>
                {user.name}
              </div>
              <div style={{
                fontSize: '14px',
                color: index === 0 ? 'rgba(255,255,255,0.9)' : '#7f8c8d'
              }}>
                정확도: {user.accuracy}%
              </div>
            </div>

            {/* 연속 기록 뱃지 (작은 크기) */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              background: user.streak >= 30 ? 'linear-gradient(135deg, #ff6b6b, #ffd93d)' :
                         user.streak >= 7 ? 'linear-gradient(135deg, #3498db, #2980b9)' :
                         '#95a5a6',
              borderRadius: '16px',
              color: 'white',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              <span>{user.streak >= 30 ? '🔥' : user.streak >= 7 ? '⭐' : '✨'}</span>
              <span>{user.streak}일</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 애니메이션 스타일
const animationStyles = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;

// 스타일 시트 추가
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = animationStyles;
  document.head.appendChild(styleSheet);
}

export default {
  UserProfileWithStreak,
  VotingDashboardWithStreak,
  VoteSubmitWithStreakUpdate,
  LeaderboardWithStreak
};