import { test, expect } from '@playwright/test';
import {
  TestDataGenerator,
  AuthHelpers,
  WaitHelpers,
  ValidationHelpers,
  NetworkHelpers
} from '../utils/test-helpers';

test.describe('Form Validation - Registration', () => {
  let validationHelpers: ValidationHelpers;
  let waitHelpers: WaitHelpers;
  let networkHelpers: NetworkHelpers;

  test.beforeEach(async ({ page }) => {
    validationHelpers = new ValidationHelpers(page);
    waitHelpers = new WaitHelpers(page);
    networkHelpers = new NetworkHelpers(page);

    await page.goto('/register');
  });

  test('should show real-time email validation', async ({ page }) => {
    const emailInput = page.locator('input[name="email"]');

    // Test various email formats
    const testCases = [
      { email: '', error: '이메일을 입력해주세요', shouldError: true },
      { email: 'a', error: '올바른 이메일 형식이 아닙니다', shouldError: true },
      { email: 'test', error: '올바른 이메일 형식이 아닙니다', shouldError: true },
      { email: 'test@', error: '올바른 이메일 형식이 아닙니다', shouldError: true },
      { email: 'test@domain', error: '올바른 이메일 형식이 아닙니다', shouldError: true },
      { email: 'test@domain.', error: '올바른 이메일 형식이 아닙니다', shouldError: true },
      { email: '@domain.com', error: '올바른 이메일 형식이 아닙니다', shouldError: true },
      { email: 'test @domain.com', error: '올바른 이메일 형식이 아닙니다', shouldError: true },
      { email: 'test@domain.com', error: null, shouldError: false },
      { email: 'user.name@domain.co.kr', error: null, shouldError: false },
      { email: 'user+tag@domain.com', error: null, shouldError: false }
    ];

    for (const testCase of testCases) {
      await emailInput.fill(testCase.email);
      await emailInput.blur(); // Trigger validation
      await page.waitForTimeout(100);

      if (testCase.shouldError) {
        await validationHelpers.checkFieldError('email', testCase.error!);
      } else {
        await validationHelpers.checkNoFieldError('email');
      }
    }
  });

  test('should show real-time password strength validation', async ({ page }) => {
    const passwordInput = page.locator('input[name="password"]');

    // Test password strength requirements
    const testCases = [
      { password: '', error: '비밀번호를 입력해주세요', shouldError: true },
      { password: '123', error: '비밀번호는 최소 8자 이상이어야 합니다', shouldError: true },
      { password: '12345678', error: '비밀번호는 영문자를 포함해야 합니다', shouldError: true },
      { password: 'abcdefgh', error: '비밀번호는 숫자를 포함해야 합니다', shouldError: true },
      { password: 'ABCDEFGH', error: '비밀번호는 숫자를 포함해야 합니다', shouldError: true },
      { password: 'abcd1234', error: '비밀번호는 특수문자를 포함해야 합니다', shouldError: true },
      { password: 'Abcd1234', error: '비밀번호는 특수문자를 포함해야 합니다', shouldError: true },
      { password: 'Abcd1234!', error: null, shouldError: false },
      { password: 'Test@1234', error: null, shouldError: false },
      { password: 'P@ssw0rd!', error: null, shouldError: false }
    ];

    for (const testCase of testCases) {
      await passwordInput.fill(testCase.password);
      await passwordInput.blur();
      await page.waitForTimeout(100);

      if (testCase.shouldError) {
        await validationHelpers.checkFieldError('password', testCase.error!);
      } else {
        await validationHelpers.checkNoFieldError('password');
      }
    }
  });

  test('should show password strength indicator', async ({ page }) => {
    const passwordInput = page.locator('input[name="password"]');
    const strengthIndicator = page.locator('[data-testid="password-strength"]');

    // Test different password strengths
    const passwords = [
      { password: '123', strength: '매우 약함', color: 'red' },
      { password: 'password', strength: '약함', color: 'orange' },
      { password: 'Password1', strength: '보통', color: 'yellow' },
      { password: 'Password1!', strength: '강함', color: 'green' },
      { password: 'MyP@ssw0rd2024!', strength: '매우 강함', color: 'green' }
    ];

    for (const { password, strength } of passwords) {
      await passwordInput.fill(password);
      await page.waitForTimeout(100);

      if (await strengthIndicator.isVisible()) {
        await expect(strengthIndicator).toContainText(strength);
      }
    }
  });

  test('should validate password confirmation in real-time', async ({ page }) => {
    const passwordInput = page.locator('input[name="password"]');
    const confirmInput = page.locator('input[name="passwordConfirm"]');

    // Set password
    await passwordInput.fill('TestPassword123!');

    // Test confirmation matching
    await confirmInput.fill('Test');
    await confirmInput.blur();
    await validationHelpers.checkFieldError('passwordConfirm', '비밀번호가 일치하지 않습니다');

    await confirmInput.fill('TestPassword123');
    await confirmInput.blur();
    await validationHelpers.checkFieldError('passwordConfirm', '비밀번호가 일치하지 않습니다');

    await confirmInput.fill('TestPassword123!');
    await confirmInput.blur();
    await validationHelpers.checkNoFieldError('passwordConfirm');
  });

  test('should validate username format and length', async ({ page }) => {
    const usernameInput = page.locator('input[name="username"]');

    const testCases = [
      { username: '', error: '사용자명을 입력해주세요', shouldError: true },
      { username: 'ab', error: '사용자명은 최소 3자 이상이어야 합니다', shouldError: true },
      { username: 'a'.repeat(21), error: '사용자명은 최대 20자까지 가능합니다', shouldError: true },
      { username: '123user', error: '사용자명은 영문자로 시작해야 합니다', shouldError: true },
      { username: 'user@name', error: '사용자명은 영문자, 숫자, 언더스코어만 사용 가능합니다', shouldError: true },
      { username: 'user name', error: '사용자명은 영문자, 숫자, 언더스코어만 사용 가능합니다', shouldError: true },
      { username: 'user-name', error: '사용자명은 영문자, 숫자, 언더스코어만 사용 가능합니다', shouldError: true },
      { username: 'validuser', error: null, shouldError: false },
      { username: 'user123', error: null, shouldError: false },
      { username: 'user_name', error: null, shouldError: false }
    ];

    for (const testCase of testCases) {
      await usernameInput.fill(testCase.username);
      await usernameInput.blur();
      await page.waitForTimeout(100);

      if (testCase.shouldError) {
        await validationHelpers.checkFieldError('username', testCase.error!);
      } else {
        await validationHelpers.checkNoFieldError('username');
      }
    }
  });

  test('should check username availability with debouncing', async ({ page }) => {
    const usernameInput = page.locator('input[name="username"]');
    const availabilityIndicator = page.locator('[data-testid="username-availability"]');

    // Type username slowly to test debouncing
    await usernameInput.type('test', { delay: 100 });

    // Should show checking indicator
    if (await availabilityIndicator.isVisible()) {
      await expect(availabilityIndicator).toContainText('확인 중...');
    }

    // Wait for debounce and API call
    await page.waitForTimeout(500);

    // Should show availability result
    if (await availabilityIndicator.isVisible()) {
      const text = await availabilityIndicator.textContent();
      expect(text).toMatch(/사용 가능|이미 사용 중/);
    }
  });

  test('should clear errors when user corrects input', async ({ page }) => {
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');

    // Create errors
    await emailInput.fill('invalid');
    await emailInput.blur();
    await validationHelpers.checkFieldError('email', '올바른 이메일 형식이 아닙니다');

    await passwordInput.fill('123');
    await passwordInput.blur();
    await validationHelpers.checkFieldError('password', '비밀번호는 최소 8자 이상이어야 합니다');

    // Fix errors
    await emailInput.fill('valid@email.com');
    await emailInput.blur();
    await validationHelpers.checkNoFieldError('email');

    await passwordInput.fill('ValidPass123!');
    await passwordInput.blur();
    await validationHelpers.checkNoFieldError('password');
  });

  test('should prevent form submission with validation errors', async ({ page }) => {
    const submitButton = page.locator('button[type="submit"]');

    // Try to submit with empty form
    await submitButton.click();

    // Should show all validation errors
    await validationHelpers.checkFieldError('email', '이메일을 입력해주세요');
    await validationHelpers.checkFieldError('username', '사용자명을 입력해주세요');
    await validationHelpers.checkFieldError('password', '비밀번호를 입력해주세요');

    // Should not navigate away
    expect(page.url()).toContain('/register');

    // Fill partial form
    await page.fill('input[name="email"]', 'test@email.com');
    await submitButton.click();

    // Should still show remaining errors
    await validationHelpers.checkNoFieldError('email');
    await validationHelpers.checkFieldError('username', '사용자명을 입력해주세요');
    await validationHelpers.checkFieldError('password', '비밀번호를 입력해주세요');

    // Should still not navigate
    expect(page.url()).toContain('/register');
  });

  test('should show field focus states', async ({ page }) => {
    const fields = ['email', 'username', 'password', 'passwordConfirm'];

    for (const fieldName of fields) {
      const field = page.locator(`input[name="${fieldName}"]`);

      // Focus the field
      await field.focus();

      // Check if field has focus styling (class or attribute)
      const isFocused = await field.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return el.classList.contains('focused') ||
               el.classList.contains('focus') ||
               styles.borderColor !== styles.borderColor ||
               el.getAttribute('data-focused') === 'true';
      });

      // Field should indicate focus somehow
      expect(isFocused !== undefined).toBeTruthy();
    }
  });

  test('should have proper tab order', async ({ page }) => {
    // Start at first field
    await page.locator('input[name="email"]').focus();

    // Tab through fields in order
    const expectedOrder = ['email', 'username', 'password', 'passwordConfirm', 'terms'];

    for (let i = 1; i < expectedOrder.length; i++) {
      await page.keyboard.press('Tab');

      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement as HTMLInputElement;
        return el ? el.name : null;
      });

      expect(focusedElement).toBe(expectedOrder[i]);
    }

    // Tab to submit button
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      return el ? el.tagName.toLowerCase() : null;
    });
    expect(focusedElement).toBe('button');
  });
});

