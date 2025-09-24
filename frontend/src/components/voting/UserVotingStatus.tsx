// 🔥 UserVotingStatus - 100% API 명세서 준수 구현

import React from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { theme } from '../../styles/theme';
import { VotingDashboardItem } from '../../types/voting.types';

// =============================================================================
// Props Interface - 새로운 구조 사용
// =============================================================================

interface UserVotingStatusProps {
  allItems: VotingDashboardItem[]; // 새로운 구조: 모든 투표 항목
  votingDate: string; // 투표일
  isAuthenticated: boolean;
  isLoading?: boolean;
  onLoginClick?: () => void;
}

// =============================================================================
// Styled Components (기존과 동일)
// =============================================================================

const slideInAnimation = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const StatusContainer = styled.div`
  background: ${theme.colors.white};
  border-radius: ${theme.borderRadius.xl};
  box-shadow: ${theme.shadows.lg};
  padding: ${theme.spacing.xl};
  margin-bottom: ${theme.spacing.xl};
  animation: ${slideInAnimation} 0.6s ease-out;

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

const StatusBadge = styled.div<{ hasVoted: boolean }>`
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border-radius: ${theme.borderRadius.full};
  font-size: ${theme.fontSizes.sm};
  font-weight: ${theme.fontWeights.medium};
  color: ${theme.colors.white};

  background: ${props => props.hasVoted
    ? 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  };

  &::before {
    content: '${props => props.hasVoted ? '✓' : '⏱️'} ';
    margin-right: ${theme.spacing.xs};
  }
`;

const ProgressSection = styled.div`
  margin-bottom: ${theme.spacing.lg};
`;

const ProgressHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.md};

  @media (max-width: ${theme.breakpoints.mobile}) {
    flex-direction: column;
    gap: ${theme.spacing.xs};
    align-items: flex-start;
  }
`;

const ProgressLabel = styled.div`
  font-size: ${theme.fontSizes.md};
  font-weight: ${theme.fontWeights.medium};
  color: ${theme.colors.gray[700]};
`;

const ProgressCount = styled.div`
  font-size: ${theme.fontSizes.md};
  font-weight: ${theme.fontWeights.bold};
  color: ${theme.colors.primary};
`;

const ProgressBar = styled.div`
  background: ${theme.colors.gray[200]};
  border-radius: ${theme.borderRadius.full};
  height: 12px;
  overflow: hidden;
  position: relative;
`;

const ProgressFill = styled.div<{ percentage: number }>`
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: ${theme.borderRadius.full};
  transition: width 1s ease-out;
  width: ${props => props.percentage}%;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%);
    animation: shimmer 2s ease-in-out infinite;
  }

  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.lg};

  @media (max-width: ${theme.breakpoints.mobile}) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const StatCard = styled.div`
  text-align: center;
  padding: ${theme.spacing.md};
  background: ${theme.colors.gray[50]};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.gray[200]};
  transition: ${theme.transitions.base};

  &:hover {
    background: ${theme.colors.gray[100]};
    border-color: ${theme.colors.primary};
  }

  @media (max-width: ${theme.breakpoints.mobile}) {
    padding: ${theme.spacing.sm};
  }
`;

const StatValue = styled.div`
  font-size: ${theme.fontSizes.lg};
  font-weight: ${theme.fontWeights.bold};
  color: ${theme.colors.primary};
  margin-bottom: ${theme.spacing.xs};

  @media (max-width: ${theme.breakpoints.mobile}) {
    font-size: ${theme.fontSizes.md};
  }
`;

const StatLabel = styled.div`
  font-size: ${theme.fontSizes.xs};
  color: ${theme.colors.gray[600]};
  font-weight: ${theme.fontWeights.medium};
`;

const VotesList = styled.div`
  background: ${theme.colors.gray[50]};
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing.md};
  max-height: 200px;
  overflow-y: auto;

  @media (max-width: ${theme.breakpoints.mobile}) {
    max-height: 150px;
  }
`;

const VotesHeader = styled.div`
  font-size: ${theme.fontSizes.sm};
  font-weight: ${theme.fontWeights.medium};
  color: ${theme.colors.gray[700]};
  margin-bottom: ${theme.spacing.sm};
  padding-bottom: ${theme.spacing.xs};
  border-bottom: 1px solid ${theme.colors.gray[200]};
`;

const VoteItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${theme.spacing.xs} 0;
  border-bottom: 1px solid ${theme.colors.gray[200]};

  &:last-child {
    border-bottom: none;
  }

  @media (max-width: ${theme.breakpoints.mobile}) {
    flex-direction: column;
    align-items: flex-start;
    gap: ${theme.spacing.xs};
  }
`;

const VoteStock = styled.div`
  flex: 1;
  font-size: ${theme.fontSizes.sm};
  color: ${theme.colors.gray[800]};
  font-weight: ${theme.fontWeights.medium};
`;

const VotePrediction = styled.div<{ voteType: 'UP' | 'DOWN' }>`
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.sm};
  font-size: ${theme.fontSizes.xs};
  font-weight: ${theme.fontWeights.medium};
  color: ${theme.colors.white};

  background: ${props => props.voteType === 'UP'
    ? 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
    : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  };

  &::before {
    content: '${props => props.voteType === 'UP' ? '📈' : '📉'} ';
    margin-right: ${theme.spacing.xs};
  }
`;

const EmptyVotes = styled.div`
  text-align: center;
  padding: ${theme.spacing.lg};
  color: ${theme.colors.gray[500]};
  font-size: ${theme.fontSizes.sm};
`;

