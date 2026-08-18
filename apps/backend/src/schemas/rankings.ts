import { z } from '@hono/zod-openapi';

export const ScoreboardItemSchema = z.object({
  id: z.string().openapi({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' }),
  nickname: z.string().openapi({ example: 'Player1' }),
  score: z.number().openapi({ example: 1500 }),
  created_at: z.string().openapi({ example: '2024-01-01T00:00:00Z' })
}).openapi('ScoreboardItem');

export const CreateScoreboardSchema = z.object({
  nickname: z.string().min(1, 'ニックネームは必須です').max(255).openapi({ example: 'Player1' }),
  score: z.number().int().min(0, 'スコアは0以上である必要があります').openapi({ example: 1500 })
}).openapi('CreateScoreboard');

export const ScoreboardListSchema = z.array(ScoreboardItemSchema).openapi('ScoreboardList');

