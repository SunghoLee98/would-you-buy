import { test, expect } from '@playwright/test';
import { ApiValidator } from '../utils/api-validators';
import { TestDataGenerator } from '../utils/test-helpers';

/**
 * API Contract Tests - Standard Response Format
 *
 * Tests that ALL API endpoints return the standard response format:
 * {
 *   success: boolean,
 *   message: string,
 *   data: object | array | null,
 *   timestamp: ISO-8601 DateTime,
 *   errors: array | null
 * }
 */

test.describe('Standard API Response Format Validation', () => {
  let apiValidator: ApiValidator;

  test.beforeEach(async ({ page }) => {
    apiValidator = new ApiValidator(page);
  });

  test.describe('Public Endpoints (No Authentication)', () => {
    test('GET /stocks/voting - should return standard format', async () => {
      const { body } = await apiValidator.makeApiRequest('GET', '/stocks/voting');

      expect(body.success).toBe(true);
      expect(body.message).toBe('투표 가능한 주식 목록을 조회했습니다');
      expect(body.data).not.toBeNull();
      expect(body.errors).toBeNull();
    });

    test('GET /auth/check-email - should return standard format', async () => {
      const { body } = await apiValidator.makeApiRequest(
        'GET',
        '/auth/check-email?email=test@example.com'
      );

      expect(body.success).toBe(true);
      expect(body.message).toBe('이메일 확인이 완료되었습니다');
      expect(body.data).not.toBeNull();
      expect(body.data).toHaveProperty('available');
      expect(body.errors).toBeNull();
    });

    test('GET /auth/check-username - should return standard format', async () => {
      const { body } = await apiValidator.makeApiRequest(
        'GET',
        '/auth/check-username?username=testuser'
      );

      expect(body.success).toBe(true);
      expect(body.message).toBe('사용자명 확인이 완료되었습니다');
      expect(body.data).not.toBeNull();
      expect(body.data).toHaveProperty('available');
      expect(body.errors).toBeNull();
    });
  });

  test.describe('Authentication Endpoints', () => {
    test('POST /auth/register - success response format', async () => {
      const userData = TestDataGenerator.generateUser();

      const { body } = await apiValidator.makeApiRequest(
        'POST',
        '/auth/register',
        {
          data: {
            email: userData.email,
            password: userData.password,
            username: userData.username,
            termsAccepted: true
          },
          expectedStatus: 201
        }
      );

      expect(body.success).toBe(true);
      expect(body.message).toBe('회원가입이 완료되었습니다');
      expect(body.data).not.toBeNull();
      expect(body.data).toHaveProperty('userId');
      expect(body.data).toHaveProperty('email');
      expect(body.data).toHaveProperty('username');
      expect(body.data).toHaveProperty('createdAt');
      expect(body.errors).toBeNull();
    });

    test('POST /auth/register - validation error format', async () => {
      const { body } = await apiValidator.makeApiRequest(
        'POST',
        '/auth/register',
        {
          data: {
            email: 'invalid-email',
            password: '123',
            username: '',
            termsAccepted: false
          },
          expectedStatus: 400
        }
      );

      expect(body.success).toBe(false);
      expect(body.message).toBe('요청 처리 중 오류가 발생했습니다');
      expect(body.data).toBeNull();
      expect(body.errors).not.toBeNull();
      expect(Array.isArray(body.errors)).toBe(true);
      expect(body.errors!.length).toBeGreaterThan(0);

      // Validate error structure
      body.errors!.forEach((error: any) => {
        expect(error).toHaveProperty('code');
        expect(error).toHaveProperty('message');
        expect(typeof error.code).toBe('string');
        expect(typeof error.message).toBe('string');
        if (error.field) {
          expect(typeof error.field).toBe('string');
        }
      });
    });

    test('POST /auth/login - success response format', async () => {
      // First register a user
      const userData = TestDataGenerator.generateUser();
      await apiValidator.makeApiRequest('POST', '/auth/register', {
        data: {
          email: userData.email,
          password: userData.password,
          username: userData.username,
          termsAccepted: true
        },
        expectedStatus: 201
      });

      // Then login
      const { body } = await apiValidator.makeApiRequest('POST', '/auth/login', {
        data: {
          email: userData.email,
          password: userData.password
        }
      });

      expect(body.success).toBe(true);
      expect(body.message).toBe('로그인이 완료되었습니다');
      expect(body.data).not.toBeNull();
      ApiValidator.validateLoginResponse(body.data);
      expect(body.errors).toBeNull();
    });

    test('POST /auth/login - authentication error format', async () => {
      const { body } = await apiValidator.makeApiRequest('POST', '/auth/login', {
        data: {
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        },
        expectedStatus: 401
      });

      expect(body.success).toBe(false);
      expect(body.data).toBeNull();
      expect(body.errors).not.toBeNull();
      ApiValidator.validateErrorResponse(body, 'UNAUTHORIZED');
    });
  });

  test.describe('Protected Endpoints (Authentication Required)', () => {
    let authToken: string;

    test.beforeEach(async () => {
      // Register and login to get auth token
      const userData = TestDataGenerator.generateUser();

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

    test('GET /stocks/voting/dashboard - should return standard format', async () => {
      const { body } = await apiValidator.makeApiRequest(
        'GET',
        '/stocks/voting/dashboard',
        { token: authToken }
      );

      expect(body.success).toBe(true);
      expect(body.message).toBe('투표 가능한 주식 목록을 조회했습니다');
      expect(body.data).not.toBeNull();
      expect(body.errors).toBeNull();
    });

    test('GET /users/me - should return standard format', async () => {
      const { body } = await apiValidator.makeApiRequest(
        'GET',
        '/users/me',
        { token: authToken }
      );

      expect(body.success).toBe(true);
      expect(body.message).toBe('사용자 정보를 조회했습니다');
      expect(body.data).not.toBeNull();
      expect(body.data).toHaveProperty('userId');
      expect(body.data).toHaveProperty('email');
      expect(body.data).toHaveProperty('username');
      expect(body.data).toHaveProperty('statistics');
      expect(body.errors).toBeNull();
    });

    test('GET /votes/my-votes - should return standard format', async () => {
      const { body } = await apiValidator.makeApiRequest(
        'GET',
        '/votes/my-votes',
        { token: authToken }
      );

      expect(body.success).toBe(true);
      expect(body.message).toBe('투표 내역을 조회했습니다');
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.errors).toBeNull();
    });

    test('GET /votes/my-votes/today - should return standard format', async () => {
      const { body } = await apiValidator.makeApiRequest(
        'GET',
        '/votes/my-votes/today',
        { token: authToken }
      );

      expect(body.success).toBe(true);
      expect(body.message).toBe('오늘의 투표 현황을 조회했습니다');
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.errors).toBeNull();
    });

    test('GET /votes/my-stats - should return standard format', async () => {
      const { body } = await apiValidator.makeApiRequest(
        'GET',
        '/votes/my-stats',
        { token: authToken }
      );

      expect(body.success).toBe(true);
      expect(body.message).toBe('사용자 통계를 조회했습니다');
      expect(body.data).not.toBeNull();
      ApiValidator.validateUserStatistics(body.data);
      expect(body.errors).toBeNull();
    });

    test('POST /votes - success response format', async () => {
      const { body } = await apiValidator.makeApiRequest(
        'POST',
        '/votes',
        {
          token: authToken,
          data: {
            stockCode: '005930',
            voteType: 'UP',
            confidenceLevel: 4,
            predictionReason: '실적 개선 기대'
          },
          expectedStatus: 201
        }
      );

      expect(body.success).toBe(true);
      expect(body.message).toBe('투표가 성공적으로 등록되었습니다');
      expect(body.data).not.toBeNull();
      expect(body.data).toHaveProperty('success');
      expect(body.data).toHaveProperty('voteId');
      expect(body.data).toHaveProperty('message');
      expect(body.data).toHaveProperty('vote');
      expect(body.errors).toBeNull();
    });

    test('POST /votes - conflict error format (already voted)', async () => {
      // Vote once
      await apiValidator.makeApiRequest('POST', '/votes', {
        token: authToken,
        data: {
          stockCode: '005930',
          voteType: 'UP'
        },
        expectedStatus: 201
      });

      // Try to vote again on same stock
      const { body } = await apiValidator.makeApiRequest(
        'POST',
        '/votes',
        {
          token: authToken,
          data: {
            stockCode: '005930',
            voteType: 'DOWN'
          },
          expectedStatus: 409
        }
      );

      expect(body.success).toBe(false);
      expect(body.message).toBe('이미 해당 주식에 투표하셨습니다');
      expect(body.data).toBeNull();
      expect(body.errors).not.toBeNull();
      ApiValidator.validateErrorResponse(body, 'ALREADY_VOTED');
    });

    test('POST /auth/logout - should return standard format', async () => {
      const { body } = await apiValidator.makeApiRequest(
        'POST',
        '/auth/logout',
        {
          token: authToken,
          data: { refreshToken: 'dummy-refresh-token' }
        }
      );

      expect(body.success).toBe(true);
      expect(body.message).toBe('로그아웃되었습니다');
      expect(body.data).toBeNull();
      expect(body.errors).toBeNull();
    });
  });

  test.describe('Unauthorized Access', () => {
    test('Protected endpoints without token should return 401 with standard format', async () => {
      const protectedEndpoints = [
        { method: 'GET' as const, path: '/stocks/voting/dashboard' },
        { method: 'GET' as const, path: '/users/me' },
        { method: 'GET' as const, path: '/votes/my-votes' },
        { method: 'GET' as const, path: '/votes/my-stats' },
        { method: 'POST' as const, path: '/votes' },
        { method: 'POST' as const, path: '/auth/logout' }
      ];

      for (const endpoint of protectedEndpoints) {
        const { body } = await apiValidator.makeApiRequest(
          endpoint.method,
          endpoint.path,
          {
            expectedStatus: 401,
            data: endpoint.method === 'POST' ? {} : undefined
          }
        );

        expect(body.success).toBe(false);
        expect(body.data).toBeNull();
        expect(body.errors).not.toBeNull();
        ApiValidator.validateErrorResponse(body, 'UNAUTHORIZED');
      }
    });

    test('Invalid token should return 401 with standard format', async () => {
      const { body } = await apiValidator.makeApiRequest(
        'GET',
        '/users/me',
        {
          token: 'invalid-token',
          expectedStatus: 401
        }
      );

      expect(body.success).toBe(false);
      expect(body.data).toBeNull();
      expect(body.errors).not.toBeNull();
      ApiValidator.validateErrorResponse(body, 'UNAUTHORIZED');
    });
  });

  test.describe('Security Headers Validation', () => {
    test('All API responses should include security headers', async () => {
      const { response } = await apiValidator.makeApiRequest('GET', '/stocks/voting');

      ApiValidator.validateSecurityHeaders(response);
    });
  });

  test.describe('Rate Limiting', () => {
    test('API responses should include rate limiting headers when applicable', async () => {
      const { response } = await apiValidator.makeApiRequest('GET', '/stocks/voting');

      // Rate limiting headers are optional but if present should be valid
      ApiValidator.validateRateLimitHeaders(response);
    });
  });

  test.describe('Not Found Endpoints', () => {
    test('Non-existent endpoint should return 404 with standard format', async () => {
      const { body } = await apiValidator.makeApiRequest(
        'GET',
        '/non-existent-endpoint',
        { expectedStatus: 404 }
      );

      expect(body.success).toBe(false);
      expect(body.data).toBeNull();
      expect(body.errors).not.toBeNull();
      ApiValidator.validateErrorResponse(body, 'NOT_FOUND');
    });
  });
});