# E2E Test Suite - 살래말래 Authentication System

## Overview
This directory contains comprehensive End-to-End (E2E) tests for the authentication system of the 살래말래 stock prediction platform. The tests are written using Playwright and cover all authentication flows from a user's perspective.

## Test Coverage

### Sprint 1 - Authentication System
The following test suites have been implemented to verify the complete authentication system:

#### 1. Registration Flow (`tests/auth/registration.spec.ts`)
- ✅ Display registration form with all required fields in Korean
- ✅ Successful registration with valid data
- ✅ Email format validation
- ✅ Password strength requirements validation
- ✅ Password confirmation matching
- ✅ Username availability checking
- ✅ Email availability checking
- ✅ Terms acceptance requirement
- ✅ Form submission states and loading indicators
- ✅ Network error handling
- ✅ Mobile viewport compatibility
- ✅ Console error monitoring

#### 2. Login Flow (`tests/auth/login.spec.ts`)
- ✅ Display login form with Korean labels
- ✅ Successful login with correct credentials
- ✅ Rejection of incorrect email/password
- ✅ Email format validation
- ✅ Required field validation
- ✅ JWT token storage in localStorage
- ✅ Login state persistence after refresh
- ✅ Redirect to originally requested page after login
- ✅ Network and server error handling
- ✅ Form interaction (Enter key submission)
- ✅ Mobile viewport compatibility

#### 3. Logout Flow (`tests/auth/logout.spec.ts`)
- ✅ Successful logout from dashboard
- ✅ JWT token removal from localStorage
- ✅ Protected route access prevention after logout
- ✅ Logout confirmation messages
- ✅ API error handling during logout
- ✅ Concurrent logout handling (multiple tabs)
- ✅ Session data cleanup
- ✅ Mobile viewport compatibility

#### 4. Protected Routes (`tests/auth/protected-routes.spec.ts`)
- ✅ Redirect unauthenticated users to login
- ✅ Allow authenticated users to access protected routes
- ✅ Preserve original URL after login redirect
- ✅ Handle expired JWT tokens
- ✅ Handle invalid JWT tokens
- ✅ Authenticated API requests with JWT in headers
- ✅ 401 response handling
- ✅ Admin route access control
- ✅ Multi-tab authentication synchronization
- ✅ Token refresh handling (if implemented)

#### 5. Form Validation (`tests/auth/form-validation.spec.ts`)
- ✅ Real-time email validation with Korean error messages
- ✅ Password strength validation and indicators
- ✅ Username format and length validation
- ✅ Username availability checking with debouncing
- ✅ Error clearing when user corrects input
- ✅ Form submission prevention with errors
- ✅ Field focus states and tab order
- ✅ Loading states during submission
- ✅ Korean language display verification
- ✅ Accessibility compliance (labels, ARIA)

## Test Environment

### Requirements
- Node.js 16+
- npm or yarn
- Backend running on `localhost:7070`
- Frontend running on `localhost:5000`
- PostgreSQL database on `localhost:5432`

### Installation
```bash
cd e2e
npm install
npx playwright install
```

## Running Tests

### All Tests
```bash
npm test
```

### Specific Test Suites
```bash
# All authentication tests
npm run test:auth

# Individual test files
npm run test:registration
npm run test:login
npm run test:logout
npm run test:protected
npm run test:validation
```

### Test Modes
```bash
# Run tests with UI mode (interactive)
npm run test:ui

# Run tests in headed mode (see browser)
npm run test:headed

# Debug mode
npm run test:debug

# Specific browser
npm run test:chrome
npm run test:firefox
npm run test:webkit

# Mobile viewports
npm run test:mobile
```

### View Test Report
```bash
npm run report
```

## Test Configuration

### Playwright Configuration (`playwright.config.ts`)
- **Browsers**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Base URL**: `http://localhost:5000`
- **Timeouts**: 10s action, 30s navigation
- **Parallel Execution**: Enabled
- **Retry**: 0 locally, 2 on CI
- **Screenshots**: On failure
- **Video**: On failure
- **Trace**: On first retry

### Test Helpers (`tests/utils/test-helpers.ts`)
The test suite includes comprehensive helper utilities:

- **TestDataGenerator**: Generate unique test user data
- **AuthHelpers**: Handle registration, login, logout, token management
- **WaitHelpers**: Wait for navigation, messages, loading states
- **ValidationHelpers**: Check field errors and form states
- **NetworkHelpers**: Intercept API calls, check console errors
- **ScreenshotHelpers**: Capture screenshots for debugging
- **DatabaseHelpers**: Clean up test data

## Quality Gates

All tests must pass the following quality criteria:

1. **Functionality**: All user flows work end-to-end
2. **Korean Language**: UI displays Korean text correctly
3. **Console Errors**: No console errors during user flows
4. **Responsive Design**: Works on desktop and mobile viewports
5. **Error Handling**: Graceful handling of network/server errors
6. **Performance**: Reasonable load times and response times
7. **Security**: JWT tokens properly stored and transmitted
8. **Accessibility**: Forms have proper labels and ARIA attributes

## Test Data Management

- Tests use dynamically generated test data with timestamps
- Each test cleans up its data after execution
- No hardcoded test credentials
- Isolated test execution (no dependencies between tests)

## CI/CD Integration

The tests are designed to run in CI/CD pipelines:

1. Tests can run in headless mode
2. Automatic retry on CI failures
3. Test reports generated in JSON format
4. Screenshots and videos captured on failures
5. Parallel execution for faster runs

## Debugging Failed Tests

When tests fail:

1. Check the HTML report: `npm run report`
2. Review screenshots in `test-results/`
3. Watch video recordings of failures
4. Use trace viewer for detailed debugging
5. Run individual tests in headed mode
6. Use `--debug` flag for step-by-step debugging

## Best Practices

1. **Page Object Pattern**: Use helper classes for common operations
2. **Data Independence**: Generate unique test data for each test
3. **Explicit Waits**: Use proper wait strategies instead of fixed timeouts
4. **Error Messages**: Verify Korean error messages display correctly
5. **Cleanup**: Always clean up test data after execution
6. **Parallel Safety**: Ensure tests can run in parallel without conflicts

## Known Issues and Limitations

1. Tests require backend and frontend to be running locally
2. Database cleanup is mocked (requires actual implementation)
3. Token refresh testing depends on backend implementation
4. Admin role testing requires backend support

## Future Improvements

1. Add API contract testing
2. Implement performance benchmarks
3. Add visual regression testing
4. Create CI/CD pipeline configuration
5. Add test coverage metrics
6. Implement real database cleanup utilities

## Maintenance

Regular maintenance tasks:

1. Update Playwright version quarterly
2. Review and update test data generators
3. Refactor common patterns into helpers
4. Monitor test execution times
5. Review false positive failures
6. Update Korean translations as needed

## Contact

For questions or issues with the test suite, please contact the QA team or create an issue in the project repository.