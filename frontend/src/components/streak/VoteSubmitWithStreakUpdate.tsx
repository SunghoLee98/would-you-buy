/**
 * Vote Submit with Streak Update Component
 */

import React, { useState } from 'react';
import useStreak from '../../hooks/useStreak';
import ToastNotification from '../common/ToastNotification';

interface VoteSubmitWithStreakUpdateProps {
  onVoteSubmit?: () => void;
  userId?: string;
}

export const VoteSubmitWithStreakUpdate: React.FC<VoteSubmitWithStreakUpdateProps> = ({
  onVoteSubmit,
  userId
}) => {
  const { updateStreak, streak, refresh } = useStreak({
    fetchOnMount: true
  });

  const [showNotification, setShowNotification] = useState(false);
  const [notificationData, setNotificationData] = useState({
    message: '',
    subMessage: ''
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
      setNotificationData({
        message: '투표가 제출되었습니다!',
        subMessage: streak && streak.currentStreak > 0
          ? `🔥 ${streak.currentStreak + 1}일 연속 예측!`
          : ''
      });
      setShowNotification(true);

      // 4. 데이터 새로고침
      await refresh();
    } catch (error) {
      console.error('Failed to submit vote:', error);

      // 오류 메시지 표시 (한국어로 개선)
      setNotificationData({
        message: '투표 제출에 실패했습니다',
        subMessage: '잠시 후 다시 시도해주세요'
      });
      setShowNotification(true);
    }
  };

  return (
    <>
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

      {showNotification && (
        <ToastNotification
          message={notificationData.message}
          subMessage={notificationData.subMessage}
          type="success"
          onClose={() => setShowNotification(false)}
        />
      )}
    </>
  );
};

export default VoteSubmitWithStreakUpdate;