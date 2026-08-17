import { z } from '@hono/zod-openapi'

// メインユーザースキーマ
export const UserSchema = z.object({
  id: z.string().openapi({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' }),
  name: z.string().openapi({ example: 'John Doe' }),
  email: z.email().openapi({ example: 'john@example.com' }),
  active: z.boolean().openapi({ example: true }),
  created_at: z.iso.datetime().openapi({ example: '2024-01-01T00:00:00Z' })
}).openapi('User')

// ユーザー作成用スキーマ
export const CreateUserSchema = z.object({
  name: z.string().min(1).openapi({ example: 'Jane Doe' }),
  email: z.email().openapi({ example: 'jane@example.com' }),
  password: z.string().min(6).openapi({ example: 'password123' })
}).openapi('CreateUser')

// ユーザー更新用スキーマ
export const UpdateUserSchema = z.object({
  name: z.string().min(1).optional().openapi({ example: 'Jane Smith' }),
  email: z.email().optional().openapi({ example: 'jane.smith@example.com' }),
  active: z.boolean().optional().openapi({ example: false }),
  password: z.string().min(6).optional().openapi({ example: 'newPassword123' })
}).openapi('UpdateUser')

// ユーザーリスト用スキーマ
export const UserListSchema = z.array(UserSchema).openapi('UserList')