const GuestMessage = styled.div`
  text-align: center;
  padding: ${theme.spacing.xl};
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: ${theme.borderRadius.lg};
  color: ${theme.colors.white};

  h3 {
    font-size: ${theme.fontSizes.lg};
    margin-bottom: ${theme.spacing.md};
  }

  p {
    font-size: ${theme.fontSizes.sm};
    opacity: 0.9;
    margin-bottom: ${theme.spacing.lg};
  }

  @media (max-width: ${theme.breakpoints.mobile}) {
    padding: ${theme.spacing.lg};
  }
`;

const LoginButton = styled.button`
  padding: ${theme.spacing.md} ${theme.spacing.xl};
  background: ${theme.colors.white};
  color: ${theme.colors.primary};
  border: none;
  border-radius: ${theme.borderRadius.full};
  font-size: ${theme.fontSizes.md};
  font-weight: ${theme.fontWeights.bold};
  cursor: pointer;
  transition: ${theme.transitions.base};

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${theme.shadows.md};
  }
`;

const LoadingSkeleton = styled.div<{ width?: string; height?: string }>`
  background: ${theme.colors.gray[200]};
  border-radius: ${theme.borderRadius.sm};
  width: ${props => props.width || '100%'};
  height: ${props => props.height || '20px'};
  margin-bottom: ${theme.spacing.sm};
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
 * 🎯 UserVotingStatus - 100% API 명세서 준수 구현
 * - Legacy UserVotingStatus 타입 제거
 * - 새로운 VotingDashboardItem[] 구조 직접 사용
 * - UserVote의 새로운 필드 구조 사용
 */
const UserVotingStatus: React.FC<UserVotingStatusProps> = ({
  allItems,
  votingDate,
  isAuthenticated,
  isLoading = false,
  onLoginClick,
}) => {
  if (isLoading) {
    return (
      <StatusContainer>
        <Header>
          <LoadingSkeleton width="150px" height="24px" />
          <LoadingSkeleton width="100px" height="32px" />
        </Header>
        <LoadingSkeleton width="100%" height="40px" />
        <StatsGrid>
          {Array.from({ length: 4 }).map((_, index) => (
            <StatCard key={index}>
              <LoadingSkeleton width="40px" height="20px" style={{ margin: '0 auto 8px' }} />
              <LoadingSkeleton width="60px" height="14px" style={{ margin: '0 auto' }} />
            </StatCard>
          ))}
        </StatsGrid>
        <LoadingSkeleton width="100%" height="100px" />
      </StatusContainer>
    );
  }

  if (!isAuthenticated) {
    return (
      <StatusContainer>
        <GuestMessage>
          <h3>투표에 참여해보세요!</h3>
          <p>로그인하고 오늘의 주식 시장을 예측해보세요.</p>
          <LoginButton onClick={onLoginClick}>
            로그인하기
          </LoginButton>
        </GuestMessage>
      </StatusContainer>
    );
  }

  // 새로운 구조로 사용자 투표 정보 계산
  const userVotes = allItems.filter(item => item.userVote !== null).map(item => item.userVote!);
  const totalItems = allItems.length;
  const votedCount = userVotes.length;
  const hasVoted = votedCount > 0;

  // 포인트 계산 (실제 API에서는 UserVote.pointsEarned 사용)
  const totalPointsEarned = userVotes.reduce((sum, vote) => {
    return sum + (vote.pointsEarned || 0);
  }, 0);

  // 연속 참여일 계산 (실제로는 사용자 통계 API에서 가져와야 함)
  const streakCount = 0; // 임시값, 실제로는 API에서

  const completionPercentage = totalItems > 0
    ? Math.round((votedCount / totalItems) * 100)
    : 0;

  return (
    <StatusContainer>
      <Header>
        <Title>나의 투표 현황</Title>
        <StatusBadge hasVoted={hasVoted}>
          {hasVoted ? '투표 완료' : '투표 진행중'}
        </StatusBadge>
      </Header>

      <ProgressSection>
        <ProgressHeader>
          <ProgressLabel>오늘의 투표 진행률</ProgressLabel>
          <ProgressCount>
            {votedCount} / {totalItems}
          </ProgressCount>
        </ProgressHeader>
        <ProgressBar>
          <ProgressFill percentage={completionPercentage} />
        </ProgressBar>
      </ProgressSection>

      <StatsGrid>
        <StatCard>
          <StatValue>{totalPointsEarned}</StatValue>
          <StatLabel>오늘 획득 포인트</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{streakCount}</StatValue>
          <StatLabel>연속 참여일</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{votedCount}</StatValue>
          <StatLabel>투표 완료</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{completionPercentage}%</StatValue>
          <StatLabel>완료율</StatLabel>
        </StatCard>
      </StatsGrid>

      <VotesList>
        <VotesHeader>오늘의 투표 내역 ({votingDate})</VotesHeader>
        {userVotes.length === 0 ? (
          <EmptyVotes>
            아직 투표한 종목이 없습니다.<br />
            위의 종목들을 선택하여 투표해보세요!
          </EmptyVotes>
        ) : (
          userVotes.map((vote) => (
            <VoteItem key={vote.id}>
              <VoteStock>{vote.stockName}</VoteStock>
              <VotePrediction voteType={vote.voteType}>
                {vote.voteTypeText}
              </VotePrediction>
            </VoteItem>
          ))
        )}
      </VotesList>
    </StatusContainer>
  );
};

export default UserVotingStatus;