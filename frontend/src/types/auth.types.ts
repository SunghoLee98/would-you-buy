// Authentication Types
export interface User {
  userId: string;
  email: string;
  username: string;
  role: 'USER' | 'ADMIN';
}

export interface UserStatistics {
  totalPredictions: number;
  correctPredictions: number;
  accuracyRate: number;
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
}

export interface UserProfile extends User {
  statistics: UserStatistics;
  createdAt: string;
  lastLoginAt: string;
}

// API Request Types
export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
  termsAccepted: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string>;
}

export interface RegisterResponse {
  userId: string;
  email: string;
  username: string;
  createdAt: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface RefreshTokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface AvailabilityResponse {
  available: boolean;
  message: string;
}

// Form Types
export interface RegisterFormData {
  email: string;
  password: string;
  passwordConfirm: string;
  username: string;
  termsAccepted: boolean;
}

export interface LoginFormData {
  email: string;
  password: string;
}