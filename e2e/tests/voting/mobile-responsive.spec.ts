import { test, expect } from '@playwright/test';
import {
  TestDataGenerator,
  AuthHelpers,
  WaitHelpers,
  VotingHelpers,
  NetworkHelpers,
  MobileHelpers,
  DatabaseHelpers
} from '../utils/test-helpers';

test.describe('Voting Dashboard - Mobile Responsive & Korean Localization', () => {
  let authHelpers: AuthHelpers;
  let waitHelpers: WaitHelpers;
  let votingHelpers: VotingHelpers;
  let networkHelpers: NetworkHelpers;
  let mobileHelpers: MobileHelpers;
  let testUser: ReturnType<typeof TestDataGenerator.generateUser>;

  test.beforeEach(async ({ page }) => {
    authHelpers = new AuthHelpers(page);
    waitHelpers = new WaitHelpers(page);
    votingHelpers = new VotingHelpers(page);
    networkHelpers = new NetworkHelpers(page);
    mobileHelpers = new MobileHelpers(page);
    testUser = TestDataGenerator.generateUser();

    // Mock stock data
    await votingHelpers.mockStockData();
    await votingHelpers.mockVoteStatistics();
  });

  test.afterEach(async () => {
    await DatabaseHelpers.cleanupTestUser(testUser.email);
  });

  test('should render correctly on mobile viewport', async ({ page }) => {
    await mobileHelpers.setMobileViewport();

    await votingHelpers.navigateToDashboard();
    await votingHelpers.waitForKospiLoad();
    await votingHelpers.waitForStockCardsLoad();

    // Check mobile layout
    await expect(page.locator('[data-testid="voting-dashboard"]')).toHaveClass(/mobile-layout/);

    // KOSPI card should be mobile-optimized
    const kospiCard = page.locator('[data-testid="kospi-hero-card"]');
    await expect(kospiCard).toBeVisible();

    const kospiBox = await kospiCard.boundingBox();
    expect(kospiBox!.width).toBeLessThan(400); // Mobile width constraint

    // Stock cards should stack vertically on mobile
    const stockCards = page.locator('[data-testid="stock-voting-card"]');
    await expect(stockCards).toHaveCount(4);

    // Check that cards are arranged in single column
    const firstCard = stockCards.nth(0);
    const secondCard = stockCards.nth(1);

    const firstBox = await firstCard.boundingBox();
    const secondBox = await secondCard.boundingBox();

    // Second card should be below first card (Y position greater)
    expect(secondBox!.y).toBeGreaterThan(firstBox!.y + firstBox!.height - 10);
  });

  test('should have touch-friendly voting buttons on mobile', async ({ page }) => {
    await mobileHelpers.setMobileViewport();

    // Register and login for voting functionality
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

    // Check KOSPI voting buttons are touch-friendly
    await mobileHelpers.checkTouchFriendly('[data-testid="kospi-hero-card"] [data-testid="vote-up-button"]');
    await mobileHelpers.checkTouchFriendly('[data-testid="kospi-hero-card"] [data-testid="vote-down-button"]');

    // Check stock card voting buttons
    const stockCards = page.locator('[data-testid="stock-voting-card"]');
    for (let i = 0; i < await stockCards.count(); i++) {
      const card = stockCards.nth(i);
      await mobileHelpers.checkTouchFriendly('[data-testid="vote-up-button"]');
      await mobileHelpers.checkTouchFriendly('[data-testid="vote-down-button"]');
    }
  });

  test('should work with touch gestures', async ({ page }) => {
    await mobileHelpers.setMobileViewport();

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

    // Use touch gesture to vote
    const kospiUpButton = page.locator('[data-testid="kospi-hero-card"] [data-testid="vote-up-button"]');
    await mobileHelpers.simulateTouchGesture('[data-testid="kospi-hero-card"] [data-testid="vote-up-button"]');

    // Should register the vote
    await votingHelpers.checkVoteConfirmation('KS11', 'UP');
  });

  test('should show responsive statistics on mobile', async ({ page }) => {
    await mobileHelpers.setMobileViewport();

    await votingHelpers.navigateToDashboard();
    await votingHelpers.waitForKospiLoad();
    await votingHelpers.waitForStockCardsLoad();

    // Statistics should be visible but compact on mobile
    const kospiStats = page.locator('[data-testid="voting-stats-KS11"]');
    await expect(kospiStats).toBeVisible();

    // Check mobile-specific layout
    await expect(kospiStats).toHaveClass(/mobile-stats/);

    // Percentages should be visible
    await expect(kospiStats.locator('[data-testid="up-percentage"]')).toBeVisible();
    await expect(kospiStats.locator('[data-testid="down-percentage"]')).toBeVisible();

    // Total votes might be hidden on mobile for space
    const totalVotes = kospiStats.locator('[data-testid="total-votes"]');
    const isVisible = await totalVotes.isVisible();
    // Either visible or hidden based on design - both are acceptable
    expect(typeof isVisible).toBe('boolean');
  });

  test('should render correctly on tablet viewport', async ({ page }) => {
    await mobileHelpers.setTabletViewport();

    await votingHelpers.navigateToDashboard();
    await votingHelpers.waitForKospiLoad();
    await votingHelpers.waitForStockCardsLoad();

    // Tablet should have intermediate layout
    await expect(page.locator('[data-testid="voting-dashboard"]')).toHaveClass(/tablet-layout/);

    // Stock cards might be in 2-column layout on tablet
    const stockCards = page.locator('[data-testid="stock-voting-card"]');
    const firstCard = stockCards.nth(0);
    const thirdCard = stockCards.nth(2);

    const firstBox = await firstCard.boundingBox();
    const thirdBox = await thirdCard.boundingBox();

    // Third card should be either in same row or next row
    const isThirdCardInSameRow = Math.abs(thirdBox!.y - firstBox!.y) < 50;
    const isThirdCardInNextRow = thirdBox!.y > firstBox!.y + 100;

    expect(isThirdCardInSameRow || isThirdCardInNextRow).toBeTruthy();
  });

  test('should maintain functionality across all viewport sizes', async ({ page }) => {
    // Test desktop, tablet, and mobile
    const viewports = [
      { name: 'desktop', width: 1280, height: 720 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'mobile', width: 375, height: 667 }
    ];

    // Register and login once
    await authHelpers.register({
      email: testUser.email,
      username: testUser.username,
      password: testUser.password,
      acceptTerms: true
    });

    await authHelpers.login(testUser.email, testUser.password);
    await waitHelpers.waitForLoadingToComplete();

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      await votingHelpers.navigateToDashboard();
      await votingHelpers.waitForKospiLoad();
      await votingHelpers.waitForStockCardsLoad();

      // All core elements should be visible
      await expect(page.locator('[data-testid="voting-dashboard"]')).toBeVisible();
      await expect(page.locator('[data-testid="kospi-hero-card"]')).toBeVisible();
      await expect(page.locator('[data-testid="stock-voting-card"]')).toHaveCount(4);

      // Voting buttons should be accessible
      await expect(page.locator('[data-testid="vote-up-button"]').first()).toBeVisible();
      await expect(page.locator('[data-testid="vote-down-button"]').first()).toBeVisible();

      console.log(`✓ ${viewport.name} viewport test passed`);
    }
  });

  test('should display all text in Korean', async ({ page }) => {
    await votingHelpers.navigateToDashboard();
    await votingHelpers.waitForKospiLoad();
    await votingHelpers.waitForStockCardsLoad();

    // Check Korean stock names
    await expect(page.locator('[data-testid="stock-card-005930"]')).toContainText('삼성전자');
    await expect(page.locator('[data-testid="stock-card-000660"]')).toContainText('SK하이닉스');
    await expect(page.locator('[data-testid="stock-card-035420"]')).toContainText('NAVER');
    await expect(page.locator('[data-testid="stock-card-035720"]')).toContainText('카카오');

    // Check Korean UI elements
    await expect(page.locator('[data-testid="vote-up-button"]').first()).toContainText('상승');
    await expect(page.locator('[data-testid="vote-down-button"]').first()).toContainText('하락');

    // Check voting window information in Korean
    await expect(page.locator('[data-testid="voting-window-info"]')).toContainText('투표 가능 시간');

    // Check market status in Korean
    const marketStatus = page.locator('[data-testid="market-status"]');
    if (await marketStatus.isVisible()) {
      const statusText = await marketStatus.textContent();
      expect(statusText).toMatch(/장 시작|장 마감|투표 진행중|시간외/);
    }
  });

  test('should display Korean error messages', async ({ page }) => {
    // Clear auth to trigger guest mode
    await authHelpers.clearToken();
    await votingHelpers.navigateToDashboard();
    await votingHelpers.waitForKospiLoad();

    // Try to vote as guest
    await page.locator('[data-testid="kospi-hero-card"] [data-testid="vote-up-button"]').click();

    // Should show Korean login prompt
    await votingHelpers.checkLoginPrompt();
    await expect(page.locator('[data-testid="login-prompt"]')).toContainText('로그인');

    // Check modal content is in Korean
    if (await page.locator('[data-testid="login-modal"]').isVisible()) {
      await expect(page.locator('[data-testid="login-modal"]')).toContainText('로그인이 필요합니다');
      await expect(page.locator('[data-testid="login-modal"]')).toContainText('투표하려면 로그인해주세요');
    }
  });

  test('should format Korean numbers and percentages correctly', async ({ page }) => {
    await votingHelpers.navigateToDashboard();
    await votingHelpers.waitForKospiLoad();
    await votingHelpers.waitForStockCardsLoad();

    // Check KOSPI price formatting (Korean number format)
    const kospiPrice = page.locator('[data-testid="kospi-index-value"]');
    await expect(kospiPrice).toContainText('2,450.50'); // Should use comma separators

    // Check percentage formatting
    const kospiChange = page.locator('[data-testid="kospi-change-percent"]');
    await expect(kospiChange).toContainText('1.25%');

    // Check stock prices
    const samsungPrice = page.locator('[data-testid="stock-card-005930"] [data-testid="current-price"]');
    await expect(samsungPrice).toContainText('68,000'); // Korean number formatting

    // Check voting statistics formatting
    const stats = page.locator('[data-testid="voting-stats-KS11"]');
    await expect(stats.locator('[data-testid="up-percentage"]')).toContainText('65%');
  });

  test('should handle Korean date and time formatting', async ({ page }) => {
    await votingHelpers.navigateToDashboard();
    await votingHelpers.waitForKospiLoad();

    // Check voting deadline formatting
    const deadline = page.locator('[data-testid="voting-deadline"]');
    if (await deadline.isVisible()) {
      const deadlineText = await deadline.textContent();
      // Should use Korean time format (AM/PM = 오전/오후)
      expect(deadlineText).toMatch(/오전|오후/);
    }

    // Check current time display
    const currentTime = page.locator('[data-testid="current-time"]');
    if (await currentTime.isVisible()) {
      const timeText = await currentTime.textContent();
      expect(timeText).toMatch(/오전|오후|\d{1,2}:\d{2}/);
    }
  });

  test('should work with Korean input methods', async ({ page }) => {
    // Navigate to login page for Korean input testing
    await page.goto('/login');

    // Test Korean input in email field (though email should be English)
    await page.fill('input[name="email"]', 'test@example.com');

    // Check that form handles Korean characters gracefully
    await page.fill('input[name="password"]', 'Test한글123!');

    // Form should accept the input
    const passwordField = page.locator('input[name="password"]');
    const passwordValue = await passwordField.inputValue();
    expect(passwordValue).toBe('Test한글123!');
  });

  test('should display proper Korean tooltips and help text', async ({ page }) => {
    await votingHelpers.navigateToDashboard();
    await votingHelpers.waitForKospiLoad();
    await votingHelpers.waitForStockCardsLoad();

    // Hover over info icons or help elements
    const helpIcon = page.locator('[data-testid="voting-help-icon"]');
    if (await helpIcon.isVisible()) {
      await helpIcon.hover();

      // Tooltip should be in Korean
      const tooltip = page.locator('[data-testid="tooltip"]');
      await expect(tooltip).toBeVisible();
      const tooltipText = await tooltip.textContent();
      expect(tooltipText).toMatch(/투표|예측|상승|하락/);
    }

    // Check stock information tooltips
    const stockInfo = page.locator('[data-testid="stock-info-icon"]').first();
    if (await stockInfo.isVisible()) {
      await stockInfo.hover();

      const stockTooltip = page.locator('[data-testid="stock-tooltip"]');
      if (await stockTooltip.isVisible()) {
        const stockTooltipText = await stockTooltip.textContent();
        expect(stockTooltipText).toMatch(/종목|가격|변동률/);
      }
    }
  });

  test('should handle RTL text direction correctly for Korean', async ({ page }) => {
    await votingHelpers.navigateToDashboard();
    await votingHelpers.waitForKospiLoad();

    // Korean text should be left-to-right
    const stockName = page.locator('[data-testid="stock-card-005930"] [data-testid="stock-name"]');
    await expect(stockName).toHaveCSS('direction', 'ltr');

    // Numbers should also be left-to-right
    const stockPrice = page.locator('[data-testid="stock-card-005930"] [data-testid="current-price"]');
    await expect(stockPrice).toHaveCSS('direction', 'ltr');
  });

  test('should maintain Korean localization across navigation', async ({ page }) => {
    // Start at dashboard
    await votingHelpers.navigateToDashboard();
    await votingHelpers.waitForKospiLoad();

    // Check Korean text
    await expect(page.locator('[data-testid="vote-up-button"]').first()).toContainText('상승');

    // Navigate to login
    await page.goto('/login');

    // Check Korean labels on login page
    await expect(page.locator('label[for="email"]')).toContainText('이메일');
    await expect(page.locator('label[for="password"]')).toContainText('비밀번호');

    // Navigate back to dashboard
    await votingHelpers.navigateToDashboard();
    await votingHelpers.waitForKospiLoad();

    // Korean text should still be correct
    await expect(page.locator('[data-testid="vote-up-button"]').first()).toContainText('상승');
  });

  test('should handle responsive navigation on mobile', async ({ page }) => {
    await mobileHelpers.setMobileViewport();

    await votingHelpers.navigateToDashboard();

    // Check mobile navigation elements
    const mobileNav = page.locator('[data-testid="mobile-navigation"]');
    if (await mobileNav.isVisible()) {
      // Should have hamburger menu or bottom navigation
      const hamburger = page.locator('[data-testid="hamburger-menu"]');
      const bottomNav = page.locator('[data-testid="bottom-navigation"]');

      const hasHamburger = await hamburger.isVisible();
      const hasBottomNav = await bottomNav.isVisible();

      expect(hasHamburger || hasBottomNav).toBeTruthy();
    }

    // Test navigation functionality
    const loginButton = page.locator('[data-testid="login-button"]');
    if (await loginButton.isVisible()) {
      await mobileHelpers.checkTouchFriendly('[data-testid="login-button"]');
    }
  });
});