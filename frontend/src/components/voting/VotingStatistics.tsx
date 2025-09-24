// 🔥 VotingStatistics - 100% API 명세서 준수 구현

import React from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { theme } from '../../styles/theme';
import { VotingDashboardResponse } from '../../types/voting.types';

// =============================================================================
// Props Interface - 새로운 구조 사용
// =============================================================================

interface VotingStatisticsProps {
  votingData: VotingDashboardResponse; // 새로운 구조: VotingDashboardResponse 직접 사용
  isLoading?: boolean;
}

const countUpAnimation = keyframes`
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
`;

const pulseAnimation = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

const StatisticsContainer = styled.div`
  background: ${theme.colors.white};
  border-radius: ${theme.borderRadius.xl};
  box-shadow: ${theme.shadows.lg};
  padding: ${theme.spacing.xl};
  margin-bottom: ${theme.spacing.xl};

  @media (max-width: ${theme.breakpoints.mobile}) {
    padding: ${theme.spacing.lg};
    margin-bottom: ${theme.spacing.lg};
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.lg};
  padding-bottom: ${theme.spacing.md};
  border-bottom: 2px solid ${theme.colors.gray[100]};

  @media (max-width: ${theme.breakpoints.mobile}) {
    flex-direction: column;
    gap: ${theme.spacing.sm};
    align-items: flex-start;
  }
`;

const Title = styled.h2`
  font-size: ${theme.fontSizes.xl};
  font-weight: ${theme.fontWeights.bold};
  color: ${theme.colors.gray[800]};
  margin: 0;

  @media (max-width: ${theme.breakpoints.mobile}) {
    font-size: ${theme.fontSizes.lg};
  }
`;

const SessionInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};

  @media (max-width: ${theme.breakpoints.mobile}) {
    flex-direction: column;
    align-items: flex-start;
    gap: ${theme.spacing.xs};
  }
`;

const SessionStatus = styled.div<{ status: 'ACTIVE' | 'CLOSED' }>`
  padding: ${theme.spacing.xs} ${theme.spacing.md};
  border-radius: ${theme.borderRadius.full};
  font-size: ${theme.fontSizes.sm};
  font-weight: ${theme.fontWeights.medium};
  color: ${theme.colors.white};

  background: ${props => {
    switch (props.status) {
      case 'ACTIVE':
        return theme.colors.success;
      case 'CLOSED':
        return theme.colors.warning;
      default:
        return theme.colors.gray[400];
    }
  }};

  ${props => props.status === 'ACTIVE' && `
    animation: ${pulseAnimation} 2s ease-in-out infinite;
  `}
