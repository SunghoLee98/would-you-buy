import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginRequest, RegisterRequest } from '../types/auth.types';
import authService from '../services/auth.service';
import {
  setTokens,
  removeTokens,
  getRefreshToken,
  setUser as setStoredUser,
  getUser as getStoredUser,
  isAuthenticated as checkAuth,
} from '../utils/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (checkAuth()) {
          const storedUser = getStoredUser();
          if (storedUser) {
            setUser(storedUser);
            // Optionally refresh user data from server
            await refreshUser();
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const refreshUser = async () => {
    try {
      const response = await authService.getCurrentUser();
      if (response.success && response.data) {
        const userData: User = {
          userId: response.data.userId,
          email: response.data.email,
          username: response.data.username,
          role: response.data.role,
        };
        setUser(userData);
        setStoredUser(userData);
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  const login = async (data: LoginRequest) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.login(data);

      if (response.success && response.data) {
        const { accessToken, refreshToken, expiresIn, user: userData } = response.data;
        setTokens(accessToken, refreshToken, expiresIn);
        setStoredUser(userData);
        setUser(userData);
      } else {
        setError(response.error?.message || '로그인에 실패했습니다.');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || '로그인 중 오류가 발생했습니다.';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.register(data);

      if (response.success) {
        // Auto-login after successful registration
        await login({ email: data.email, password: data.password });
      } else {
        const errorMessage = response.error?.message || '회원가입에 실패했습니다.';
        const detailErrors = response.error?.details;
        if (detailErrors) {
          const firstError = Object.values(detailErrors)[0];
          setError(firstError || errorMessage);
        } else {
          setError(errorMessage);
        }
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      if (!error) {
        const errorMessage = err.response?.data?.error?.message || '회원가입 중 오류가 발생했습니다.';
        setError(errorMessage);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      removeTokens();
      setUser(null);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    refreshUser,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};