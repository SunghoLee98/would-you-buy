import { User } from '../types/auth.types';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user';
const TOKEN_EXPIRY_KEY = 'token_expiry';

// Token management
export const setTokens = (accessToken: string, refreshToken: string, expiresIn?: number): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);

  if (expiresIn) {
    const expiryTime = Date.now() + (expiresIn * 1000);
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
  }
};

export const getAccessToken = (): string | null => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const removeTokens = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
  localStorage.removeItem(USER_KEY);
};

export const isTokenExpired = (): boolean => {
  const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!expiryTime) return true;
  return Date.now() > parseInt(expiryTime);
};

// User management
export const setUser = (user: User): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getUser = (): User | null => {
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

export const isAuthenticated = (): boolean => {
  const token = getAccessToken();
  const user = getUser();
  return !!(token && user && !isTokenExpired());
};

// Password validation
export const validatePassword = (password: string): string | null => {
  if (password.length < 8) {
    return '비밀번호는 최소 8자 이상이어야 합니다.';
  }
  if (!/[A-Z]/.test(password)) {
    return '비밀번호는 대문자를 포함해야 합니다.';
  }
  if (!/[a-z]/.test(password)) {
    return '비밀번호는 소문자를 포함해야 합니다.';
  }
  if (!/[0-9]/.test(password)) {
    return '비밀번호는 숫자를 포함해야 합니다.';
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return '비밀번호는 특수문자를 포함해야 합니다.';
  }
  return null;
};

// Username validation
export const validateUsername = (username: string): string | null => {
  if (username.length < 2 || username.length > 20) {
    return '닉네임은 2자 이상 20자 이하여야 합니다.';
  }
  if (!/^[a-zA-Z0-9가-힣]+$/.test(username)) {
    return '닉네임은 한글, 영문, 숫자만 사용할 수 있습니다.';
  }
  return null;
};

// Email validation
export const validateEmail = (email: string): string | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return '올바른 이메일 형식이 아닙니다.';
  }
  return null;
};