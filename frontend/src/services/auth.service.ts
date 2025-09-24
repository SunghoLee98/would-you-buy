import api from './api';
import {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  UserProfile,
  AvailabilityResponse,
  ApiResponse,
} from '../types/auth.types';

class AuthService {
  // Register new user
  async register(data: RegisterRequest): Promise<ApiResponse<RegisterResponse>> {
    const response = await api.post<ApiResponse<RegisterResponse>>('/auth/register', data);
    return response.data;
  }

  // Login user
  async login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await api.post<ApiResponse<LoginResponse>>('/auth/login', data);
    return response.data;
  }

  // Refresh access token
  async refreshToken(data: RefreshTokenRequest): Promise<ApiResponse<RefreshTokenResponse>> {
    const response = await api.post<ApiResponse<RefreshTokenResponse>>('/auth/refresh', data);
    return response.data;
  }

  // Logout user
  async logout(refreshToken: string): Promise<ApiResponse> {
    const response = await api.post<ApiResponse>('/auth/logout', { refreshToken });
    return response.data;
  }

  // Get current user profile
  async getCurrentUser(): Promise<ApiResponse<UserProfile>> {
    const response = await api.get<ApiResponse<UserProfile>>('/users/me');
    return response.data;
  }

  // Check email availability
  async checkEmailAvailability(email: string): Promise<ApiResponse<AvailabilityResponse>> {
    const response = await api.get<ApiResponse<AvailabilityResponse>>(
      '/auth/check-email',
      { params: { email } }
    );
    return response.data;
  }

  // Check username availability
  async checkUsernameAvailability(username: string): Promise<ApiResponse<AvailabilityResponse>> {
    const response = await api.get<ApiResponse<AvailabilityResponse>>(
      '/auth/check-username',
      { params: { username } }
    );
    return response.data;
  }

  // Request password reset
  async forgotPassword(data: ForgotPasswordRequest): Promise<ApiResponse> {
    const response = await api.post<ApiResponse>('/auth/forgot-password', data);
    return response.data;
  }

  // Reset password with token
  async resetPassword(data: ResetPasswordRequest): Promise<ApiResponse> {
    const response = await api.post<ApiResponse>('/auth/reset-password', data);
    return response.data;
  }

  // Initiate social login (returns URL for redirect)
  getSocialLoginUrl(provider: 'google' | 'kakao' | 'naver'): string {
    return `${api.defaults.baseURL}/auth/oauth/${provider}`;
  }
}

const authService = new AuthService();
export default authService;