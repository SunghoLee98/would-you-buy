import { test, expect } from '@playwright/test';
import {
  TestDataGenerator,
  AuthHelpers,
  WaitHelpers,
  VotingHelpers,
  NetworkHelpers,
  DatabaseHelpers
} from '../utils/test-helpers';

test.describe('Voting Dashboard - Real-time Features & WebSocket', () => {
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

    // Register and login test user
    await authHelpers.register({
      email: testUser.email,
      username: testUser.username,
      password: testUser.password,
      acceptTerms: true
    });

    await authHelpers.login(testUser.email, testUser.password);
    await waitHelpers.waitForLoadingToComplete();

    // Mock stock data
    await votingHelpers.mockStockData();
    await votingHelpers.mockVoteStatistics();
  });

  test.afterEach(async () => {
    await DatabaseHelpers.cleanupTestUser(testUser.email);
  });

  test('should establish WebSocket connection on dashboard load', async ({ page }) => {
    // Monitor WebSocket connections
    const wsConnections: any[] = [];
    page.on('websocket', ws => {
      wsConnections.push(ws);
      console.log(`WebSocket connection established: ${ws.url()}`);
    });

    await votingHelpers.navigateToDashboard();
    await votingHelpers.waitForKospiLoad();

    // Wait for WebSocket connection
    await votingHelpers.waitForWebSocketConnection();

    // Verify WebSocket connection was established
    expect(wsConnections.length).toBeGreaterThan(0);

    // Check WebSocket URL is correct
    const wsUrl = wsConnections[0].url();
    expect(wsUrl).toContain('ws://');
    expect(wsUrl).toMatch(/voting|realtime|updates/);

    // Check connection status indicator
    await expect(page.locator('[data-testid="realtime-status"]')).toHaveClass(/connected|online/);
  });

  test('should receive real-time voting statistics updates', async ({ page }) => {
    await votingHelpers.navigateToDashboard();
    await votingHelpers.waitForKospiLoad();
    await votingHelpers.waitForStockCardsLoad();

    // Check initial statistics
    const kospiStats = page.locator('[data-testid="voting-stats-KS11"]');
    await expect(kospiStats.locator('[data-testid="up-percentage"]')).toContainText('65%');

    // Simulate WebSocket message with updated statistics
    await page.evaluate(() => {
      // Simulate receiving WebSocket message
      const event = new CustomEvent('websocket-message', {
        detail: {
          type: 'VOTE_STATISTICS_UPDATE',
          data: {
            'KS11': { upVotes: 70, downVotes: 35, totalVotes: 105 },
            '005930': { upVotes: 50, downVotes: 55, totalVotes: 105 }
          }
        }
      });
      window.dispatchEvent(event);
    });

    // Check that statistics updated in real-time
    await expect(kospiStats.locator('[data-testid="up-percentage"]')).toContainText('67%', { timeout: 5000 });
    await expect(kospiStats.locator('[data-testid="total-votes"]')).toContainText('105');

    // Check Samsung statistics also updated
    const samsungStats = page.locator('[data-testid="voting-stats-005930"]');
    await expect(samsungStats.locator('[data-testid="up-percentage"]')).toContainText('48%');
  });

  test('should update voting statistics when other users vote', async ({ page }) => {
    await votingHelpers.navigateToDashboard();
    await votingHelpers.waitForKospiLoad();
    await votingHelpers.waitForStockCardsLoad();

    // Initial state
    const naverStats = page.locator('[data-testid="voting-stats-035420"]');
    await expect(naverStats.locator('[data-testid="up-percentage"]')).toContainText('58%');
    await expect(naverStats.locator('[data-testid="total-votes"]')).toContainText('100');

    // Simulate another user voting (WebSocket message)
    await page.evaluate(() => {
      const event = new CustomEvent('websocket-message', {
        detail: {
          type: 'NEW_VOTE',
          data: {
            stockCode: '035420',
            direction: 'UP',
            newStatistics: {
              upVotes: 59,
              downVotes: 42,
              totalVotes: 101
            }
          }
        }
      });
      window.dispatchEvent(event);
    });

    // Should update immediately
    await expect(naverStats.locator('[data-testid="up-percentage"]')).toContainText('58%', { timeout: 3000 });
    await expect(naverStats.locator('[data-testid="total-votes"]')).toContainText('101');

    // Should show live update animation
    await expect(naverStats.locator('[data-testid="live-update-indicator"]')).toBeVisible({ timeout: 2000 });
    await expect(naverStats.locator('[data-testid="live-update-indicator"]')).toBeHidden({ timeout: 5000 });
  });

  test('should handle WebSocket disconnection and reconnection', async ({ page }) => {
    await votingHelpers.navigateToDashboard();
    await votingHelpers.waitForKospiLoad();

    // Initial connection status
    await expect(page.locator('[data-testid="realtime-status"]')).toHaveClass(/connected/);

    // Simulate WebSocket disconnection
    await page.evaluate(() => {
      const event = new CustomEvent('websocket-disconnect', {
        detail: { reason: 'network-error' }
      });
      window.dispatchEvent(event);
    });

    // Should show disconnected state
    await expect(page.locator('[data-testid="realtime-status"]')).toHaveClass(/disconnected|offline/);
    await expect(page.locator('[data-testid="connection-lost-banner"]')).toBeVisible();
    await expect(page.locator('[data-testid="connection-lost-banner"]')).toContainText('실시간 연결이 끊어졌습니다');

    // Should show retry indicator
    await expect(page.locator('[data-testid="reconnecting-indicator"]')).toBeVisible();

    // Simulate reconnection
    await page.evaluate(() => {
      const event = new CustomEvent('websocket-reconnect', {
        detail: { success: true }
      });
      window.dispatchEvent(event);
    });

    // Should restore connected state
    await expect(page.locator('[data-testid="realtime-status"]')).toHaveClass(/connected/);
    await expect(page.locator('[data-testid="connection-lost-banner"]')).toBeHidden();

    // Should show reconnection success message
    await waitHelpers.waitForToast('실시간 연결이 복구되었습니다');
  });

  test('should handle multiple users voting simultaneously', async ({ page }) => {
    await votingHelpers.navigateToDashboard();
    await votingHelpers.waitForKospiLoad();
    await votingHelpers.waitForStockCardsLoad();

    // Simulate rapid voting activity from multiple users
    const voteUpdates = [
      { stockCode: 'KS11', direction: 'UP', upVotes: 66, downVotes: 35, totalVotes: 101 },
      { stockCode: 'KS11', direction: 'UP', upVotes: 67, downVotes: 35, totalVotes: 102 },
      { stockCode: '005930', direction: 'DOWN', upVotes: 45, downVotes: 56, totalVotes: 101 },
      { stockCode: 'KS11', direction: 'DOWN', upVotes: 67, downVotes: 36, totalVotes: 103 }
    ];

    // Send multiple rapid updates
    for (const [index, update] of voteUpdates.entries()) {
      setTimeout(() => {
        page.evaluate((updateData) => {
          const event = new CustomEvent('websocket-message', {
            detail: {
              type: 'NEW_VOTE',
              data: {
                stockCode: updateData.stockCode,
                direction: updateData.direction,
                newStatistics: {
                  upVotes: updateData.upVotes,
                  downVotes: updateData.downVotes,
                  totalVotes: updateData.totalVotes
                }
              }
            }
          });
          window.dispatchEvent(event);
        }, update);
      }, index * 500); // Spread updates over time
    }

    // Final state should reflect all updates
    const kospiStats = page.locator('[data-testid="voting-stats-KS11"]');
    await expect(kospiStats.locator('[data-testid="total-votes"]')).toContainText('103', { timeout: 10000 });

    // Should handle rapid updates without UI glitches
    await expect(kospiStats.locator('[data-testid="up-percentage"]')).toContainText('65%');
  });

  test('should show live vote count animations', async ({ page }) => {
    await votingHelpers.navigateToDashboard();
    await votingHelpers.waitForKospiLoad();
    await votingHelpers.waitForStockCardsLoad();

    const kakaoStats = page.locator('[data-testid="voting-stats-035720"]');

    // Initial state
    await expect(kakaoStats.locator('[data-testid="total-votes"]')).toContainText('100');

    // Simulate vote update
    await page.evaluate(() => {
      const event = new CustomEvent('websocket-message', {
        detail: {
          type: 'NEW_VOTE',
          data: {
            stockCode: '035720',
            direction: 'UP',
            newStatistics: {
              upVotes: 39,
              downVotes: 62,
              totalVotes: 101
            }
          }
        }
      });
      window.dispatchEvent(event);
    });

    // Should show animation for vote count increase
    await expect(kakaoStats.locator('[data-testid="vote-count-animation"]')).toBeVisible({ timeout: 2000 });
    await expect(kakaoStats.locator('[data-testid="total-votes"]')).toContainText('101');

    // Animation should disappear
    await expect(kakaoStats.locator('[data-testid="vote-count-animation"]')).toBeHidden({ timeout: 3000 });
  });

  test('should handle WebSocket message validation', async ({ page }) => {
    await votingHelpers.navigateToDashboard();
    await votingHelpers.waitForKospiLoad();

    // Send invalid WebSocket message
    await page.evaluate(() => {
      const event = new CustomEvent('websocket-message', {
        detail: {
          type: 'INVALID_MESSAGE_TYPE',
          data: { malformed: 'data' }
        }
      });
      window.dispatchEvent(event);
    });

    // Should handle gracefully without errors
    await networkHelpers.checkNoConsoleErrors();

    // Send message with invalid data structure
    await page.evaluate(() => {
      const event = new CustomEvent('websocket-message', {
        detail: {
          type: 'NEW_VOTE',
          data: {
            // Missing required fields
            stockCode: null,
            direction: 'INVALID_DIRECTION'
          }
        }
      });
      window.dispatchEvent(event);
    });

    // Should not crash or show incorrect data
    const kospiStats = page.locator('[data-testid="voting-stats-KS11"]');
    await expect(kospiStats.locator('[data-testid="up-percentage"]')).toContainText('65%'); // Should retain original data
  });

  test('should maintain WebSocket connection across page interactions', async ({ page }) => {
    await votingHelpers.navigateToDashboard();
    await votingHelpers.waitForKospiLoad();

    // Check initial connection
    await expect(page.locator('[data-testid="realtime-status"]')).toHaveClass(/connected/);

    // Interact with the page (scroll, click, etc.)
    await page.evaluate(() => window.scrollTo(0, 100));
    await page.locator('[data-testid="stock-card-005930"]').hover();

    // Wait a moment
    await page.waitForTimeout(2000);

    // Connection should still be active
    await expect(page.locator('[data-testid="realtime-status"]')).toHaveClass(/connected/);

    // Should still receive updates
    await page.evaluate(() => {
      const event = new CustomEvent('websocket-message', {
        detail: {
          type: 'NEW_VOTE',
          data: {
            stockCode: '005930',
            direction: 'UP',
            newStatistics: {
              upVotes: 46,
              downVotes: 55,
              totalVotes: 101
            }
          }
        }
      });
      window.dispatchEvent(event);
    });

    const samsungStats = page.locator('[data-testid="voting-stats-005930"]');
    await expect(samsungStats.locator('[data-testid="total-votes"]')).toContainText('101');
  });

  test('should handle browser tab visibility changes', async ({ page }) => {
    await votingHelpers.navigateToDashboard();
    await votingHelpers.waitForKospiLoad();

    // Simulate tab becoming hidden
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {
        writable: true,
        value: 'hidden'
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Connection should be maintained but may be throttled
    await expect(page.locator('[data-testid="realtime-status"]')).toHaveClass(/connected|throttled/);

    // Simulate tab becoming visible again
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {
        writable: true,
        value: 'visible'
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Should restore full connection
    await expect(page.locator('[data-testid="realtime-status"]')).toHaveClass(/connected/);

    // Should sync any missed updates
    await expect(page.locator('[data-testid="syncing-indicator"]')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('[data-testid="syncing-indicator"]')).toBeHidden({ timeout: 5000 });
  });

  test('should handle real-time market status updates', async ({ page }) => {
    await votingHelpers.navigateToDashboard();
    await votingHelpers.waitForKospiLoad();

    // Initial market status
    await expect(page.locator('[data-testid="market-status"]')).toBeVisible();

    // Simulate market status change
    await page.evaluate(() => {
      const event = new CustomEvent('websocket-message', {
        detail: {
          type: 'MARKET_STATUS_UPDATE',
          data: {
            status: 'CLOSED',
            nextOpen: '2024-01-02T09:00:00Z',
            votingWindowOpen: false
          }
        }
      });
      window.dispatchEvent(event);
    });

    // Should update market status
    await expect(page.locator('[data-testid="market-status"]')).toContainText('장 마감');
    await expect(page.locator('[data-testid="voting-window-closed"]')).toBeVisible();

    // Voting buttons should be disabled
    const kospiCard = page.locator('[data-testid="kospi-hero-card"]');
    await expect(kospiCard.locator('[data-testid="vote-up-button"]')).toBeDisabled();
    await expect(kospiCard.locator('[data-testid="vote-down-button"]')).toBeDisabled();
  });

  test('should batch multiple rapid updates for performance', async ({ page }) => {
    await votingHelpers.navigateToDashboard();
    await votingHelpers.waitForKospiLoad();
    await votingHelpers.waitForStockCardsLoad();

    const kospiStats = page.locator('[data-testid="voting-stats-KS11"]');

    // Send many rapid updates
    const updates = Array.from({ length: 10 }, (_, i) => ({
      upVotes: 65 + i,
      downVotes: 35,
      totalVotes: 100 + i
    }));

    // Send all updates rapidly
    for (const update of updates) {
      await page.evaluate((updateData) => {
        const event = new CustomEvent('websocket-message', {
          detail: {
            type: 'NEW_VOTE',
            data: {
              stockCode: 'KS11',
              direction: 'UP',
              newStatistics: updateData
            }
          }
        });
        window.dispatchEvent(event);
      }, update);
    }

    // Should end up with final state
    await expect(kospiStats.locator('[data-testid="total-votes"]')).toContainText('109', { timeout: 5000 });

    // Should not cause performance issues
    await networkHelpers.checkNoConsoleErrors();
  });

  test('should show connection quality indicator', async ({ page }) => {
    await votingHelpers.navigateToDashboard();
    await votingHelpers.waitForKospiLoad();

    // Good connection
    await expect(page.locator('[data-testid="connection-quality"]')).toHaveClass(/good|excellent/);

    // Simulate poor connection
    await page.evaluate(() => {
      const event = new CustomEvent('websocket-latency', {
        detail: { latency: 2000 } // High latency
      });
      window.dispatchEvent(event);
    });

    // Should show poor connection indicator
    await expect(page.locator('[data-testid="connection-quality"]')).toHaveClass(/poor|slow/);

    // Should show warning about delayed updates
    await expect(page.locator('[data-testid="slow-connection-warning"]')).toBeVisible();
    await expect(page.locator('[data-testid="slow-connection-warning"]')).toContainText('연결 상태가 불안정합니다');
  });
});