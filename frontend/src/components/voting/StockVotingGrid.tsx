// 🔥 StockVotingGrid - 100% API 명세서 준수 구현

import React, { useState, useMemo } from 'react';
import styled from '@emotion/styled';
import { theme } from '../../styles/theme';
import StockVotingCard from './StockVotingCard';
import { VotingDashboardItem, VoteType } from '../../types/voting.types';

// =============================================================================
// Props Interface - 새로운 구조 사용
// =============================================================================

interface StockVotingGridProps {
  stockItems: VotingDashboardItem[]; // 새로운 구조: VotingDashboardItem[]
  onVote: (stockCode: string, voteType: VoteType) => Promise<void>; // 새로운 구조: stockCode, VoteType
  isVotingActive: boolean;
  isAuthenticated: boolean;
  votingInProgress?: string | null; // 현재 투표 진행 중인 주식 코드
}

type SortOption = 'popularity' | 'alphabetical' | 'price' | 'change';
type FilterOption = 'all' | 'voted' | 'unvoted';

// =============================================================================
// Styled Components (기존과 동일)
// =============================================================================

const GridContainer = styled.div`
  margin-bottom: ${theme.spacing['2xl']};
`;

const GridHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.xl};
  gap: ${theme.spacing.lg};

  @media (max-width: ${theme.breakpoints.tablet}) {
    flex-direction: column;
    align-items: stretch;
    gap: ${theme.spacing.md};
  }
`;

const SectionTitle = styled.h2`
  font-size: ${theme.fontSizes['2xl']};
  font-weight: ${theme.fontWeights.bold};
  color: ${theme.colors.gray[800]};
  margin: 0;

  @media (max-width: ${theme.breakpoints.mobile}) {
    font-size: ${theme.fontSizes.xl};
  }
`;

const FilterControls = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  align-items: center;

  @media (max-width: ${theme.breakpoints.mobile}) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const SortSelect = styled.select`
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border: 2px solid ${theme.colors.gray[300]};
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.white};
  font-size: ${theme.fontSizes.sm};
  color: ${theme.colors.gray[700]};
  cursor: pointer;
  transition: ${theme.transitions.fast};

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  &:hover {
    border-color: ${theme.colors.gray[400]};
  }
`;

const FilterTabs = styled.div`
  display: flex;
  background: ${theme.colors.gray[100]};
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing.xs};
  gap: ${theme.spacing.xs};
`;

const FilterTab = styled.button<{ active: boolean }>`
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border: none;
  border-radius: ${theme.borderRadius.sm};
  background: ${props => props.active ? theme.colors.white : 'transparent'};
  color: ${props => props.active ? theme.colors.primary : theme.colors.gray[600]};
  font-size: ${theme.fontSizes.sm};
  font-weight: ${theme.fontWeights.medium};
  cursor: pointer;
  transition: ${theme.transitions.fast};
  white-space: nowrap;

  &:hover {
    background: ${props => props.active ? theme.colors.white : 'rgba(255, 255, 255, 0.5)'};
    color: ${props => props.active ? theme.colors.primary : theme.colors.gray[800]};
  }

  box-shadow: ${props => props.active ? theme.shadows.sm : 'none'};
`;

const StatsBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${theme.colors.gray[50]};
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.lg};

  @media (max-width: ${theme.breakpoints.mobile}) {
    flex-direction: column;
    gap: ${theme.spacing.sm};
    text-align: center;
  }
`;

const StatGroup = styled.div`
  display: flex;
  gap: ${theme.spacing.lg};

  @media (max-width: ${theme.breakpoints.mobile}) {
    gap: ${theme.spacing.md};
  }
`;

const Stat = styled.div`
  text-align: center;
`;

const StatValue = styled.div`
  font-size: ${theme.fontSizes.lg};
  font-weight: ${theme.fontWeights.bold};
  color: ${theme.colors.gray[800]};

  @media (max-width: ${theme.breakpoints.mobile}) {
    font-size: ${theme.fontSizes.md};
  }
`;

const StatLabel = styled.div`
  font-size: ${theme.fontSizes.xs};
  color: ${theme.colors.gray[600]};
  margin-top: ${theme.spacing.xs};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: ${theme.spacing.lg};

  @media (max-width: ${theme.breakpoints.tablet}) {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: ${theme.spacing.md};
  }

  @media (max-width: ${theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
    gap: ${theme.spacing.md};
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${theme.spacing['3xl']};
  color: ${theme.colors.gray[500]};
  grid-column: 1 / -1;

  h3 {
    font-size: ${theme.fontSizes.xl};
    margin-bottom: ${theme.spacing.md};
    color: ${theme.colors.gray[600]};
  }

  p {
    font-size: ${theme.fontSizes.md};
  }
`;

// =============================================================================
// Main Component - 100% API 명세서 준수
// =============================================================================

/**
 * 🎯 StockVotingGrid - 100% API 명세서 준수 구현
 * - Legacy VotingStock 타입 제거
 * - 새로운 VotingDashboardItem 구조 직접 사용
 * - stockCode와 VoteType 사용
 */
