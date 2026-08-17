/**
 * 画像エンティティの型定義
 */
export interface Image {
  id: string;
  file_key: string;
  original_name: string;
  mime_type: string;
  size: number;
  url: string;
  user_id: string | null;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

/**
 * 画像レスポンス型（APIレスポンス用）
 * Imageのエイリアス
 */
export type ImageResponse = Image;

/**
 * アップロードURL要求時の入力データ
 */
export interface UploadUrlRequest {
  filename: string;
  content_type: string;
  size: number;
}

/**
 * アップロードURL応答データ
 */
export interface UploadUrlResponse {
  upload_url: string;
  file_key: string;
  expires_in: number;
}

/**
 * アップロード確認時の入力データ
 */
export interface ConfirmUploadRequest {
  file_key: string;
  original_name: string;
  mime_type: string;
  size: number;
}
