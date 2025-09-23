import { test, expect } from '@playwright/test';
import {
  TestDataGenerator,
  AuthHelpers,
  WaitHelpers,
  NetworkHelpers,
  DatabaseHelpers
} from '../utils/test-helpers';

test.describe('Protected Route Access', () => {
  let authHelpers: AuthHelpers;
  let waitHelpers: WaitHelpers;
  let networkHelpers: NetworkHelpers;
  let testUser: ReturnType<typeof TestDataGenerator.generateUser>;

  const protectedRoutes = [
    '/dashboard',
    '/dashboard/profile',
    '/dashboard/settings',
    '/dashboard/predictions',
    '/dashboard/rankings',
    '/voting',
    '/results'
  ];

  test.beforeEach(async ({ page }) => {
    authHelpers = new AuthHelpers(page);
    waitHelpers = new WaitHelpers(page);
    networkHelpers = new NetworkHelpers(page);
    testUser = TestDataGenerator.generateUser();
  });

  test.afterEach(async () => {
    // Clean up test data
    await DatabaseHelpers.cleanupTestUser(testUser.email);
  });

  test('should redirect unauthenticated users to login page', async ({ page }) => {
    // Ensure not logged in
    await authHelpers.clearToken();

    for (const route of protectedRoutes) {
      // Try to access protected route
      await page.goto(route);

      // Should redirect to login
      await waitHelpers.waitForNavigation('/login');

      // Verify redirect happened
      expect(page.url()).toContain('/login');

      // Check for redirect message (optional)
      const redirectMessage = page.locator('[data-testid="redirect-message"]');
      if (await redirectMessage.isVisible()) {
        await expect(redirectMessage).toContainText('로그인이 필요합니다');
      }
    }
  });

  test('should allow authenticated users to access protected routes', async ({ page }) => {
    // Register and login
    await authHelpers.register({
      email: testUser.email,
      username: testUser.username,
      password: testUser.password,
      acceptTerms: true
    });

    await waitHelpers.waitForLoadingToComplete();

    // Test each protected route
    for (const route of protectedRoutes) {
      await page.goto(route);

      // Should NOT redirect to login
      expect(page.url()).not.toContain('/login');

      // Should be on the requested route
      expect(page.url()).toContain(route);

      // User info should be visible
      await expect(page.locator('[data-testid="user-info"]')).toBeVisible();
    }
  });

  test('should preserve original URL after login redirect', async ({ page }) => {
    // Ensure not logged in
    await authHelpers.clearToken();

    // Try to access a specific protected route
    const targetRoute = '/dashboard/profile';
    await page.goto(targetRoute);

    // Should redirect to login
    await waitHelpers.waitForNavigation('/login');

    // Check if original URL is preserved (usually in query params)
    const currentUrl = new URL(page.url());
    const returnUrl = currentUrl.searchParams.get('returnUrl') ||
                     currentUrl.searchParams.get('redirect') ||
                     currentUrl.searchParams.get('from');

    if (returnUrl) {
      expect(returnUrl).toContain(targetRoute);
    }

    // Now register a new user
    await page.goto('/register');
    await authHelpers.register({
      email: testUser.email,
      username: testUser.username,
      password: testUser.password,
      acceptTerms: true
    });

    // Should redirect to original target route
    await waitHelpers.waitForNavigation(targetRoute);
    expect(page.url()).toContain(targetRoute);
  });

  test('should handle expired JWT tokens', async ({ page }) => {
    // Register and login
    await authHelpers.register({
      email: testUser.email,
      username: testUser.username,
      password: testUser.password,
      acceptTerms: true
    });

    await waitHelpers.waitForLoadingToComplete();

    // Set an expired token
    await page.evaluate(() => {
      // Create a fake expired JWT (this is just for testing)
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjB9.invalid';
      localStorage.setItem('token', expiredToken);
    });

    // Try to access protected route
    await page.goto('/dashboard');

    // Should redirect to login due to expired token
    await waitHelpers.waitForNavigation('/login');

    // Check for expiration message
    const expirationMessage = page.locator('[data-testid="session-expired"]');
    if (await expirationMessage.isVisible()) {
      await expect(expirationMessage).toContainText('세션이 만료되었습니다');
    }
  });

  test('should handle invalid JWT tokens', async ({ page }) => {
    // Set an invalid token
    await page.evaluate(() => {
      localStorage.setItem('token', 'invalid-token-format');
    });

    // Try to access protected route
    await page.goto('/dashboard');

    // Should redirect to login due to invalid token
    await waitHelpers.waitForNavigation('/login');

    // Token should be cleared
    const token = await authHelpers.getToken();
    expect(token).toBeNull();
  });

  test('should make authenticated API requests with JWT', async ({ page }) => {
    // Register and login
    await authHelpers.register({
      email: testUser.email,
      username: testUser.username,
      password: testUser.password,
      acceptTerms: true
    });

    await waitHelpers.waitForLoadingToComplete();
    const token = await authHelpers.getToken();
    expect(token).toBeTruthy();

    // Navigate to dashboard
    await page.goto('/dashboard');

    // Intercept API calls to verify Authorization header
    let authHeaderSent = false;
    page.on('request', request => {
      if (request.url().includes('/api/') && request.method() === 'GET') {
        const headers = request.headers();
        if (headers['authorization']) {
          authHeaderSent = true;
          expect(headers['authorization']).toBe(`Bearer ${token}`);
        }
      }
    });

    // Trigger an API call (navigate or interact with page)
    await page.reload();
    await page.waitForTimeout(1000);

    // Verify Authorization header was sent
    expect(authHeaderSent).toBeTruthy();
  });

  test('should handle 401 responses by redirecting to login', async ({ page }) => {
    // Login first
    await authHelpers.register({
      email: testUser.email,
      username: testUser.username,
      password: testUser.password,
      acceptTerms: true
    });

    await waitHelpers.waitForLoadingToComplete();
    await page.goto('/dashboard');

    // Intercept API calls to return 401
    await page.route('**/api/**', route => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 401,
          body: JSON.stringify({ error: 'Unauthorized' })
        });
      } else {
        route.continue();
      }
    });

    // Trigger an API call
    await page.reload();

    // Should redirect to login
    await waitHelpers.waitForNavigation('/login');

    // Token should be cleared
    const token = await authHelpers.getToken();
    expect(token).toBeNull();
  });

  test('should not access admin routes without admin privileges', async ({ page }) => {
    // Register as regular user
    await authHelpers.register({
      email: testUser.email,
      username: testUser.username,
      password: testUser.password,
      acceptTerms: true
    });

    await waitHelpers.waitForLoadingToComplete();

    // Try to access admin routes
    const adminRoutes = ['/admin', '/admin/users', '/admin/settings'];

    for (const route of adminRoutes) {
      await page.goto(route);

      // Should either redirect or show forbidden message
      const isForbidden = page.url().includes('403') ||
                         page.url().includes('forbidden');
      const isRedirected = page.url().includes('/dashboard') ||
                          page.url().includes('/login');

      expect(isForbidden || isRedirected).toBeTruthy();

      // Check for forbidden message
      const forbiddenMessage = page.locator('[data-testid="forbidden-message"]');
      if (await forbiddenMessage.isVisible()) {
        await expect(forbiddenMessage).toContainText('접근 권한이 없습니다');
      }
    }
  });

  test('should maintain authentication across multiple tabs', async ({ context, page }) => {
    // Register and login in first tab
    await authHelpers.register({
      email: testUser.email,
      username: testUser.username,
      password: testUser.password,
      acceptTerms: true
    });

    await waitHelpers.waitForLoadingToComplete();
    const token = await authHelpers.getToken();
    expect(token).toBeTruthy();

    // Open second tab
    const page2 = await context.newPage();
    const authHelpers2 = new AuthHelpers(page2);

    // Navigate to protected route in second tab
    await page2.goto('/dashboard');

    // Should be authenticated in second tab
    const isLoggedIn2 = await authHelpers2.isLoggedIn();
    expect(isLoggedIn2).toBeTruthy();

    // Token should be the same
    const token2 = await authHelpers2.getToken();
    expect(token2).toBe(token);

    // Both tabs should show user info
    await expect(page.locator('[data-testid="user-info"]')).toContainText(testUser.username);
    await expect(page2.locator('[data-testid="user-info"]')).toContainText(testUser.username);

    // Close second tab
    await page2.close();
  });

  test('should handle token refresh if implemented', async ({ page }) => {
    // Register and login
    await authHelpers.register({
      email: testUser.email,
      username: testUser.username,
      password: testUser.password,
      acceptTerms: true
    });

    await waitHelpers.waitForLoadingToComplete();
    const initialToken = await authHelpers.getToken();

    // Wait for some time and make a request
    await page.waitForTimeout(2000);
    await page.goto('/dashboard/profile');

    // Check if token was refreshed (if refresh is implemented)
    const currentToken = await authHelpers.getToken();

    // Token might be the same or refreshed depending on implementation
    expect(currentToken).toBeTruthy();

    // User should still be authenticated
    expect(await authHelpers.isLoggedIn()).toBeTruthy();
  });

  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Register and login
    await authHelpers.register({
      email: testUser.email,
      username: testUser.username,
      password: testUser.password,
      acceptTerms: true
    });

    await waitHelpers.waitForLoadingToComplete();

    // Access protected routes on mobile
    for (const route of protectedRoutes.slice(0, 3)) { // Test first 3 routes
      await page.goto(route);
      expect(page.url()).toContain(route);
      await expect(page.locator('[data-testid="user-info"]')).toBeVisible();
    }
  });

  test('should have no console errors when accessing protected routes', async ({ page }) => {
    await networkHelpers.checkNoConsoleErrors();

    // Register and login
    await authHelpers.register({
      email: testUser.email,
      username: testUser.username,
      password: testUser.password,
      acceptTerms: true
    });

    await waitHelpers.waitForLoadingToComplete();

    // Access multiple protected routes
    for (const route of protectedRoutes.slice(0, 3)) {
      await page.goto(route);
      await networkHelpers.checkNoConsoleErrors();
    }
  });
});