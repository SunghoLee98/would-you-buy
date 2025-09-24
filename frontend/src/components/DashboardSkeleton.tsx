import React from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { theme } from '../styles/theme';

// Skeleton animation
const shimmer = keyframes`
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
`;

const SkeletonBase = styled.div`
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200px 100%;
  animation: ${shimmer} 1.5s infinite linear;
  border-radius: ${theme.borderRadius.md};
`;

// Container matching the actual dashboard
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

// Header skeleton
const HeaderSkeleton = styled.div`
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

const LogoSkeleton = styled(SkeletonBase)`
  width: 200px;
  height: 32px;

  @media (max-width: ${theme.breakpoints.mobile}) {
    width: 150px;
    height: 28px;
    margin: 0 auto;
  }
`;

const SubtitleSkeleton = styled(SkeletonBase)`
  width: 250px;
  height: 16px;
  margin-top: ${theme.spacing.xs};

  @media (max-width: ${theme.breakpoints.mobile}) {
    width: 180px;
    margin: ${theme.spacing.xs} auto 0;
  }
`;

const ActionsSkeleton = styled.div`
  display: flex;
  gap: ${theme.spacing.md};

  @media (max-width: ${theme.breakpoints.tablet}) {
    justify-content: center;
  }

  @media (max-width: ${theme.breakpoints.mobile}) {
    flex-direction: column;
    width: 100%;
  }
`;

const ButtonSkeleton = styled(SkeletonBase)`
  width: 80px;
  height: 40px;

  @media (max-width: ${theme.breakpoints.mobile}) {
    width: 100%;
  }
`;

// Content wrapper
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

// KOSPI Hero Card skeleton
const KospiCardSkeleton = styled.div`
  background: ${theme.colors.white};
  border-radius: ${theme.borderRadius.xl};
  box-shadow: ${theme.shadows.lg};
  padding: ${theme.spacing['2xl']};
  position: relative;
  overflow: hidden;

  @media (max-width: ${theme.breakpoints.mobile}) {
    padding: ${theme.spacing.xl};
  }
`;

const KospiTitleSkeleton = styled(SkeletonBase)`
  width: 120px;
  height: 24px;
  margin-bottom: ${theme.spacing.lg};
`;

const KospiValueSkeleton = styled(SkeletonBase)`
  width: 200px;
  height: 48px;
  margin-bottom: ${theme.spacing.md};
`;

const KospiChangeSkeleton = styled(SkeletonBase)`
  width: 150px;
  height: 20px;
  margin-bottom: ${theme.spacing.xl};
`;

const VoteButtonsSkeleton = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  margin-top: ${theme.spacing.lg};
`;

const VoteButtonSkeleton = styled(SkeletonBase)`
  flex: 1;
  height: 48px;
  border-radius: ${theme.borderRadius.lg};
`;

// Stock grid skeleton
const StockGridSkeleton = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: ${theme.spacing.lg};

  @media (max-width: ${theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`;

const StockCardSkeleton = styled.div`
  background: ${theme.colors.white};
  border-radius: ${theme.borderRadius.lg};
  box-shadow: ${theme.shadows.md};
  padding: ${theme.spacing.lg};
`;

const StockNameSkeleton = styled(SkeletonBase)`
  width: 140px;
  height: 20px;
  margin-bottom: ${theme.spacing.sm};
`;

const StockSymbolSkeleton = styled(SkeletonBase)`
  width: 80px;
  height: 16px;
  margin-bottom: ${theme.spacing.md};
`;

const StockPriceSkeleton = styled(SkeletonBase)`
  width: 100px;
  height: 24px;
  margin-bottom: ${theme.spacing.sm};
`;

const StockChangeSkeleton = styled(SkeletonBase)`
  width: 80px;
  height: 18px;
  margin-bottom: ${theme.spacing.lg};
`;

// Sidebar components skeleton
const SidebarCardSkeleton = styled.div`
  background: ${theme.colors.white};
  border-radius: ${theme.borderRadius.lg};
  box-shadow: ${theme.shadows.md};
  padding: ${theme.spacing.lg};
`;

const SidebarTitleSkeleton = styled(SkeletonBase)`
  width: 120px;
  height: 20px;
  margin-bottom: ${theme.spacing.lg};
`;

const StatItemSkeleton = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.md};
`;

const StatLabelSkeleton = styled(SkeletonBase)`
  width: 80px;
  height: 16px;
`;

const StatValueSkeleton = styled(SkeletonBase)`
  width: 60px;
  height: 16px;
`;

const ProgressBarSkeleton = styled.div`
  width: 100%;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  margin: ${theme.spacing.sm} 0;
  overflow: hidden;

  &::after {
    content: '';
    display: block;
    width: 60%;
    height: 100%;
    background: linear-gradient(90deg, #e0e0e0 25%, #d0d0d0 50%, #e0e0e0 75%);
    background-size: 200px 100%;
    animation: ${shimmer} 1.5s infinite linear;
  }
`;

const DashboardSkeleton: React.FC = () => {
  return (
    <Container>
      {/* Header Skeleton */}
      <HeaderSkeleton>
        <div>
          <LogoSkeleton />
          <SubtitleSkeleton />
        </div>
        <ActionsSkeleton>
          <ButtonSkeleton />
          <ButtonSkeleton />
        </ActionsSkeleton>
      </HeaderSkeleton>

      <ContentWrapper>
        <MainContent>
          {/* Primary Column */}
          <PrimaryColumn>
            {/* KOSPI Hero Card Skeleton */}
            <KospiCardSkeleton>
              <KospiTitleSkeleton />
              <KospiValueSkeleton />
              <KospiChangeSkeleton />
              <VoteButtonsSkeleton>
                <VoteButtonSkeleton />
                <VoteButtonSkeleton />
              </VoteButtonsSkeleton>
            </KospiCardSkeleton>

            {/* Stock Grid Skeleton */}
            <StockGridSkeleton>
              {Array.from({ length: 6 }, (_, index) => (
                <StockCardSkeleton key={index}>
                  <StockNameSkeleton />
                  <StockSymbolSkeleton />
                  <StockPriceSkeleton />
                  <StockChangeSkeleton />
                  <VoteButtonsSkeleton>
                    <VoteButtonSkeleton />
                    <VoteButtonSkeleton />
                  </VoteButtonsSkeleton>
                </StockCardSkeleton>
              ))}
            </StockGridSkeleton>
          </PrimaryColumn>

          {/* Secondary Column */}
          <SecondaryColumn>
            {/* Statistics Card Skeleton */}
            <SidebarCardSkeleton>
              <SidebarTitleSkeleton />
              {Array.from({ length: 4 }, (_, index) => (
                <StatItemSkeleton key={index}>
                  <StatLabelSkeleton />
                  <StatValueSkeleton />
                </StatItemSkeleton>
              ))}
              <ProgressBarSkeleton />
            </SidebarCardSkeleton>

            {/* User Status Card Skeleton */}
            <SidebarCardSkeleton>
              <SidebarTitleSkeleton />
              {Array.from({ length: 3 }, (_, index) => (
                <StatItemSkeleton key={index}>
                  <StatLabelSkeleton />
                  <StatValueSkeleton />
                </StatItemSkeleton>
              ))}
            </SidebarCardSkeleton>
          </SecondaryColumn>
        </MainContent>
      </ContentWrapper>
    </Container>
  );
};

export default DashboardSkeleton;