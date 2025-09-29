/**
 * 🗓️ StreakCalendar Component
 * GitHub 스타일 365일 연속 기록 달력
 */

import React, { useEffect, useState, useMemo } from 'react';
import streakService from '../../services/streakService';
import { DailyPrediction } from '../../types/streak.types';
import styles from '../../styles/streak.module.css';

interface CalendarDay {
  date: Date;
  prediction?: DailyPrediction;
  intensity: number;
}

const StreakCalendar: React.FC = () => {
  const [predictions, setPredictions] = useState<DailyPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredDay, setHoveredDay] = useState<CalendarDay | null>(null);

  // 요일 레이블 (한국어)
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  useEffect(() => {
    fetchYearlyPredictions();
  }, []);

  const fetchYearlyPredictions = async () => {
    try {
      setLoading(true);
      const data = await streakService.getYearlyPredictions();
      setPredictions(data);
    } catch (err) {
      setError('예측 기록을 불러오는데 실패했습니다');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 365일 달력 데이터 생성
  const calendarData = useMemo(() => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 364); // 365일 전부터
    startDate.setDay(0); // 일요일로 맞추기

    const days: CalendarDay[] = [];
    const predictionMap = new Map(
      predictions.map(p => [p.date, p])
    );

    // 53주 * 7일 = 371일 (여유있게)
    for (let i = 0; i < 371; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      if (date <= today) {
        const dateStr = date.toISOString().split('T')[0];
        const prediction = predictionMap.get(dateStr);
        const intensity = prediction
          ? streakService.getIntensityLevel(prediction.accuracy)
          : 0;

        days.push({
          date,
          prediction,
          intensity
        });
      }
    }

    return days;
  }, [predictions]);

  // 주별로 그룹화
  const weeks = useMemo(() => {
    const weeks: CalendarDay[][] = [];
    for (let i = 0; i < calendarData.length; i += 7) {
      weeks.push(calendarData.slice(i, i + 7));
    }
    return weeks;
  }, [calendarData]);

  // 월 레이블 생성
  const monthLabels = useMemo(() => {
    const labels: { month: string; week: number }[] = [];
    let currentMonth = -1;

    weeks.forEach((week, weekIndex) => {
      const monthNum = week[0]?.date.getMonth();
      if (monthNum !== currentMonth) {
        currentMonth = monthNum;
        const monthName = week[0]?.date.toLocaleDateString('ko-KR', { month: 'short' });
        labels.push({ month: monthName || '', week: weekIndex });
      }
    });

    return labels;
  }, [weeks]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>{error}</p>
      </div>
    );
  }

  return (
    <div className={styles.calendarContainer}>
      <div className={styles.calendarHeader}>
        <h2 className={styles.calendarTitle}>
          📊 365일 예측 기록
        </h2>
        <span className={styles.yearLabel}>
          {new Date().getFullYear()}년
        </span>
      </div>

      {/* 월 레이블 */}
      <div style={{ display: 'flex', marginBottom: '8px', paddingLeft: '30px' }}>
        {monthLabels.map((label, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: `${30 + label.week * 15}px`,
              fontSize: '12px',
              color: '#7f8c8d'
            }}
          >
            {label.month}
          </div>
        ))}
      </div>

      {/* 달력 그리드 */}
      <div style={{ display: 'flex', gap: '3px', marginTop: '24px' }}>
        {/* 요일 레이블 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginRight: '8px' }}>
          {weekDays.map((day, index) => (
            <div
              key={index}
              className={styles.weekLabel}
              style={{
                height: '13px',
                visibility: index % 2 === 1 ? 'visible' : 'hidden'
              }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 주별 그리드 */}
        <div style={{ display: 'flex', gap: '3px' }}>
          {weeks.map((week, weekIndex) => (
            <div
              key={weekIndex}
              style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}
            >
              {week.map((day, dayIndex) => {
                if (!day) return <div key={dayIndex} style={{ width: '13px', height: '13px' }} />;

                const intensityClass = day.intensity === -1
                  ? styles.intensityFailed
                  : styles[`intensity${day.intensity}`];

                return (
                  <div
                    key={dayIndex}
                    className={`${styles.daySquare} ${intensityClass}`}
                    style={{ width: '13px', height: '13px' }}
                    onMouseEnter={() => setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                  >
                    {hoveredDay === day && day.prediction && (
                      <div className={styles.tooltip}>
                        <div className={styles.tooltipContent}>
                          <div className={styles.tooltipDate}>
                            {day.date.toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                          <div className={styles.tooltipStat}>
                            <span>정확도:</span>
                            <span>{day.prediction.accuracy}%</span>
                          </div>
                          <div className={styles.tooltipStat}>
                            <span>예측:</span>
                            <span>{day.prediction.voteCount}개</span>
                          </div>
                          <div className={styles.tooltipStat}>
                            <span>정답:</span>
                            <span>{day.prediction.correctCount}개</span>
                          </div>
                          {day.prediction.kospiCorrect !== undefined && (
                            <div className={styles.tooltipStat}>
                              <span>KOSPI:</span>
                              <span>{day.prediction.kospiCorrect ? '✅' : '❌'}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* 범례 */}
      <div className={styles.legend}>
        <span>적음</span>
        <div className={styles.legendItem}>
          <div className={`${styles.legendSquare} ${styles.intensity0}`}></div>
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.legendSquare} ${styles.intensity1}`}></div>
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.legendSquare} ${styles.intensity2}`}></div>
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.legendSquare} ${styles.intensity3}`}></div>
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.legendSquare} ${styles.intensity4}`}></div>
        </div>
        <span>많음</span>
      </div>
    </div>
  );
};

export default StreakCalendar;