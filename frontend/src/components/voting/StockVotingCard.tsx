// 🔥 StockVotingCard - 100% API 명세서 준수 구현

import React, { useState } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { theme } from '../../styles/theme';
import { VotingDashboardItem, VoteType } from '../../types/voting.types';

// =============================================================================
// Props Interface - 새로운 구조 사용
// =============================================================================

interface StockVotingCardProps {
  stockItem: VotingDashboardItem; // 새로운 구조: VotingDashboardItem
  onVote: (stockCode: string, voteType: VoteType) => Promise<void>; // 새로운 구조: stockCode, VoteType
  isVotingActive: boolean;
  isAuthenticated: boolean;
  isLoading?: boolean;
}

const cardHoverAnimation = keyframes`
  from { transform: translateY(0); }
  to { transform: translateY(-4px); }
`;

const voteSuccessAnimation = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
`;

const CardContainer = styled.div<{ isLoading?: boolean }>`
  background: ${theme.colors.white};
  border-radius: ${theme.borderRadius.lg};
  box-shadow: ${theme.shadows.md};
  padding: ${theme.spacing.lg};
  transition: ${theme.transitions.base};
  cursor: pointer;
  position: relative;
  overflow: hidden;
  opacity: ${props => props.isLoading ? 0.7 : 1};

  &:hover {
    box-shadow: ${theme.shadows.xl};
    animation: ${cardHoverAnimation} 0.2s ease-out forwards;
  }

  @media (max-width: ${theme.breakpoints.mobile}) {
    padding: ${theme.spacing.md};
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${theme.spacing.md};
`;

const StockInfo = styled.div`
  flex: 1;
`;

const StockSymbol = styled.h3`
  font-size: ${theme.fontSizes.lg};
  font-weight: ${theme.fontWeights.bold};
  color: ${theme.colors.gray[800]};
  margin: 0 0 ${theme.spacing.xs};

  @media (max-width: ${theme.breakpoints.mobile}) {
    font-size: ${theme.fontSizes.md};
  }
`;

const StockName = styled.p`
  font-size: ${theme.fontSizes.sm};
  color: ${theme.colors.gray[600]};
  margin: 0;
  line-height: 1.3;

  @media (max-width: ${theme.breakpoints.mobile}) {
    font-size: ${theme.fontSizes.xs};
  }
`;

const VoteIndicator = styled.div<{ hasVoted: boolean; voteType?: VoteType }>`
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.full};
  font-size: ${theme.fontSizes.xs};
  font-weight: ${theme.fontWeights.medium};
  white-space: nowrap;

  ${props => {
    if (!props.hasVoted) {
      return `
        background: ${theme.colors.gray[100]};
        color: ${theme.colors.gray[600]};
      `;
    }
    return props.voteType === 'UP' ? `
      background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
      color: white;
    ` : `
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
    `;
  }}
`;

const PriceSection = styled.div`
  margin-bottom: ${theme.spacing.lg};
`;

const CurrentPrice = styled.div`
  font-size: ${theme.fontSizes.xl};
  font-weight: ${theme.fontWeights.bold};
  color: ${theme.colors.gray[800]};
  margin-bottom: ${theme.spacing.xs};

  @media (max-width: ${theme.breakpoints.mobile}) {
    font-size: ${theme.fontSizes.lg};
  }
`;

const PriceChange = styled.div<{ isPositive: boolean }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  font-size: ${theme.fontSizes.sm};
  font-weight: ${theme.fontWeights.medium};
  color: ${props => props.isPositive ? theme.colors.success : theme.colors.error};

  &::before {
    content: '${props => props.isPositive ? '▲' : '▼'}';
    font-size: ${theme.fontSizes.xs};
  }
`;

const VotingSection = styled.div`
  margin-bottom: ${theme.spacing.md};
`;

const VotingButtons = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
  margin-bottom: ${theme.spacing.md};