`;

const SessionDate = styled.div`
  font-size: ${theme.fontSizes.sm};
  color: ${theme.colors.gray[600]};

  @media (max-width: ${theme.breakpoints.mobile}) {
    font-size: ${theme.fontSizes.xs};
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.lg};

  @media (max-width: ${theme.breakpoints.tablet}) {
    grid-template-columns: repeat(2, 1fr);
    gap: ${theme.spacing.md};
  }

  @media (max-width: ${theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled.div`
  text-align: center;
  padding: ${theme.spacing.lg};
  background: linear-gradient(135deg, ${theme.colors.gray[50]} 0%, ${theme.colors.white} 100%);
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid ${theme.colors.gray[200]};
  transition: ${theme.transitions.base};

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${theme.shadows.md};
    border-color: ${theme.colors.primary};
  }

  @media (max-width: ${theme.breakpoints.mobile}) {
    padding: ${theme.spacing.md};
  }
`;

const StatValue = styled.div`
  font-size: ${theme.fontSizes['2xl']};
  font-weight: ${theme.fontWeights.bold};
  color: ${theme.colors.primary};
  margin-bottom: ${theme.spacing.sm};
  animation: ${countUpAnimation} 0.6s ease-out;

  @media (max-width: ${theme.breakpoints.mobile}) {
    font-size: ${theme.fontSizes.xl};
  }
`;

const StatLabel = styled.div`
  font-size: ${theme.fontSizes.sm};
  color: ${theme.colors.gray[600]};
  font-weight: ${theme.fontWeights.medium};

  @media (max-width: ${theme.breakpoints.mobile}) {
    font-size: ${theme.fontSizes.xs};
  }
`;

const PopularStock = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: ${theme.borderRadius.lg};
  padding: ${theme.spacing.lg};
  color: ${theme.colors.white};
  text-align: center;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
    pointer-events: none;
  }

  @media (max-width: ${theme.breakpoints.mobile}) {
    padding: ${theme.spacing.md};
  }
`;

const PopularStockLabel = styled.div`
  font-size: ${theme.fontSizes.sm};
  font-weight: ${theme.fontWeights.medium};
  opacity: 0.9;
  margin-bottom: ${theme.spacing.sm};

  &::before {
    content: '🏆 ';
    margin-right: ${theme.spacing.xs};
  }
`;

const PopularStockInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${theme.spacing.md};

  @media (max-width: ${theme.breakpoints.mobile}) {
    flex-direction: column;
    gap: ${theme.spacing.sm};
  }
`;

const PopularStockName = styled.div`
  flex: 1;
`;

const StockSymbol = styled.div`
  font-size: ${theme.fontSizes.lg};
  font-weight: ${theme.fontWeights.bold};
  margin-bottom: ${theme.spacing.xs};

  @media (max-width: ${theme.breakpoints.mobile}) {
    font-size: ${theme.fontSizes.md};
  }
`;

const StockNameText = styled.div`
  font-size: ${theme.fontSizes.sm};
  opacity: 0.9;

  @media (max-width: ${theme.breakpoints.mobile}) {
    font-size: ${theme.fontSizes.xs};
  }
`;

const VoteCount = styled.div`
  text-align: right;

  @media (max-width: ${theme.breakpoints.mobile}) {
    text-align: center;
  }
`;

const VoteNumber = styled.div`
  font-size: ${theme.fontSizes.xl};
  font-weight: ${theme.fontWeights.bold};

  @media (max-width: ${theme.breakpoints.mobile}) {
    font-size: ${theme.fontSizes.lg};
  }
`;

const VoteLabel = styled.div`
  font-size: ${theme.fontSizes.xs};
  opacity: 0.8;
`;


const LoadingSkeleton = styled.div<{ width?: string; height?: string }>`
  background: ${theme.colors.gray[200]};
  border-radius: ${theme.borderRadius.sm};
  width: ${props => props.width || '100%'};
  height: ${props => props.height || '20px'};
  animation: pulse 1.5s ease-in-out infinite;

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

// =============================================================================
// Main Component - 100% API 명세서 준수
// =============================================================================

/**
 * 🎯 VotingStatistics - 100% API 명세서 준수 구현
 * - Legacy VotingStatistics 타입 제거
 * - 새로운 VotingDashboardResponse 구조 직접 사용
 * - 통계 데이터를 직접 계산
 */
const VotingStatistics: React.FC<VotingStatisticsProps> = ({
  votingData,
  isLoading = false,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  };

  const getStatusText = (isOpen: boolean) => {
    return isOpen ? '투표 진행중' : '투표 마감';
  };

  // 새로운 구조에서 통계 데이터 계산
  const totalVotes = votingData.items.reduce((sum, item) => sum + item.voteStatistics.totalVotes, 0);
  const totalParticipants = votingData.items.filter(item => item.voteStatistics.totalVotes > 0).length;
  const averageVotes = totalParticipants > 0 ? totalVotes / totalParticipants : 0;

  // 가장 인기 있는 종목 찾기
  const mostPopularStock = votingData.items.reduce((max, item) => {
    return item.voteStatistics.totalVotes > (max?.voteStatistics.totalVotes || 0) ? item : max;
  }, votingData.items[0] || null);

  if (isLoading) {
    return (
      <StatisticsContainer>
        <Header>
          <LoadingSkeleton width="150px" height="24px" />
          <LoadingSkeleton width="200px" height="32px" />
        </Header>
        <StatsGrid>
          {Array.from({ length: 4 }).map((_, index) => (
            <StatCard key={index}>
              <LoadingSkeleton width="60px" height="32px" style={{ margin: '0 auto 8px' }} />
              <LoadingSkeleton width="80px" height="16px" style={{ margin: '0 auto' }} />
            </StatCard>
          ))}
        </StatsGrid>
        <LoadingSkeleton width="100%" height="80px" />
      </StatisticsContainer>
    );
  }

  return (
    <StatisticsContainer>
      <Header>
        <Title>실시간 투표 현황</Title>
        <SessionInfo>
          <SessionStatus status={votingData.votingWindowOpen ? 'ACTIVE' : 'CLOSED'}>
            {getStatusText(votingData.votingWindowOpen)}
          </SessionStatus>
          <SessionDate>
            {formatDate(votingData.votingDate)} - {votingData.marketStatus}
          </SessionDate>
        </SessionInfo>
      </Header>

      <StatsGrid>
        <StatCard>
          <StatValue>{votingData.totalActiveStocks}</StatValue>
          <StatLabel>총 종목수</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{totalVotes.toLocaleString()}</StatValue>
          <StatLabel>총 투표수</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>
            {averageVotes.toFixed(1)}
          </StatValue>
          <StatLabel>평균 투표수</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>
            {votingData.votingWindowOpen ? '진행중' : '마감'}
          </StatValue>
          <StatLabel>투표 상태</StatLabel>
        </StatCard>
      </StatsGrid>

      {mostPopularStock && (
        <PopularStock>
          <PopularStockLabel>
            오늘의 인기 종목
          </PopularStockLabel>
          <PopularStockInfo>
            <PopularStockName>
              <StockSymbol>{mostPopularStock.stock.code}</StockSymbol>
              <StockNameText>{mostPopularStock.stock.koreanName}</StockNameText>
            </PopularStockName>
            <VoteCount>
              <VoteNumber>{mostPopularStock.voteStatistics.totalVotes.toLocaleString()}</VoteNumber>
              <VoteLabel>투표</VoteLabel>
            </VoteCount>
          </PopularStockInfo>
        </PopularStock>
      )}
    </StatisticsContainer>
  );
};

export default VotingStatistics;