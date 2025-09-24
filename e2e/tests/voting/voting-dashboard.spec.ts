import { test, expect } from '@playwright/test';
import { ApiValidator } from '../utils/api-validators';
import { TestDataGenerator, AuthHelpers, VotingHelpers } from '../utils/test-helpers';

/**
 * Voting Dashboard E2E Tests
 *
 * Tests the voting dashboard functionality with 100% API specification compliance:
 * - GET /stocks/voting (public access)
 * - GET /stocks/voting/dashboard (authenticated access)
 * - Complete VotingDashboardResponse validation
 * - UI integration with backend data
 */

test.describe('Voting Dashboard - API Integration Tests', () => {
  let apiValidator: ApiValidator;
  let authHelpers: AuthHelpers;
  let votingHelpers: VotingHelpers;
  let authToken: string;
  let userData: ReturnType<typeof TestDataGenerator.generateUser>;

  test.beforeEach(async ({ page }) => {
    apiValidator = new ApiValidator(page);
    authHelpers = new AuthHelpers(page);
    votingHelpers = new VotingHelpers(page);

    // Register and login user for authenticated tests
    userData = TestDataGenerator.generateUser();

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

  test.describe('Public Voting Dashboard (Unauthenticated)', () => {
    test('GET /stocks/voting should return complete dashboard data', async () => {
      const { body } = await apiValidator.makeApiRequest('GET', '/stocks/voting');

      expect(body.success).toBe(true);
      expect(body.message).toBe('투표 가능한 주식 목록을 조회했습니다');

      // Validate complete VotingDashboardResponse structure
      const dashboardData = ApiValidator.validateVotingDashboardResponse(body.data);

      // Verify required dashboard components
      expect(dashboardData.kospiItem).toBeDefined();
      expect(dashboardData.featuredStocks.length).toBeGreaterThan(0);
      expect(dashboardData.items.length).toBeGreaterThan(0);
      expect(dashboardData.totalActiveStocks).toBe(dashboardData.items.length);

      // For public access, userVote should be null
      expect(dashboardData.kospiItem.userVote).toBeNull();
      dashboardData.featuredStocks.forEach(item => {
        expect(item.userVote).toBeNull();
      });
      dashboardData.items.forEach(item => {
        expect(item.userVote).toBeNull();
      });

      // Validate KOSPI specific requirements
      expect(dashboardData.kospiItem.stock.code).toBe('KOSPI');
      expect(dashboardData.kospiItem.stock.isPrimary).toBe(true);
      expect(dashboardData.kospiItem.stock.marketType).toBe('INDEX');
      expect(dashboardData.kospiItem.stock.koreanName).toBe('코스피');
      expect(dashboardData.kospiItem.stock.englishName).toBe('KOSPI Index');

      // Validate featured stocks requirements
      dashboardData.featuredStocks.forEach(item => {
        expect(item.stock.code).not.toBe('KOSPI');
        expect(item.stock.isPrimary).toBe(false);
        expect(item.stock.marketType).toBe('KOSPI');
        expect(item.stock.code).toMatch(/^\d{6}$/); // 6-digit stock code
      });

      // Validate voting window and market status
      expect(typeof dashboardData.votingWindowOpen).toBe('boolean');
      expect(typeof dashboardData.marketStatus).toBe('string');
      expect(dashboardData.marketStatus.length).toBeGreaterThan(0);

      // Validate voting date format and logic
      expect(dashboardData.votingDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      const votingDate = new Date(dashboardData.votingDate);
      expect(votingDate.toString()).not.toBe('Invalid Date');

      // Voting date should typically be tomorrow (next trading day)
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Allow for weekend/holiday adjustments
      const votingDateMs = votingDate.getTime();
      const tomorrowMs = tomorrow.getTime();
      const dayInMs = 24 * 60 * 60 * 1000;
      expect(Math.abs(votingDateMs - tomorrowMs)).toBeLessThanOrEqual(7 * dayInMs);
    });

    test('Public dashboard should display on frontend without authentication', async ({ page }) => {
      // Navigate to dashboard without logging in
      await votingHelpers.navigateToDashboard();

      // Wait for KOSPI card to load
      await votingHelpers.waitForKospiLoad();

      // Verify KOSPI card displays API data correctly
      const kospiCard = page.locator('[data-testid="kospi-hero-card"]');
      await expect(kospiCard).toBeVisible();

      // Check if KOSPI data is displayed
      const kospiValue = page.locator('[data-testid="kospi-index-value"]');
      await expect(kospiValue).toBeVisible();

      const kospiText = await kospiValue.textContent();
      expect(kospiText).toBeTruthy();
      expect(kospiText).toMatch(/[\d,]+/); // Should contain numbers

      // Wait for stock cards to load
      await votingHelpers.waitForStockCardsLoad();

      // Verify featured stocks are displayed
      const stockCards = page.locator('[data-testid="stock-voting-card"]');
      const cardCount = await stockCards.count();
      expect(cardCount).toBeGreaterThanOrEqual(8); // At least 8 featured stocks

      // Check that stock cards contain real data
      for (let i = 0; i < Math.min(cardCount, 3); i++) {
        const card = stockCards.nth(i);
        const stockName = card.locator('[data-testid="stock-name"]');
        const stockPrice = card.locator('[data-testid="stock-price"]');

        await expect(stockName).toBeVisible();
        await expect(stockPrice).toBeVisible();

        const nameText = await stockName.textContent();
        const priceText = await stockPrice.textContent();

        expect(nameText).toBeTruthy();
        expect(priceText).toBeTruthy();
        expect(priceText).toMatch(/[\d,]+/); // Should contain price numbers
      }

      // Verify voting statistics are shown
      await votingHelpers.checkVotingStatistics('KOSPI');

      // Check at least one featured stock statistics
      const firstStockCard = stockCards.first();
      const stockCode = await firstStockCard.getAttribute('data-stock-code');
      if (stockCode) {
        await votingHelpers.checkVotingStatistics(stockCode);
      }
    });
  });

  test.describe('Authenticated Voting Dashboard', () => {
    test('GET /stocks/voting/dashboard should include user vote data', async () => {
      const { body } = await apiValidator.makeApiRequest(
        'GET',
        '/stocks/voting/dashboard',
        { token: authToken }
      );

      expect(body.success).toBe(true);
      const dashboardData = ApiValidator.validateVotingDashboardResponse(body.data);

      // For newly registered user, userVote should be null initially
      expect(dashboardData.kospiItem.userVote).toBeNull();
      dashboardData.featuredStocks.forEach(item => {
        expect(item.userVote).toBeNull();
      });

      // Same data structure as public, but with userVote capability
      expect(dashboardData.kospiItem.stock.code).toBe('KOSPI');
      expect(dashboardData.featuredStocks.length).toBeGreaterThan(0);
    });

    test('Dashboard should show user votes after voting', async () => {
      // First vote on KOSPI
      const { body: voteBody } = await apiValidator.makeApiRequest(
        'POST',
        '/votes',
        {
          token: authToken,
          data: {
            stockCode: 'KOSPI',
            voteType: 'UP',
            confidenceLevel: 5,
            predictionReason: 'KOSPI 상승 예상'
          },
          expectedStatus: 201
        }
      );

      expect(voteBody.success).toBe(true);
      const userVote = ApiValidator.validateUserVote(voteBody.data.vote);

      // Now fetch dashboard and verify user vote is included
      const { body: dashboardBody } = await apiValidator.makeApiRequest(
        'GET',
        '/stocks/voting/dashboard',
        { token: authToken }
      );

      const dashboardData = ApiValidator.validateVotingDashboardResponse(dashboardBody.data);

      // KOSPI item should now include user vote
      expect(dashboardData.kospiItem.userVote).not.toBeNull();
      const kospiUserVote = ApiValidator.validateUserVote(dashboardData.kospiItem.userVote!);

      expect(kospiUserVote.id).toBe(userVote.id);
      expect(kospiUserVote.stockCode).toBe('KOSPI');
      expect(kospiUserVote.voteType).toBe('UP');
      expect(kospiUserVote.confidenceLevel).toBe(5);
      expect(kospiUserVote.predictionReason).toBe('KOSPI 상승 예상');
      expect(kospiUserVote.canChangeVote).toBe(true);
    });

    test('Authenticated dashboard UI should show user votes', async ({ page }) => {
      // Login through UI
      await authHelpers.login(userData.email, userData.password);

      // Navigate to dashboard
      await votingHelpers.navigateToDashboard();
      await votingHelpers.waitForKospiLoad();

      // Vote on KOSPI through UI
      await votingHelpers.voteOnKospi('UP');

      // Wait for vote confirmation
      await votingHelpers.checkVoteConfirmation('KOSPI', 'UP');

      // Refresh page and verify vote persists
      await page.reload();
      await votingHelpers.waitForKospiLoad();

      // Check that KOSPI card shows user voted
      const kospiCard = page.locator('[data-testid="kospi-hero-card"]');
      await expect(kospiCard.locator('[data-testid="voted-up"]')).toBeVisible();

      // Verify vote can be changed
      const changeVoteButton = kospiCard.locator('[data-testid="change-vote-button"]');
      await expect(changeVoteButton).toBeVisible();
      await expect(changeVoteButton).toBeEnabled();
    });
  });

  test.describe('Dashboard Real-time Updates', () => {
    test('Dashboard should reflect voting statistics updates', async () => {
      // Get initial dashboard data
      const { body: initialBody } = await apiValidator.makeApiRequest(
        'GET',
        '/stocks/voting',
      );

      const initialData = ApiValidator.validateVotingDashboardResponse(initialBody.data);
      const initialKospiStats = initialData.kospiItem.voteStatistics;

      // Submit a vote
      await apiValidator.makeApiRequest(
        'POST',
        '/votes',
        {
          token: authToken,
          data: {
            stockCode: 'KOSPI',
            voteType: 'UP'
          },
          expectedStatus: 201
        }
      );

      // Get updated dashboard data
      const { body: updatedBody } = await apiValidator.makeApiRequest(
        'GET',
        '/stocks/voting',
      );

      const updatedData = ApiValidator.validateVotingDashboardResponse(updatedBody.data);
      const updatedKospiStats = updatedData.kospiItem.voteStatistics;

      // Verify vote counts increased
      expect(updatedKospiStats.upVotes).toBe(initialKospiStats.upVotes + 1);
      expect(updatedKospiStats.totalVotes).toBe(initialKospiStats.totalVotes + 1);

      // Verify percentages were recalculated correctly
      const expectedUpPercentage = (updatedKospiStats.upVotes / updatedKospiStats.totalVotes) * 100;
      expect(Math.abs(updatedKospiStats.upPercentage - expectedUpPercentage)).toBeLessThanOrEqual(0.1);
    });

    test('Multiple users voting should update statistics correctly', async () => {
      // Create second user
      const userData2 = TestDataGenerator.generateUser();

      await apiValidator.makeApiRequest('POST', '/auth/register', {
        data: {
          email: userData2.email,
          password: userData2.password,
          username: userData2.username,
          termsAccepted: true
        },
        expectedStatus: 201
      });

      const { body: loginBody2 } = await apiValidator.makeApiRequest('POST', '/auth/login', {
        data: {
          email: userData2.email,
          password: userData2.password
        }
      });

      const authToken2 = loginBody2.data.accessToken;

      // Get initial statistics for Samsung Electronics
      const { body: initialBody } = await apiValidator.makeApiRequest('GET', '/stocks/voting');
      const initialData = ApiValidator.validateVotingDashboardResponse(initialBody.data);

      const samsungItem = initialData.featuredStocks.find(item => item.stock.code === '005930');
      expect(samsungItem).toBeDefined();
      const initialSamsungStats = samsungItem!.voteStatistics;

      // User 1 votes UP
      await apiValidator.makeApiRequest(
        'POST',
        '/votes',
        {
          token: authToken,
          data: { stockCode: '005930', voteType: 'UP' },
          expectedStatus: 201
        }
      );

      // User 2 votes DOWN
      await apiValidator.makeApiRequest(
        'POST',
        '/votes',
        {
          token: authToken2,
          data: { stockCode: '005930', voteType: 'DOWN' },
          expectedStatus: 201
        }
      );

      // Get updated statistics
      const { body: updatedBody } = await apiValidator.makeApiRequest('GET', '/stocks/voting');
      const updatedData = ApiValidator.validateVotingDashboardResponse(updatedBody.data);

      const updatedSamsungItem = updatedData.featuredStocks.find(item => item.stock.code === '005930');
      expect(updatedSamsungItem).toBeDefined();
      const updatedSamsungStats = updatedSamsungItem!.voteStatistics;

      // Verify both votes were counted
      expect(updatedSamsungStats.upVotes).toBe(initialSamsungStats.upVotes + 1);
      expect(updatedSamsungStats.downVotes).toBe(initialSamsungStats.downVotes + 1);
      expect(updatedSamsungStats.totalVotes).toBe(initialSamsungStats.totalVotes + 2);
    });
  });

  test.describe('Dashboard Query Parameters', () => {
    test('Dashboard with date parameter should return data for specific date', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateString = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD format

      const { body } = await apiValidator.makeApiRequest(
        'GET',
        `/stocks/voting/dashboard?date=${dateString}`,
        { token: authToken }
      );

      expect(body.success).toBe(true);
      const dashboardData = ApiValidator.validateVotingDashboardResponse(body.data);

      expect(dashboardData.votingDate).toBe(dateString);

      // All vote statistics should be for the specified date
      dashboardData.items.forEach(item => {
        expect(item.voteStatistics.votingDate).toBe(dateString);
      });
    });

    test('Invalid date parameter should return validation error', async () => {
      const { body } = await apiValidator.makeApiRequest(
        'GET',
        '/stocks/voting/dashboard?date=invalid-date',
        {
          token: authToken,
          expectedStatus: 400
        }
      );

      expect(body.success).toBe(false);
      ApiValidator.validateErrorResponse(body, 'VALIDATION_ERROR');
    });
  });

  test.describe('Dashboard Performance and Caching', () => {
    test('Dashboard API should respond within performance targets', async () => {
      const startTime = Date.now();

      const { response } = await apiValidator.makeApiRequest('GET', '/stocks/voting');

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // API should respond within 200ms as per specifications
      expect(responseTime).toBeLessThan(200);
      expect(response.status()).toBe(200);
    });

    test('Authenticated dashboard should have reasonable response time', async () => {
      const startTime = Date.now();

      await apiValidator.makeApiRequest(
        'GET',
        '/stocks/voting/dashboard',
        { token: authToken }
      );

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Should still be fast even with authentication
      expect(responseTime).toBeLessThan(300);
    });
  });

  test.describe('Dashboard Error Handling', () => {
    test('Dashboard should handle server errors gracefully', async ({ page }) => {
      // Mock server error for dashboard API
      await page.route('**/api/v1/stocks/voting', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: '서버 내부 오류가 발생했습니다',
            data: null,
            timestamp: new Date().toISOString(),
            errors: [{
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Database connection failed'
            }]
          })
        });
      });

      await votingHelpers.navigateToDashboard();

      // Should show error message to user
      const errorMessage = page.locator('[data-testid="error-message"], .error-message');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText('오류');
    });

    test('Dashboard should handle network failures gracefully', async ({ page }) => {
      await page.route('**/api/v1/stocks/voting', route => {
        route.abort('internetdisconnected');
      });

      await votingHelpers.navigateToDashboard();

      // Should show network error message
      const errorMessage = page.locator('[data-testid="network-error"], .network-error');
      await expect(errorMessage).toBeVisible({ timeout: 10000 });
    });
  });
});