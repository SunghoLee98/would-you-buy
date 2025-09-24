import { test, expect } from '@playwright/test';
import {
  TestDataGenerator,
  AuthHelpers,
  WaitHelpers,
  VotingHelpers,
  NetworkHelpers,
  DatabaseHelpers
} from '../utils/test-helpers';

test.describe('Voting Dashboard - Error Handling & Edge Cases', () => {
  let authHelpers: AuthHelpers;
  let waitHelpers: WaitHelpers;
  let votingHelpers: VotingHelpers;
  let networkHelpers: NetworkHelpers;
  let testUser: ReturnType<typeof TestDataGenerator.generateUser>;

  test.beforeEach(async ({ page }) => {
    authHelpers = new AuthHelpers(page);
    waitHelpers = new WaitHelpers(page);
    votingHelpers = new VotingHelpers(page);
    networkHelpers = new NetworkHelpers(page);
    testUser = TestDataGenerator.generateUser();

    // Register and login test user
    await authHelpers.register({
      email: testUser.email,
      username: testUser.username,
      password: testUser.password,
      acceptTerms: true
    });

    await authHelpers.login(testUser.email, testUser.password);
    await waitHelpers.waitForLoadingToComplete();

    // Mock basic stock data
    await votingHelpers.mockStockData();
    await votingHelpers.mockVoteStatistics();
  });

  test.afterEach(async () => {
    await DatabaseHelpers.cleanupTestUser(testUser.email);
  });

  test('should handle duplicate voting attempts gracefully', async ({ page }) => {
    await votingHelpers.navigateToDashboard();
    await votingHelpers.waitForKospiLoad();

    // Mock first vote success
    let voteCount = 0;
    await page.route('**/api/votes', route => {
      voteCount++;
      if (voteCount === 1) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              stockCode: 'KS11',
              direction: 'UP',
              votedAt: new Date().toISOString()
            }
          })
        });
      } else {
        // Subsequent votes should return conflict
        route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Already voted on this stock',
            code: 'DUPLICATE_VOTE'
          })
        });
      }
    });

    // First vote should succeed
    await votingHelpers.voteOnKospi('UP');
    await votingHelpers.checkVoteConfirmation('KS11', 'UP');

    // Mock user votes to reflect the vote
    await votingHelpers.mockUserVotes([
      { stockCode: 'KS11', direction: 'UP' }
    ]);

    await page.reload();
    await votingHelpers.waitForKospiLoad();

    // Try to vote again (should be prevented by UI)
    const kospiCard = page.locator('[data-testid="kospi-hero-card"]');
    const downButton = kospiCard.locator('[data-testid="vote-down-button"]');

    await expect(downButton).toBeDisabled();

    // If user somehow triggers the action, should show error
    await downButton.click({ force: true });
    await waitHelpers.waitForErrorMessage('이미 이 종목에 투표하셨습니다');
  });

  test('should handle API errors gracefully', async ({ page }) => {
    await votingHelpers.navigateToDashboard();
    await votingHelpers.waitForKospiLoad();

    // Mock server error
    await networkHelpers.simulateServerError('**/api/votes', 500);

    // Try to vote
    await votingHelpers.voteOnKospi('UP');

    // Should show server error message
    await waitHelpers.waitForErrorMessage('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');

    // Button should be re-enabled for retry
    const kospiCard = page.locator('[data-testid="kospi-hero-card"]');
    const upButton = kospiCard.locator('[data-testid="vote-up-button"]');
    await expect(upButton).toBeEnabled();

    // Vote should not be marked as completed
    await expect(kospiCard.locator('[data-testid="vote-success"]')).not.toBeVisible();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    await votingHelpers.navigateToDashboard();
    await votingHelpers.waitForKospiLoad();

    // Mock network failure
    await networkHelpers.simulateNetworkFailure('**/api/votes');

    // Try to vote
    await votingHelpers.voteOnKospi('UP');

    // Should show network error message
    await waitHelpers.waitForErrorMessage('네트워크 오류가 발생했습니다. 인터넷 연결을 확인하고 다시 시도해주세요.');

    // Should provide retry option
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-button"]')).toContainText('다시 시도');
  });

  test('should handle invalid stock code errors', async ({ page }) => {
    await votingHelpers.navigateToDashboard();
    await votingHelpers.waitForKospiLoad();

    // Mock invalid stock code response
    await page.route('**/api/votes', route => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Invalid stock code',
          code: 'INVALID_STOCK_CODE'
        })
      });
    });

    // Try to vote
    await votingHelpers.voteOnKospi('UP');

    // Should show specific error message
    await waitHelpers.waitForErrorMessage('유효하지 않은 종목입니다. 페이지를 새로고침해주세요.');

    // Should suggest page refresh
    await expect(page.locator('[data-testid="refresh-button"]')).toBeVisible();
  });

  test('should handle voting window closed errors', async ({ page }) => {
    await votingHelpers.navigateToDashboard();
    await votingHelpers.waitForKospiLoad();

    // Mock voting window closed response
    await page.route('**/api/votes', route => {
      route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Voting window is closed',
          code: 'VOTING_WINDOW_CLOSED'
        })
      });
    });

    // Try to vote
    await votingHelpers.voteOnKospi('UP');

    // Should show voting window closed message
    await waitHelpers.waitForErrorMessage('투표 시간이 종료되었습니다. 투표는 매일 오후 3:30부터 다음날 오전 9:00까지 가능합니다.');

    // Should disable all voting buttons
    const kospiCard = page.locator('[data-testid="kospi-hero-card"]');
    await expect(kospiCard.locator('[data-testid="vote-up-button"]')).toBeDisabled();
    await expect(kospiCard.locator('[data-testid="vote-down-button"]')).toBeDisabled();

    // Should show voting window status
    await expect(page.locator('[data-testid="voting-window-closed"]')).toBeVisible();
  });

  test('should handle malformed API responses', async ({ page }) => {
    await votingHelpers.navigateToDashboard();
    await votingHelpers.waitForKospiLoad();

    // Mock malformed response
    await page.route('**/api/votes', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: 'invalid json response'
      });
    });

    // Try to vote
    await votingHelpers.voteOnKospi('UP');

    // Should handle parsing error gracefully
    await waitHelpers.waitForErrorMessage('응답 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
  });

  test('should handle slow API responses with timeout', async ({ page }) => {
    await votingHelpers.navigateToDashboard();
    await votingHelpers.waitForKospiLoad();

    // Mock very slow response
    await page.route('**/api/votes', route => {
      // Never resolve to simulate timeout
      // In real scenario, this would timeout after configured duration
    });

    // Try to vote
    await votingHelpers.voteOnKospi('UP');

    // Should show loading state
    const kospiCard = page.locator('[data-testid="kospi-hero-card"]');
    await expect(kospiCard.locator('[data-testid="vote-processing"]')).toBeVisible();

    // Wait for timeout (adjust timeout in config if needed)
    await page.waitForTimeout(10000);

    // Should show timeout error after configured timeout
    await waitHelpers.waitForErrorMessage('요청 시간이 초과되었습니다. 다시 시도해주세요.');
  });

  test('should handle stock data loading failures', async ({ page }) => {
    // Mock stock data loading failure
    await networkHelpers.simulateServerError('**/api/stocks/voting', 500);

    await votingHelpers.navigateToDashboard();

    // Should show error state for stock data
    await expect(page.locator('[data-testid="stock-data-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="stock-data-error"]')).toContainText('주식 데이터를 불러올 수 없습니다');

    // Should provide refresh option
    await expect(page.locator('[data-testid="refresh-stock-data"]')).toBeVisible();

    // Click refresh should retry
    await page.locator('[data-testid="refresh-stock-data"]').click();

    // Should attempt to reload data
    await networkHelpers.waitForAPICall('/api/stocks/voting');
  });

  test('should handle statistics loading failures', async ({ page }) => {
    await votingHelpers.mockStockData(); // Stock data loads fine

    // Mock statistics loading failure
    await networkHelpers.simulateServerError('**/api/votes/statistics', 503);

    await votingHelpers.navigateToDashboard();
    await votingHelpers.waitForKospiLoad();

    // Stock cards should still be visible
    await votingHelpers.waitForStockCardsLoad();

    // But statistics should show error state
    await expect(page.locator('[data-testid="statistics-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="statistics-unavailable"]')).toBeVisible();

    // Voting should still be possible
    await page.route('**/api/votes', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            stockCode: 'KS11',
            direction: 'UP',
            votedAt: new Date().toISOString()
          }
        })
      });
    });

    await votingHelpers.voteOnKospi('UP');
    await votingHelpers.checkVoteConfirmation('KS11', 'UP');
  });

  test('should handle concurrent vote submissions', async ({ page }) => {
    await votingHelpers.navigateToDashboard();
    await votingHelpers.waitForKospiLoad();

    let firstRequestHandled = false;

    await page.route('**/api/votes', route => {
      if (!firstRequestHandled) {
        firstRequestHandled = true;
        // First request succeeds
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              stockCode: 'KS11',
              direction: 'UP',
              votedAt: new Date().toISOString()
            }
          })
        });
      } else {
        // Subsequent requests should be blocked
        route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Vote already in progress',
            code: 'VOTE_IN_PROGRESS'
          })
        });
      }
    });

    const kospiCard = page.locator('[data-testid="kospi-hero-card"]');
    const upButton = kospiCard.locator('[data-testid="vote-up-button"]');

    // Click multiple times rapidly
    await Promise.all([
      upButton.click(),
      upButton.click(),
      upButton.click()
    ]);

    // Should only process one vote
    await votingHelpers.checkVoteConfirmation('KS11', 'UP');

    // Should not show duplicate vote errors
    await expect(page.locator('[data-testid="error-message"]')).not.toContainText('VOTE_IN_PROGRESS');
  });

  test('should handle browser offline state', async ({ page }) => {
    await votingHelpers.navigateToDashboard();
    await votingHelpers.waitForKospiLoad();

    // Simulate offline state
    await page.context().setOffline(true);

    // Try to vote
    await votingHelpers.voteOnKospi('UP');

    // Should detect offline state and show appropriate message
    await waitHelpers.waitForErrorMessage('인터넷 연결이 끊어졌습니다. 연결을 확인하고 다시 시도해주세요.');

    // Should show offline indicator
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();

    // Restore online state
    await page.context().setOffline(false);

    // Offline indicator should disappear
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeHidden();
  });

  test('should handle empty stock data gracefully', async ({ page }) => {
    // Mock empty stock data
    await page.route('**/api/stocks/voting', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            kospi: null,
            stocks: []
          }
        })
      });
    });

    await votingHelpers.navigateToDashboard();

    // Should show no data state
    await expect(page.locator('[data-testid="no-stocks-available"]')).toBeVisible();
    await expect(page.locator('[data-testid="no-stocks-available"]')).toContainText('현재 투표 가능한 종목이 없습니다');

    // Should provide refresh option
    await expect(page.locator('[data-testid="refresh-stocks"]')).toBeVisible();
  });

  test('should handle authentication errors during voting', async ({ page }) => {
    await votingHelpers.navigateToDashboard();
    await votingHelpers.waitForKospiLoad();

    // Mock authentication error
    await page.route('**/api/votes', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED'
        })
      });
    });

    // Try to vote
    await votingHelpers.voteOnKospi('UP');

    // Should show authentication error
    await waitHelpers.waitForErrorMessage('인증이 필요합니다. 다시 로그인해주세요.');

    // Should redirect to login or show login modal
    const hasModal = await page.locator('[data-testid="login-modal"]').isVisible().catch(() => false);
    const hasRedirect = page.url().includes('/login');

    expect(hasModal || hasRedirect).toBeTruthy();
  });

  test('should handle rate limiting gracefully', async ({ page }) => {
    await votingHelpers.navigateToDashboard();
    await votingHelpers.waitForKospiLoad();

    // Mock rate limiting response
    await page.route('**/api/votes', route => {
      route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Too many requests',
          code: 'RATE_LIMITED',
          retryAfter: 60
        })
      });
    });

    // Try to vote
    await votingHelpers.voteOnKospi('UP');

    // Should show rate limiting message
    await waitHelpers.waitForErrorMessage('너무 많은 요청을 보냈습니다. 1분 후 다시 시도해주세요.');

    // Should disable voting temporarily
    const kospiCard = page.locator('[data-testid="kospi-hero-card"]');
    await expect(kospiCard.locator('[data-testid="vote-up-button"]')).toBeDisabled();
    await expect(kospiCard.locator('[data-testid="vote-down-button"]')).toBeDisabled();

    // Should show countdown or retry timer
    await expect(page.locator('[data-testid="rate-limit-timer"]')).toBeVisible();
  });

  test('should recover from errors and allow retry', async ({ page }) => {
    await votingHelpers.navigateToDashboard();
    await votingHelpers.waitForKospiLoad();

    // First request fails
    let requestCount = 0;
    await page.route('**/api/votes', route => {
      requestCount++;
      if (requestCount === 1) {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Internal server error'
          })
        });
      } else {
        // Second request succeeds
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              stockCode: 'KS11',
              direction: 'UP',
              votedAt: new Date().toISOString()
            }
          })
        });
      }
    });

    // First attempt fails
    await votingHelpers.voteOnKospi('UP');
    await waitHelpers.waitForErrorMessage('서버 오류가 발생했습니다');

    // Retry should work
    await page.locator('[data-testid="retry-button"]').click();
    await votingHelpers.checkVoteConfirmation('KS11', 'UP');
  });
});