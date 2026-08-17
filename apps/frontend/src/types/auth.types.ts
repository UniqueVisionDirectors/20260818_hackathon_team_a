/**
 * ログイン認証情報
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * 認証エラー
 */
export interface AuthError {
  message: string;
  code?: string;
}

/**
 * 認証状態
 */
export interface AuthState {
  isLoggedIn: boolean;
  currentUser?: {
    id: string;
    name: string;
    email: string;
  };
  loading: boolean;
  error: AuthError | null;
}