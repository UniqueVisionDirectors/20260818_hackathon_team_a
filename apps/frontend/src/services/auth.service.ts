/**
 * Authentication Service
 * Handles all authentication-related API calls
 */
import { api, setStoredToken, removeStoredToken, ApiError } from './api';
import type { LoginRequest, LoginResponse, SessionResponse, ApiResponse } from '@/types';

/**
 * Login user with email and password
 */
export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  try {
    const response = await api<ApiResponse<LoginResponse>>('/auth/login', {
      method: 'POST',
      body: credentials,
    });

    if (response.success && response.data) {
      // Store token on successful login
      setStoredToken(response.data.token);
      return response.data;
    }

    throw new ApiError(response.error ?? 'ログインに失敗しました');
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('ログイン処理中にエラーが発生しました');
  }
}

/**
 * Logout current user
 */
export async function logout(): Promise<void> {
  try {
    await api<ApiResponse>('/auth/logout', {
      method: 'POST',
    });
  } catch (error) {
    // Even if logout fails on server, clear local token
    console.error('Logout error:', error);
  } finally {
    removeStoredToken();
  }
}

/**
 * Check current session
 */
export async function checkSession(): Promise<SessionResponse | null> {
  try {
    const response = await api<ApiResponse<SessionResponse>>('/auth/session', {
      method: 'GET',
    });

    if (response.success && response.data) {
      return response.data;
    }

    return null;
  } catch {
    // Session check failure is not critical - don't remove token here
    // Token removal should be handled by auth store logic
    return null;
  }
}
