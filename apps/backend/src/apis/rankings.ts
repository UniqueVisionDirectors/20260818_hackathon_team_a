import type { OpenAPIHono } from '@hono/zod-openapi';
import { createRoute } from '@hono/zod-openapi';
import { ScoreboardListSchema, ScoreboardItemSchema, CreateScoreboardSchema } from '../schemas/rankings.js';
import { ErrorResponseSchema } from '../schemas/common.js';
import { db } from '../db/connection.js';

export const storeRankingApi = (app: OpenAPIHono) => {
  storeGetRankingsRoute(app);
  storeCreateScoreboardRoute(app);
};

const storeGetRankingsRoute = (app: OpenAPIHono) => {
  // GET /api/rankings ルート定義
  const getRankingsRoute = createRoute({
    method: 'get',
    path: '/api/rankings',
    responses: {
      200: {
        content: { 'application/json': { schema: ScoreboardListSchema } },
        description: 'スコアボード（ランキング）一覧を取得'
      },
      500: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'データベースエラー'
      }
    }
  });

  // GET /api/rankings エンドポイント実装
  app.openapi(getRankingsRoute, async (c) => {
    try {
      const scores = await db
        .selectFrom('scoreboards')
        .select(['id', 'nickname', 'score', 'created_at'])
        .orderBy('score', 'desc')
        .orderBy('created_at', 'asc')
        .limit(100)
        .execute();

      const formattedScores = scores.map(item => ({
        id: item.id,
        nickname: item.nickname,
        score: item.score,
        created_at: item.created_at.toISOString()
      }));

      return c.json(formattedScores, 200);
    } catch (error) {
      console.error('Database error:', error);
      return c.json({
        success: false,
        message: 'Database error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });
};

const storeCreateScoreboardRoute = (app: OpenAPIHono) => {
  // POST /api/rankings ルート定義
  const createScoreboardRoute = createRoute({
    method: 'post',
    path: '/api/rankings',
    request: {
      body: {
        content: { 'application/json': { schema: CreateScoreboardSchema } }
      }
    },
    responses: {
      201: {
        content: { 'application/json': { schema: ScoreboardItemSchema } },
        description: 'スコア登録成功'
      },
      400: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'バリデーションエラー'
      },
      500: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'データベースエラー'
      }
    }
  });

  // POST /api/rankings エンドポイント実装
  app.openapi(createScoreboardRoute, async (c) => {
    const data = c.req.valid('json');

    try {
      const newScore = await db
        .insertInto('scoreboards')
        .values({
          nickname: data.nickname,
          score: data.score
        })
        .returning(['id', 'nickname', 'score', 'created_at'])
        .executeTakeFirstOrThrow();

      return c.json({
        id: newScore.id,
        nickname: newScore.nickname,
        score: newScore.score,
        created_at: newScore.created_at.toISOString()
      }, 201);
    } catch (error) {
      console.error('Database error:', error);
      return c.json({
        success: false,
        message: 'Database error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });
};