`;

const VoteButton = styled.button<{
  voteType: VoteType;
  isSelected?: boolean;
  isAnimating?: boolean;
}>`
  flex: 1;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border: 2px solid ${props => {
    if (props.isSelected) {
      return props.voteType === 'UP' ? theme.colors.success : theme.colors.error;
    }
    return theme.colors.gray[300];
  }};
  border-radius: ${theme.borderRadius.md};
  background: ${props => {
    if (props.isSelected) {
      return props.voteType === 'UP'
        ? 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
        : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
    }
    return theme.colors.white;
  }};
  color: ${props => {
    if (props.isSelected) return theme.colors.white;
    return props.voteType === 'UP' ? theme.colors.success : theme.colors.error;
  }};
  font-size: ${theme.fontSizes.sm};
  font-weight: ${theme.fontWeights.medium};
  cursor: pointer;
  transition: ${theme.transitions.fast};

  ${props => props.isAnimating && `
    animation: ${voteSuccessAnimation} 0.5s ease-in-out;
  `}

  &:hover:not(:disabled) {
    background: ${props => {
      if (props.isSelected) {
        return props.voteType === 'UP'
          ? 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
          : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
      }
      return props.voteType === 'UP'
        ? 'rgba(67, 233, 123, 0.1)'
        : 'rgba(245, 87, 108, 0.1)';
    }};
    border-color: ${props => props.voteType === 'UP' ? theme.colors.success : theme.colors.error};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &::before {
    content: '${props => props.voteType === 'UP' ? '📈' : '📉'}';
    margin-right: ${theme.spacing.xs};
  }

  @media (max-width: ${theme.breakpoints.mobile}) {
    padding: ${theme.spacing.xs} ${theme.spacing.sm};
    font-size: ${theme.fontSizes.xs};
  }
`;

const VotingProgress = styled.div`
  background: ${theme.colors.gray[100]};
  border-radius: ${theme.borderRadius.full};
  height: 8px;
  overflow: hidden;
  margin-bottom: ${theme.spacing.sm};
`;

const ProgressBar = styled.div<{ percentage: number; type: VoteType }>`
  height: 100%;
  width: ${props => props.percentage}%;
  background: ${props => props.type === 'UP'
    ? 'linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)'
    : 'linear-gradient(90deg, #f093fb 0%, #f5576c 100%)'
  };
  transition: width 0.5s ease;
`;

const VotingStats = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: ${theme.fontSizes.xs};
  color: ${theme.colors.gray[600]};
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
`;

const StatDot = styled.div<{ color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.color};
`;

const TotalVotes = styled.div`
  font-weight: ${theme.fontWeights.medium};
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: ${theme.borderRadius.lg};
`;

const LoadingSpinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid ${theme.colors.gray[300]};
  border-radius: 50%;
  border-top-color: ${theme.colors.primary};
  animation: spin 1s linear infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

// =============================================================================
// Main Component - 100% API 명세서 준수
// =============================================================================

/**
 * 🎯 StockVotingCard - 100% API 명세서 준수 구현
 * - 새로운 VotingDashboardItem 구조 사용
 * - UserVote의 새로운 필드 구조 사용 (voteType, voteTypeText 등)
 */
const StockVotingCard: React.FC<StockVotingCardProps> = ({
  stockItem,
  onVote,
  isVotingActive,
  isAuthenticated,
  isLoading = false,
}) => {
  const [isVoting, setIsVoting] = useState(false);
  const [animatingButton, setAnimatingButton] = useState<VoteType | null>(null);

  // 새로운 구조에서 데이터 추출
  const { stock, voteStatistics, userVote } = stockItem;

  const handleVote = async (voteType: VoteType) => {
    if (isVoting || !isVotingActive || !isAuthenticated) return;

    try {
      setIsVoting(true);
      setAnimatingButton(voteType);
      await onVote(stock.code, voteType);
    } catch (error) {
      console.error('Vote failed:', error);
    } finally {
      setIsVoting(false);
      setTimeout(() => setAnimatingButton(null), 500);
    }
  };

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return price.toLocaleString('ko-KR');
    }
    return price.toLocaleString('ko-KR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };

  const isPositive = (stock.changeRate || 0) >= 0;

  return (
    <CardContainer isLoading={isLoading}>
      {isLoading && (
        <LoadingOverlay>
          <LoadingSpinner />
        </LoadingOverlay>
      )}

      <CardHeader>
        <StockInfo>
          <StockSymbol>{stock.code}</StockSymbol>
          <StockName>{stock.koreanName}</StockName>
        </StockInfo>
        <VoteIndicator hasVoted={!!userVote} voteType={userVote?.voteType}>
          {userVote ? userVote.voteTypeText : '미투표'}
        </VoteIndicator>
      </CardHeader>

      <PriceSection>
        <CurrentPrice>{stock.currentPrice?.toLocaleString() || 'N/A'}원</CurrentPrice>
        <PriceChange isPositive={isPositive}>
          {stock.formattedChangeAmount} ({stock.formattedChangeRate})
        </PriceChange>
      </PriceSection>

      <VotingSection>
        <VotingButtons>
          <VoteButton
            voteType="UP"
            isSelected={userVote?.voteType === 'UP'}
            isAnimating={animatingButton === 'UP'}
            onClick={() => handleVote('UP')}
            disabled={!isAuthenticated || !isVotingActive || isVoting || !!userVote}
          >
            {isAuthenticated ? '상승' : '로그인'}
          </VoteButton>
          <VoteButton
            voteType="DOWN"
            isSelected={userVote?.voteType === 'DOWN'}
            isAnimating={animatingButton === 'DOWN'}
            onClick={() => handleVote('DOWN')}
            disabled={!isAuthenticated || !isVotingActive || isVoting || !!userVote}
          >
            {isAuthenticated ? '하락' : '로그인'}
          </VoteButton>
        </VotingButtons>

        <VotingProgress>
          <ProgressBar
            percentage={voteStatistics.upPercentage}
            type="UP"
          />
        </VotingProgress>

        <VotingStats>
          <StatItem>
            <StatDot color="#43e97b" />
            상승 {formatPercentage(voteStatistics.upPercentage)}
          </StatItem>
          <TotalVotes>
            총 {voteStatistics.totalVotes.toLocaleString()}표
          </TotalVotes>
          <StatItem>
            <StatDot color="#f5576c" />
            하락 {formatPercentage(voteStatistics.downPercentage)}
          </StatItem>
        </VotingStats>
      </VotingSection>
    </CardContainer>
  );
};

export default StockVotingCard;