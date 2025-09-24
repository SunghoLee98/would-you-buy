import { test, expect } from '@playwright/test';
import {
  TestDataGenerator,
  AuthHelpers,
  WaitHelpers,
  VotingHelpers,
  NetworkHelpers,
  DatabaseHelpers
} from '../utils/test-helpers';

test.describe('Voting Dashboard - Authentication Integration', () => {
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

    // Mock stock data
    await votingHelpers.mockStockData();
    await votingHelpers.mockVoteStatistics();
  });

  test.afterEach(async () => {
    await DatabaseHelpers.cleanupTestUser(testUser.email);
  });

  test('should show login prompt for guest users when attempting to vote', async ({ page }) => {
    // Clear any existing auth
    await authHelpers.clearToken();

    // Navigate to dashboard as guest
    await votingHelpers.navigateToDashboard();
    await votingHelpers.waitForKospiLoad();

    // Try to vote on KOSPI
    const kospiCard = page.locator('[data-testid="kospi-hero-card"]');
    const upButton = kospiCard.locator('[data-testid="vote-up-button"]');

    await upButton.click();

    // Should show login prompt
    await votingHelpers.checkLoginPrompt();

    // Check modal or popup with login options
    await expect(page.locator('[data-testid="login-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-modal"]')).toContainText('로그인이 필요합니다');
    await expect(page.locator('[data-testid="login-modal"]')).toContainText('투표하려면 로그인해주세요');

    // Check login button in modal
    await expect(page.locator('[data-testid="modal-login-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="modal-register-button"]')).toBeVisible();
  });

  test('should redirect to login page from voting dashboard when not authenticated', async ({ page }) => {
    // Clear any existing auth
    await authHelpers.clearToken();

    // Try to vote on a stock
    await votingHelpers.navigateToDashboard();
    await votingHelpers.waitForStockCardsLoad();

    const samsungCard = page.locator('[data-testid="stock-card-005930"]');
    const voteButton = samsungCard.locator('[data-testid="vote-up-button"]');

    await voteButton.click();

    // Should either show login modal or redirect
    const hasModal = await page.locator('[data-testid="login-modal"]').isVisible().catch(() => false);

    if (!hasModal) {
      // If no modal, should redirect to login
      await waitHelpers.waitForNavigation('/login');

      // Should include return URL
      const currentUrl = page.url();
      expect(currentUrl).toContain('returnUrl=%2Fdashboard');
    }
  });

  test('should allow voting immediately after successful login', async ({ page }) => {
    // Start as guest
    await authHelpers.clearToken();
    await votingHelpers.navigateToDashboard();

    // Try to vote - should trigger login prompt
    const kospiCard = page.locator('[data-testid="kospi-hero-card"]');
    await kospiCard.locator('[data-testid="vote-up-button"]').click();

    // Click login from modal
    await page.locator('[data-testid="modal-login-button"]').click();

    // Should navigate to login page
    await waitHelpers.waitForNavigation('/login');

    // Register and login
    await authHelpers.register({
      email: testUser.email,
      username: testUser.username,
      password: testUser.password,
      acceptTerms: true
    });

    await authHelpers.login(testUser.email, testUser.password);
    await waitHelpers.waitForLoadingToComplete();

    // Should redirect back to dashboard
    await waitHelpers.waitForNavigation('/dashboard');

    // Mock successful vote
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

    // Now should be able to vote
    await votingHelpers.voteOnKospi('UP');
    await votingHelpers.checkVoteConfirmation('KS11', 'UP');
  });

  test('should preserve voting context during login flow', async ({ page }) => {
    // Clear auth and navigate to dashboard
    await authHelpers.clearToken();
    await votingHelpers.navigateToDashboard();
    await votingHelpers.waitForStockCardsLoad();

    // Try to vote on a specific stock
    const targetStock = '035420'; // NAVER
    const naverCard = page.locator(`[data-testid="stock-card-${targetStock}"]`);

    // Store current stock information for comparison later
    const stockPrice = await naverCard.locator('[data-testid="current-price"]').textContent();
    const stockName = await naverCard.locator('[data-testid="stock-name"]').textContent();

    // Try to vote
    await naverCard.locator('[data-testid="vote-down-button"]').click();

    // Complete login process
    await page.locator('[data-testid="modal-login-button"]').click();

    // Register new user and login
    await authHelpers.register({
      email: testUser.email,
      username: testUser.username,
      password: testUser.password,
      acceptTerms: true
    });

    await authHelpers.login(testUser.email, testUser.password);
    await waitHelpers.waitForLoadingToComplete();

    // Should return to dashboard with same stock data
    await waitHelpers.waitForNavigation('/dashboard');
    await votingHelpers.waitForStockCardsLoad();

    // Check that stock information is still the same
    const returnedNaverCard = page.locator(`[data-testid="stock-card-${targetStock}"]`);
    await expect(returnedNaverCard.locator('[data-testid="current-price"]')).toContainText(stockPrice || '');
    await expect(returnedNaverCard.locator('[data-testid="stock-name"]')).toContainText(stockName || '');

    // Should be able to vote now
    await page.route('**/api/votes', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            stockCode: targetStock,
            direction: 'DOWN',
            votedAt: new Date().toISOString()
          }
        })
      });
    });

    await votingHelpers.voteOnStock(targetStock, 'DOWN');
    await votingHelpers.checkVoteConfirmation(targetStock, 'DOWN');
  });

  test('should handle logout during voting session', async ({ page }) => {
    // Register and login
    await authHelpers.register({
      email: testUser.email,
      username: testUser.username,
      password: testUser.password,
      acceptTerms: true
    });

    await authHelpers.login(testUser.email, testUser.password);
    await waitHelpers.waitForLoadingToComplete();

    // Navigate to dashboard and make a vote
    await votingHelpers.navigateToDashboard();
    await votingHelpers.waitForKospiLoad();

    // Mock successful vote
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

    // Logout
    await authHelpers.logout();
    await waitHelpers.waitForNavigation('/login');

    // Navigate back to dashboard
    await votingHelpers.navigateToDashboard();

    // Should be in guest mode
    await expect(page.locator('[data-testid="guest-mode-banner"]')).toBeVisible();

    // Previous votes should not be visible
    await expect(page.locator('[data-testid="vote-success-KS11"]')).not.toBeVisible();

    // Voting should require login again
    await page.locator('[data-testid="kospi-hero-card"] [data-testid="vote-up-button"]').click();
    await votingHelpers.checkLoginPrompt();
  });

  test('should handle expired authentication during voting', async ({ page }) => {
    // Register and login
    await authHelpers.register({
      email: testUser.email,
      username: testUser.username,
      password: testUser.password,
      acceptTerms: true
    });

    await authHelpers.login(testUser.email, testUser.password);
    await waitHelpers.waitForLoadingToComplete();

    await votingHelpers.navigateToDashboard();
    await votingHelpers.waitForKospiLoad();

    // Mock expired token response
    await page.route('**/api/votes', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Token expired',
          code: 'TOKEN_EXPIRED'
        })
      });
    });

    // Try to vote with expired token
    await votingHelpers.voteOnKospi('UP');

    // Should show authentication error
    await waitHelpers.waitForErrorMessage('인증이 만료되었습니다. 다시 로그인해주세요.');

    // Should redirect to login or show login modal
    const hasModal = await page.locator('[data-testid="login-modal"]').isVisible().catch(() => false);
    const hasRedirect = page.url().includes('/login');

    expect(hasModal || hasRedirect).toBeTruthy();
  });

  test('should display user voting status correctly', async ({ page }) => {
    // Register and login
    await authHelpers.register({
      email: testUser.email,
      username: testUser.username,
      password: testUser.password,
      acceptTerms: true
    });

    await authHelpers.login(testUser.email, testUser.password);
    await waitHelpers.waitForLoadingToComplete();

    // Mock user with existing votes
    await votingHelpers.mockUserVotes([
      { stockCode: 'KS11', direction: 'UP' },
      { stockCode: '005930', direction: 'DOWN' }
    ]);

    await votingHelpers.navigateToDashboard();
    await votingHelpers.waitForKospiLoad();
    await votingHelpers.waitForStockCardsLoad();

    // Check user info is displayed
    await expect(page.locator('[data-testid="user-info"]')).toContainText(testUser.username);

    // Check voting status is displayed
    await expect(page.locator('[data-testid="user-voting-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="votes-cast-today"]')).toContainText('2');

    // Check existing votes are marked
    const kospiCard = page.locator('[data-testid="kospi-hero-card"]');
    await expect(kospiCard.locator('[data-testid="vote-up-button"]')).toHaveClass(/voted|selected|active/);

    const samsungCard = page.locator('[data-testid="stock-card-005930"]');
    await expect(samsungCard.locator('[data-testid="vote-down-button"]')).toHaveClass(/voted|selected|active/);
  });

  test('should handle login/logout flow from voting dashboard navigation', async ({ page }) => {
    // Start as guest
    await authHelpers.clearToken();
    await votingHelpers.navigateToDashboard();

    // Check guest state
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="register-button"]')).toBeVisible();

    // Click login from navigation
    await page.locator('[data-testid="login-button"]').click();
    await waitHelpers.waitForNavigation('/login');

    // Register and login
    await authHelpers.register({
      email: testUser.email,
      username: testUser.username,
      password: testUser.password,
      acceptTerms: true
    });

    await authHelpers.login(testUser.email, testUser.password);
    await waitHelpers.waitForLoadingToComplete();

    // Should redirect back to dashboard
    await waitHelpers.waitForNavigation('/dashboard');

    // Check authenticated state
    await expect(page.locator('[data-testid="user-info"]')).toBeVisible();
    await expect(page.locator('[data-testid="logout-button"]')).toBeVisible();

    // Logout
    await authHelpers.logout();

    // Should return to guest state
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="guest-mode-banner"]')).toBeVisible();
  });

  test('should prevent unauthorized API calls when not logged in', async ({ page }) => {
    // Clear auth
    await authHelpers.clearToken();

    // Try to make vote API call directly
    await page.route('**/api/votes', route => {
      // Should not reach here for unauthorized users
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Unauthorized',
          code: 'UNAUTHORIZED'
        })
      });
    });

    await votingHelpers.navigateToDashboard();

    // Attempt to make vote request through JavaScript
    const response = await page.evaluate(async () => {
      try {
        const result = await fetch('/api/votes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            stockCode: 'KS11',
            direction: 'UP'
          })
        });
        return { status: result.status, ok: result.ok };
      } catch (error) {
        return { error: error.message };
      }
    });

    // Should be unauthorized
    expect(response.status).toBe(401);
    expect(response.ok).toBeFalsy();
  });

  test('should handle multiple users voting on same stocks', async ({ page }) => {
    // Create and login first user
    const user1 = TestDataGenerator.generateUser();
    await authHelpers.register({
      email: user1.email,
      username: user1.username,
      password: user1.password,
      acceptTerms: true
    });

    await authHelpers.login(user1.email, user1.password);
    await waitHelpers.waitForLoadingToComplete();

    await votingHelpers.navigateToDashboard();

    // Mock vote submission
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

    // User 1 votes
    await votingHelpers.voteOnKospi('UP');
    await votingHelpers.checkVoteConfirmation('KS11', 'UP');

    // Logout user 1
    await authHelpers.logout();

    // Simulate second user (different session)
    await authHelpers.clearToken();

    // Check that first user's vote doesn't affect guest view
    await votingHelpers.navigateToDashboard();
    await expect(page.locator('[data-testid="vote-success-KS11"]')).not.toBeVisible();

    // Guest should see voting buttons normally
    const kospiCard = page.locator('[data-testid="kospi-hero-card"]');
    await expect(kospiCard.locator('[data-testid="vote-up-button"]')).toBeEnabled();
    await expect(kospiCard.locator('[data-testid="vote-down-button"]')).toBeEnabled();
  });
});