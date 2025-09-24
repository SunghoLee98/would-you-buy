// 🔥 KospiHeroCard - 100% API 명세서 준수 구현

import React, { useState } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { theme } from '../../styles/theme';
import { VotingDashboardItem, UserVote, VoteType } from '../../types/voting.types';

// =============================================================================
// Props Interface - 새로운 구조 사용
// =============================================================================

interface KospiHeroCardProps {
  kospiItem: VotingDashboardItem; // 새로운 구조: VotingDashboardItem
  userVote?: UserVote | null; // null 허용
  onVote: (voteType: VoteType) => Promise<void>; // 새로운 구조: VoteType
  isVotingActive: boolean;
  isAuthenticated: boolean;
  isLoading?: boolean;
}

// =============================================================================
// Styled Components (기존과 동일)
// =============================================================================

const pulseAnimation = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const slideUpAnimation = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const HeroContainer = styled.div`
  position: relative;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: ${theme.borderRadius.xl};
  padding: ${theme.spacing['2xl']};
  color: ${theme.colors.white};
  box-shadow: ${theme.shadows.xl};
  margin-bottom: ${theme.spacing['2xl']};
  overflow: hidden;
  animation: ${slideUpAnimation} 0.6s ease-out;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
    pointer-events: none;
  }

  @media (max-width: ${theme.breakpoints.tablet}) {
    padding: ${theme.spacing.xl};
    margin-bottom: ${theme.spacing.xl};
  }

  @media (max-width: ${theme.breakpoints.mobile}) {
    padding: ${theme.spacing.lg};
  }
`;

const HeaderSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${theme.spacing.xl};
  position: relative;
  z-index: 1;

  @media (max-width: ${theme.breakpoints.mobile}) {
    flex-direction: column;
    gap: ${theme.spacing.md};
  }
`;

const TitleGroup = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};

  @media (max-width: ${theme.breakpoints.mobile}) {
    justify-content: center;
    text-align: center;
  }
`;

const KospiIcon = styled.div`
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: ${theme.borderRadius.full};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${theme.fontSizes.xl};
  font-weight: ${theme.fontWeights.bold};
  backdrop-filter: blur(10px);

  @media (max-width: ${theme.breakpoints.mobile}) {
    width: 40px;
    height: 40px;
    font-size: ${theme.fontSizes.lg};
  }
`;

const TitleText = styled.div`
  h1 {
    font-size: ${theme.fontSizes['3xl']};
    font-weight: ${theme.fontWeights.bold};
    margin: 0 0 ${theme.spacing.xs};
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);

    @media (max-width: ${theme.breakpoints.mobile}) {
      font-size: ${theme.fontSizes['2xl']};
    }
  }

  p {
    font-size: ${theme.fontSizes.md};
    opacity: 0.9;
    margin: 0;

    @media (max-width: ${theme.breakpoints.mobile}) {
      font-size: ${theme.fontSizes.sm};
    }
  }
`;

const StatusBadge = styled.div<{ hasVoted: boolean }>`
  padding: ${theme.spacing.sm} ${theme.spacing.lg};
  background: ${props => props.hasVoted
    ? 'rgba(67, 233, 123, 0.2)'
    : 'rgba(255, 255, 255, 0.2)'
  };
  border: 2px solid ${props => props.hasVoted
    ? 'rgba(67, 233, 123, 0.5)'
    : 'rgba(255, 255, 255, 0.3)'
  };
  border-radius: ${theme.borderRadius.full};
  font-size: ${theme.fontSizes.sm};
  font-weight: ${theme.fontWeights.bold};
  backdrop-filter: blur(10px);
  white-space: nowrap;

  &::before {
    content: '${props => props.hasVoted ? '✓' : '⏱️'} ';
    margin-right: ${theme.spacing.xs};
  }

  @media (max-width: ${theme.breakpoints.mobile}) {
    align-self: center;
    padding: ${theme.spacing.xs} ${theme.spacing.md};
  }
`;

const PriceSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.xl};
  position: relative;
  z-index: 1;

  @media (max-width: ${theme.breakpoints.mobile}) {
    flex-direction: column;
    gap: ${theme.spacing.md};
    text-align: center;
  }
`;

const PriceGroup = styled.div`
  flex: 1;
`;

const CurrentPrice = styled.div`
  font-size: ${theme.fontSizes['4xl']};
  font-weight: ${theme.fontWeights.bold};
  margin-bottom: ${theme.spacing.xs};
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  animation: ${pulseAnimation} 3s ease-in-out infinite;

  @media (max-width: ${theme.breakpoints.tablet}) {
    font-size: ${theme.fontSizes['3xl']};
  }

  @media (max-width: ${theme.breakpoints.mobile}) {
    font-size: ${theme.fontSizes['2xl']};
  }
`;

const PriceChange = styled.div<{ isPositive: boolean }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  font-size: ${theme.fontSizes.lg};
  font-weight: ${theme.fontWeights.bold};
  opacity: 0.9;

  &::before {
    content: '${props => props.isPositive ? '📈' : '📉'}';
    font-size: ${theme.fontSizes.md};
  }

  @media (max-width: ${theme.breakpoints.mobile}) {
    font-size: ${theme.fontSizes.md};
    justify-content: center;
  }
`;

const VoteSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 1;

  @media (max-width: ${theme.breakpoints.mobile}) {
    flex-direction: column;
    gap: ${theme.spacing.lg};
  }
`;

const VoteButtons = styled.div`
  display: flex;
  gap: ${theme.spacing.md};

  @media (max-width: ${theme.breakpoints.mobile}) {
    width: 100%;

    button {
      flex: 1;
    }
  }
