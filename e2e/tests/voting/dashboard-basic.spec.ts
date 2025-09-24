import { test, expect } from '@playwright/test';
import {
  TestDataGenerator,
  AuthHelpers,
  WaitHelpers,
  VotingHelpers,
  NetworkHelpers,
  DatabaseHelpers
} from '../utils/test-helpers';

test.describe('Voting Dashboard - Basic Loading & Rendering', () => {
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

    // Mock stock data for consistent testing
    await votingHelpers.mockStockData();
    await votingHelpers.mockVoteStatistics();
  });

  test.afterEach(async () => {
    await DatabaseHelpers.cleanupTestUser(testUser.email);
  });

  test('should load dashboard correctly for authenticated users', async ({ page }) => {
    // Register and login test user
    await authHelpers.register({
      email: testUser.email,
      username: testUser.username,
      password: testUser.password,
      acceptTerms: true
    });

    await authHelpers.login(testUser.email, testUser.password);
    await waitHelpers.waitForLoadingToComplete();

    // Navigate to dashboard
    await votingHelpers.navigateToDashboard();

    // Check main components are visible
    await expect(page.locator('[data-testid="voting-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="kospi-hero-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="stock-cards-container"]')).toBeVisible();

    // Check user info is displayed
    await expect(page.locator('[data-testid="user-info"]')).toContainText(testUser.username);

    // Check no login prompt for authenticated users
    await expect(page.locator('[data-testid="login-prompt"]')).not.toBeVisible();
  });

  test('should load dashboard correctly for guest users with limited functionality', async ({ page }) => {
    // Clear any existing auth
    await authHelpers.clearToken();

    // Navigate to dashboard as guest
    await votingHelpers.navigateToDashboard();

    // Check main components are visible
    await expect(page.locator('[data-testid="voting-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="kospi-hero-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="stock-cards-container"]')).toBeVisible();

    // Check guest mode indicators
    await expect(page.locator('[data-testid="guest-mode-banner"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-prompt"]')).toBeVisible();

    // Check voting buttons are disabled or show login prompts
    const voteButtons = page.locator('[data-testid*="vote-"][data-testid*="-button"]');
    await expect(voteButtons.first()).toBeVisible();

    // Vote buttons should either be disabled or trigger login prompt
    await voteButtons.first().click();
    await votingHelpers.checkLoginPrompt();
  });

  test('should prominently display KOSPI index', async ({ page }) => {
    await votingHelpers.navigateToDashboard();
    await votingHelpers.waitForKospiLoad();

    const kospiCard = page.locator('[data-testid="kospi-hero-card"]');

    // Check KOSPI card is prominent (larger than other cards)
    const kospiBox = await kospiCard.boundingBox();
    const stockCard = page.locator('[data-testid="stock-voting-card"]').first();
    const stockBox = await stockCard.boundingBox();

    expect(kospiBox!.width).toBeGreaterThan(stockBox!.width);
    expect(kospiBox!.height).toBeGreaterThan(stockBox!.height);

    // Check KOSPI data is displayed
    await expect(kospiCard.locator('[data-testid="kospi-index-value"]')).toBeVisible();
    await expect(kospiCard.locator('[data-testid="kospi-index-value"]')).toContainText('2,450.50');
    await expect(kospiCard.locator('[data-testid="kospi-change-percent"]')).toContainText('1.25%');
    await expect(kospiCard.locator('[data-testid="kospi-change-indicator"]')).toHaveClass(/positive|up/);

    // Check KOSPI name is displayed in Korean
    await expect(kospiCard.locator('[data-testid="kospi-name"]')).toContainText('KOSPI');
  });

  test('should render stock cards with proper Korean names', async ({ page }) => {
    await votingHelpers.navigateToDashboard();
    await votingHelpers.waitForStockCardsLoad();

    // Check that at least 4 stock cards are rendered
    const stockCards = page.locator('[data-testid="stock-voting-card"]');
    await expect(stockCards).toHaveCount(4);

    // Check specific Korean stock names
    await expect(page.locator('[data-testid="stock-card-005930"]')).toContainText('삼성전자');
    await expect(page.locator('[data-testid="stock-card-000660"]')).toContainText('SK하이닉스');
    await expect(page.locator('[data-testid="stock-card-035420"]')).toContainText('NAVER');
    await expect(page.locator('[data-testid="stock-card-035720"]')).toContainText('카카오');

    // Check price information is displayed
    for (const stockCard of await stockCards.all()) {
      await expect(stockCard.locator('[data-testid*="current-price"]')).toBeVisible();
      await expect(stockCard.locator('[data-testid*="change-percent"]')).toBeVisible();
      await expect(stockCard.locator('[data-testid*="change-indicator"]')).toBeVisible();
    }
  });

  test('should display voting buttons for each stock', async ({ page }) => {
    await votingHelpers.navigateToDashboard();
    await votingHelpers.waitForStockCardsLoad();

    const stockCards = page.locator('[data-testid="stock-voting-card"]');

    for (const stockCard of await stockCards.all()) {
      // Each card should have UP and DOWN buttons
      await expect(stockCard.locator('[data-testid="vote-up-button"]')).toBeVisible();
      await expect(stockCard.locator('[data-testid="vote-down-button"]')).toBeVisible();

      // Check button labels are in Korean
      await expect(stockCard.locator('[data-testid="vote-up-button"]')).toContainText('상승');
      await expect(stockCard.locator('[data-testid="vote-down-button"]')).toContainText('하락');
    }

    // KOSPI card should also have voting buttons
    const kospiCard = page.locator('[data-testid="kospi-hero-card"]');
    await expect(kospiCard.locator('[data-testid="vote-up-button"]')).toBeVisible();
    await expect(kospiCard.locator('[data-testid="vote-down-button"]')).toBeVisible();
  });

  test('should load voting statistics for each stock', async ({ page }) => {
    await votingHelpers.navigateToDashboard();
    await votingHelpers.waitForStockCardsLoad();

    // Wait for statistics to load
    await networkHelpers.waitForAPICall('/api/votes/statistics');

    // Check KOSPI statistics
    await votingHelpers.checkVotingStatistics('KS11');
    const kospiStats = page.locator('[data-testid="voting-stats-KS11"]');
    await expect(kospiStats.locator('[data-testid="up-percentage"]')).toContainText('65%');
    await expect(kospiStats.locator('[data-testid="down-percentage"]')).toContainText('35%');

    // Check individual stock statistics
    await votingHelpers.checkVotingStatistics('005930');
    const samsungStats = page.locator('[data-testid="voting-stats-005930"]');
    await expect(samsungStats.locator('[data-testid="up-percentage"]')).toContainText('45%');
    await expect(samsungStats.locator('[data-testid="down-percentage"]')).toContainText('55%');
  });

  test('should handle empty or loading states gracefully', async ({ page }) => {
    // Intercept API to simulate loading state
    await page.route('**/api/stocks/voting', route => {
      // Delay response to simulate loading
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { kospi: null, stocks: [] }
          })
        });
      }, 2000);
    });

    await votingHelpers.navigateToDashboard();

    // Check loading states are shown
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    await expect(page.locator('[data-testid="kospi-loading"], .loading-skeleton')).toBeVisible();

    // Wait for loading to complete
    await waitHelpers.waitForLoadingToComplete();

    // Check empty state is handled
    await expect(page.locator('[data-testid="no-data-message"]')).toBeVisible();
  });

  test('should display time and voting window information', async ({ page }) => {
    await votingHelpers.navigateToDashboard();

    // Check voting window information is displayed
    await expect(page.locator('[data-testid="voting-window-info"]')).toBeVisible();
    await expect(page.locator('[data-testid="voting-window-info"]')).toContainText('투표 가능 시간');

    // Check market status is displayed
    await expect(page.locator('[data-testid="market-status"]')).toBeVisible();

    // Should show current time or remaining voting time
    await expect(page.locator('[data-testid="current-time"], [data-testid="voting-deadline"]')).toBeVisible();
  });

  test('should display proper color coding for price changes', async ({ page }) => {
    await votingHelpers.navigateToDashboard();
    await votingHelpers.waitForKospiLoad();
    await votingHelpers.waitForStockCardsLoad();

    // KOSPI should show positive change (green/red based on Korean market convention)
    const kospiCard = page.locator('[data-testid="kospi-hero-card"]');
    const kospiIndicator = kospiCard.locator('[data-testid="kospi-change-indicator"]');
    await expect(kospiIndicator).toHaveClass(/positive|up|green|red/); // Korean markets use red for up

    // Check individual stocks
    const samsungCard = page.locator('[data-testid="stock-card-005930"]');
    const samsungIndicator = samsungCard.locator('[data-testid="change-indicator"]');
    await expect(samsungIndicator).toHaveClass(/negative|down|blue|green/); // Korean markets use blue/green for down

    const skCard = page.locator('[data-testid="stock-card-000660"]');
    const skIndicator = skCard.locator('[data-testid="change-indicator"]');
    await expect(skIndicator).toHaveClass(/positive|up|green|red/);
  });

  test('should be accessible with proper ARIA labels', async ({ page }) => {
    await votingHelpers.navigateToDashboard();
    await votingHelpers.waitForKospiLoad();
    await votingHelpers.waitForStockCardsLoad();

    // Check main dashboard has proper ARIA labels
    await expect(page.locator('[data-testid="voting-dashboard"]')).toHaveAttribute('role', 'main');

    // Check KOSPI card accessibility
    const kospiCard = page.locator('[data-testid="kospi-hero-card"]');
    await expect(kospiCard).toHaveAttribute('aria-label');

    // Check vote buttons have proper labels
    const upButton = kospiCard.locator('[data-testid="vote-up-button"]');
    await expect(upButton).toHaveAttribute('aria-label');
    await expect(upButton).toHaveAttribute('role', 'button');

    // Check stock cards accessibility
    const stockCards = page.locator('[data-testid="stock-voting-card"]');
    for (const stockCard of await stockCards.all()) {
      await expect(stockCard).toHaveAttribute('aria-label');

      const voteUpButton = stockCard.locator('[data-testid="vote-up-button"]');
      const voteDownButton = stockCard.locator('[data-testid="vote-down-button"]');

      await expect(voteUpButton).toHaveAttribute('aria-label');
      await expect(voteDownButton).toHaveAttribute('aria-label');
    }
  });

  test('should have no console errors during dashboard load', async ({ page }) => {
    await networkHelpers.checkNoConsoleErrors();

    await votingHelpers.navigateToDashboard();
    await votingHelpers.waitForKospiLoad();
    await votingHelpers.waitForStockCardsLoad();

    // Wait a bit more for any delayed errors
    await page.waitForTimeout(2000);
    await networkHelpers.checkNoConsoleErrors();
  });

  test('should load properly on page refresh', async ({ page }) => {
    // First load
    await votingHelpers.navigateToDashboard();
    await votingHelpers.waitForKospiLoad();
    await votingHelpers.waitForStockCardsLoad();

    // Refresh page
    await page.reload();

    // Should load again properly
    await votingHelpers.waitForKospiLoad();
    await votingHelpers.waitForStockCardsLoad();

    // Check all components are still visible
    await expect(page.locator('[data-testid="voting-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="kospi-hero-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="stock-voting-card"]')).toHaveCount(4);
  });
});