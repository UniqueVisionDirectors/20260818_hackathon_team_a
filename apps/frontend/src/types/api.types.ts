/**
 * API関連の型定義
 */

// API共通レスポンス型
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 認証API
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    name: string;
    email: string;
  };
  token: string;
}

export interface SessionResponse {
  user: {
    id: string;
    name: string;
    email: string;
  };
  session: {
    createdAt: string;
  };
}

// アイテムAPI
export interface ItemResponse {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface CreateItemRequest {
  name: string;
}

export interface UpdateItemRequest {
  name?: string;
}

// ページネーション
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}