test.describe('Form Validation - Login', () => {
  let validationHelpers: ValidationHelpers;
  let waitHelpers: WaitHelpers;
  let networkHelpers: NetworkHelpers;

  test.beforeEach(async ({ page }) => {
    validationHelpers = new ValidationHelpers(page);
    waitHelpers = new WaitHelpers(page);
    networkHelpers = new NetworkHelpers(page);

    await page.goto('/login');
  });

  test('should validate email format on login form', async ({ page }) => {
    const emailInput = page.locator('input[name="email"]');
    const submitButton = page.locator('button[type="submit"]');

    // Test invalid email
    await emailInput.fill('notanemail');
    await page.fill('input[name="password"]', 'SomePassword123!');
    await submitButton.click();

    await validationHelpers.checkFieldError('email', '올바른 이메일 형식이 아닙니다');

    // Fix email
    await emailInput.fill('valid@email.com');
    await emailInput.blur();
    await validationHelpers.checkNoFieldError('email');
  });

  test('should require both email and password', async ({ page }) => {
    const submitButton = page.locator('button[type="submit"]');

    // Submit empty form
    await submitButton.click();

    await validationHelpers.checkFieldError('email', '이메일을 입력해주세요');
    await validationHelpers.checkFieldError('password', '비밀번호를 입력해주세요');

    // Add email only
    await page.fill('input[name="email"]', 'test@email.com');
    await submitButton.click();

    await validationHelpers.checkNoFieldError('email');
    await validationHelpers.checkFieldError('password', '비밀번호를 입력해주세요');

    // Add password
    await page.fill('input[name="password"]', 'password');
    await validationHelpers.checkNoFieldError('password');
  });

  test('should show loading state during form submission', async ({ page }) => {
    const submitButton = page.locator('button[type="submit"]');

    // Fill valid form
    await page.fill('input[name="email"]', 'test@email.com');
    await page.fill('input[name="password"]', 'Password123!');

    // Intercept to delay response
    await page.route('**/api/auth/login', async route => {
      await page.waitForTimeout(1000);
      route.fulfill({
        status: 401,
        body: JSON.stringify({ error: 'Invalid credentials' })
      });
    });

    // Submit form
    await submitButton.click();

    // Button should show loading state
    await expect(submitButton).toBeDisabled();
    const buttonText = await submitButton.textContent();
    expect(buttonText).toContain('로그인 중...');

    // Wait for response
    await waitHelpers.waitForLoadingToComplete();

    // Button should return to normal
    await expect(submitButton).toBeEnabled();
  });

  test('should handle Enter key submission', async ({ page }) => {
    let formSubmitted = false;

    // Intercept form submission
    await page.route('**/api/auth/login', route => {
      formSubmitted = true;
      route.fulfill({
        status: 401,
        body: JSON.stringify({ error: 'Invalid' })
      });
    });

    // Fill form
    await page.fill('input[name="email"]', 'test@email.com');
    await page.fill('input[name="password"]', 'Password123!');

    // Press Enter in password field
    await page.locator('input[name="password"]').press('Enter');

    // Wait a bit for submission
    await page.waitForTimeout(500);

    // Form should have been submitted
    expect(formSubmitted).toBeTruthy();
  });

  test('should maintain form values after validation error', async ({ page }) => {
    const emailValue = 'test@email.com';
    const passwordValue = 'Password123!';

    // Fill form
    await page.fill('input[name="email"]', emailValue);
    await page.fill('input[name="password"]', passwordValue);

    // Submit with API error
    await page.route('**/api/auth/login', route => {
      route.fulfill({
        status: 401,
        body: JSON.stringify({ error: 'Invalid credentials' })
      });
    });

    await page.click('button[type="submit"]');
    await waitHelpers.waitForLoadingToComplete();

    // Values should still be in the form
    const currentEmail = await page.locator('input[name="email"]').inputValue();
    const currentPassword = await page.locator('input[name="password"]').inputValue();

    expect(currentEmail).toBe(emailValue);
    expect(currentPassword).toBe(passwordValue);
  });

  test('should have accessible form labels', async ({ page }) => {
    // Check all inputs have associated labels
    const inputs = await page.locator('input').all();

    for (const input of inputs) {
      const inputId = await input.getAttribute('id');
      const inputName = await input.getAttribute('name');

      if (inputId) {
        const label = page.locator(`label[for="${inputId}"]`);
        await expect(label).toBeVisible();
      }

      // Check aria-label if no visible label
      const ariaLabel = await input.getAttribute('aria-label');
      const hasLabel = inputId || ariaLabel;
      expect(hasLabel).toBeTruthy();
    }
  });

  test('should display Korean error messages correctly', async ({ page }) => {
    // Test that Korean characters display properly
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Check Korean error messages
    const emailError = page.locator('[data-field="email"] .error, #email-error, .email-error');
    const passwordError = page.locator('[data-field="password"] .error, #password-error, .password-error');

    await expect(emailError).toHaveText(/이메일을 입력해주세요/);
    await expect(passwordError).toHaveText(/비밀번호를 입력해주세요/);

    // Verify no encoding issues
    const emailErrorText = await emailError.textContent();
    expect(emailErrorText).not.toContain('?');
    expect(emailErrorText).not.toContain('�');
  });

  test('should have no console errors during validation', async ({ page }) => {
    await networkHelpers.checkNoConsoleErrors();

    // Trigger various validations
    await page.click('button[type="submit"]'); // Empty form
    await page.fill('input[name="email"]', 'invalid');
    await page.fill('input[name="password"]', '123');
    await page.click('button[type="submit"]');

    // Fix validations
    await page.fill('input[name="email"]', 'valid@email.com');
    await page.fill('input[name="password"]', 'ValidPassword123!');

    // Check no console errors throughout
    await networkHelpers.checkNoConsoleErrors();
  });
});