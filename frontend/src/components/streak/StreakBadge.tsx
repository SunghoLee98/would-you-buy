/**
 * 🏅 StreakBadge Component
 * 사용자 카드용 컴팩트 연속 기록 뱃지
 */

import React, { useEffect, useState } from 'react';
import streakService from '../../services/streakService';
import { UserStreak, StreakMilestone, BadgeLevel } from '../../types/streak.types';
import { STREAK_MILESTONES, CONFETTI_CONFIG, STORAGE_KEYS, STREAK_EMOJIS, ANIMATION_DURATION } from '../../constants/streak.constants';
import ConfettiEffect from './ConfettiEffect';
import styles from '../../styles/streak.module.css';

interface StreakBadgeProps {
  userId?: string;
  compact?: boolean; // 컴팩트 모드 (작은 크기)
  showMilestones?: boolean; // 마일스톤 뱃지 표시 여부
  animate?: boolean; // 애니메이션 활성화
  onStreakClick?: () => void; // 클릭 이벤트
}

const StreakBadge: React.FC<StreakBadgeProps> = ({
  userId,
  compact = false,
  showMilestones = true,
  animate = true,
  onStreakClick
}) => {
  const [streak, setStreak] = useState<UserStreak | null>(null);
  const [milestones, setMilestones] = useState<StreakMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    fetchStreakData();
  }, [userId]);

  const fetchStreakData = async () => {
    try {
      setLoading(true);
      const [streakData, milestonesData] = await Promise.all([
        streakService.getCurrentStreak(),
        streakService.getMilestones()
      ]);

      setStreak(streakData);
      setMilestones(milestonesData);

      // 새로운 마일스톤 달성 체크 (로컬 스토리지 사용)
      checkNewMilestone(streakData);
    } catch (err) {
      console.error('Failed to fetch streak data:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkNewMilestone = (streakData: UserStreak) => {
    const lastCheckKey = STORAGE_KEYS.LAST_MILESTONE_CHECK(userId || '');

    // Validate localStorage value with proper error handling
    let lastCheck = 0;
    try {
      const storedValue = localStorage.getItem(lastCheckKey);
      if (storedValue) {
        const parsed = parseInt(storedValue, 10);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= STREAK_MILESTONES.YEAR) {
          lastCheck = parsed;
        } else {
          console.warn('Invalid milestone check value, resetting to 0');
          localStorage.removeItem(lastCheckKey);
        }
      }
    } catch (error) {
      console.error('Failed to read from localStorage:', error);
      lastCheck = 0;
    }

    const milestoneThresholds = Object.values(STREAK_MILESTONES).sort((a, b) => a - b);
    const currentStreak = streakData.currentStreak;

    for (const threshold of milestoneThresholds) {
      if (currentStreak >= threshold && lastCheck < threshold) {
        triggerCelebration();
        try {
          localStorage.setItem(lastCheckKey, threshold.toString());
        } catch (error) {
          console.error('Failed to write to localStorage:', error);
        }
        break;
      }
    }
  };

  const triggerCelebration = () => {
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), ANIMATION_DURATION.CELEBRATION);
  };


  const getBadgeLevel = () => {
    if (!streak) return BadgeLevel.BRONZE;
    return streakService.getBadgeLevel(streak.currentStreak);
  };

  const getBadgeClass = () => {
    const level = getBadgeLevel();
    switch (level) {
      case BadgeLevel.PLATINUM:
        return styles.platinum;
      case BadgeLevel.GOLD:
        return styles.gold;
      case BadgeLevel.SILVER:
        return styles.silver;
      case BadgeLevel.BRONZE:
      default:
        return styles.bronze;
    }
  };

  const getStreakEmoji = () => {
    if (!streak) return STREAK_EMOJIS.INACTIVE;
    const days = streak.currentStreak;

    if (days === 0) return STREAK_EMOJIS.INACTIVE;
    if (days >= STREAK_MILESTONES.YEAR) return STREAK_EMOJIS.YEAR;
    if (days >= STREAK_MILESTONES.HUNDRED) return STREAK_EMOJIS.HUNDRED;
    if (days >= STREAK_MILESTONES.MONTH) return STREAK_EMOJIS.MONTH;
    if (days >= STREAK_MILESTONES.WEEK) return STREAK_EMOJIS.WEEK;
    return STREAK_EMOJIS.STARTER;
  };

  if (loading) {
    return <div className={styles.badgeContainer}>...</div>;
  }

  if (!streak) {
    return null;
  }

  return (
    <>
      {/* 메인 뱃지 */}
      <div
        className={`${styles.badgeContainer} ${getBadgeClass()} ${
          compact ? styles.compact : ''
        }`}
        onClick={onStreakClick}
        style={{ cursor: onStreakClick ? 'pointer' : 'default' }}
      >
        <span className={`${styles.badgeIcon} ${animate ? styles.animated : ''}`}>
          {getStreakEmoji()}
        </span>
        <span className={styles.badgeText}>
          {streak.currentStreak > 0 ? `${streak.currentStreak}일` : '시작하기'}
        </span>
      </div>

      {/* 마일스톤 뱃지들 */}
      {showMilestones && !compact && milestones.length > 0 && (
        <div className={styles.milestoneBadges}>
          {milestones.map((milestone) => (
            <div
              key={milestone.days}
              className={`${styles.milestoneBadge} ${
                milestone.achieved ? styles.achieved : ''
              }`}
              title={milestone.description}
            >
              <span>{milestone.badgeIcon}</span>
              <span>{milestone.days}일</span>
            </div>
          ))}
        </div>
      )}

      {/* Confetti Effect */}
      <ConfettiEffect active={showCelebration && animate} />

      {/* 축하 메시지 */}
      {showCelebration && (
        <div className={styles.celebration}>
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            color: 'white',
            padding: '24px 32px',
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            zIndex: 10000,
            fontSize: '20px',
            fontWeight: 'bold',
            textAlign: 'center',
            animation: `${styles.celebrate} 0.5s ease`
          }}>
            🎉 축하합니다! 🎉<br />
            {streak.currentStreak}일 연속 달성!
          </div>
        </div>
      )}

      {/* 컴팩트 모드 툴팁 */}
      {compact && streak.currentStreak > 0 && (
        <style>{`
          .${styles.badgeContainer}:hover::after {
            content: '최장: ${streak.longestStreak}일 | 성공률: ${
              streak.totalPredictions > 0
                ? ((streak.successfulPredictions / streak.totalPredictions) * 100).toFixed(1)
                : 0
            }%';
            position: absolute;
            bottom: -30px;
            left: 50%;
            transform: translateX(-50%);
            background: #2c3e50;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            white-space: nowrap;
            z-index: 100;
          }
        `}</style>
      )}
    </>
  );
};

export default StreakBadge;