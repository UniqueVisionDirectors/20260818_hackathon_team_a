/**
 * API Client Configuration
 * Using ofetch for lightweight HTTP requests
 */
import { ofetch } from 'ofetch';

// API Base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:13000/api';

// Token storage key
const TOKEN_KEY = 'auth:token';

/**
 * Get stored authentication token
 */
export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Store authentication token
 */
export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Remove stored authentication token
 */
export function removeStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * API Error class for consistent error handling
 */
export class ApiError extends Error {
  public status?: number;
  public data?: unknown;

  constructor(message: string, status?: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * unknown なエラーから表示用メッセージを取り出す
 * Error 以外・空メッセージの場合は fallback を返す
 */
export function toErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message !== '') {
    return err.message;
  }
  return fallback;
}

/**
 * API のエラーレスポンスボディからメッセージを取り出す
 */
function extractErrorMessage(data: unknown): string | undefined {
  if (typeof data === 'object' && data !== null) {
    if ('error' in data && typeof data.error === 'string' && data.error !== '') {
      return data.error;
    }
    if ('message' in data && typeof data.message === 'string' && data.message !== '') {
      return data.message;
    }
  }
  return undefined;
}

/**
 * Create ofetch instance with default configuration
 */
export const api = ofetch.create({
  baseURL: API_BASE_URL,

  // Add authentication header if token exists
  onRequest(ctx) {
    const token = getStoredToken();
    if (token !== null) {
      ctx.options.headers.set('Authorization', `Bearer ${token}`);
    }
  },

  // Handle response errors
  onResponseError(ctx) {
    const { response } = ctx;
    const data: unknown = response._data;
    const message = extractErrorMessage(data);

    // Handle authentication errors
    if (response.status === 401) {
      // セッション確認のリクエストの場合はトークンを削除しない
      const requestUrl = typeof ctx.request === 'string' ? ctx.request : ctx.request.url;
      const isSessionCheck = requestUrl.includes('/auth/session');

      if (!isSessionCheck) {
        removeStoredToken();
      }

      throw new ApiError(
        message ?? '認証エラーが発生しました',
        response.status,
        data
      );
    }

    // Handle conflict errors (duplicate email, etc.)
    if (response.status === 409) {
      throw new ApiError(
        message ?? 'リソースの競合が発生しました',
        response.status,
        data
      );
    }

    // Handle other errors
    throw new ApiError(
      message ?? 'エラーが発生しました',
      response.status,
      data
    );
  },
});
