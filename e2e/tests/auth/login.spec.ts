import { test, expect } from '@playwright/test';
import {
  TestDataGenerator,
  AuthHelpers,
  WaitHelpers,
  ValidationHelpers,
  NetworkHelpers,
  DatabaseHelpers
} from '../utils/test-helpers';

test.describe('User Login Flow', () => {
  let authHelpers: AuthHelpers;
  let waitHelpers: WaitHelpers;
  let validationHelpers: ValidationHelpers;
  let networkHelpers: NetworkHelpers;
  let testUser: ReturnType<typeof TestDataGenerator.generateUser>;

  test.beforeEach(async ({ page }) => {
    authHelpers = new AuthHelpers(page);
    waitHelpers = new WaitHelpers(page);
    validationHelpers = new ValidationHelpers(page);
    networkHelpers = new NetworkHelpers(page);
    testUser = TestDataGenerator.generateUser();

    // Register a test user first
    await authHelpers.register({
      email: testUser.email,
      username: testUser.username,
      password: testUser.password,
      acceptTerms: true
    });

    // Clear session and navigate to login
    await authHelpers.clearToken();
    await page.goto('/login');
  });

  test.afterEach(async () => {
    // Clean up test data
    await DatabaseHelpers.cleanupTestUser(testUser.email);
  });

  test('should display login form with all required fields', async ({ page }) => {
    // Check form elements are present
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Check Korean labels
    await expect(page.locator('label[for="email"]')).toContainText('이메일');
    await expect(page.locator('label[for="password"]')).toContainText('비밀번호');

    // Check additional elements
    await expect(page.locator('a[href="/register"]')).toContainText('회원가입');
    await expect(page.locator('a[href="/forgot-password"]')).toContainText('비밀번호 찾기');
  });

  test('should successfully login with correct credentials', async ({ page }) => {
    // Login with valid credentials
    await authHelpers.login(testUser.email, testUser.password);

    // Wait for login to complete
    await waitHelpers.waitForLoadingToComplete();

    // Should redirect to dashboard
    await waitHelpers.waitForNavigation('/dashboard');

    // Check that user is logged in
    const isLoggedIn = await authHelpers.isLoggedIn();
    expect(isLoggedIn).toBeTruthy();

    // Check token is stored
    const token = await authHelpers.getToken();
    expect(token).toBeTruthy();
    expect(token).toMatch(/^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/); // JWT format

    // Check user info is displayed
    await expect(page.locator('[data-testid="user-info"]')).toContainText(testUser.username);
  });

  test('should reject login with incorrect email', async ({ page }) => {
    // Try to login with wrong email
    await authHelpers.login('wrong@email.com', testUser.password);

    // Wait for error response
    await waitHelpers.waitForLoadingToComplete();

    // Should show error message
    await waitHelpers.waitForErrorMessage('이메일 또는 비밀번호가 올바르지 않습니다');

    // Should stay on login page
    expect(page.url()).toContain('/login');

    // Should not be logged in
    const isLoggedIn = await authHelpers.isLoggedIn();
    expect(isLoggedIn).toBeFalsy();
  });

  test('should reject login with incorrect password', async ({ page }) => {
    // Try to login with wrong password
    await authHelpers.login(testUser.email, 'WrongPassword123!');

    // Wait for error response
    await waitHelpers.waitForLoadingToComplete();

    // Should show error message
    await waitHelpers.waitForErrorMessage('이메일 또는 비밀번호가 올바르지 않습니다');

    // Should stay on login page
    expect(page.url()).toContain('/login');

    // Should not be logged in
    const isLoggedIn = await authHelpers.isLoggedIn();
    expect(isLoggedIn).toBeFalsy();
  });

  test('should validate email format before submission', async ({ page }) => {
    // Enter invalid email
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');

    // Should show validation error
    await validationHelpers.checkFieldError('email', '올바른 이메일 형식이 아닙니다');

    // Form should not be submitted
    expect(page.url()).toContain('/login');
  });

  test('should require all fields', async ({ page }) => {
    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Should show validation errors
    await validationHelpers.checkFieldError('email', '이메일을 입력해주세요');
    await validationHelpers.checkFieldError('password', '비밀번호를 입력해주세요');

    // Try with only email
    await page.fill('input[name="email"]', testUser.email);
    await page.click('button[type="submit"]');
    await validationHelpers.checkNoFieldError('email');
    await validationHelpers.checkFieldError('password', '비밀번호를 입력해주세요');

    // Try with only password
    await page.fill('input[name="email"]', '');
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await validationHelpers.checkFieldError('email', '이메일을 입력해주세요');
    await validationHelpers.checkNoFieldError('password');
  });

  test('should disable submit button while processing', async ({ page }) => {
    // Fill in credentials
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);

    // Click submit
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Button should be disabled while processing
    await expect(submitButton).toBeDisabled();

    // Wait for completion
    await waitHelpers.waitForLoadingToComplete();
  });

  test('should store JWT token in localStorage', async ({ page }) => {
    // Login
    await authHelpers.login(testUser.email, testUser.password);
    await waitHelpers.waitForLoadingToComplete();
    await waitHelpers.waitForNavigation('/dashboard');

    // Check token is in localStorage
    const token = await page.evaluate(() => {
      return localStorage.getItem('access_token');
    });

    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');

    // Verify token structure (JWT has 3 parts separated by dots)
    const tokenParts = token!.split('.');
    expect(tokenParts).toHaveLength(3);
  });

  test('should persist login state after page refresh', async ({ page }) => {
    // Login
    await authHelpers.login(testUser.email, testUser.password);
    await waitHelpers.waitForLoadingToComplete();
    await waitHelpers.waitForNavigation('/dashboard');

    // Store token value
    const originalToken = await authHelpers.getToken();

    // Refresh the page
    await page.reload();

    // Check still logged in
    const isLoggedIn = await authHelpers.isLoggedIn();
    expect(isLoggedIn).toBeTruthy();

    // Check token is still there
    const tokenAfterRefresh = await authHelpers.getToken();
    expect(tokenAfterRefresh).toBe(originalToken);

    // Check still on dashboard
    expect(page.url()).toContain('/dashboard');

    // Check user info still displayed
    await expect(page.locator('[data-testid="user-info"]')).toContainText(testUser.username);
  });

  test('should redirect to originally requested page after login', async ({ page }) => {
    // Try to access protected route while logged out
    await page.goto('/dashboard/profile');

    // Should redirect to login
    await waitHelpers.waitForNavigation('/login');

    // Login
    await authHelpers.login(testUser.email, testUser.password);
    await waitHelpers.waitForLoadingToComplete();

    // Should redirect to originally requested page
    await waitHelpers.waitForNavigation('/dashboard/profile');
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Intercept API call to simulate network error
    await page.route('**/api/auth/login', route => {
      route.abort('internetdisconnected');
    });

    // Try to login
    await authHelpers.login(testUser.email, testUser.password);

    // Should show error message
    await waitHelpers.waitForErrorMessage('네트워크 오류가 발생했습니다. 다시 시도해주세요.');

    // Should stay on login page
    expect(page.url()).toContain('/login');
  });

  test('should handle server errors gracefully', async ({ page }) => {
    // Intercept API call to simulate server error
    await page.route('**/api/auth/login', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });

    // Try to login
    await authHelpers.login(testUser.email, testUser.password);

    // Should show error message
    await waitHelpers.waitForErrorMessage('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');

    // Should stay on login page
    expect(page.url()).toContain('/login');
  });

  test('should clear form errors when user starts typing', async ({ page }) => {
    // Submit empty form to trigger errors
    await page.click('button[type="submit"]');

    // Check errors are displayed
    await validationHelpers.checkFieldError('email', '이메일을 입력해주세요');
    await validationHelpers.checkFieldError('password', '비밀번호를 입력해주세요');

    // Start typing in email field
    await page.fill('input[name="email"]', 't');
    await validationHelpers.checkNoFieldError('email');

    // Start typing in password field
    await page.fill('input[name="password"]', 'p');
    await validationHelpers.checkNoFieldError('password');
  });

  test('should navigate to registration page via link', async ({ page }) => {
    // Find and click register link
    const registerLink = page.locator('a[href="/register"]');
    await expect(registerLink).toBeVisible();
    await expect(registerLink).toContainText('회원가입');

    await registerLink.click();
    await waitHelpers.waitForNavigation('/register');
  });

  test('should navigate to forgot password page via link', async ({ page }) => {
    // Find and click forgot password link
    const forgotLink = page.locator('a[href="/forgot-password"]');
    await expect(forgotLink).toBeVisible();
    await expect(forgotLink).toContainText('비밀번호 찾기');

    await forgotLink.click();
    await waitHelpers.waitForNavigation('/forgot-password');
  });

  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check form is still usable
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Complete login
    await authHelpers.login(testUser.email, testUser.password);
    await waitHelpers.waitForLoadingToComplete();
    await waitHelpers.waitForNavigation('/dashboard');
  });

  test('should have no console errors during login flow', async ({ page }) => {
    await networkHelpers.checkNoConsoleErrors();

    // Complete a full login flow
    await authHelpers.login(testUser.email, testUser.password);
    await waitHelpers.waitForLoadingToComplete();
    await waitHelpers.waitForNavigation('/dashboard');

    // Check again for console errors
    await networkHelpers.checkNoConsoleErrors();
  });
});