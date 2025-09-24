import { test, expect } from '@playwright/test';
import { ApiValidator } from '../utils/api-validators';
import { TestDataGenerator } from '../utils/test-helpers';

/**
 * API Contract Tests - Type Validation
 *
 * Tests that all API responses contain correctly typed data
 * according to the API specifications:
 * - StockInfo
 * - VoteStatistics
 * - UserVote
 * - VotingDashboardItem
 * - VotingDashboardResponse
 * - UserStatistics
 * - LoginResponse
 */

test.describe('API Response Type Validation', () => {
  let apiValidator: ApiValidator;
  let authToken: string;

  test.beforeAll(async ({ page }) => {
    apiValidator = new ApiValidator(page);

    // Setup authenticated user for protected endpoint tests
    const userData = TestDataGenerator.generateUser();

    await apiValidator.makeApiRequest('POST', '/auth/register', {
      data: {
        email: userData.email,
        password: userData.password,
        username: userData.username,
        termsAccepted: true
      },
      expectedStatus: 201
    });

    const { body: loginBody } = await apiValidator.makeApiRequest('POST', '/auth/login', {
      data: {
        email: userData.email,
        password: userData.password
      }
    });

    authToken = loginBody.data.accessToken;
  });

  test.describe('VotingDashboardResponse Type Validation', () => {
    test('GET /stocks/voting - should return correctly typed VotingDashboardResponse', async () => {
      const { body } = await apiValidator.makeApiRequest('GET', '/stocks/voting');

      expect(body.success).toBe(true);
      expect(body.data).not.toBeNull();

      // Validate complete VotingDashboardResponse structure
      const dashboardData = ApiValidator.validateVotingDashboardResponse(body.data);

      // Additional structural validations
      expect(dashboardData.items.length).toBeGreaterThan(0);
      expect(dashboardData.featuredStocks.length).toBeGreaterThan(0);

      // Validate KOSPI is properly marked as primary
      expect(dashboardData.kospiItem.stock.code).toBe('KOSPI');
      expect(dashboardData.kospiItem.stock.isPrimary).toBe(true);
      expect(dashboardData.kospiItem.stock.marketType).toBe('INDEX');

      // Validate featured stocks are not KOSPI and not marked as primary
      dashboardData.featuredStocks.forEach(item => {
        expect(item.stock.code).not.toBe('KOSPI');
        expect(item.stock.isPrimary).toBe(false);
        expect(item.stock.marketType).toBe('KOSPI');
      });

      // Validate all items have consistent voting date
      const votingDate = dashboardData.votingDate;
      dashboardData.items.forEach(item => {
        expect(item.voteStatistics.votingDate).toBe(votingDate);
      });
      expect(dashboardData.kospiItem.voteStatistics.votingDate).toBe(votingDate);
      dashboardData.featuredStocks.forEach(item => {
        expect(item.voteStatistics.votingDate).toBe(votingDate);
      });
    });

    test('GET /stocks/voting/dashboard - authenticated user should include userVote data', async () => {
      const { body } = await apiValidator.makeApiRequest(
        'GET',
        '/stocks/voting/dashboard',
        { token: authToken }
      );

      expect(body.success).toBe(true);
      const dashboardData = ApiValidator.validateVotingDashboardResponse(body.data);

      // For authenticated users, userVote can be null or UserVote object
      dashboardData.items.forEach(item => {
        if (item.userVote !== null) {
          ApiValidator.validateUserVote(item.userVote);
          expect(item.userVote.stockCode).toBe(item.stock.code);
        }
      });

      if (dashboardData.kospiItem.userVote !== null) {
        ApiValidator.validateUserVote(dashboardData.kospiItem.userVote);
        expect(dashboardData.kospiItem.userVote.stockCode).toBe('KOSPI');
      }

      dashboardData.featuredStocks.forEach(item => {
        if (item.userVote !== null) {
          ApiValidator.validateUserVote(item.userVote);
          expect(item.userVote.stockCode).toBe(item.stock.code);
        }
      });
    });
  });

  test.describe('StockInfo Type Validation', () => {
    test('Stock codes should follow correct format', async () => {
      const { body } = await apiValidator.makeApiRequest('GET', '/stocks/voting');
      const dashboardData = body.data;

      dashboardData.items.forEach((item: any) => {
        const stock = item.stock;

        if (stock.code === 'KOSPI') {
          // KOSPI specific validations
          expect(stock.isPrimary).toBe(true);
          expect(stock.marketType).toBe('INDEX');
          expect(stock.koreanName).toBe('코스피');
        } else {
          // Regular stock code validation (6 digits)
          expect(stock.code).toMatch(/^\d{6}$/);
          expect(stock.isPrimary).toBe(false);
          expect(stock.marketType).toBe('KOSPI');
        }

        // All stocks should have valid Korean names
        expect(stock.koreanName).toBeTruthy();
        expect(typeof stock.koreanName).toBe('string');
        expect(stock.koreanName.length).toBeGreaterThan(0);
      });
    });

    test('Price and change data should be properly formatted', async () => {
      const { body } = await apiValidator.makeApiRequest('GET', '/stocks/voting');
      const dashboardData = body.data;

      dashboardData.items.forEach((item: any) => {
        const stock = item.stock;

        if (stock.currentPrice !== null) {
          expect(typeof stock.currentPrice).toBe('number');
          expect(stock.currentPrice).toBeGreaterThan(0);
        }

        if (stock.changeRate !== null) {
          expect(typeof stock.changeRate).toBe('number');
          // Change rate should be reasonable (-100% to +100%)
          expect(stock.changeRate).toBeGreaterThanOrEqual(-100);
          expect(stock.changeRate).toBeLessThanOrEqual(100);
        }

        if (stock.changeAmount !== null) {
          expect(typeof stock.changeAmount).toBe('number');
        }

        // Formatted strings should match the raw values
        if (stock.formattedChangeRate !== null && stock.changeRate !== null) {
          expect(stock.formattedChangeRate).toContain(stock.changeRate.toString());
          if (stock.changeRate > 0) {
            expect(stock.formattedChangeRate).toMatch(/^\+/);
          }
        }

        if (stock.formattedChangeAmount !== null && stock.changeAmount !== null) {
          expect(stock.formattedChangeAmount).toContain(Math.abs(stock.changeAmount).toString());
          if (stock.changeAmount > 0) {
            expect(stock.formattedChangeAmount).toMatch(/^\+/);
          }
        }

        // Price trend should match change rate
        if (stock.changeRate !== null) {
          if (stock.changeRate > 0.1) {
            expect(stock.priceTrend).toBe('UP');
          } else if (stock.changeRate < -0.1) {
            expect(stock.priceTrend).toBe('DOWN');
          } else {
            expect(['UP', 'DOWN', 'STABLE']).toContain(stock.priceTrend);
          }
        }
      });
    });
  });

  test.describe('VoteStatistics Type Validation', () => {
    test('Vote statistics should have consistent math', async () => {
      const { body } = await apiValidator.makeApiRequest('GET', '/stocks/voting');
      const dashboardData = body.data;

      dashboardData.items.forEach((item: any) => {
        const stats = item.voteStatistics;

        // Basic math validation
        expect(stats.totalVotes).toBe(stats.upVotes + stats.downVotes);

        if (stats.totalVotes > 0) {
          const expectedUpPercentage = (stats.upVotes / stats.totalVotes) * 100;
          const expectedDownPercentage = (stats.downVotes / stats.totalVotes) * 100;

          expect(Math.abs(stats.upPercentage - expectedUpPercentage)).toBeLessThanOrEqual(0.1);
          expect(Math.abs(stats.downPercentage - expectedDownPercentage)).toBeLessThanOrEqual(0.1);

          // Percentages should add up to 100%
          expect(Math.abs(stats.upPercentage + stats.downPercentage - 100)).toBeLessThanOrEqual(0.1);

          // Majority vote logic
          if (stats.upVotes > stats.downVotes) {
            expect(stats.majorityVote).toBe('UP');
            expect(stats.majorityVoteText).toBe('상승');
          } else if (stats.downVotes > stats.upVotes) {
            expect(stats.majorityVote).toBe('DOWN');
            expect(stats.majorityVoteText).toBe('하락');
          } else {
            expect(stats.majorityVote).toBeNull();
            expect(stats.majorityVoteText).toBeNull();
          }

          // Clear majority logic (assuming >60% threshold)
          const majorityPercentage = Math.max(stats.upPercentage, stats.downPercentage);
          if (majorityPercentage >= 60) {
            expect(stats.hasClearMajority).toBe(true);
          }
        } else {
          expect(stats.upPercentage).toBe(0);
          expect(stats.downPercentage).toBe(0);
          expect(stats.majorityVote).toBeNull();
          expect(stats.majorityVoteText).toBeNull();
          expect(stats.hasClearMajority).toBe(false);
        }

        // Consensus strength should be appropriate
        expect(typeof stats.consensusStrength).toBe('string');
        expect(stats.consensusStrength.length).toBeGreaterThan(0);
      });
    });
  });

  test.describe('UserVote Type Validation', () => {
    test('Vote submission should return correctly typed UserVote', async () => {
      const { body } = await apiValidator.makeApiRequest(
        'POST',
        '/votes',
        {
          token: authToken,
          data: {
            stockCode: '005930',
            voteType: 'UP',
            confidenceLevel: 4,
            predictionReason: '실적 개선 기대로 상승 예상'
          },
          expectedStatus: 201
        }
      );

      expect(body.success).toBe(true);
      expect(body.data.vote).not.toBeNull();

      const vote = ApiValidator.validateUserVote(body.data.vote);

      // Validate specific vote data
      expect(vote.stockCode).toBe('005930');
      expect(vote.voteType).toBe('UP');
      expect(vote.voteTypeText).toBe('상승');
      expect(vote.confidenceLevel).toBe(4);
      expect(vote.predictionReason).toBe('실적 개선 기대로 상승 예상');
      expect(vote.canChangeVote).toBe(true);
      expect(vote.isResultCalculated).toBe(false);
      expect(vote.isCorrect).toBeNull();
      expect(vote.pointsEarned).toBeNull();

      // Validate UUID format
      expect(vote.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

      // Validate timestamps
      const createdAt = new Date(vote.createdAt);
      const updatedAt = new Date(vote.updatedAt);
      expect(createdAt.getTime()).toBeLessThanOrEqual(Date.now());
      expect(updatedAt.getTime()).toBeLessThanOrEqual(Date.now());
      expect(createdAt.getTime()).toBeLessThanOrEqual(updatedAt.getTime());
    });

    test('GET /votes/my-votes should return array of correctly typed UserVotes', async () => {
      const { body } = await apiValidator.makeApiRequest(
        'GET',
        '/votes/my-votes',
        { token: authToken }
      );

      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);

      body.data.forEach((vote: any) => {
        ApiValidator.validateUserVote(vote);
      });

      // If there are votes, validate they're sorted by date (newest first)
      if (body.data.length > 1) {
        for (let i = 0; i < body.data.length - 1; i++) {
          const current = new Date(body.data[i].createdAt);
          const next = new Date(body.data[i + 1].createdAt);
          expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
        }
      }
    });

    test('Vote update should return correctly typed UserVote', async () => {
      // First create a vote
      const { body: createBody } = await apiValidator.makeApiRequest(
        'POST',
        '/votes',
        {
          token: authToken,
          data: {
            stockCode: '000660',
            voteType: 'UP',
            confidenceLevel: 3
          },
          expectedStatus: 201
        }
      );

      const voteId = createBody.data.voteId;

      // Then update it
      const { body: updateBody } = await apiValidator.makeApiRequest(
        'PUT',
        `/votes/${voteId}`,
        {
          token: authToken,
          data: {
            voteType: 'DOWN',
            confidenceLevel: 5,
            predictionReason: '시장 환경 악화 우려'
          }
        }
      );

      expect(updateBody.success).toBe(true);
      const updatedVote = ApiValidator.validateUserVote(updateBody.data.vote);

      // Validate updated fields
      expect(updatedVote.id).toBe(voteId);
      expect(updatedVote.voteType).toBe('DOWN');
      expect(updatedVote.voteTypeText).toBe('하락');
      expect(updatedVote.confidenceLevel).toBe(5);
      expect(updatedVote.predictionReason).toBe('시장 환경 악화 우려');

      // updatedAt should be newer than createdAt
      const createdAt = new Date(updatedVote.createdAt);
      const updatedAt = new Date(updatedVote.updatedAt);
      expect(updatedAt.getTime()).toBeGreaterThan(createdAt.getTime());
    });
  });

  test.describe('UserStatistics Type Validation', () => {
    test('GET /votes/my-stats should return correctly typed UserStatistics', async () => {
      const { body } = await apiValidator.makeApiRequest(
        'GET',
        '/votes/my-stats',
        { token: authToken }
      );

      expect(body.success).toBe(true);
      const stats = ApiValidator.validateUserStatistics(body.data);

      // Additional logical validations
      if (stats.totalPredictions === 0) {
        expect(stats.correctPredictions).toBe(0);
        expect(stats.accuracyRate).toBe(0);
        expect(stats.currentStreak).toBe(0);
        expect(stats.longestStreak).toBe(0);
      }

      // Points should be reasonable
      expect(stats.totalPoints).toBeGreaterThanOrEqual(0);
      if (stats.correctPredictions > 0) {
        // Assuming minimum 10 points per correct prediction
        expect(stats.totalPoints).toBeGreaterThanOrEqual(stats.correctPredictions * 5);
      }

      // Streaks should make sense
      expect(stats.currentStreak).toBeLessThanOrEqual(stats.totalPredictions);
      expect(stats.longestStreak).toBeLessThanOrEqual(stats.totalPredictions);
    });
  });

  test.describe('Authentication Response Type Validation', () => {
    test('POST /auth/register should return correctly typed user data', async () => {
      const userData = TestDataGenerator.generateUser();

      const { body } = await apiValidator.makeApiRequest(
        'POST',
        '/auth/register',
        {
          data: {
            email: userData.email,
            password: userData.password,
            username: userData.username,
            termsAccepted: true
          },
          expectedStatus: 201
        }
      );

      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('userId');
      expect(body.data).toHaveProperty('email');
      expect(body.data).toHaveProperty('username');
      expect(body.data).toHaveProperty('createdAt');

      // Validate UUID format
      expect(body.data.userId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

      // Validate email format
      expect(body.data.email).toBe(userData.email);
      expect(body.data.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);

      // Validate username
      expect(body.data.username).toBe(userData.username);

      // Validate timestamp
      expect(body.data.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
      const createdAt = new Date(body.data.createdAt);
      expect(createdAt.getTime()).toBeLessThanOrEqual(Date.now());
    });

    test('GET /users/me should return complete user profile with statistics', async () => {
      const { body } = await apiValidator.makeApiRequest(
        'GET',
        '/users/me',
        { token: authToken }
      );

      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('userId');
      expect(body.data).toHaveProperty('email');
      expect(body.data).toHaveProperty('username');
      expect(body.data).toHaveProperty('role');
      expect(body.data).toHaveProperty('statistics');
      expect(body.data).toHaveProperty('createdAt');
      expect(body.data).toHaveProperty('lastLoginAt');

      // Validate role
      expect(body.data.role).toBe('USER');

      // Validate statistics structure
      ApiValidator.validateUserStatistics(body.data.statistics);

      // Validate timestamps
      expect(body.data.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
      if (body.data.lastLoginAt) {
        expect(body.data.lastLoginAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
      }
    });
  });

  test.describe('Pagination and Query Parameter Validation', () => {
    test('GET /votes/my-votes with pagination should respect parameters', async () => {
      // Test with specific page and size
      const { body } = await apiValidator.makeApiRequest(
        'GET',
        '/votes/my-votes?page=0&size=5',
        { token: authToken }
      );

      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeLessThanOrEqual(5);

      body.data.forEach((vote: any) => {
        ApiValidator.validateUserVote(vote);
      });
    });

    test('GET /votes/my-votes with stock code filter should return filtered results', async () => {
      // Create votes for specific stock
      await apiValidator.makeApiRequest('POST', '/votes', {
        token: authToken,
        data: { stockCode: '035420', voteType: 'UP' },
        expectedStatus: 201
      });

      const { body } = await apiValidator.makeApiRequest(
        'GET',
        '/votes/my-votes?stockCode=035420',
        { token: authToken }
      );

      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);

      // All returned votes should be for the specified stock
      body.data.forEach((vote: any) => {
        ApiValidator.validateUserVote(vote);
        expect(vote.stockCode).toBe('035420');
      });
    });
  });

  test.describe('Date Format Validation', () => {
    test('All date fields should use correct ISO-8601 format', async () => {
      const { body } = await apiValidator.makeApiRequest(
        'GET',
        '/stocks/voting/dashboard',
        { token: authToken }
      );

      const dashboardData = body.data;

      // Validate votingDate format (YYYY-MM-DD)
      expect(dashboardData.votingDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      // Check that it's a valid date
      const votingDate = new Date(dashboardData.votingDate + 'T00:00:00Z');
      expect(votingDate.toString()).not.toBe('Invalid Date');

      // Validate stock lastUpdated timestamps
      dashboardData.items.forEach((item: any) => {
        if (item.stock.lastUpdated !== null) {
          expect(item.stock.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
          const lastUpdated = new Date(item.stock.lastUpdated);
          expect(lastUpdated.toString()).not.toBe('Invalid Date');
        }
      });
    });
  });
});