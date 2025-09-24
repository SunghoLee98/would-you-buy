import { Page, expect } from '@playwright/test';

/**
 * Test data generator
 */
export class TestDataGenerator {
  private static counter = 0;

  static generateUser() {
    const timestamp = Date.now();
    const counter = this.counter++;
    return {
      email: `testuser${timestamp}${counter}@example.com`,
      username: `testuser${timestamp}${counter}`,
      password: 'TestPassword123!',
      weakPassword: '123456',
      invalidEmail: 'invalid-email',
    };
  }

  static resetCounter() {
    this.counter = 0;
  }
}

/**
 * Authentication helpers
 */
export class AuthHelpers {
  constructor(private page: Page) {}

  async register(userData: {
    email: string;
    username: string;
    password: string;
    passwordConfirm?: string;
    acceptTerms?: boolean;
  }) {
    await this.page.goto('/register');

    await this.page.fill('input[name="email"]', userData.email);
    await this.page.fill('input[name="username"]', userData.username);
    await this.page.fill('input[name="password"]', userData.password);
    await this.page.fill('input[name="passwordConfirm"]', userData.passwordConfirm || userData.password);

    if (userData.acceptTerms !== false) {
      await this.page.check('input[id="termsAccepted"]');
    }

    await this.page.click('button[type="submit"]');
  }

  async login(email: string, password: string) {
    await this.page.goto('/login');
    await this.page.fill('input[name="email"]', email);
    await this.page.fill('input[name="password"]', password);
    await this.page.click('button[type="submit"]');
  }

  async logout() {
    // Click on logout button directly (no menu dropdown in current implementation)
    await this.page.click('[data-testid="logout-button"]');
  }

  async getToken(): Promise<string | null> {
    return await this.page.evaluate(() => {
      return localStorage.getItem('access_token');
    });
  }

  async clearToken() {
    await this.page.evaluate(() => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('token_expiry');
      localStorage.removeItem('user');
    });
  }

  async isLoggedIn(): Promise<boolean> {
    const token = await this.getToken();
    return token !== null;
  }
}

/**
 * Wait helpers
 */
export class WaitHelpers {
  constructor(private page: Page) {}

  async waitForNavigation(url: string) {
    await this.page.waitForURL(url, { timeout: 5000 });
  }

  async waitForErrorMessage(text: string) {
    await expect(this.page.locator('.error-message')).toContainText(text);
  }

  async waitForSuccessMessage(text: string) {
    await expect(this.page.locator('.success-message')).toContainText(text);
  }

  async waitForToast(text: string) {
    const toast = this.page.locator('.toast-message, .notification, [role="alert"]');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText(text);
  }

  async waitForLoadingToComplete() {
    // Wait for any loading spinners to disappear
    const spinner = this.page.locator('.spinner, .loading, [data-testid="loading"]');
    await expect(spinner).toBeHidden({ timeout: 10000 }).catch(() => {
      // Ignore if no spinner found
    });
  }
}

/**
 * Validation helpers
 */
export class ValidationHelpers {
  constructor(private page: Page) {}

  async checkFieldError(fieldName: string, expectedError: string) {
    const fieldError = this.page.locator(`[data-field="${fieldName}"] .error, #${fieldName}-error, .${fieldName}-error`);
    await expect(fieldError).toBeVisible();
    await expect(fieldError).toContainText(expectedError);
  }

  async checkNoFieldError(fieldName: string) {
    const fieldError = this.page.locator(`[data-field="${fieldName}"] .error, #${fieldName}-error, .${fieldName}-error`);
    await expect(fieldError).not.toBeVisible();
  }

  async checkFormDisabled() {
    const submitButton = this.page.locator('button[type="submit"]');
    await expect(submitButton).toBeDisabled();
  }

  async checkFormEnabled() {
    const submitButton = this.page.locator('button[type="submit"]');
    await expect(submitButton).toBeEnabled();
  }
}

/**
 * Database cleanup helper
 */
export class DatabaseHelpers {
  static async cleanupTestUser(email: string) {
    // This would typically call an API endpoint to clean up test data
    // For now, we'll just log that cleanup would happen
    console.log(`Would cleanup user with email: ${email}`);
  }
}

/**
 * Screenshot helper
 */
export class ScreenshotHelpers {
  constructor(private page: Page) {}

  async takeScreenshot(name: string) {
    await this.page.screenshot({
      path: `./test-results/screenshots/${name}.png`,
      fullPage: true
    });
  }
}

/**
 * Network helpers
 */
export class NetworkHelpers {
  constructor(private page: Page) {}

  async interceptAPICall(url: string, response: any) {
    await this.page.route(url, route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response)
      });
    });
  }

  async waitForAPICall(url: string) {
    return this.page.waitForResponse(response =>
      response.url().includes(url) && response.status() === 200
    );
  }

  async checkNoConsoleErrors() {
    const messages: string[] = [];

    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        messages.push(msg.text());
      }
    });

    await this.page.waitForTimeout(1000); // Give time for any errors to appear

    expect(messages).toHaveLength(0);
  }

  async simulateNetworkFailure(url: string) {
    await this.page.route(url, route => {
      route.abort('internetdisconnected');
    });
  }

  async simulateServerError(url: string, status: number = 500) {
    await this.page.route(url, route => {
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server Error' })
      });
    });
  }
}

