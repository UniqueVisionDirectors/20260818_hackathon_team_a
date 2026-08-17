import type { OpenAPIHono} from '@hono/zod-openapi';
import { createRoute } from '@hono/zod-openapi';
import { db } from '../db/connection.js';
import { verifyPassword, generateJWT } from '../utils/auth.js';
import { authMiddleware } from '../middleware/auth.js';
import {
  LoginRequestSchema,
  LoginResponseSchema,
  LogoutResponseSchema,
  SessionResponseSchema,
  AuthErrorResponseSchema
} from '../schemas/auth.js';
import { ErrorResponseSchema } from '../schemas/common.js';

export const storeAuthApi = (app: OpenAPIHono) => {
  storeLoginRoute(app);
  storeLogoutRoute(app);
  storeSessionRoute(app);
};

const storeLoginRoute = (app: OpenAPIHono) => {
  // POST /api/auth/login ルート定義
  const loginRoute = createRoute({
    method: 'post',
    path: '/api/auth/login',
    request: {
      body: {
        content: { 'application/json': { schema: LoginRequestSchema } }
      }
    },
    responses: {
      200: {
        content: { 'application/json': { schema: LoginResponseSchema } },
        description: 'ログイン成功'
      },
      400: {
        content: { 'application/json': { schema: AuthErrorResponseSchema } },
        description: 'バリデーションエラー'
      },
      401: {
        content: { 'application/json': { schema: AuthErrorResponseSchema } },
        description: '認証エラー'
      },
      500: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'サーバーエラー'
      }
    }
  });

  // POST /api/auth/login エンドポイント実装
  app.openapi(loginRoute, async (c) => {
    try {
      const body = c.req.valid('json');
      const { email, password } = body;

      // Find user by email
      const user = await db
        .selectFrom('users')
        .select(['id', 'name', 'email', 'password_hash', 'active'])
        .where('email', '=', email)
        .where('active', '=', true)
        .executeTakeFirst();

      if (!user?.password_hash) {
        return c.json({
          success: false,
          error: 'Invalid email or password'
        }, 401);
      }

      // Verify password
      const isValidPassword = await verifyPassword(password, user.password_hash);
      if (!isValidPassword) {
        return c.json({
          success: false,
          error: 'Invalid email or password'
        }, 401);
      }

      // Generate JWT
      const token = await generateJWT({ userId: user.id, email: user.email });

      return c.json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email
          }
        }
      }, 200);
    } catch (error) {
      console.error('Login error:', error);
      return c.json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });
};

const storeLogoutRoute = (app: OpenAPIHono) => {
  // POST /api/auth/logout ルート定義
  const logoutRoute = createRoute({
    method: 'post',
    path: '/api/auth/logout',
    responses: {
      200: {
        content: { 'application/json': { schema: LogoutResponseSchema } },
        description: 'ログアウト成功'
      }
    }
  });

  // POST /api/auth/logout エンドポイント実装
  app.openapi(logoutRoute, (c) => {
    // JWT is stateless, so we just return success
    // Client should remove the token from storage
    return c.json({
      success: true,
      data: null
    }, 200);
  });
};

const storeSessionRoute = (app: OpenAPIHono) => {
  // 認証ミドルウェアを適用
  app.use('/api/auth/session', authMiddleware);

  // GET /api/auth/session ルート定義
  const sessionRoute = createRoute({
    method: 'get',
    path: '/api/auth/session',
    responses: {
      200: {
        content: { 'application/json': { schema: SessionResponseSchema } },
        description: 'セッション情報取得成功'
      },
      401: {
        content: { 'application/json': { schema: AuthErrorResponseSchema } },
        description: '認証エラー'
      },
      500: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'サーバーエラー'
      }
    }
  });

  // GET /api/auth/session エンドポイント実装
  app.openapi(sessionRoute, (c) => {
    const user = c.get('user');
    if (!user) {
      return c.json({
        success: false,
        error: 'Unauthorized'
      }, 401);
    }
    return c.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      }
    }, 200);
  });
};
