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
}