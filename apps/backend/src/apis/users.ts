import type { OpenAPIHono} from '@hono/zod-openapi';
import { createRoute } from '@hono/zod-openapi';
import { authMiddleware } from '../middleware/auth.js';
import { UserSchema, UserListSchema, CreateUserSchema, UpdateUserSchema } from '../schemas/users.js';
import { ErrorResponseSchema, IdParamSchema } from '../schemas/common.js';
import { db } from '../db/connection.js';
import { hashPassword } from '../utils/auth.js'

export const storeUserApi = (app: OpenAPIHono) => {
  app.use('/api/users/*', authMiddleware);
  storeGetUserRoute(app);
  storeGetUsersRoute(app);
  storeCreateUserRoute(app);
  storeUpdateUserRoute(app);
  storeDeleteUserRoute(app);
};

const storeGetUserRoute = (app: OpenAPIHono) => {
  // GET /api/users/{id} ルート定義
  const getUserRoute = createRoute({
    method: 'get',
    path: '/api/users/{id}',
    request: { params: IdParamSchema },
    responses: {
      200: {
        content: { 'application/json': { schema: UserSchema } },
        description: 'ユーザー情報を取得'
      },
      404: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'ユーザーが見つからない'
      },
      500: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'データベースエラー'
      }
    }
  });

  // GET /api/users/{id} エンドポイント実装
  app.openapi(getUserRoute, async (c) => {
    const { id } = c.req.valid('param');

    try {
      const user = await db
        .selectFrom('users')
        .select(['id', 'name', 'email', 'active', 'created_at'])
        .where('id', '=', id)
        .executeTakeFirst();

      if (!user) {
        return c.json({
          success: false,
          message: 'User not found'
        }, 404);
      }

      return c.json({
        id: user.id,
        name: user.name,
        email: user.email,
        active: user.active,
        created_at: user.created_at.toISOString()
      }, 200);
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

const storeGetUsersRoute = (app: OpenAPIHono) => {
  // GET /api/users ルート定義
  const getUsersRoute = createRoute({
    method: 'get',
    path: '/api/users',
    responses: {
      200: {
        content: { 'application/json': { schema: UserListSchema } },
        description: 'ユーザー一覧を取得'
      },
      500: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'データベースエラー'
      }
    }
  });

  // GET /api/users エンドポイント実装
  app.openapi(getUsersRoute, async (c) => {
    try {
      const users = await db
        .selectFrom('users')
        .select(['id', 'name', 'email', 'active', 'created_at'])
        .orderBy('created_at', 'desc')
        .execute();

      const formattedUsers = users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        active: user.active,
        created_at: user.created_at.toISOString()
      }));

      return c.json(formattedUsers, 200);
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

const storeCreateUserRoute = (app: OpenAPIHono) => {
  // POST /api/users ルート定義
  const createUserRoute = createRoute({
    method: 'post',
    path: '/api/users',
    request: {
      body: {
        content: { 'application/json': { schema: CreateUserSchema } }
      }
    },
    responses: {
      201: {
        content: { 'application/json': { schema: UserSchema } },
        description: 'ユーザー作成成功'
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

  // POST /api/users エンドポイント実装
  app.openapi(createUserRoute, async (c) => {
    const userData = c.req.valid('json');

    try {
      // メールアドレスの重複チェック
      const existingUser = await db
        .selectFrom('users')
        .select('id')
        .where('email', '=', userData.email.toLowerCase())
        .executeTakeFirst();

      if (existingUser) {
        return c.json({
          success: false,
          message: 'Email already exists',
          error: 'このメールアドレスは既に使用されています'
        }, 400); // Bad Request - validation error
      }

      // パスワードをハッシュ化
      const hashedPassword = await hashPassword(userData.password);

      const newUser = await db
        .insertInto('users')
        .values({
          name: userData.name,
          email: userData.email.toLowerCase(),
          password_hash: hashedPassword
        })
        .returning(['id', 'name', 'email', 'active', 'created_at'])
        .executeTakeFirstOrThrow();

      return c.json({
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        active: newUser.active,
        created_at: newUser.created_at.toISOString()
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

const storeUpdateUserRoute = (app: OpenAPIHono) => {
  // PUT /api/users/{id} ルート定義
  const updateUserRoute = createRoute({
    method: 'put',
    path: '/api/users/{id}',
    request: {
      params: IdParamSchema,
      body: {
        content: { 'application/json': { schema: UpdateUserSchema } }
      }
    },
    responses: {
      200: {
        content: { 'application/json': { schema: UserSchema } },
        description: 'ユーザー更新成功'
      },
      404: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'ユーザーが見つからない'
      },
      500: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'データベースエラー'
      }
    }
  });

  // PUT /api/users/{id} エンドポイント実装
  app.openapi(updateUserRoute, async (c) => {
    const { id } = c.req.valid('param');
    const updateData = c.req.valid('json');

    try {
      // メールアドレスが変更される場合は重複チェック
      if (updateData.email) {
        const existingUser = await db
          .selectFrom('users')
          .select('id')
          .where('email', '=', updateData.email.toLowerCase())
          .where('id', '!=', id)
          .executeTakeFirst();

        if (existingUser) {
          return c.json({
            success: false,
            message: 'Email already exists',
            error: 'このメールアドレスは既に使用されています'
          }, 500); // Server Error - business logic error
        }
      }

      // パスワードが含まれている場合はハッシュ化
      const { password, ...updateFields } = updateData;
      const dataToUpdate = password
        ? { ...updateFields, password_hash: await hashPassword(password) }
        : updateFields;

      const updatedUser = await db
        .updateTable('users')
        .set(dataToUpdate)
        .where('id', '=', id)
        .returning(['id', 'name', 'email', 'active', 'created_at'])
        .executeTakeFirst();

      if (!updatedUser) {
        return c.json({
          success: false,
          message: 'User not found'
        }, 404);
      }

      return c.json({
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        active: updatedUser.active,
        created_at: updatedUser.created_at.toISOString()
      }, 200);
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

const storeDeleteUserRoute = (app: OpenAPIHono) => {
  // DELETE /api/users/{id} ルート定義
  const deleteUserRoute = createRoute({
    method: 'delete',
    path: '/api/users/{id}',
    request: { params: IdParamSchema },
    responses: {
      204: {
        description: 'ユーザー削除成功'
      },
      404: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'ユーザーが見つからない'
      },
      500: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'データベースエラー'
      }
    }
  });

  // DELETE /api/users/{id} エンドポイント実装
  app.openapi(deleteUserRoute, async (c) => {
    const { id } = c.req.valid('param');

    try {
      const result = await db
        .deleteFrom('users')
        .where('id', '=', id)
        .executeTakeFirst();

      if (result.numDeletedRows === 0n) {
        return c.json({
          success: false,
          message: 'User not found'
        }, 404);
      }

      return c.body(null, 204);
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