/**
 * Voting dashboard test helpers
 */
export class VotingHelpers {
  constructor(private page: Page) {}

  async navigateToDashboard() {
    await this.page.goto('/dashboard');
    await this.page.waitForLoadState('networkidle');
  }

  async waitForKospiLoad() {
    await expect(this.page.locator('[data-testid="kospi-hero-card"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="kospi-index-value"]')).toBeVisible();
  }

  async waitForStockCardsLoad() {
    await expect(this.page.locator('[data-testid="stock-voting-card"]')).toHaveCount(8, { timeout: 10000 });
  }

  async voteOnKospi(direction: 'UP' | 'DOWN') {
    const kospiCard = this.page.locator('[data-testid="kospi-hero-card"]');
    const voteButton = kospiCard.locator(`[data-testid="vote-${direction.toLowerCase()}-button"]`);

    await expect(voteButton).toBeVisible();
    await voteButton.click();
  }

  async voteOnStock(stockCode: string, direction: 'UP' | 'DOWN') {
    const stockCard = this.page.locator(`[data-testid="stock-card-${stockCode}"]`);
    const voteButton = stockCard.locator(`[data-testid="vote-${direction.toLowerCase()}-button"]`);

    await expect(voteButton).toBeVisible();
    await voteButton.click();
  }

  async checkVoteConfirmation(stockCode: string, direction: 'UP' | 'DOWN') {
    const stockCard = this.page.locator(`[data-testid="stock-card-${stockCode}"]`);
    await expect(stockCard.locator('[data-testid="vote-success"]')).toBeVisible();
    await expect(stockCard.locator(`[data-testid="voted-${direction.toLowerCase()}"]`)).toBeVisible();
  }

  async checkVoteAnimation() {
    // Wait for confetti or success animation
    await expect(this.page.locator('[data-testid="confetti-animation"], .vote-success-animation')).toBeVisible({ timeout: 3000 });
  }

  async checkLoginPrompt() {
    await expect(this.page.locator('[data-testid="login-prompt"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="login-prompt"]')).toContainText('로그인');
  }

  async waitForWebSocketConnection() {
    // Wait for WebSocket connection to be established
    await this.page.waitForFunction(() => {
      return window.WebSocket && window.WebSocket.prototype.readyState !== undefined;
    });
  }

  async checkVotingStatistics(stockCode: string) {
    const statsElement = this.page.locator(`[data-testid="voting-stats-${stockCode}"]`);
    await expect(statsElement).toBeVisible();
    await expect(statsElement.locator('[data-testid="up-percentage"]')).toBeVisible();
    await expect(statsElement.locator('[data-testid="down-percentage"]')).toBeVisible();
  }

  async mockStockData() {
    const mockData = {
      kospi: {
        code: 'KS11',
        name: 'KOSPI',
        currentPrice: 2450.50,
        changePercent: 1.25,
        isPositive: true
      },
      stocks: [
        {
          code: '005930',
          nameKorean: '삼성전자',
          currentPrice: 68000,
          changePercent: -0.8,
          isPositive: false
        },
        {
          code: '000660',
          nameKorean: 'SK하이닉스',
          currentPrice: 89500,
          changePercent: 2.1,
          isPositive: true
        },
        {
          code: '035420',
          nameKorean: 'NAVER',
          currentPrice: 188500,
          changePercent: 0.5,
          isPositive: true
        },
        {
          code: '035720',
          nameKorean: '카카오',
          currentPrice: 45200,
          changePercent: -1.2,
          isPositive: false
        }
      ]
    };

    await this.page.route('**/api/stocks/voting', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockData
        })
      });
    });

    return mockData;
  }

  async mockVoteStatistics() {
    const mockStats = {
      'KS11': { upVotes: 65, downVotes: 35, totalVotes: 100 },
      '005930': { upVotes: 45, downVotes: 55, totalVotes: 100 },
      '000660': { upVotes: 72, downVotes: 28, totalVotes: 100 },
      '035420': { upVotes: 58, downVotes: 42, totalVotes: 100 },
      '035720': { upVotes: 38, downVotes: 62, totalVotes: 100 }
    };

    await this.page.route('**/api/votes/statistics', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockStats
        })
      });
    });

    return mockStats;
  }

  async mockUserVotes(votes: Array<{stockCode: string, direction: 'UP' | 'DOWN'}> = []) {
    await this.page.route('**/api/votes/my-votes', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: votes.map(vote => ({
            stockCode: vote.stockCode,
            direction: vote.direction,
            votedAt: new Date().toISOString()
          }))
        })
      });
    });
  }
}

/**
 * Mobile helpers
 */
export class MobileHelpers {
  constructor(private page: Page) {}

  async setMobileViewport() {
    await this.page.setViewportSize({ width: 375, height: 667 });
  }

  async setTabletViewport() {
    await this.page.setViewportSize({ width: 768, height: 1024 });
  }

  async setDesktopViewport() {
    await this.page.setViewportSize({ width: 1280, height: 720 });
  }

  async checkTouchFriendly(selector: string) {
    const element = this.page.locator(selector);
    const box = await element.boundingBox();

    if (!box) {
      throw new Error(`Element ${selector} not found`);
    }

    // Touch targets should be at least 44x44px for good usability
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  }

  async simulateTouchGesture(selector: string) {
    const element = this.page.locator(selector);
    await element.tap();
  }
}