// 🔥 VotingDashboard - 100% API 명세서 준수 구현

import React, { useState, useCallback, Suspense } from 'react';
import styled from '@emotion/styled';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { theme } from '../styles/theme';
import { Button, ErrorMessage, SuccessMessage } from '../styles/shared';
import { useVotingData } from '../hooks/useVotingData';
import { apiClient } from '../services/api-client';
import { SubmitVoteRequest, VoteType } from '../types/voting.types';
import { DashboardErrorBoundary } from './ErrorBoundary';
import DashboardSkeleton from './DashboardSkeleton';

// Import voting components
import KospiHeroCard from './voting/KospiHeroCard';
import StockVotingGrid from './voting/StockVotingGrid';
import VotingStatisticsComponent from './voting/VotingStatistics';
import UserVotingStatusComponent from './voting/UserVotingStatus';
import ConfettiAnimation from './ui/ConfettiAnimation';

// =============================================================================
// Styled Components
// =============================================================================

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: ${theme.spacing.xl} ${theme.spacing.lg};

  @media (max-width: ${theme.breakpoints.tablet}) {
    padding: ${theme.spacing.lg} ${theme.spacing.md};
  }

  @media (max-width: ${theme.breakpoints.mobile}) {
    padding: ${theme.spacing.md} ${theme.spacing.sm};
  }
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto ${theme.spacing.xl};
  padding: ${theme.spacing.lg};
  background: ${theme.colors.white};
  border-radius: ${theme.borderRadius.xl};
  box-shadow: ${theme.shadows.md};

  @media (max-width: ${theme.breakpoints.tablet}) {
    flex-direction: column;
    gap: ${theme.spacing.md};
    align-items: stretch;
  }
`;

const Logo = styled.h1`
  color: ${theme.colors.primary};
  font-size: ${theme.fontSizes['2xl']};
  font-weight: ${theme.fontWeights.bold};
  margin: 0;
  background: ${theme.colors.gradient.primary};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;

  @media (max-width: ${theme.breakpoints.mobile}) {
    font-size: ${theme.fontSizes.xl};
    text-align: center;
  }
`;

const Subtitle = styled.p`
  color: ${theme.colors.gray[600]};
  font-size: ${theme.fontSizes.sm};
  margin: ${theme.spacing.xs} 0 0;

  @media (max-width: ${theme.breakpoints.mobile}) {
    text-align: center;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  align-items: center;

  @media (max-width: ${theme.breakpoints.tablet}) {
    justify-content: center;
  }

  @media (max-width: ${theme.breakpoints.mobile}) {
    flex-direction: column;
    width: 100%;
  }
`;

const ContentWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const MainContent = styled.main`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${theme.spacing.xl};

  @media (min-width: ${theme.breakpoints.wide}) {
    grid-template-columns: 2fr 1fr;
    gap: ${theme.spacing['2xl']};
  }
`;

const PrimaryColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.xl};
`;

const SecondaryColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.xl};

  @media (max-width: ${theme.breakpoints.wide}) {
    order: -1;
  }
`;

const MessageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto ${theme.spacing.lg};
`;

const RefreshButton = styled(Button)`
  margin-left: ${theme.spacing.md};
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  font-size: ${theme.fontSizes.sm};

  @media (max-width: ${theme.breakpoints.mobile}) {
    margin-left: 0;
    margin-top: ${theme.spacing.sm};
    width: 100%;
  }
`;

// =============================================================================
// Main VotingDashboard Component - 100% API 명세서 준수
// =============================================================================

/**
 * 🎯 Core VotingDashboard component using Suspense pattern
 * - Legacy 어댑터 완전 제거
 * - 새로운 VotingDashboardResponse 구조 직접 사용
 * - 100% API 명세서 준수
 */
const VotingDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Use Suspense-compatible hook - data is guaranteed to be available
  const {
    data: votingData,
    kospiItem,
    featuredStocks,
    allItems,
    isAuthenticated,
    isVotingActive,
    getUserVote,
    hasUserVoted,
    refetch,
    marketStatus,
    votingDate
  } = useVotingData();

  // UI state management
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [votingInProgress, setVotingInProgress] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Handle vote submission with modern error handling
  const handleVote = useCallback(async (stockCode: string, voteType: VoteType, confidenceLevel?: number, predictionReason?: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (votingInProgress) {
      return; // Prevent multiple votes
    }

    try {
      setVotingInProgress(stockCode);
      setError(null);
      setSuccess(null);

      const voteRequest: SubmitVoteRequest = {
        stockCode,
        voteType,
        confidenceLevel,
        predictionReason,
      };

      const response = await apiClient.submitVote(voteRequest);

      if (response.success && response.vote) {
        const voteText = voteType === 'UP' ? '상승' : '하락';
        setSuccess(`${response.vote.stockName} ${voteText} 예측이 완료되었습니다!`);
        setShowConfetti(true);

        // Refresh voting data
        refetch();

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.message || '투표에 실패했습니다.');
      }
    } catch (err) {
      console.error('Vote submission failed:', err);

      // Handle specific API errors
      if (err instanceof Error) {
        if (err.message.includes('이미 투표')) {
          setError('이미 해당 주식에 투표하셨습니다.');
        } else {
          setError(err.message);
        }
      } else {
        setError('투표 중 오류가 발생했습니다.');
      }
    } finally {
      setVotingInProgress(null);
    }
  }, [user, navigate, votingInProgress, refetch]);

  // Handle KOSPI vote (now type-safe with new structure)
  const handleKospiVote = useCallback(async (voteType: VoteType) => {
    if (kospiItem) {
      await handleVote(kospiItem.stock.code, voteType);
    }
  }, [kospiItem, handleVote]);

  // Handle logout
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Handle login navigation
  const handleLoginClick = () => {
    navigate('/login');
  };

  // Get user vote for KOSPI (type-safe with new structure)
  const kospiUserVote = kospiItem ? getUserVote(kospiItem.stock.code) : null;

  // Since we're using Suspense, votingData is guaranteed to be available
  // No loading or error states needed here - they're handled by Suspense and Error Boundary

  return (
    <Container>
      <ConfettiAnimation
        isActive={showConfetti}
        duration={3000}
        onComplete={() => setShowConfetti(false)}
      />

      <Header>
        <div>
          <Logo>살래말래</Logo>
          <Subtitle>한국 주식 시장 예측 플랫폼 - {marketStatus}</Subtitle>
        </div>
        <HeaderActions>
          <RefreshButton
            variant="secondary"
            onClick={refetch}
            disabled={!!votingInProgress}
          >
            {votingInProgress ? '새로고침 중...' : '새로고침'}
          </RefreshButton>
          {user ? (
            <Button variant="secondary" onClick={handleLogout}>
              로그아웃
            </Button>
          ) : (
            <Button onClick={handleLoginClick}>
              로그인
            </Button>
          )}
        </HeaderActions>
      </Header>

      {(error || success) && (
        <MessageContainer>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          {success && <SuccessMessage>{success}</SuccessMessage>}
        </MessageContainer>
      )}

      <ContentWrapper>
        <MainContent>
          <PrimaryColumn>
            {/* KOSPI Hero Card - 새로운 구조 사용 */}
            {kospiItem && (
              <KospiHeroCard
                kospiItem={kospiItem}
                userVote={kospiUserVote}
                onVote={handleKospiVote}
                isVotingActive={isVotingActive}
                isAuthenticated={isAuthenticated}
                isLoading={votingInProgress === kospiItem.stock.code}
              />
            )}

            {/* Stock Voting Grid - 새로운 구조 사용 */}
            <StockVotingGrid
              stockItems={featuredStocks}
              onVote={(stockCode, voteType) => handleVote(stockCode, voteType)}
              isVotingActive={isVotingActive}
              isAuthenticated={isAuthenticated}
              votingInProgress={votingInProgress}
            />
          </PrimaryColumn>

          <SecondaryColumn>
            {/* Voting Statistics - 새로운 구조 사용 */}
            <VotingStatisticsComponent
              votingData={votingData}
              isLoading={false} // No loading state with Suspense
            />

            {/* User Voting Status - 새로운 구조 사용 */}
            {isAuthenticated && (
              <UserVotingStatusComponent
                allItems={allItems}
                votingDate={votingDate}
                isAuthenticated={isAuthenticated}
                isLoading={false} // No loading state with Suspense
                onLoginClick={handleLoginClick}
              />
            )}
          </SecondaryColumn>
        </MainContent>
      </ContentWrapper>
    </Container>
  );
};

/**
 * 🎯 Suspense + Error Boundary wrapper for VotingDashboard
 * This is the main export that handles loading and error states
 */
const VotingDashboardContainer: React.FC = () => {
  return (
    <DashboardErrorBoundary>
      <Suspense fallback={<DashboardSkeleton />}>
        <VotingDashboard />
      </Suspense>
    </DashboardErrorBoundary>
  );
};

export default VotingDashboardContainer;