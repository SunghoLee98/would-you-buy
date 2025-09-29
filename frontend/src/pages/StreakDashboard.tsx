/**
 * 📊 StreakDashboard Page
 * 사용자 연속 기록 대시보드 페이지
 */

import React, { useState } from 'react';
import { StreakCalendar, StreakStats, StreakBadge } from '../components/streak';
import styles from '../styles/streak.module.css';

const StreakDashboard: React.FC = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* 페이지 헤더 */}
        <header style={{
          textAlign: 'center',
          marginBottom: '40px',
          color: 'white'
        }}>
          <h1 style={{
            fontSize: '36px',
            fontWeight: 'bold',
            marginBottom: '16px'
          }}>
            🔥 나의 예측 연속 기록
          </h1>
          <p style={{
            fontSize: '18px',
            opacity: 0.9
          }}>
            매일 꾸준한 예측으로 실력을 키워보세요!
          </p>
        </header>

        {/* 메인 통계 */}
        <StreakStats refreshTrigger={refreshTrigger} />

        {/* 뱃지 섹션 */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '700',
            marginBottom: '16px',
            color: '#2c3e50'
          }}>
            🏅 내 뱃지
          </h2>
          <div style={{
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
            <StreakBadge showMilestones={true} animate={true} />
          </div>
        </div>

        {/* 365일 달력 */}
        <StreakCalendar />

        {/* 액션 버튼 */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '16px',
          marginTop: '32px'
        }}>
          <button
            onClick={handleRefresh}
            style={{
              padding: '12px 24px',
              background: 'white',
              color: '#667eea',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
            }}
          >
            🔄 새로고침
          </button>

          <button
            onClick={() => window.location.href = '/voting'}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #ff6b6b, #ffd93d)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 107, 107, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 107, 107, 0.3)';
            }}
          >
            📊 오늘의 예측하기
          </button>
        </div>

        {/* 팁 섹션 */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '20px',
          marginTop: '32px',
          color: 'white',
          textAlign: 'center'
        }}>
          <h3 style={{
            fontSize: '18px',
            marginBottom: '12px'
          }}>
            💡 연속 기록 팁
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px',
            marginTop: '16px'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '12px',
              borderRadius: '8px'
            }}>
              <strong>🎯 일정한 시간에</strong>
              <p style={{ marginTop: '4px', fontSize: '14px', opacity: 0.9 }}>
                매일 같은 시간에 예측하는 습관을 만드세요
              </p>
            </div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '12px',
              borderRadius: '8px'
            }}>
              <strong>📈 시장 분석하기</strong>
              <p style={{ marginTop: '4px', fontSize: '14px', opacity: 0.9 }}>
                예측 전 간단한 시장 동향을 확인하세요
              </p>
            </div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '12px',
              borderRadius: '8px'
            }}>
              <strong>🔥 연속 기록 유지</strong>
              <p style={{ marginTop: '4px', fontSize: '14px', opacity: 0.9 }}>
                하루도 빠지지 않고 꾸준히 참여해보세요
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreakDashboard;