import { Page, expect, APIResponse } from '@playwright/test';

/**
 * API Contract Validation Helpers
 * 100% strict validation against API specifications
 */

export interface StandardApiResponse {
  success: boolean;
  message: string;
  data: any;
  timestamp: string;
  errors: any[] | null;
}

export interface StockInfo {
  code: string;
  koreanName: string;
  englishName: string | null;
  currentPrice: number | null;
  changeRate: number | null;
  changeAmount: number | null;
  isPrimary: boolean;
  displayOrder: number;
  marketType: string;
  lastUpdated: string | null;
  isVotingEligible: boolean;
  priceTrend: 'UP' | 'DOWN' | 'STABLE';
  formattedChangeRate: string | null;
  formattedChangeAmount: string | null;
}

export interface VoteStatistics {
  stockCode: string;
  votingDate: string;
  upVotes: number;
  downVotes: number;
  totalVotes: number;
  upPercentage: number;
  downPercentage: number;
  majorityVote: 'UP' | 'DOWN' | null;
  hasClearMajority: boolean;
  majorityVoteText: string | null;
  consensusStrength: string;
}

export interface UserVote {
  id: string;
  stockCode: string;
  stockName: string;
  voteType: 'UP' | 'DOWN';
  voteTypeText: '상승' | '하락';
  votingDate: string;
  confidenceLevel: number | null;
  predictionReason: string | null;
  canChangeVote: boolean;
  isResultCalculated: boolean;
  isCorrect: boolean | null;
  pointsEarned: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface VotingDashboardItem {
  stock: StockInfo;
  voteStatistics: VoteStatistics;
  userVote: UserVote | null;
}

export interface VotingDashboardResponse {
  votingDate: string;
  items: VotingDashboardItem[];
  totalActiveStocks: number;
  votingWindowOpen: boolean;
  marketStatus: string;
  kospiItem: VotingDashboardItem;
  featuredStocks: VotingDashboardItem[];
}

export interface UserStatistics {
  totalPredictions: number;
  correctPredictions: number;
  accuracyRate: number;
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  rank?: number;
  weeklyRank?: number;
  weeklyPoints?: number;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: {
    userId: string;
    email: string;
    username: string;
    role: string;
  };
}

/**
 * API Contract Validator
 */
export class ApiValidator {
  constructor(private page: Page) {}

  /**
   * Validate Standard API Response Format
   */
  static validateStandardResponse(response: any): StandardApiResponse {
    expect(response).toHaveProperty('success');
    expect(response).toHaveProperty('message');
    expect(response).toHaveProperty('data');
    expect(response).toHaveProperty('timestamp');
    expect(response).toHaveProperty('errors');

    expect(typeof response.success).toBe('boolean');
    expect(typeof response.message).toBe('string');
    expect(typeof response.timestamp).toBe('string');

    // Validate ISO-8601 timestamp format
    expect(response.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);

    if (response.errors !== null) {
      expect(Array.isArray(response.errors)).toBe(true);
      response.errors.forEach((error: any) => {
        expect(error).toHaveProperty('code');
        expect(error).toHaveProperty('message');
        expect(typeof error.code).toBe('string');
        expect(typeof error.message).toBe('string');
      });
    }

    return response as StandardApiResponse;
  }

  /**
   * Validate StockInfo type
   */
  static validateStockInfo(stock: any): StockInfo {
    expect(stock).toHaveProperty('code');
    expect(stock).toHaveProperty('koreanName');
    expect(stock).toHaveProperty('englishName');
    expect(stock).toHaveProperty('currentPrice');
    expect(stock).toHaveProperty('changeRate');
    expect(stock).toHaveProperty('changeAmount');
    expect(stock).toHaveProperty('isPrimary');
    expect(stock).toHaveProperty('displayOrder');
    expect(stock).toHaveProperty('marketType');
    expect(stock).toHaveProperty('lastUpdated');
    expect(stock).toHaveProperty('isVotingEligible');
    expect(stock).toHaveProperty('priceTrend');
    expect(stock).toHaveProperty('formattedChangeRate');
    expect(stock).toHaveProperty('formattedChangeAmount');

    expect(typeof stock.code).toBe('string');
    expect(typeof stock.koreanName).toBe('string');
    expect(stock.englishName === null || typeof stock.englishName === 'string').toBe(true);
    expect(stock.currentPrice === null || typeof stock.currentPrice === 'number').toBe(true);
    expect(stock.changeRate === null || typeof stock.changeRate === 'number').toBe(true);
    expect(stock.changeAmount === null || typeof stock.changeAmount === 'number').toBe(true);
    expect(typeof stock.isPrimary).toBe('boolean');
    expect(typeof stock.displayOrder).toBe('number');
    expect(typeof stock.marketType).toBe('string');
    expect(stock.lastUpdated === null || typeof stock.lastUpdated === 'string').toBe(true);
    expect(typeof stock.isVotingEligible).toBe('boolean');
    expect(['UP', 'DOWN', 'STABLE'].includes(stock.priceTrend)).toBe(true);
    expect(stock.formattedChangeRate === null || typeof stock.formattedChangeRate === 'string').toBe(true);
    expect(stock.formattedChangeAmount === null || typeof stock.formattedChangeAmount === 'string').toBe(true);

    // Validate stock code format
    expect(stock.code === 'KOSPI' || /^\d{6}$/.test(stock.code)).toBe(true);

    // Validate datetime format if not null
    if (stock.lastUpdated !== null) {
      expect(stock.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
    }

    return stock as StockInfo;
  }

  /**
   * Validate VoteStatistics type
   */
  static validateVoteStatistics(stats: any): VoteStatistics {
    expect(stats).toHaveProperty('stockCode');
    expect(stats).toHaveProperty('votingDate');
    expect(stats).toHaveProperty('upVotes');
    expect(stats).toHaveProperty('downVotes');
    expect(stats).toHaveProperty('totalVotes');
    expect(stats).toHaveProperty('upPercentage');
    expect(stats).toHaveProperty('downPercentage');
    expect(stats).toHaveProperty('majorityVote');
    expect(stats).toHaveProperty('hasClearMajority');
    expect(stats).toHaveProperty('majorityVoteText');
    expect(stats).toHaveProperty('consensusStrength');

    expect(typeof stats.stockCode).toBe('string');
    expect(typeof stats.votingDate).toBe('string');
    expect(typeof stats.upVotes).toBe('number');
    expect(typeof stats.downVotes).toBe('number');
    expect(typeof stats.totalVotes).toBe('number');
    expect(typeof stats.upPercentage).toBe('number');
    expect(typeof stats.downPercentage).toBe('number');
    expect(stats.majorityVote === null || ['UP', 'DOWN'].includes(stats.majorityVote)).toBe(true);
    expect(typeof stats.hasClearMajority).toBe('boolean');
    expect(stats.majorityVoteText === null || typeof stats.majorityVoteText === 'string').toBe(true);
    expect(typeof stats.consensusStrength).toBe('string');

    // Validate date format (YYYY-MM-DD)
    expect(stats.votingDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    // Validate vote math
    expect(stats.totalVotes).toBe(stats.upVotes + stats.downVotes);
    expect(Math.abs(stats.upPercentage + stats.downPercentage - 100)).toBeLessThanOrEqual(0.1);

    return stats as VoteStatistics;
  }

  /**
   * Validate UserVote type
   */
  static validateUserVote(vote: any): UserVote {
    expect(vote).toHaveProperty('id');
    expect(vote).toHaveProperty('stockCode');
    expect(vote).toHaveProperty('stockName');
    expect(vote).toHaveProperty('voteType');
    expect(vote).toHaveProperty('voteTypeText');
    expect(vote).toHaveProperty('votingDate');
    expect(vote).toHaveProperty('confidenceLevel');
    expect(vote).toHaveProperty('predictionReason');
    expect(vote).toHaveProperty('canChangeVote');
    expect(vote).toHaveProperty('isResultCalculated');
    expect(vote).toHaveProperty('isCorrect');
    expect(vote).toHaveProperty('pointsEarned');
    expect(vote).toHaveProperty('createdAt');
    expect(vote).toHaveProperty('updatedAt');

    expect(typeof vote.id).toBe('string');
    expect(typeof vote.stockCode).toBe('string');
    expect(typeof vote.stockName).toBe('string');
    expect(['UP', 'DOWN'].includes(vote.voteType)).toBe(true);
    expect(['상승', '하락'].includes(vote.voteTypeText)).toBe(true);
    expect(typeof vote.votingDate).toBe('string');
    expect(vote.confidenceLevel === null || typeof vote.confidenceLevel === 'number').toBe(true);
    expect(vote.predictionReason === null || typeof vote.predictionReason === 'string').toBe(true);
    expect(typeof vote.canChangeVote).toBe('boolean');
    expect(typeof vote.isResultCalculated).toBe('boolean');
    expect(vote.isCorrect === null || typeof vote.isCorrect === 'boolean').toBe(true);
    expect(vote.pointsEarned === null || typeof vote.pointsEarned === 'number').toBe(true);
    expect(typeof vote.createdAt).toBe('string');
    expect(typeof vote.updatedAt).toBe('string');

    // Validate UUID format
    expect(vote.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

    // Validate date formats
    expect(vote.votingDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(vote.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
    expect(vote.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);

    // Validate confidence level range
    if (vote.confidenceLevel !== null) {
      expect(vote.confidenceLevel).toBeGreaterThanOrEqual(1);
      expect(vote.confidenceLevel).toBeLessThanOrEqual(5);
    }

    // Validate prediction reason length
    if (vote.predictionReason !== null) {
      expect(vote.predictionReason.length).toBeLessThanOrEqual(200);
    }

    return vote as UserVote;
  }

  /**
   * Validate VotingDashboardItem type
   */
  static validateVotingDashboardItem(item: any): VotingDashboardItem {
    expect(item).toHaveProperty('stock');
    expect(item).toHaveProperty('voteStatistics');
    expect(item).toHaveProperty('userVote');

    this.validateStockInfo(item.stock);
    this.validateVoteStatistics(item.voteStatistics);

    if (item.userVote !== null) {
      this.validateUserVote(item.userVote);
    }

    // Cross-validation
    expect(item.stock.code).toBe(item.voteStatistics.stockCode);
    if (item.userVote !== null) {
      expect(item.userVote.stockCode).toBe(item.stock.code);
    }

    return item as VotingDashboardItem;
  }

  /**
   * Validate VotingDashboardResponse type
   */
  static validateVotingDashboardResponse(data: any): VotingDashboardResponse {
    expect(data).toHaveProperty('votingDate');
    expect(data).toHaveProperty('items');
    expect(data).toHaveProperty('totalActiveStocks');
    expect(data).toHaveProperty('votingWindowOpen');
    expect(data).toHaveProperty('marketStatus');
    expect(data).toHaveProperty('kospiItem');
    expect(data).toHaveProperty('featuredStocks');

    expect(typeof data.votingDate).toBe('string');
    expect(Array.isArray(data.items)).toBe(true);
    expect(typeof data.totalActiveStocks).toBe('number');
    expect(typeof data.votingWindowOpen).toBe('boolean');
    expect(typeof data.marketStatus).toBe('string');
    expect(Array.isArray(data.featuredStocks)).toBe(true);

    // Validate date format
    expect(data.votingDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    // Validate items
    data.items.forEach((item: any) => {
      this.validateVotingDashboardItem(item);
    });

    // Validate kospiItem
    this.validateVotingDashboardItem(data.kospiItem);
    expect(data.kospiItem.stock.code).toBe('KOSPI');
    expect(data.kospiItem.stock.isPrimary).toBe(true);

    // Validate featuredStocks
    data.featuredStocks.forEach((item: any) => {
      this.validateVotingDashboardItem(item);
      expect(item.stock.code).not.toBe('KOSPI');
    });

    // Validate consistency
    expect(data.items.length).toBe(data.totalActiveStocks);

    return data as VotingDashboardResponse;
  }

  /**
   * Validate UserStatistics type
   */
  static validateUserStatistics(stats: any): UserStatistics {
    expect(stats).toHaveProperty('totalPredictions');
    expect(stats).toHaveProperty('correctPredictions');
    expect(stats).toHaveProperty('accuracyRate');
    expect(stats).toHaveProperty('totalPoints');
    expect(stats).toHaveProperty('currentStreak');
    expect(stats).toHaveProperty('longestStreak');

    expect(typeof stats.totalPredictions).toBe('number');
    expect(typeof stats.correctPredictions).toBe('number');
    expect(typeof stats.accuracyRate).toBe('number');
    expect(typeof stats.totalPoints).toBe('number');
    expect(typeof stats.currentStreak).toBe('number');
    expect(typeof stats.longestStreak).toBe('number');

    // Validate ranges
    expect(stats.totalPredictions).toBeGreaterThanOrEqual(0);
    expect(stats.correctPredictions).toBeGreaterThanOrEqual(0);
    expect(stats.correctPredictions).toBeLessThanOrEqual(stats.totalPredictions);
    expect(stats.accuracyRate).toBeGreaterThanOrEqual(0);
    expect(stats.accuracyRate).toBeLessThanOrEqual(100);
    expect(stats.currentStreak).toBeGreaterThanOrEqual(0);
    expect(stats.longestStreak).toBeGreaterThanOrEqual(0);
    expect(stats.longestStreak).toBeGreaterThanOrEqual(stats.currentStreak);

    // Validate accuracy calculation
    if (stats.totalPredictions > 0) {
      const expectedAccuracy = (stats.correctPredictions / stats.totalPredictions) * 100;
      expect(Math.abs(stats.accuracyRate - expectedAccuracy)).toBeLessThanOrEqual(0.1);
    } else {
      expect(stats.accuracyRate).toBe(0);
      expect(stats.correctPredictions).toBe(0);
    }

    return stats as UserStatistics;
  }

  /**
   * Validate LoginResponse type
   */
  static validateLoginResponse(data: any): LoginResponse {
    expect(data).toHaveProperty('accessToken');
    expect(data).toHaveProperty('refreshToken');
    expect(data).toHaveProperty('tokenType');
    expect(data).toHaveProperty('expiresIn');
    expect(data).toHaveProperty('user');

    expect(typeof data.accessToken).toBe('string');
    expect(typeof data.refreshToken).toBe('string');
    expect(data.tokenType).toBe('Bearer');
    expect(typeof data.expiresIn).toBe('number');
    expect(data.expiresIn).toBe(3600); // 1 hour

    // Validate JWT format (basic check)
    expect(data.accessToken.split('.')).toHaveLength(3);
    expect(data.refreshToken.split('.')).toHaveLength(3);

    // Validate user object
    expect(data.user).toHaveProperty('userId');
    expect(data.user).toHaveProperty('email');
    expect(data.user).toHaveProperty('username');
    expect(data.user).toHaveProperty('role');

    expect(typeof data.user.userId).toBe('string');
    expect(typeof data.user.email).toBe('string');
    expect(typeof data.user.username).toBe('string');
    expect(data.user.role).toBe('USER');

    // Validate UUID format
    expect(data.user.userId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

    // Validate email format
    expect(data.user.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);

    return data as LoginResponse;
  }

  /**
   * Make API request and validate response
   */
  async makeApiRequest(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    options: {
      headers?: Record<string, string>;
      data?: any;
      expectedStatus?: number;
      token?: string;
    } = {}
  ): Promise<{ response: APIResponse; body: StandardApiResponse }> {
    const baseUrl = 'http://localhost:7070/api/v1';
    const url = `${baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (options.token) {
      headers['Authorization'] = `Bearer ${options.token}`;
    }

    const requestOptions: any = {
      method,
      headers,
    };

    if (options.data && (method === 'POST' || method === 'PUT')) {
      requestOptions.data = options.data;
    }

    const response = await this.page.request.fetch(url, requestOptions);

    expect(response.status()).toBe(options.expectedStatus || 200);

    const body = await response.json();
    const validatedBody = ApiValidator.validateStandardResponse(body);

    return { response, body: validatedBody };
  }

  /**
   * Validate HTTP Security Headers
   */
  static validateSecurityHeaders(response: APIResponse) {
    const headers = response.headers();

    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['x-xss-protection']).toBe('1; mode=block');
    expect(headers['strict-transport-security']).toContain('max-age=31536000');
    expect(headers['strict-transport-security']).toContain('includeSubDomains');
  }

  /**
   * Validate Error Response
   */
  static validateErrorResponse(body: StandardApiResponse, expectedErrorCode: string) {
    expect(body.success).toBe(false);
    expect(body.data).toBeNull();
    expect(body.errors).not.toBeNull();
    expect(Array.isArray(body.errors)).toBe(true);
    expect(body.errors!.length).toBeGreaterThan(0);
    expect(body.errors![0]).toHaveProperty('code');
    expect(body.errors![0].code).toBe(expectedErrorCode);
  }

  /**
   * Validate Rate Limiting Headers
   */
  static validateRateLimitHeaders(response: APIResponse) {
    const headers = response.headers();

    // Common rate limit headers
    if (headers['x-ratelimit-limit']) {
      expect(headers['x-ratelimit-limit']).toMatch(/^\d+$/);
    }
    if (headers['x-ratelimit-remaining']) {
      expect(headers['x-ratelimit-remaining']).toMatch(/^\d+$/);
    }
    if (headers['x-ratelimit-reset']) {
      expect(headers['x-ratelimit-reset']).toMatch(/^\d+$/);
    }
  }
}

/**
 * Mock Data Generators for Testing
 */
export class ApiMockData {
  static generateMockStockInfo(overrides: Partial<StockInfo> = {}): StockInfo {
    return {
      code: '005930',
      koreanName: '삼성전자',
      englishName: 'Samsung Electronics',
      currentPrice: 75000,
      changeRate: -0.8,
      changeAmount: -600,
      isPrimary: false,
      displayOrder: 2,
      marketType: 'KOSPI',
      lastUpdated: '2024-01-15T15:30:00Z',
      isVotingEligible: true,
      priceTrend: 'DOWN',
      formattedChangeRate: '-0.8%',
      formattedChangeAmount: '-600',
      ...overrides,
    };
  }

  static generateMockKospiInfo(): StockInfo {
    return this.generateMockStockInfo({
      code: 'KOSPI',
      koreanName: '코스피',
      englishName: 'KOSPI Index',
      currentPrice: 2650.50,
      changeRate: 1.25,
      changeAmount: 32.75,
      isPrimary: true,
      displayOrder: 1,
      marketType: 'INDEX',
      priceTrend: 'UP',
      formattedChangeRate: '+1.25%',
      formattedChangeAmount: '+32.75',
    });
  }

  static generateMockVoteStatistics(overrides: Partial<VoteStatistics> = {}): VoteStatistics {
    return {
      stockCode: '005930',
      votingDate: '2024-01-16',
      upVotes: 980,
      downVotes: 720,
      totalVotes: 1700,
      upPercentage: 57.6,
      downPercentage: 42.4,
      majorityVote: 'UP',
      hasClearMajority: false,
      majorityVoteText: '상승',
      consensusStrength: '약간의 의견 차이',
      ...overrides,
    };
  }

  static generateMockUserVote(overrides: Partial<UserVote> = {}): UserVote {
    return {
      id: '123e4567-e89b-12d3-a456-426614174000',
      stockCode: '005930',
      stockName: '삼성전자',
      voteType: 'UP',
      voteTypeText: '상승',
      votingDate: '2024-01-16',
      confidenceLevel: 4,
      predictionReason: '실적 개선 기대',
      canChangeVote: true,
      isResultCalculated: false,
      isCorrect: null,
      pointsEarned: null,
      createdAt: '2024-01-15T16:00:00Z',
      updatedAt: '2024-01-15T16:00:00Z',
      ...overrides,
    };
  }
}