`;

const VoteButton = styled.button<{ variant: 'up' | 'down'; selected?: boolean }>`
  padding: ${theme.spacing.md} ${theme.spacing.xl};
  font-size: ${theme.fontSizes.lg};
  font-weight: ${theme.fontWeights.bold};
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: ${theme.borderRadius.full};
  backdrop-filter: blur(10px);
  transition: ${theme.transitions.base};
  position: relative;
  min-width: 120px;
  cursor: pointer;

  background: ${props => {
    if (props.selected) {
      return props.variant === 'up'
        ? 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
        : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
    }
    return 'rgba(255, 255, 255, 0.1)';
  }};

  color: ${theme.colors.white};
  border-color: ${props => props.selected ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.3)'};

  &::before {
    content: '${props => props.variant === 'up' ? '⬆️' : '⬇️'} ';
    margin-right: ${theme.spacing.xs};
  }

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
    border-color: rgba(255, 255, 255, 0.6);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  @media (max-width: ${theme.breakpoints.mobile}) {
    min-width: unset;
    padding: ${theme.spacing.sm} ${theme.spacing.lg};
    font-size: ${theme.fontSizes.md};
  }
`;

const VoteStats = styled.div`
  display: flex;
  gap: ${theme.spacing.lg};

  @media (max-width: ${theme.breakpoints.mobile}) {
    width: 100%;
    justify-content: center;
  }
`;

const StatItem = styled.div`
  text-align: center;

  .value {
    font-size: ${theme.fontSizes.xl};
    font-weight: ${theme.fontWeights.bold};
    margin-bottom: ${theme.spacing.xs};
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);

    @media (max-width: ${theme.breakpoints.mobile}) {
      font-size: ${theme.fontSizes.lg};
    }
  }

  .label {
    font-size: ${theme.fontSizes.sm};
    opacity: 0.8;

    @media (max-width: ${theme.breakpoints.mobile}) {
      font-size: ${theme.fontSizes.xs};
    }
  }
`;

// =============================================================================
// Main Component - 100% API 명세서 준수
// =============================================================================

/**
 * 🎯 KospiHeroCard - 100% API 명세서 준수 구현
 * - 새로운 VotingDashboardItem 구조 사용
 * - UserVote의 새로운 필드 구조 사용 (voteType, voteTypeText 등)
 */
const KospiHeroCard: React.FC<KospiHeroCardProps> = ({
  kospiItem,
  userVote,
  onVote,
  isVotingActive,
  isAuthenticated,
  isLoading = false,
}) => {
  const [hoveredVote, setHoveredVote] = useState<VoteType | null>(null);

  // 새로운 구조에서 데이터 추출
  const { stock, voteStatistics } = kospiItem;
  const hasVoted = userVote !== null;
  const currentUserVote = userVote?.voteType;

  // 가격 변화 여부 확인
  const isPricePositive = (stock.changeRate || 0) >= 0;

  // 투표 버튼 클릭 핸들러
  const handleVoteClick = async (voteType: VoteType) => {
    if (!isVotingActive || !isAuthenticated || isLoading) {
      return;
    }

    try {
      await onVote(voteType);
    } catch (error) {
      console.error('Vote failed:', error);
    }
  };

  return (
    <HeroContainer>
      <HeaderSection>
        <TitleGroup>
          <KospiIcon>K</KospiIcon>
          <TitleText>
            <h1>{stock.koreanName}</h1>
            <p>한국 종합주가지수</p>
          </TitleText>
        </TitleGroup>
        <StatusBadge hasVoted={hasVoted}>
          {hasVoted ? `${userVote?.voteTypeText} 예측완료` : '예측대기'}
        </StatusBadge>
      </HeaderSection>

      <PriceSection>
        <PriceGroup>
          <CurrentPrice>
            {stock.currentPrice?.toLocaleString() || 'N/A'}
          </CurrentPrice>
          <PriceChange isPositive={isPricePositive}>
            {stock.formattedChangeAmount} ({stock.formattedChangeRate})
          </PriceChange>
        </PriceGroup>
      </PriceSection>

      <VoteSection>
        <VoteButtons>
          <VoteButton
            variant="up"
            selected={currentUserVote === 'UP'}
            onClick={() => handleVoteClick('UP')}
            disabled={!isVotingActive || !isAuthenticated || isLoading}
            onMouseEnter={() => setHoveredVote('UP')}
            onMouseLeave={() => setHoveredVote(null)}
          >
            {isLoading ? '투표중...' : '상승'}
          </VoteButton>
          <VoteButton
            variant="down"
            selected={currentUserVote === 'DOWN'}
            onClick={() => handleVoteClick('DOWN')}
            disabled={!isVotingActive || !isAuthenticated || isLoading}
            onMouseEnter={() => setHoveredVote('DOWN')}
            onMouseLeave={() => setHoveredVote(null)}
          >
            {isLoading ? '투표중...' : '하락'}
          </VoteButton>
        </VoteButtons>

        <VoteStats>
          <StatItem>
            <div className="value">{voteStatistics.totalVotes.toLocaleString()}</div>
            <div className="label">총 투표</div>
          </StatItem>
          <StatItem>
            <div className="value">{Math.round(voteStatistics.upPercentage)}%</div>
            <div className="label">상승 예측</div>
          </StatItem>
          <StatItem>
            <div className="value">{voteStatistics.majorityVoteText || 'N/A'}</div>
            <div className="label">다수 의견</div>
          </StatItem>
        </VoteStats>
      </VoteSection>
    </HeroContainer>
  );
};

export default KospiHeroCard;