const StockVotingGrid: React.FC<StockVotingGridProps> = ({
  stockItems,
  onVote,
  isVotingActive,
  isAuthenticated,
  votingInProgress,
}) => {
  const [sortBy, setSortBy] = useState<SortOption>('popularity');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');

  // 필터링 및 정렬된 주식 목록 - 새로운 구조 사용
  const filteredAndSortedStocks = useMemo(() => {
    let filtered = [...stockItems];

    // Apply filter based on user votes
    switch (filterBy) {
      case 'voted':
        filtered = filtered.filter(item => item.userVote !== null);
        break;
      case 'unvoted':
        filtered = filtered.filter(item => item.userVote === null);
        break;
      default:
        // 'all' - no filtering
        break;
    }

    // Apply sort - 새로운 구조의 필드 사용
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popularity':
          return b.voteStatistics.totalVotes - a.voteStatistics.totalVotes;
        case 'alphabetical':
          return a.stock.koreanName.localeCompare(b.stock.koreanName, 'ko-KR');
        case 'price':
          const aPrice = a.stock.currentPrice || 0;
          const bPrice = b.stock.currentPrice || 0;
          return bPrice - aPrice;
        case 'change':
          const aChange = Math.abs(a.stock.changeRate || 0);
          const bChange = Math.abs(b.stock.changeRate || 0);
          return bChange - aChange;
        default:
          return 0;
      }
    });

    return filtered;
  }, [stockItems, sortBy, filterBy]);

  // Calculate statistics - 새로운 구조 사용
  const statistics = useMemo(() => {
    const totalStocks = stockItems.length;
    const votedStocks = stockItems.filter(item => item.userVote !== null).length;
    const totalVotes = stockItems.reduce((sum, item) => sum + item.voteStatistics.totalVotes, 0);
    const avgVotesPerStock = totalStocks > 0 ? Math.round(totalVotes / totalStocks) : 0;

    return {
      totalStocks,
      votedStocks,
      totalVotes,
      avgVotesPerStock,
    };
  }, [stockItems]);

  return (
    <GridContainer>
      <GridHeader>
        <SectionTitle>주요 종목</SectionTitle>
        <FilterControls>
          <FilterTabs>
            <FilterTab
              active={filterBy === 'all'}
              onClick={() => setFilterBy('all')}
            >
              전체
            </FilterTab>
            <FilterTab
              active={filterBy === 'unvoted'}
              onClick={() => setFilterBy('unvoted')}
            >
              미투표
            </FilterTab>
            <FilterTab
              active={filterBy === 'voted'}
              onClick={() => setFilterBy('voted')}
            >
              투표완료
            </FilterTab>
          </FilterTabs>
          <SortSelect
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
          >
            <option value="popularity">인기순</option>
            <option value="alphabetical">가나다순</option>
            <option value="price">주가순</option>
            <option value="change">변동률순</option>
          </SortSelect>
        </FilterControls>
      </GridHeader>

      <StatsBar>
        <StatGroup>
          <Stat>
            <StatValue>{statistics.totalStocks}</StatValue>
            <StatLabel>총 종목</StatLabel>
          </Stat>
          <Stat>
            <StatValue>{statistics.votedStocks}</StatValue>
            <StatLabel>투표완료</StatLabel>
          </Stat>
        </StatGroup>
        <StatGroup>
          <Stat>
            <StatValue>{statistics.totalVotes.toLocaleString()}</StatValue>
            <StatLabel>총 투표수</StatLabel>
          </Stat>
          <Stat>
            <StatValue>{statistics.avgVotesPerStock}</StatValue>
            <StatLabel>평균 투표</StatLabel>
          </Stat>
        </StatGroup>
      </StatsBar>

      {filteredAndSortedStocks.length === 0 ? (
        <EmptyState>
          <h3>
            {filterBy === 'voted' && '투표한 종목이 없습니다'}
            {filterBy === 'unvoted' && '모든 종목에 투표가 완료되었습니다'}
            {filterBy === 'all' && '투표 가능한 종목이 없습니다'}
          </h3>
          <p>
            {filterBy === 'voted' && '종목을 선택하여 투표해보세요.'}
            {filterBy === 'unvoted' && '훌륭합니다! 내일도 참여해보세요.'}
            {filterBy === 'all' && '잠시 후 다시 시도해주세요.'}
          </p>
        </EmptyState>
      ) : (
        <Grid>
          {filteredAndSortedStocks.map((item) => (
            <StockVotingCard
              key={item.stock.code} // 새로운 구조: stock.code 사용
              stockItem={item} // 새로운 구조: VotingDashboardItem 전달
              onVote={onVote}
              isVotingActive={isVotingActive}
              isAuthenticated={isAuthenticated}
              isLoading={votingInProgress === item.stock.code}
            />
          ))}
        </Grid>
      )}
    </GridContainer>
  );
};

export default StockVotingGrid;