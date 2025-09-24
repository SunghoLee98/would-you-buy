import { test, expect } from '@playwright/test';

test.describe('Manual Application Verification', () => {
  test('should load the frontend application', async ({ page }) => {
    // Navigate to the application
    await page.goto('/');

    // Take a screenshot to see what's rendered
    await page.screenshot({ path: 'test-results/homepage-screenshot.png', fullPage: true });

    // Check if React app is loaded
    await expect(page.locator('#root')).toBeVisible();

    // Wait for any React content to load
    await page.waitForLoadState('networkidle');

    // Check the current URL
    console.log('Current URL:', page.url());

    // Get the page title
    const title = await page.title();
    console.log('Page Title:', title);

    // Get all text content to see what's rendered
    const bodyText = await page.locator('body').textContent();
    console.log('Body text:', bodyText?.substring(0, 500));

    // Check for any error messages
    const errors = await page.locator('[role="alert"], .error, .alert-error').count();
    console.log('Error elements found:', errors);

    // Log console errors
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleMessages.push(msg.text());
      }
    });

    // Wait a bit more for any async operations
    await page.waitForTimeout(3000);

    if (consoleMessages.length > 0) {
      console.log('Console errors:', consoleMessages);
    }
  });

  test('should test backend API directly', async ({ request }) => {
    // Test health endpoint
    const healthResponse = await request.get('http://localhost:7070/api/v1/health');
    console.log('Health Response Status:', healthResponse.status());
    console.log('Health Response Body:', await healthResponse.text());

    // Test voting stocks endpoint (should fail without auth)
    const votingResponse = await request.get('http://localhost:7070/api/v1/voting/stocks');
    console.log('Voting Response Status:', votingResponse.status());
    console.log('Voting Response Body:', await votingResponse.text());
  });

  test('should check login form', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Take a screenshot
    await page.screenshot({ path: 'test-results/login-page.png', fullPage: true });

    // Check what's on the login page
    const loginContent = await page.locator('body').textContent();
    console.log('Login page content:', loginContent?.substring(0, 1000));

    // Look for form elements
    const forms = await page.locator('form').count();
    const inputs = await page.locator('input').count();
    const buttons = await page.locator('button').count();

    console.log(`Forms: ${forms}, Inputs: ${inputs}, Buttons: ${buttons}`);
  });
});