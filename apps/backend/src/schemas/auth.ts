import { z } from '@hono/zod-openapi';

// ログイン用のリクエストスキーマ
export const LoginRequestSchema = z.object({
  email: z.email().openapi({
    example: 'user@example.com',
    description: 'ユーザーのメールアドレス'
  }),
  password: z.string().min(6).openapi({
    example: 'password123',
    description: 'ユーザーのパスワード（6文字以上）'
  })
}).openapi('LoginRequest');

// ログイン成功時のレスポンススキーマ
export const LoginResponseSchema = z.object({
  success: z.boolean().openapi({ example: true }),
  data: z.object({
    token: z.string().openapi({
      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      description: 'JWT認証トークン'
    }),
    user: z.object({
      id: z.string().openapi({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' }),
      name: z.string().openapi({ example: 'John Doe' }),
      email: z.email().openapi({ example: 'user@example.com' })
    })
  })
}).openapi('LoginResponse');

// ログアウト成功時のレスポンススキーマ
export const LogoutResponseSchema = z.object({
  success: z.boolean().openapi({ example: true }),
  data: z.null()
}).openapi('LogoutResponse');

// セッション情報のレスポンススキーマ
export const SessionResponseSchema = z.object({
  success: z.boolean().openapi({ example: true }),
  data: z.object({
    user: z.object({
      id: z.string().openapi({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' }),
      name: z.string().openapi({ example: 'John Doe' }),
      email: z.email().openapi({ example: 'user@example.com' })
    })
  })
}).openapi('SessionResponse');

// 認証エラーのレスポンススキーマ
export const AuthErrorResponseSchema = z.object({
  success: z.boolean().openapi({ example: false }),
  error: z.string().openapi({ example: 'Invalid email or password' })
}).openapi('AuthErrorResponse');