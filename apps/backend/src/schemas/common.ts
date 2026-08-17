import { z } from '@hono/zod-openapi'

export const HealthResponseSchema = z.object({
  status: z.string().openapi({ example: 'ok' })
}).openapi('HealthResponse')

export const ErrorResponseSchema = z.object({
  success: z.boolean().openapi({ example: false }),
  message: z.string().openapi({ example: 'Error occurred' }),
  error: z.string().optional().openapi({ example: 'Detailed error message' })
}).openapi('ErrorResponse')

// id パスパラメータ用スキーマ。3 テーブル (users/items/images) の PK は uuid で
// 検証規則が同一のため単一スキーマに集約する
export const IdParamSchema = z.object({
  id: z.uuid('IDはUUID形式である必要があります').openapi({
    param: { name: 'id', in: 'path' },
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6'
  })
})