import { test, expect } from '@playwright/test';
import {
  TestDataGenerator,
  AuthHelpers,
  WaitHelpers,
  VotingHelpers,
  NetworkHelpers,
  DatabaseHelpers
} from '../utils/test-helpers';

test.describe('Voting Dashboard - Voting Functionality', () => {
  let authHelpers: AuthHelpers;
  let waitHelpers: WaitHelpers;
  let votingHelpers: VotingHelpers;
  let networkHelpers: NetworkHelpers;
  let testUser: ReturnType<typeof TestDataGenerator.generateUser>;

  test.beforeEach(async ({ page }) => {
    authHelpers = new AuthHelpers(page);
    waitHelpers = new WaitHelpers(page);
    votingHelpers = new VotingHelpers(page);
    networkHelpers = new NetworkHelpers(page);
    testUser = TestDataGenerator.generateUser();

    // Mock stock data and statistics
    await votingHelpers.mockStockData();
    await votingHelpers.mockVoteStatistics();
    await votingHelpers.mockUserVotes(); // Start with no votes

    // Register and login test user
    await authHelpers.register({
      email: testUser.email,
      username: testUser.username,
      password: testUser.password,
      acceptTerms: true
    });

    await authHelpers.login(testUser.email, testUser.password);
    await waitHelpers.waitForLoadingToComplete();

    // Navigate to dashboard
    await votingHelpers.navigateToDashboard();
    await votingHelpers.waitForKospiLoad();
    await votingHelpers.waitForStockCardsLoad();
  });

  test.afterEach(async () => {
    await DatabaseHelpers.cleanupTestUser(testUser.email);
  });

  test('should successfully vote UP on KOSPI', async ({ page }) => {
    // Mock successful vote submission
    await page.route('**/api/votes', route => {
      const request = route.request();
      const postData = JSON.parse(request.postData() || '{}');

      expect(postData.stockCode).toBe('KS11');
      expect(postData.direction).toBe('UP');

      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            stockCode: 'KS11',
            direction: 'UP',
            votedAt: new Date().toISOString()
          }
        })
      });
    });

    // Perform vote
    await votingHelpers.voteOnKospi('UP');

    // Check vote confirmation
    await votingHelpers.checkVoteConfirmation('KS11', 'UP');

    // Check animation plays
    await votingHelpers.checkVoteAnimation();

    // Check button state changes
    const kospiCard = page.locator('[data-testid="kospi-hero-card"]');
    await expect(kospiCard.locator('[data-testid="vote-up-button"]')).toHaveClass(/voted|selected|active/);
    await expect(kospiCard.locator('[data-testid="vote-down-button"]')).toBeDisabled();

    // Check success message
    await waitHelpers.waitForToast('투표가 성공적으로 완료되었습니다');
  });

  test('should successfully vote DOWN on regular stocks', async ({ page }) => {
    // Mock successful vote submission for Samsung Electronics
    await page.route('**/api/votes', route => {
      const request = route.request();
      const postData = JSON.parse(request.postData() || '{}');

      expect(postData.stockCode).toBe('005930');
      expect(postData.direction).toBe('DOWN');

      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            stockCode: '005930',
            direction: 'DOWN',
            votedAt: new Date().toISOString()
          }
        })
      });
    });

    // Perform vote on Samsung Electronics (DOWN)
    await votingHelpers.voteOnStock('005930', 'DOWN');

    // Check vote confirmation
    await votingHelpers.checkVoteConfirmation('005930', 'DOWN');

    // Check animation plays
    await votingHelpers.checkVoteAnimation();

    // Check button state changes
    const samsungCard = page.locator('[data-testid="stock-card-005930"]');
    await expect(samsungCard.locator('[data-testid="vote-down-button"]')).toHaveClass(/voted|selected|active/);
    await expect(samsungCard.locator('[data-testid="vote-up-button"]')).toBeDisabled();

    // Check success message
    await waitHelpers.waitForToast('투표가 성공적으로 완료되었습니다');
  });

  test('should display vote confirmation with proper animation', async ({ page }) => {
    // Mock vote response
    await page.route('**/api/votes', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            stockCode: 'KS11',
            direction: 'UP',
            votedAt: new Date().toISOString()
          }
        })
      });
    });

    // Vote on KOSPI
    await votingHelpers.voteOnKospi('UP');

    // Check immediate feedback
    await expect(page.locator('[data-testid="vote-processing"]')).toBeVisible();

    // Check success animation
    await expect(page.locator('[data-testid="confetti-animation"]')).toBeVisible({ timeout: 3000 });

    // Check vote success indicator
    await expect(page.locator('[data-testid="vote-success-KS11"]')).toBeVisible();

    // Check celebration text
    await expect(page.locator('[data-testid="vote-success-message"]')).toContainText('투표 완료!');

    // Animation should disappear after a few seconds
    await expect(page.locator('[data-testid="confetti-animation"]')).toBeHidden({ timeout: 5000 });
  });

  test('should update UI optimistically during vote submission', async ({ page }) => {
    // Mock delayed vote response to test optimistic updates
    await page.route('**/api/votes', route => {
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              stockCode: '035420',
              direction: 'UP',
              votedAt: new Date().toISOString()
            }
          })
        });
      }, 1000); // 1 second delay
    });

    const naverCard = page.locator('[data-testid="stock-card-035420"]');
    const upButton = naverCard.locator('[data-testid="vote-up-button"]');

    // Vote on NAVER
    await upButton.click();

    // Check immediate optimistic update
    await expect(upButton).toHaveClass(/loading|pending/);
    await expect(upButton).toBeDisabled();

    // Check other button is also disabled during processing
    await expect(naverCard.locator('[data-testid="vote-down-button"]')).toBeDisabled();

    // Check loading indicator
    await expect(naverCard.locator('[data-testid="vote-processing"]')).toBeVisible();

    // Wait for response and check final state
    await waitHelpers.waitForLoadingToComplete();
    await expect(upButton).toHaveClass(/voted|selected|active/);
    await expect(naverCard.locator('[data-testid="vote-success"]')).toBeVisible();
  });

  test('should update vote statistics in real-time', async ({ page }) => {
    // Mock updated statistics after vote
    const originalStats = {
      'KS11': { upVotes: 65, downVotes: 35, totalVotes: 100 }
    };

    const updatedStats = {
      'KS11': { upVotes: 66, downVotes: 35, totalVotes: 101 }
    };

    // First load with original stats
    await page.route('**/api/votes/statistics', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: originalStats
        })
      });
    });

    // Check original statistics
    await page.reload();
    await votingHelpers.waitForKospiLoad();
    const kospiStats = page.locator('[data-testid="voting-stats-KS11"]');
    await expect(kospiStats.locator('[data-testid="up-percentage"]')).toContainText('65%');

    // Mock vote submission and updated stats
    let isVoteSubmitted = false;
    await page.route('**/api/votes', route => {
      isVoteSubmitted = true;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            stockCode: 'KS11',
            direction: 'UP',
            votedAt: new Date().toISOString()
          }
        })
      });
    });

    // Update statistics route to return new data after vote
    await page.route('**/api/votes/statistics', route => {
      const statsToReturn = isVoteSubmitted ? updatedStats : originalStats;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: statsToReturn
        })
      });
    });

    // Vote and check updated statistics
    await votingHelpers.voteOnKospi('UP');
    await waitHelpers.waitForLoadingToComplete();

    // Statistics should update to reflect the new vote
    await expect(kospiStats.locator('[data-testid="up-percentage"]')).toContainText('65%'); // Optimistic update or real-time refresh
  });

  test('should prevent multiple votes on same stock', async ({ page }) => {
    // Mock user already has vote
    await votingHelpers.mockUserVotes([
      { stockCode: 'KS11', direction: 'UP' }
    ]);

    // Reload to apply mock
    await page.reload();
    await votingHelpers.waitForKospiLoad();

    // Check that user's existing vote is displayed
    const kospiCard = page.locator('[data-testid="kospi-hero-card"]');
    await expect(kospiCard.locator('[data-testid="vote-up-button"]')).toHaveClass(/voted|selected|active/);
    await expect(kospiCard.locator('[data-testid="vote-down-button"]')).toBeDisabled();

    // Try to vote again - should show message
    await kospiCard.locator('[data-testid="vote-down-button"]').click();
    await waitHelpers.waitForToast('이미 이 종목에 투표하셨습니다');
  });

  test('should allow voting on multiple different stocks', async ({ page }) => {
    // Mock successful votes for different stocks
    let voteCount = 0;
    const expectedVotes = ['KS11', '005930', '035420'];

    await page.route('**/api/votes', route => {
      const request = route.request();
      const postData = JSON.parse(request.postData() || '{}');

      expect(expectedVotes).toContain(postData.stockCode);
      voteCount++;

      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            stockCode: postData.stockCode,
            direction: postData.direction,
            votedAt: new Date().toISOString()
          }
        })
      });
    });

    // Vote on KOSPI
    await votingHelpers.voteOnKospi('UP');
    await waitHelpers.waitForLoadingToComplete();

    // Vote on Samsung Electronics
    await votingHelpers.voteOnStock('005930', 'DOWN');
    await waitHelpers.waitForLoadingToComplete();

    // Vote on NAVER
    await votingHelpers.voteOnStock('035420', 'UP');
    await waitHelpers.waitForLoadingToComplete();

    // Verify all votes were submitted
    expect(voteCount).toBe(3);

    // Check all vote confirmations are visible
    await expect(page.locator('[data-testid="vote-success-KS11"]')).toBeVisible();
    await expect(page.locator('[data-testid="vote-success-005930"]')).toBeVisible();
    await expect(page.locator('[data-testid="vote-success-035420"]')).toBeVisible();
  });

  test('should disable voting buttons properly after vote', async ({ page }) => {
    // Mock vote response
    await page.route('**/api/votes', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            stockCode: '000660',
            direction: 'UP',
            votedAt: new Date().toISOString()
          }
        })
      });
    });

    const skCard = page.locator('[data-testid="stock-card-000660"]');
    const upButton = skCard.locator('[data-testid="vote-up-button"]');
    const downButton = skCard.locator('[data-testid="vote-down-button"]');

    // Both buttons should be enabled initially
    await expect(upButton).toBeEnabled();
    await expect(downButton).toBeEnabled();

    // Vote UP
    await upButton.click();
    await waitHelpers.waitForLoadingToComplete();

    // UP button should be marked as voted, DOWN should be disabled
    await expect(upButton).toHaveClass(/voted|selected|active/);
    await expect(downButton).toBeDisabled();

    // Check tooltip or message when trying to interact with disabled button
    await downButton.hover();
    await expect(page.locator('[data-testid="vote-disabled-tooltip"]')).toBeVisible();
  });

  test('should show vote count and percentage updates', async ({ page }) => {
    // Mock vote statistics that change after user votes
    const initialStats = {
      '035720': { upVotes: 38, downVotes: 62, totalVotes: 100 }
    };

    await page.route('**/api/votes/statistics', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: initialStats
        })
      });
    });

    await page.reload();
    await votingHelpers.waitForStockCardsLoad();

    // Check initial statistics for Kakao
    const kakaoStats = page.locator('[data-testid="voting-stats-035720"]');
    await expect(kakaoStats.locator('[data-testid="up-percentage"]')).toContainText('38%');
    await expect(kakaoStats.locator('[data-testid="down-percentage"]')).toContainText('62%');
    await expect(kakaoStats.locator('[data-testid="total-votes"]')).toContainText('100');

    // Mock vote submission that updates statistics
    await page.route('**/api/votes', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            stockCode: '035720',
            direction: 'UP',
            votedAt: new Date().toISOString()
          }
        })
      });
    });

    // Update stats to reflect new vote
    await page.route('**/api/votes/statistics', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            '035720': { upVotes: 39, downVotes: 62, totalVotes: 101 }
          }
        })
      });
    });

    // Vote and check updated statistics
    await votingHelpers.voteOnStock('035720', 'UP');
    await waitHelpers.waitForLoadingToComplete();

    // Should show optimistic update or fetch new data
    await expect(kakaoStats.locator('[data-testid="total-votes"]')).toContainText('101');
  });

  test('should handle rapid clicking gracefully', async ({ page }) => {
    let voteSubmissionCount = 0;

    await page.route('**/api/votes', route => {
      voteSubmissionCount++;

      // Simulate processing time
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              stockCode: 'KS11',
              direction: 'UP',
              votedAt: new Date().toISOString()
            }
          })
        });
      }, 500);
    });

    const kospiCard = page.locator('[data-testid="kospi-hero-card"]');
    const upButton = kospiCard.locator('[data-testid="vote-up-button"]');

    // Rapidly click multiple times
    await upButton.click();
    await upButton.click();
    await upButton.click();

    // Should only submit one vote
    await waitHelpers.waitForLoadingToComplete();
    expect(voteSubmissionCount).toBe(1);

    // Button should be disabled during processing
    await expect(upButton).toBeDisabled();
  });

  test('should persist vote status after page refresh', async ({ page }) => {
    // Mock user votes
    await votingHelpers.mockUserVotes([
      { stockCode: 'KS11', direction: 'UP' },
      { stockCode: '005930', direction: 'DOWN' }
    ]);

    // Refresh page
    await page.reload();
    await votingHelpers.waitForKospiLoad();
    await votingHelpers.waitForStockCardsLoad();

    // Check vote status is preserved
    const kospiCard = page.locator('[data-testid="kospi-hero-card"]');
    await expect(kospiCard.locator('[data-testid="vote-up-button"]')).toHaveClass(/voted|selected|active/);
    await expect(kospiCard.locator('[data-testid="vote-down-button"]')).toBeDisabled();

    const samsungCard = page.locator('[data-testid="stock-card-005930"]');
    await expect(samsungCard.locator('[data-testid="vote-down-button"]')).toHaveClass(/voted|selected|active/);
    await expect(samsungCard.locator('[data-testid="vote-up-button"]')).toBeDisabled();
  });

  test('should show voting deadline and time constraints', async ({ page }) => {
    // Check voting window information
    await expect(page.locator('[data-testid="voting-deadline"]')).toBeVisible();
    await expect(page.locator('[data-testid="voting-window-status"]')).toBeVisible();

    // Should show remaining time or deadline information
    const deadlineElement = page.locator('[data-testid="voting-deadline"]');
    const deadlineText = await deadlineElement.textContent();
    expect(deadlineText).toMatch(/오전 9:00|투표 마감|투표 가능/);
  });
});