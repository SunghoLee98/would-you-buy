import { test, expect } from '@playwright/test';
import { ApiValidator } from '../utils/api-validators';
import { TestDataGenerator, AuthHelpers, VotingHelpers } from '../utils/test-helpers';

/**
 * Vote Submission E2E Tests
 *
 * Tests vote submission and modification with 100% API specification compliance:
 * - POST /votes (vote submission)
 * - PUT /votes/{voteId} (vote modification)
 * - Complete validation of request/response formats
 * - Error handling for all edge cases
 */

test.describe('Vote Submission and Modification Tests', () => {
  let apiValidator: ApiValidator;
  let authHelpers: AuthHelpers;
  let votingHelpers: VotingHelpers;
  let authToken: string;
  let userData: ReturnType<typeof TestDataGenerator.generateUser>;

  test.beforeEach(async ({ page }) => {
    apiValidator = new ApiValidator(page);
    authHelpers = new AuthHelpers(page);
    votingHelpers = new VotingHelpers(page);

    // Setup authenticated user
    userData = TestDataGenerator.generateUser();

    await apiValidator.makeApiRequest('POST', '/auth/register', {
      data: {
        email: userData.email,
        password: userData.password,
        username: userData.username,
        termsAccepted: true
      },
      expectedStatus: 201
    });

    const { body: loginBody } = await apiValidator.makeApiRequest('POST', '/auth/login', {
      data: {
        email: userData.email,
        password: userData.password
      }
    });

    authToken = loginBody.data.accessToken;
  });

  test.describe('Vote Submission - POST /votes', () => {
    test('Should successfully submit vote with all required fields', async () => {
      const voteRequest = {
        stockCode: '005930',
        voteType: 'UP' as const,
        confidenceLevel: 4,
        predictionReason: '실적 개선 기대로 상승 예상'
      };

      const { body } = await apiValidator.makeApiRequest(
        'POST',
        '/votes',
        {
          token: authToken,
          data: voteRequest,
          expectedStatus: 201
        }
      );

      expect(body.success).toBe(true);
      expect(body.message).toBe('투표가 성공적으로 등록되었습니다');

      // Validate response structure
      expect(body.data).toHaveProperty('success');
      expect(body.data).toHaveProperty('voteId');
      expect(body.data).toHaveProperty('message');
      expect(body.data).toHaveProperty('vote');

      expect(body.data.success).toBe(true);
      expect(body.data.message).toBe('투표가 등록되었습니다');

      // Validate UserVote object
      const userVote = ApiValidator.validateUserVote(body.data.vote);

      expect(userVote.stockCode).toBe(voteRequest.stockCode);
      expect(userVote.voteType).toBe(voteRequest.voteType);
      expect(userVote.voteTypeText).toBe('상승');
      expect(userVote.confidenceLevel).toBe(voteRequest.confidenceLevel);
      expect(userVote.predictionReason).toBe(voteRequest.predictionReason);
      expect(userVote.canChangeVote).toBe(true);
      expect(userVote.isResultCalculated).toBe(false);
      expect(userVote.isCorrect).toBeNull();
      expect(userVote.pointsEarned).toBeNull();

      // Validate timestamps
      const now = new Date();
      const createdAt = new Date(userVote.createdAt);
      const updatedAt = new Date(userVote.updatedAt);

      expect(createdAt.getTime()).toBeLessThanOrEqual(now.getTime());
      expect(updatedAt.getTime()).toBeLessThanOrEqual(now.getTime());
      expect(createdAt.getTime()).toBeLessThanOrEqual(updatedAt.getTime());

      // Validate voting date is tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const expectedDate = tomorrow.toISOString().split('T')[0];
      expect(userVote.votingDate).toBe(expectedDate);
    });

    test('Should submit vote with minimal required fields only', async () => {
      const voteRequest = {
        stockCode: 'KOSPI',
        voteType: 'DOWN' as const
      };

      const { body } = await apiValidator.makeApiRequest(
        'POST',
        '/votes',
        {
          token: authToken,
          data: voteRequest,
          expectedStatus: 201
        }
      );

      expect(body.success).toBe(true);
      const userVote = ApiValidator.validateUserVote(body.data.vote);

      expect(userVote.stockCode).toBe('KOSPI');
      expect(userVote.voteType).toBe('DOWN');
      expect(userVote.voteTypeText).toBe('하락');
      expect(userVote.confidenceLevel).toBeNull();
      expect(userVote.predictionReason).toBeNull();
    });

    test('Should validate stock name mapping for regular stocks', async () => {
      const stockTests = [
        { code: '005930', expectedName: '삼성전자' },
        { code: '000660', expectedName: 'SK하이닉스' },
        { code: '035420', expectedName: 'NAVER' },
        { code: '035720', expectedName: '카카오' }
      ];

      for (const stockTest of stockTests) {
        const { body } = await apiValidator.makeApiRequest(
          'POST',
          '/votes',
          {
            token: authToken,
            data: {
              stockCode: stockTest.code,
              voteType: 'UP' as const
            },
            expectedStatus: 201
          }
        );

        expect(body.success).toBe(true);
        const userVote = ApiValidator.validateUserVote(body.data.vote);
        expect(userVote.stockName).toBe(stockTest.expectedName);
      }
    });

    test('Should validate confidence level range', async () => {
      const confidenceLevels = [1, 2, 3, 4, 5];

      for (const level of confidenceLevels) {
        const { body } = await apiValidator.makeApiRequest(
          'POST',
          '/votes',
          {
            token: authToken,
            data: {
              stockCode: `00${level.toString().padStart(4, '0')}0`, // Different stock for each test
              voteType: 'UP' as const,
              confidenceLevel: level
            },
            expectedStatus: 201
          }
        );

        expect(body.success).toBe(true);
        const userVote = ApiValidator.validateUserVote(body.data.vote);
        expect(userVote.confidenceLevel).toBe(level);
      }
    });

    test('Should validate prediction reason length limit', async () => {
      const validReason = 'A'.repeat(200); // Exactly 200 characters
      const tooLongReason = 'A'.repeat(201); // 201 characters

      // Valid length should succeed
      const { body: validBody } = await apiValidator.makeApiRequest(
        'POST',
        '/votes',
        {
          token: authToken,
          data: {
            stockCode: '005930',
            voteType: 'UP' as const,
            predictionReason: validReason
          },
          expectedStatus: 201
        }
      );

      expect(validBody.success).toBe(true);
      const userVote = ApiValidator.validateUserVote(validBody.data.vote);
      expect(userVote.predictionReason).toBe(validReason);
      expect(userVote.predictionReason!.length).toBe(200);

      // Too long should fail
      const { body: invalidBody } = await apiValidator.makeApiRequest(
        'POST',
        '/votes',
        {
          token: authToken,
          data: {
            stockCode: '000660',
            voteType: 'UP' as const,
            predictionReason: tooLongReason
          },
          expectedStatus: 400
        }
      );

      expect(invalidBody.success).toBe(false);
      ApiValidator.validateErrorResponse(invalidBody, 'VALIDATION_ERROR');
    });
  });

  test.describe('Vote Submission Validation Errors', () => {
    test('Should reject invalid stock codes', async () => {
      const invalidStockCodes = [
        '', // Empty
        '123', // Too short
        '1234567', // Too long
        'INVALID', // Non-numeric (except KOSPI)
        '999999' // Non-existent stock
      ];

      for (const invalidCode of invalidStockCodes) {
        const { body } = await apiValidator.makeApiRequest(
          'POST',
          '/votes',
          {
            token: authToken,
            data: {
              stockCode: invalidCode,
              voteType: 'UP' as const
            },
            expectedStatus: 400
          }
        );

        expect(body.success).toBe(false);
        ApiValidator.validateErrorResponse(body, 'VALIDATION_ERROR');
      }
    });

    test('Should reject invalid vote types', async () => {
      const invalidVoteTypes = ['up', 'down', 'NEUTRAL', 'BUY', 'SELL', '', null];

      for (const invalidType of invalidVoteTypes) {
        const { body } = await apiValidator.makeApiRequest(
          'POST',
          '/votes',
          {
            token: authToken,
            data: {
              stockCode: '005930',
              voteType: invalidType as any
            },
            expectedStatus: 400
          }
        );

        expect(body.success).toBe(false);
        ApiValidator.validateErrorResponse(body, 'VALIDATION_ERROR');
      }
    });

    test('Should reject invalid confidence levels', async () => {
      const invalidLevels = [0, 6, -1, 3.5, 'high', null];

      for (const invalidLevel of invalidLevels) {
        const { body } = await apiValidator.makeApiRequest(
          'POST',
          '/votes',
          {
            token: authToken,
            data: {
              stockCode: '005930',
              voteType: 'UP' as const,
              confidenceLevel: invalidLevel as any
            },
            expectedStatus: 400
          }
        );

        expect(body.success).toBe(false);
        ApiValidator.validateErrorResponse(body, 'VALIDATION_ERROR');
      }
    });

    test('Should require authentication', async () => {
      const { body } = await apiValidator.makeApiRequest(
        'POST',
        '/votes',
        {
          data: {
            stockCode: '005930',
            voteType: 'UP' as const
          },
          expectedStatus: 401
        }
      );

      expect(body.success).toBe(false);
      ApiValidator.validateErrorResponse(body, 'UNAUTHORIZED');
    });

    test('Should reject duplicate votes on same stock', async () => {
      // Submit first vote
      const { body: firstVote } = await apiValidator.makeApiRequest(
        'POST',
        '/votes',
        {
          token: authToken,
          data: {
            stockCode: '005930',
            voteType: 'UP' as const
          },
          expectedStatus: 201
        }
      );

      expect(firstVote.success).toBe(true);

      // Try to submit second vote on same stock
      const { body: secondVote } = await apiValidator.makeApiRequest(
        'POST',
        '/votes',
        {
          token: authToken,
          data: {
            stockCode: '005930',
            voteType: 'DOWN' as const
          },
          expectedStatus: 409
        }
      );

      expect(secondVote.success).toBe(false);
      expect(secondVote.message).toBe('이미 해당 주식에 투표하셨습니다');
      ApiValidator.validateErrorResponse(secondVote, 'ALREADY_VOTED');

      // Error should include specific stock information
      expect(secondVote.errors![0].field).toBe('stockCode');
      expect(secondVote.errors![0].message).toContain('005930');
    });
  });

  test.describe('Vote Modification - PUT /votes/{voteId}', () => {
    test('Should successfully modify existing vote', async () => {
      // Create initial vote
      const { body: createBody } = await apiValidator.makeApiRequest(
        'POST',
        '/votes',
        {
          token: authToken,
          data: {
            stockCode: '005930',
            voteType: 'UP' as const,
            confidenceLevel: 3,
            predictionReason: '초기 예측'
          },
          expectedStatus: 201
        }
      );

      const voteId = createBody.data.voteId;
      const originalVote = createBody.data.vote;

      // Modify the vote
      const updateData = {
        voteType: 'DOWN' as const,
        confidenceLevel: 5,
        predictionReason: '시장 환경 악화로 인한 하락 예상'
      };

      const { body: updateBody } = await apiValidator.makeApiRequest(
        'PUT',
        `/votes/${voteId}`,
        {
          token: authToken,
          data: updateData
        }
      );

      expect(updateBody.success).toBe(true);
      expect(updateBody.message).toBe('투표가 성공적으로 수정되었습니다');

      expect(updateBody.data).toHaveProperty('success');
      expect(updateBody.data).toHaveProperty('message');
      expect(updateBody.data).toHaveProperty('vote');

      expect(updateBody.data.success).toBe(true);
      expect(updateBody.data.message).toBe('투표가 수정되었습니다');

      // Validate updated vote
      const updatedVote = ApiValidator.validateUserVote(updateBody.data.vote);

      expect(updatedVote.id).toBe(voteId);
      expect(updatedVote.stockCode).toBe('005930');
      expect(updatedVote.voteType).toBe('DOWN');
      expect(updatedVote.voteTypeText).toBe('하락');
      expect(updatedVote.confidenceLevel).toBe(5);
      expect(updatedVote.predictionReason).toBe('시장 환경 악화로 인한 하락 예상');

      // Timestamps should be updated
      expect(updatedVote.createdAt).toBe(originalVote.createdAt); // Should remain same
      expect(updatedVote.updatedAt).not.toBe(originalVote.updatedAt); // Should be newer

      const updatedAt = new Date(updatedVote.updatedAt);
      const createdAt = new Date(updatedVote.createdAt);
      expect(updatedAt.getTime()).toBeGreaterThan(createdAt.getTime());

      // Other fields should remain unchanged
      expect(updatedVote.votingDate).toBe(originalVote.votingDate);
      expect(updatedVote.canChangeVote).toBe(true);
      expect(updatedVote.isResultCalculated).toBe(false);
      expect(updatedVote.isCorrect).toBeNull();
      expect(updatedVote.pointsEarned).toBeNull();
    });

    test('Should allow partial updates', async () => {
      // Create initial vote
      const { body: createBody } = await apiValidator.makeApiRequest(
        'POST',
        '/votes',
        {
          token: authToken,
          data: {
            stockCode: 'KOSPI',
            voteType: 'UP' as const,
            confidenceLevel: 4,
            predictionReason: '원래 이유'
          },
          expectedStatus: 201
        }
      );

      const voteId = createBody.data.voteId;
      const originalVote = createBody.data.vote;

      // Update only vote type
      const { body: updateBody } = await apiValidator.makeApiRequest(
        'PUT',
        `/votes/${voteId}`,
        {
          token: authToken,
          data: {
            voteType: 'DOWN' as const
          }
        }
      );

      const updatedVote = ApiValidator.validateUserVote(updateBody.data.vote);

      // Only voteType should change
      expect(updatedVote.voteType).toBe('DOWN');
      expect(updatedVote.voteTypeText).toBe('하락');
      expect(updatedVote.confidenceLevel).toBe(originalVote.confidenceLevel);
      expect(updatedVote.predictionReason).toBe(originalVote.predictionReason);
    });

    test('Should clear optional fields when set to null', async () => {
      // Create vote with all fields
      const { body: createBody } = await apiValidator.makeApiRequest(
        'POST',
        '/votes',
        {
          token: authToken,
          data: {
            stockCode: '000660',
            voteType: 'UP' as const,
            confidenceLevel: 4,
            predictionReason: '메모리 반도체 호조'
          },
          expectedStatus: 201
        }
      );

      const voteId = createBody.data.voteId;

      // Clear optional fields
      const { body: updateBody } = await apiValidator.makeApiRequest(
        'PUT',
        `/votes/${voteId}`,
        {
          token: authToken,
          data: {
            voteType: 'DOWN' as const,
            confidenceLevel: null,
            predictionReason: null
          }
        }
      );

      const updatedVote = ApiValidator.validateUserVote(updateBody.data.vote);

      expect(updatedVote.voteType).toBe('DOWN');
      expect(updatedVote.confidenceLevel).toBeNull();
      expect(updatedVote.predictionReason).toBeNull();
    });
  });

  test.describe('Vote Modification Validation Errors', () => {
    let voteId: string;

    test.beforeEach(async () => {
      // Create a vote to modify in each test
      const { body: createBody } = await apiValidator.makeApiRequest(
        'POST',
        '/votes',
        {
          token: authToken,
          data: {
            stockCode: '035420',
            voteType: 'UP' as const,
            confidenceLevel: 3
          },
          expectedStatus: 201
        }
      );

      voteId = createBody.data.voteId;
    });

    test('Should reject invalid vote ID format', async () => {
      const invalidIds = [
        'invalid-uuid',
        '12345',
        'not-a-uuid',
        ''
      ];

      for (const invalidId of invalidIds) {
        const { body } = await apiValidator.makeApiRequest(
          'PUT',
          `/votes/${invalidId}`,
          {
            token: authToken,
            data: {
              voteType: 'DOWN' as const
            },
            expectedStatus: 400
          }
        );

        expect(body.success).toBe(false);
        ApiValidator.validateErrorResponse(body, 'VALIDATION_ERROR');
      }
    });

    test('Should reject non-existent vote ID', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000';

      const { body } = await apiValidator.makeApiRequest(
        'PUT',
        `/votes/${nonExistentId}`,
        {
          token: authToken,
          data: {
            voteType: 'DOWN' as const
          },
          expectedStatus: 404
        }
      );

      expect(body.success).toBe(false);
      ApiValidator.validateErrorResponse(body, 'NOT_FOUND');
    });

    test('Should reject modification by different user', async () => {
      // Create second user
      const userData2 = TestDataGenerator.generateUser();

      await apiValidator.makeApiRequest('POST', '/auth/register', {
        data: {
          email: userData2.email,
          password: userData2.password,
          username: userData2.username,
          termsAccepted: true
        },
        expectedStatus: 201
      });

      const { body: loginBody2 } = await apiValidator.makeApiRequest('POST', '/auth/login', {
        data: {
          email: userData2.email,
          password: userData2.password
        }
      });

      const authToken2 = loginBody2.data.accessToken;

      // Try to modify vote created by first user
      const { body } = await apiValidator.makeApiRequest(
        'PUT',
        `/votes/${voteId}`,
        {
          token: authToken2,
          data: {
            voteType: 'DOWN' as const
          },
          expectedStatus: 403
        }
      );

      expect(body.success).toBe(false);
      ApiValidator.validateErrorResponse(body, 'FORBIDDEN');
    });

    test('Should require authentication for modification', async () => {
      const { body } = await apiValidator.makeApiRequest(
        'PUT',
        `/votes/${voteId}`,
        {
          data: {
            voteType: 'DOWN' as const
          },
          expectedStatus: 401
        }
      );

      expect(body.success).toBe(false);
      ApiValidator.validateErrorResponse(body, 'UNAUTHORIZED');
    });

    test('Should validate modification data same as creation', async () => {
      // Test invalid vote type
      const { body: invalidVoteType } = await apiValidator.makeApiRequest(
        'PUT',
        `/votes/${voteId}`,
        {
          token: authToken,
          data: {
            voteType: 'INVALID' as any
          },
          expectedStatus: 400
        }
      );

      expect(invalidVoteType.success).toBe(false);
      ApiValidator.validateErrorResponse(invalidVoteType, 'VALIDATION_ERROR');

      // Test invalid confidence level
      const { body: invalidConfidence } = await apiValidator.makeApiRequest(
        'PUT',
        `/votes/${voteId}`,
        {
          token: authToken,
          data: {
            voteType: 'DOWN' as const,
            confidenceLevel: 10
          },
          expectedStatus: 400
        }
      );

      expect(invalidConfidence.success).toBe(false);
      ApiValidator.validateErrorResponse(invalidConfidence, 'VALIDATION_ERROR');

      // Test too long prediction reason
      const { body: longReason } = await apiValidator.makeApiRequest(
        'PUT',
        `/votes/${voteId}`,
        {
          token: authToken,
          data: {
            voteType: 'DOWN' as const,
            predictionReason: 'A'.repeat(201)
          },
          expectedStatus: 400
        }
      );

      expect(longReason.success).toBe(false);
      ApiValidator.validateErrorResponse(longReason, 'VALIDATION_ERROR');
    });
  });

  test.describe('Frontend Vote Submission Integration', () => {
    test('Vote submission through UI should call correct API', async ({ page }) => {
      // Login through UI
      await authHelpers.login(userData.email, userData.password);

      // Navigate to dashboard
      await votingHelpers.navigateToDashboard();
      await votingHelpers.waitForKospiLoad();

      // Set up API request interception
      let apiCallMade = false;
      let requestData: any = null;

      await page.route('**/api/v1/votes', async (route) => {
        if (route.request().method() === 'POST') {
          apiCallMade = true;
          requestData = await route.request().postDataJSON();

          // Let the real API handle the request
          route.continue();
        } else {
          route.continue();
        }
      });

      // Vote through UI
      await votingHelpers.voteOnKospi('UP');

      // Wait for API call
      await page.waitForTimeout(1000);

      // Verify API was called with correct data
      expect(apiCallMade).toBe(true);
      expect(requestData).toHaveProperty('stockCode', 'KOSPI');
      expect(requestData).toHaveProperty('voteType', 'UP');

      // Verify UI shows success confirmation
      await votingHelpers.checkVoteConfirmation('KOSPI', 'UP');
    });

    test('Vote modification through UI should call correct API', async ({ page }) => {
      // Login and vote first
      await authHelpers.login(userData.email, userData.password);
      await votingHelpers.navigateToDashboard();
      await votingHelpers.waitForKospiLoad();

      await votingHelpers.voteOnKospi('UP');
      await votingHelpers.checkVoteConfirmation('KOSPI', 'UP');

      // Set up API request interception for modification
      let modifyApiCalled = false;
      let voteId: string = '';

      await page.route('**/api/v1/votes/**', async (route) => {
        if (route.request().method() === 'PUT') {
          modifyApiCalled = true;
          const url = route.request().url();
          voteId = url.split('/').pop() || '';

          route.continue();
        } else {
          route.continue();
        }
      });

      // Change vote through UI
      const kospiCard = page.locator('[data-testid="kospi-hero-card"]');
      const downButton = kospiCard.locator('[data-testid="vote-down-button"]');
      await downButton.click();

      // Wait for API call
      await page.waitForTimeout(1000);

      // Verify modification API was called
      expect(modifyApiCalled).toBe(true);
      expect(voteId).toBeTruthy();
      expect(voteId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

      // Verify UI shows updated vote
      await votingHelpers.checkVoteConfirmation('KOSPI', 'DOWN');
    });
  });
});