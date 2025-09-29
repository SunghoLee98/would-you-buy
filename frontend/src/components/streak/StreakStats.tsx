/**
 * 📊 StreakStats Component
 * 사용자 연속 기록 통계 표시
 */

import React, { useEffect, useState } from 'react';
import streakService from '../../services/streakService';
import { UserStreak } from '../../types/streak.types';
import styles from '../../styles/streak.module.css';

interface StreakStatsProps {
  refreshTrigger?: number; // 외부에서 갱신 트리거
}

const StreakStats: React.FC<StreakStatsProps> = ({ refreshTrigger }) => {
  const [streak, setStreak] = useState<UserStreak | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [animateStats, setAnimateStats] = useState(false);

  useEffect(() => {
    fetchStreakData();
  }, [refreshTrigger]);

  const fetchStreakData = async () => {
    try {
      setLoading(true);
      const data = await streakService.getCurrentStreak();
      setStreak(data);

      // 통계 애니메이션 트리거
      setAnimateStats(false);
      setTimeout(() => setAnimateStats(true), 100);
    } catch (err) {
      setError('연속 기록을 불러오는데 실패했습니다');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getSuccessRate = () => {
    if (!streak || streak.totalPredictions === 0) return 0;
    return ((streak.successfulPredictions / streak.totalPredictions) * 100).toFixed(1);
  };

  const getStreakEmoji = (days: number) => {
    if (days === 0) return '💤';
    if (days < 7) return '🔥';
    if (days < 30) return '🚀';
    if (days < 100) return '⚡';
    return '🌟';
  };

  const getMotivationalMessage = () => {
    if (!streak) return '';

    const successRate = parseFloat(getSuccessRate());
    const currentStreak = streak.currentStreak;

    // 연속 기록별 특별 메시지
    if (currentStreak === 0) {
      return '오늘부터 새로운 도전을 시작해보세요! 💪';
    } else if (currentStreak === 1) {
      return '첫 걸음을 내디뎠어요! 내일도 함께해요! 🌱';
    } else if (currentStreak === 7) {
      return '🎉 일주일 연속 달성! 대단해요!';
    } else if (currentStreak === 30) {
      return '🏆 한 달 연속! 당신은 예측의 달인!';
    } else if (currentStreak === 100) {
      return '💎 100일 연속! 전설이 되셨습니다!';
    } else if (currentStreak === 365) {
      return '👑 1년 연속! 진정한 마스터입니다!';
    }

    // 성공률 기반 메시지
    if (successRate >= 80) {
      return `놀라운 예측력! 정확도 ${successRate}%! 🎯`;
    } else if (successRate >= 60) {
      return `훌륭한 성과예요! 계속 도전하세요! 📈`;
    } else if (successRate >= 40) {
      return `꾸준히 성장하고 있어요! 화이팅! 💪`;
    } else if (currentStreak > 3) {
      return `${currentStreak}일 연속! 멋진 도전이에요! 🌟`;
    } else {
      return '매일이 새로운 기회입니다! 포기하지 마세요! 🌈';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className={styles.statsContainer}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
        </div>
      </div>
    );
  }

  if (error || !streak) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>{error || '데이터를 불러올 수 없습니다'}</p>
      </div>
    );
  }

  return (
    <div className={styles.statsContainer}>
      <div className={styles.statsGrid}>
        {/* 현재 연속 기록 */}
        <div className={`${styles.statItem} ${animateStats ? 'animate' : ''}`}>
          <div className={styles.statValue}>
            <span className={styles.statEmoji}>{getStreakEmoji(streak.currentStreak)}</span>
            <span>{streak.currentStreak}일</span>
          </div>
          <div className={styles.statLabel}>현재 연속</div>
        </div>

        {/* 최장 연속 기록 */}
        <div className={`${styles.statItem} ${animateStats ? 'animate' : ''}`}>
          <div className={styles.statValue}>
            <span className={styles.statEmoji}>🏆</span>
            <span>{streak.longestStreak}일</span>
          </div>
          <div className={styles.statLabel}>최장 연속</div>
        </div>

        {/* 성공률 */}
        <div className={`${styles.statItem} ${animateStats ? 'animate' : ''}`}>
          <div className={styles.statValue}>
            <span className={styles.statEmoji}>🎯</span>
            <span>{getSuccessRate()}%</span>
          </div>
          <div className={styles.statLabel}>예측 성공률</div>
        </div>

        {/* 총 예측 수 */}
        <div className={`${styles.statItem} ${animateStats ? 'animate' : ''}`}>
          <div className={styles.statValue}>
            <span className={styles.statEmoji}>📊</span>
            <span>{streak.totalPredictions}</span>
          </div>
          <div className={styles.statLabel}>총 예측</div>
        </div>
      </div>

      {/* 동기부여 메시지 */}
      <div className={styles.motivationalMessage}>
        {getMotivationalMessage()}
      </div>

      {/* 추가 정보 */}
      {streak.streakStartDate && streak.currentStreak > 0 && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          fontSize: '14px',
          textAlign: 'center',
          color: 'rgba(255, 255, 255, 0.9)'
        }}>
          🗓️ {formatDate(streak.streakStartDate)}부터 연속 예측 중!
        </div>
      )}

      {/* 연속 기록 진행률 바 */}
      {streak.currentStreak > 0 && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '8px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px',
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.9)'
          }}>
            <span>다음 마일스톤까지</span>
            <span>
              {streak.currentStreak < 7 ? `${7 - streak.currentStreak}일` :
               streak.currentStreak < 30 ? `${30 - streak.currentStreak}일` :
               streak.currentStreak < 100 ? `${100 - streak.currentStreak}일` :
               streak.currentStreak < 365 ? `${365 - streak.currentStreak}일` :
               '최고 레벨 달성! 🎉'}
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '8px',
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${
                streak.currentStreak < 7 ? (streak.currentStreak / 7) * 100 :
                streak.currentStreak < 30 ? (streak.currentStreak / 30) * 100 :
                streak.currentStreak < 100 ? (streak.currentStreak / 100) * 100 :
                streak.currentStreak < 365 ? (streak.currentStreak / 365) * 100 :
                100
              }%`,
              height: '100%',
              background: 'linear-gradient(90deg, #ffd93d, #ff6b6b)',
              borderRadius: '4px',
              transition: 'width 0.5s ease',
              animation: 'pulse 2s ease-in-out infinite'
            }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default StreakStats;