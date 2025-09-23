import { test, expect } from '@playwright/test';
import {
  TestDataGenerator,
  AuthHelpers,
  WaitHelpers,
  ValidationHelpers,
  NetworkHelpers,
  DatabaseHelpers
} from '../utils/test-helpers';

test.describe('User Registration Flow', () => {
  let authHelpers: AuthHelpers;
  let waitHelpers: WaitHelpers;
  let validationHelpers: ValidationHelpers;
  let networkHelpers: NetworkHelpers;
  let userData: ReturnType<typeof TestDataGenerator.generateUser>;

  test.beforeEach(async ({ page }) => {
    authHelpers = new AuthHelpers(page);
    waitHelpers = new WaitHelpers(page);
    validationHelpers = new ValidationHelpers(page);
    networkHelpers = new NetworkHelpers(page);
    userData = TestDataGenerator.generateUser();

    await page.goto('/register');
  });

  test.afterEach(async () => {
    // Clean up test data if needed
    await DatabaseHelpers.cleanupTestUser(userData.email);
  });

  test('should display registration form with all required fields', async ({ page }) => {
    // Check all form elements are present
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="passwordConfirm"]')).toBeVisible();
    await expect(page.locator('input[id="termsAccepted"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Check Korean labels
    await expect(page.locator('label[for="email"]')).toContainText('이메일');
    await expect(page.locator('label[for="username"]')).toContainText('사용자명');
    await expect(page.locator('label[for="password"]')).toContainText('비밀번호');
    await expect(page.locator('label[for="passwordConfirm"]')).toContainText('비밀번호 확인');
    await expect(page.locator('label[for="termsAccepted"]')).toContainText('약관');
  });

  test('should successfully register with valid data', async ({ page }) => {
    // Fill in registration form
    await authHelpers.register({
      email: userData.email,
      username: userData.username,
      password: userData.password,
      acceptTerms: true
    });

    // Wait for successful registration
    await waitHelpers.waitForLoadingToComplete();

    // Should redirect to dashboard after successful registration
    await waitHelpers.waitForNavigation('/dashboard');

    // Check that user is logged in (token should be stored)
    const isLoggedIn = await authHelpers.isLoggedIn();
    expect(isLoggedIn).toBeTruthy();

    // Check welcome message or user info is displayed
    await expect(page.locator('[data-testid="user-info"]')).toContainText(userData.username);
  });

  test('should validate email format', async ({ page }) => {
    // Test invalid email formats
    const invalidEmails = [
      'notanemail',
      'missing@domain',
      '@nodomain.com',
      'spaces in@email.com',
      'double@@at.com'
    ];

    for (const email of invalidEmails) {
      await page.fill('input[name="email"]', email);
      await page.click('input[name="username"]'); // Trigger blur event

      await validationHelpers.checkFieldError('email', '올바른 이메일 형식이 아닙니다');
    }

    // Test valid email
    await page.fill('input[name="email"]', userData.email);
    await page.click('input[name="username"]');
    await validationHelpers.checkNoFieldError('email');
  });

  test('should validate password strength requirements', async ({ page }) => {
    // Test weak passwords
    const weakPasswords = [
      { password: '123', error: '비밀번호는 최소 8자 이상이어야 합니다' },
      { password: 'password', error: '비밀번호는 숫자를 포함해야 합니다' },
      { password: '12345678', error: '비밀번호는 영문자를 포함해야 합니다' },
      { password: 'password1', error: '비밀번호는 특수문자를 포함해야 합니다' }
    ];

    for (const { password, error } of weakPasswords) {
      await page.fill('input[name="password"]', password);
      await page.click('input[name="passwordConfirm"]'); // Trigger blur event

      await validationHelpers.checkFieldError('password', error);
    }

    // Test strong password
    await page.fill('input[name="password"]', userData.password);
    await page.click('input[name="passwordConfirm"]');
    await validationHelpers.checkNoFieldError('password');
  });

  test('should validate password confirmation match', async ({ page }) => {
    await page.fill('input[name="password"]', userData.password);
    await page.fill('input[name="passwordConfirm"]', 'DifferentPassword123!');
    await page.click('input[name="email"]'); // Trigger blur event

    await validationHelpers.checkFieldError('passwordConfirm', '비밀번호가 일치하지 않습니다');

    // Fix the password confirmation
    await page.fill('input[name="passwordConfirm"]', userData.password);
    await page.click('input[name="email"]');
    await validationHelpers.checkNoFieldError('passwordConfirm');
  });

  test('should check username availability in real-time', async ({ page }) => {
    // Register first user
    const firstUser = TestDataGenerator.generateUser();
    await authHelpers.register({
      email: firstUser.email,
      username: firstUser.username,
      password: firstUser.password,
      acceptTerms: true
    });

    // Navigate back to registration
    await page.goto('/register');

    // Try to use the same username
    await page.fill('input[name="username"]', firstUser.username);
    await page.click('input[name="email"]'); // Trigger blur event

    // Wait for availability check
    await waitHelpers.waitForLoadingToComplete();
    await validationHelpers.checkFieldError('username', '이미 사용 중인 사용자명입니다');

    // Try a different username
    await page.fill('input[name="username"]', userData.username);
    await page.click('input[name="email"]');
    await waitHelpers.waitForLoadingToComplete();
    await validationHelpers.checkNoFieldError('username');
  });

  test('should check email availability', async ({ page }) => {
    // Register first user
    const firstUser = TestDataGenerator.generateUser();
    await authHelpers.register({
      email: firstUser.email,
      username: firstUser.username,
      password: firstUser.password,
      acceptTerms: true
    });

    // Navigate back to registration
    await page.goto('/register');

    // Try to use the same email
    await page.fill('input[name="email"]', firstUser.email);
    await page.fill('input[name="username"]', userData.username);
    await page.fill('input[name="password"]', userData.password);
    await page.fill('input[name="passwordConfirm"]', userData.password);
    await page.check('input[id="termsAccepted"]');
    await page.click('button[type="submit"]');

    // Should show error message
    await waitHelpers.waitForErrorMessage('이미 등록된 이메일입니다');

    // Should not redirect
    expect(page.url()).toContain('/register');
  });

  test('should require terms acceptance', async ({ page }) => {
    // Try to register without accepting terms
    await authHelpers.register({
      email: userData.email,
      username: userData.username,
      password: userData.password,
      acceptTerms: false
    });

    // Should show error message
    await validationHelpers.checkFieldError('termsAccepted', '이용약관에 동의해주세요.');

    // Should not redirect
    expect(page.url()).toContain('/register');

    // Accept terms and try again
    await page.check('input[id="termsAccepted"]');
    await page.click('button[type="submit"]');

    await waitHelpers.waitForLoadingToComplete();
    await waitHelpers.waitForNavigation('/dashboard');
  });

  test('should disable submit button while processing', async ({ page }) => {
    // Fill in valid data
    await page.fill('input[name="email"]', userData.email);
    await page.fill('input[name="username"]', userData.username);
    await page.fill('input[name="password"]', userData.password);
    await page.fill('input[name="passwordConfirm"]', userData.password);
    await page.check('input[id="termsAccepted"]');

    // Click submit
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Button should be disabled while processing
    await expect(submitButton).toBeDisabled();

    // Wait for completion
    await waitHelpers.waitForLoadingToComplete();
  });

  test('should show all validation errors at once on submit', async ({ page }) => {
    // Submit empty form
    await page.click('button[type="submit"]');

    // Check all error messages are displayed
    await validationHelpers.checkFieldError('email', '이메일을 입력해주세요');
    await validationHelpers.checkFieldError('username', '사용자명을 입력해주세요');
    await validationHelpers.checkFieldError('password', '비밀번호를 입력해주세요');
    await validationHelpers.checkFieldError('passwordConfirm', '비밀번호 확인을 입력해주세요');
    await validationHelpers.checkFieldError('termsAccepted', '이용약관에 동의해주세요.');
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Intercept API call to simulate network error
    await page.route('**/api/auth/register', route => {
      route.abort('internetdisconnected');
    });

    // Try to register
    await authHelpers.register({
      email: userData.email,
      username: userData.username,
      password: userData.password,
      acceptTerms: true
    });

    // Should show error message
    await waitHelpers.waitForErrorMessage('네트워크 오류가 발생했습니다. 다시 시도해주세요.');

    // Should stay on registration page
    expect(page.url()).toContain('/register');
  });

  test('should have no console errors during registration flow', async ({ page }) => {
    await networkHelpers.checkNoConsoleErrors();

    // Complete a full registration flow
    await authHelpers.register({
      email: userData.email,
      username: userData.username,
      password: userData.password,
      acceptTerms: true
    });

    await waitHelpers.waitForLoadingToComplete();
    await waitHelpers.waitForNavigation('/dashboard');

    // Check again for console errors
    await networkHelpers.checkNoConsoleErrors();
  });

  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check form is still usable
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Complete registration
    await authHelpers.register({
      email: userData.email,
      username: userData.username,
      password: userData.password,
      acceptTerms: true
    });

    await waitHelpers.waitForLoadingToComplete();
    await waitHelpers.waitForNavigation('/dashboard');
  });

  test('should navigate to login page via link', async ({ page }) => {
    // Find and click login link
    const loginLink = page.locator('a[href="/login"]');
    await expect(loginLink).toBeVisible();
    await expect(loginLink).toContainText('이미 계정이 있으신가요?');

    await loginLink.click();
    await waitHelpers.waitForNavigation('/login');
  });
});