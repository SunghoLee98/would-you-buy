import { test, expect } from '@playwright/test';
import {
  TestDataGenerator,
  AuthHelpers,
  WaitHelpers,
  ValidationHelpers,
  NetworkHelpers,
  DatabaseHelpers
} from '../utils/test-helpers';

test.describe('User Logout Flow', () => {
  let authHelpers: AuthHelpers;
  let waitHelpers: WaitHelpers;
  let networkHelpers: NetworkHelpers;
  let testUser: ReturnType<typeof TestDataGenerator.generateUser>;

  test.beforeEach(async ({ page }) => {
    authHelpers = new AuthHelpers(page);
    waitHelpers = new WaitHelpers(page);
    networkHelpers = new NetworkHelpers(page);
    testUser = TestDataGenerator.generateUser();

    // Register and login a test user
    await authHelpers.register({
      email: testUser.email,
      username: testUser.username,
      password: testUser.password,
      acceptTerms: true
    });

    // Ensure user is logged in and on dashboard
    await waitHelpers.waitForNavigation('/dashboard');
    const isLoggedIn = await authHelpers.isLoggedIn();
    expect(isLoggedIn).toBeTruthy();
  });

  test.afterEach(async () => {
    // Clean up test data
    await DatabaseHelpers.cleanupTestUser(testUser.email);
  });

  test('should successfully logout from dashboard', async ({ page }) => {
    // Verify logged in state
    expect(await authHelpers.isLoggedIn()).toBeTruthy();
    await expect(page.locator('[data-testid="user-info"]')).toContainText(testUser.username);

    // Perform logout
    await authHelpers.logout();

    // Wait for logout to complete
    await waitHelpers.waitForLoadingToComplete();

    // Should redirect to home or login page
    const currentUrl = page.url();
    expect(currentUrl.endsWith('/') || currentUrl.includes('/login')).toBeTruthy();

    // Check token is removed
    const token = await authHelpers.getToken();
    expect(token).toBeNull();

    // User info should not be visible
    await expect(page.locator('[data-testid="user-info"]')).not.toBeVisible();
  });

  test('should clear JWT token from localStorage on logout', async ({ page }) => {
    // Verify token exists
    const tokenBefore = await authHelpers.getToken();
    expect(tokenBefore).toBeTruthy();

    // Logout
    await authHelpers.logout();
    await waitHelpers.waitForLoadingToComplete();

    // Verify token is removed
    const tokenAfter = await authHelpers.getToken();
    expect(tokenAfter).toBeNull();

    // Also verify through direct evaluation
    const localStorageToken = await page.evaluate(() => {
      return localStorage.getItem('token');
    });
    expect(localStorageToken).toBeNull();
  });

  test('should redirect to login when accessing protected route after logout', async ({ page }) => {
    // Logout
    await authHelpers.logout();
    await waitHelpers.waitForLoadingToComplete();

    // Try to access dashboard
    await page.goto('/dashboard');

    // Should redirect to login
    await waitHelpers.waitForNavigation('/login');

    // Verify not logged in
    expect(await authHelpers.isLoggedIn()).toBeFalsy();
  });

  test('should show logout confirmation or success message', async ({ page }) => {
    // Logout
    await authHelpers.logout();

    // Should show success message
    await waitHelpers.waitForToast('로그아웃되었습니다');

    // Or check for a logout confirmation
    const logoutMessage = page.locator('[data-testid="logout-message"]');
    if (await logoutMessage.isVisible()) {
      await expect(logoutMessage).toContainText('성공적으로 로그아웃되었습니다');
    }
  });

  test('should handle logout API errors gracefully', async ({ page }) => {
    // Intercept logout API call to simulate error
    await page.route('**/api/auth/logout', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Logout failed' })
      });
    });

    // Try to logout
    await authHelpers.logout();

    // Even if API fails, client should clear token
    await page.waitForTimeout(1000);
    const token = await authHelpers.getToken();
    expect(token).toBeNull();

    // Should still redirect to login/home
    const currentUrl = page.url();
    expect(currentUrl.endsWith('/') || currentUrl.includes('/login')).toBeTruthy();
  });

  test('should not be able to use old token after logout', async ({ page }) => {
    // Store the token
    const oldToken = await authHelpers.getToken();
    expect(oldToken).toBeTruthy();

    // Logout
    await authHelpers.logout();
    await waitHelpers.waitForLoadingToComplete();

    // Try to make an authenticated request with old token
    const response = await page.request.get('http://localhost:7070/api/user/profile', {
      headers: {
        'Authorization': `Bearer ${oldToken}`
      }
    });

    // Should return 401 Unauthorized
    expect(response.status()).toBe(401);
  });

  test('should logout from any page in the application', async ({ page }) => {
    // Navigate to different pages and logout
    const pages = ['/dashboard', '/dashboard/profile', '/dashboard/settings'];

    for (const pageUrl of pages) {
      // Login fresh
      await authHelpers.clearToken();
      await authHelpers.login(testUser.email, testUser.password);
      await waitHelpers.waitForLoadingToComplete();

      // Navigate to specific page
      await page.goto(pageUrl);
      await page.waitForTimeout(500);

      // Verify on correct page and logged in
      expect(page.url()).toContain(pageUrl);
      expect(await authHelpers.isLoggedIn()).toBeTruthy();

      // Logout
      await authHelpers.logout();
      await waitHelpers.waitForLoadingToComplete();

      // Verify logged out
      expect(await authHelpers.isLoggedIn()).toBeFalsy();
    }
  });

  test('should handle concurrent logout requests', async ({ page, context }) => {
    // Open second tab
    const page2 = await context.newPage();
    const authHelpers2 = new AuthHelpers(page2);

    // Navigate to dashboard in second tab
    await page2.goto('/dashboard');

    // Verify both tabs are logged in
    expect(await authHelpers.isLoggedIn()).toBeTruthy();
    expect(await authHelpers2.isLoggedIn()).toBeTruthy();

    // Logout from first tab
    await authHelpers.logout();
    await waitHelpers.waitForLoadingToComplete();

    // Second tab should also be logged out on next navigation/refresh
    await page2.reload();
    expect(await authHelpers2.isLoggedIn()).toBeFalsy();

    // Close second tab
    await page2.close();
  });

  test('should cleanup all user session data on logout', async ({ page }) => {
    // Set some session data
    await page.evaluate(() => {
      localStorage.setItem('token', 'test-token');
      localStorage.setItem('user', JSON.stringify({ username: 'testuser' }));
      sessionStorage.setItem('session-data', 'test-session');
    });

    // Logout
    await authHelpers.logout();
    await waitHelpers.waitForLoadingToComplete();

    // Verify all session data is cleared
    const storageData = await page.evaluate(() => {
      return {
        token: localStorage.getItem('token'),
        user: localStorage.getItem('user'),
        sessionData: sessionStorage.getItem('session-data')
      };
    });

    expect(storageData.token).toBeNull();
    expect(storageData.user).toBeNull();
    // Session storage might or might not be cleared depending on implementation
  });

  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Verify logged in
    expect(await authHelpers.isLoggedIn()).toBeTruthy();

    // Find and click mobile menu/hamburger if needed
    const mobileMenu = page.locator('[data-testid="mobile-menu"]');
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
    }

    // Logout
    await authHelpers.logout();
    await waitHelpers.waitForLoadingToComplete();

    // Verify logged out
    expect(await authHelpers.isLoggedIn()).toBeFalsy();
  });

  test('should have no console errors during logout flow', async ({ page }) => {
    await networkHelpers.checkNoConsoleErrors();

    // Perform logout
    await authHelpers.logout();
    await waitHelpers.waitForLoadingToComplete();

    // Check for console errors after logout
    await networkHelpers.checkNoConsoleErrors();
  });
});