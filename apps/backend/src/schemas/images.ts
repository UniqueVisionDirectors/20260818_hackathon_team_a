import { z } from '@hono/zod-openapi';

// 画像レスポンススキーマ
export const ImageSchema = z.object({
  id: z.string().openapi({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' }),
  file_key: z.string().openapi({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg' }),
  original_name: z.string().openapi({ example: 'vacation-photo.jpg' }),
  mime_type: z.string().openapi({ example: 'image/jpeg' }),
  size: z.number().openapi({ example: 2048576 }),
  url: z.url().openapi({ example: 'https://minio.example.com/...' }),
  user_id: z.string().nullable().openapi({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' }),
  created_at: z.iso.datetime().openapi({ example: '2025-01-10T15:30:45Z' }),
  updated_at: z.iso.datetime().openapi({ example: '2025-01-10T15:30:45Z' })
}).openapi('Image');

// アップロードURL要求スキーマ
export const UploadUrlRequestSchema = z.object({
  filename: z.string().min(1, 'ファイル名は必須です').max(255),
  content_type: z.enum([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ], { error: 'サポートされていない画像形式です' }),
  size: z.number().positive().max(10 * 1024 * 1024, 'ファイルサイズは10MB以下にしてください')
}).openapi('UploadUrlRequest');

// アップロードURL応答スキーマ
export const UploadUrlResponseSchema = z.object({
  upload_url: z.url(),
  file_key: z.string(),
  expires_in: z.number()
}).openapi('UploadUrlResponse');

// アップロード確認スキーマ
export const ConfirmUploadSchema = z.object({
  file_key: z.string().min(1),
  original_name: z.string().min(1).max(255),
  mime_type: z.string(),
  size: z.number().positive()
}).openapi('ConfirmUpload');

// 画像一覧スキーマ
export const ImageListSchema = z.array(ImageSchema).openapi('ImageList');
