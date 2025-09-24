# Plan: Restart Services and Run E2E Tests

## 1. Stop Current Services
- Kill the existing Spring Boot backend process (PID 72799)
- Note: Frontend doesn't appear to be running

## 2. Restart Backend Service
- Navigate to backend directory
- Run: `./gradlew bootRun` to start Spring Boot on port 7070

## 3. Start Frontend Service
- Navigate to frontend directory
- Run: `npm start` to start React on port 3001 (as configured in package.json)

## 4. Verify Services
- Check backend: http://localhost:7070/api/health
- Check frontend: http://localhost:3001
- Verify both services respond correctly

## 5. Run E2E Tests
- Navigate to e2e directory
- Run all Playwright tests: `npm test` or `npx playwright test`
- Tests include:
  - Authentication tests (login, registration, logout)
  - Voting dashboard tests
  - Mobile responsive tests
  - Error handling tests
  - Real-time features

## 6. Generate Test Report
- Create `docs/test_report.md` with:
  - Test execution summary
  - Pass/fail statistics per test suite
  - Failed test details with error messages
  - Performance metrics
  - Screenshots if available
  - Recommendations for fixes

## 7. Handle Test Failures
- If tests fail, document issues in report
- Include error logs and stack traces
  - Note which functionality is affected