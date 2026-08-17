import type { OpenAPIHono} from '@hono/zod-openapi';
import { createRoute } from '@hono/zod-openapi';
import { authMiddleware } from '../middleware/auth.js';
import { ItemListSchema, ItemSchema, CreateItemSchema, UpdateItemSchema } from '../schemas/items.js';
import { ErrorResponseSchema, IdParamSchema } from '../schemas/common.js';
import { db } from '../db/connection.js';

export const storeItemApi = (app: OpenAPIHono) => {
  app.use('/api/items/*', authMiddleware);
  storeGetItemRoute(app);
  storeGetItemsRoute(app);
  storeCreateItemRoute(app);
  storeUpdateItemRoute(app);
  storeDeleteUserRoute(app);
};

const storeGetItemRoute = (app: OpenAPIHono) => {

  // GET /api/items ルート定義
  const getItemsRoute = createRoute({
    method: 'get',
    path: '/api/items',
    responses: {
      200: {
        content: { 'application/json': { schema: ItemListSchema } },
        description: 'アイテム一覧を取得'
      },
      500: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'データベースエラー'
      }
    }
  });

  // GET /api/items エンドポイント実装
  app.openapi(getItemsRoute, async (c) => {
    try {
      const items = await db
        .selectFrom('items')
        .select(['id', 'name', 'created_at', 'updated_at'])
        .orderBy('created_at', 'desc')
        .execute();

      const formattedItems = items.map(item => ({
        id: item.id,
        name: item.name,
        created_at: item.created_at.toISOString(),
        updated_at: item.updated_at.toISOString()
      }));

      return c.json(formattedItems, 200);
    } catch (error) {
      console.error('Database error:', error);
      return c.json({
        success: false,
        message: 'Database error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });
}

const storeGetItemsRoute = (app: OpenAPIHono) => {
  // GET /api/items/{id} ルート定義
  const getItemRoute = createRoute({
    method: 'get',
    path: '/api/items/{id}',
    request: { params: IdParamSchema },
    responses: {
      200: {
        content: { 'application/json': { schema: ItemSchema } },
        description: 'アイテム情報を取得'
      },
      404: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'アイテムが見つからない'
      },
      500: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'データベースエラー'
      }
    }
  });

  // GET /api/items/{id} エンドポイント実装
  app.openapi(getItemRoute, async (c) => {
    const { id } = c.req.valid('param');

    try {
      const item = await db
        .selectFrom('items')
        .select(['id', 'name', 'created_at', 'updated_at'])
        .where('id', '=', id)
        .executeTakeFirst();

      if (!item) {
        return c.json({
          success: false,
          message: 'Item not found'
        }, 404);
      }

      return c.json({
        id: item.id,
        name: item.name,
        created_at: item.created_at.toISOString(),
        updated_at: item.updated_at.toISOString()
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
}

const storeCreateItemRoute = (app: OpenAPIHono) => {
  // POST /api/items ルート定義
  const createItemRoute = createRoute({
    method: 'post',
    path: '/api/items',
    request: {
      body: {
        content: { 'application/json': { schema: CreateItemSchema } }
      }
    },
    responses: {
      201: {
        content: { 'application/json': { schema: ItemSchema } },
        description: 'アイテム作成成功'
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

  // POST /api/items エンドポイント実装
  app.openapi(createItemRoute, async (c) => {
    const itemData = c.req.valid('json');

    try {
      const newItem = await db
        .insertInto('items')
        .values({
          name: itemData.name
        })
        .returning(['id', 'name', 'created_at', 'updated_at'])
        .executeTakeFirstOrThrow();

      return c.json({
        id: newItem.id,
        name: newItem.name,
        created_at: newItem.created_at.toISOString(),
        updated_at: newItem.updated_at.toISOString()
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
}

const storeUpdateItemRoute = (app: OpenAPIHono) => {

  // PUT /api/items/{id} ルート定義
  const updateItemRoute = createRoute({
    method: 'put',
    path: '/api/items/{id}',
    request: {
      params: IdParamSchema,
      body: {
        content: { 'application/json': { schema: UpdateItemSchema } }
      }
    },
    responses: {
      200: {
        content: { 'application/json': { schema: ItemSchema } },
        description: 'アイテム更新成功'
      },
      404: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'アイテムが見つからない'
      },
      500: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'データベースエラー'
      }
    }
  });

  // PUT /api/items/{id} エンドポイント実装
  app.openapi(updateItemRoute, async (c) => {
    const { id } = c.req.valid('param');
    const updateData = c.req.valid('json');

    try {
      const updatedItem = await db
        .updateTable('items')
        .set(updateData)
        .where('id', '=', id)
        .returning(['id', 'name', 'created_at', 'updated_at'])
        .executeTakeFirst();

      if (!updatedItem) {
        return c.json({
          success: false,
          message: 'Item not found'
        }, 404);
      }

      return c.json({
        id: updatedItem.id,
        name: updatedItem.name,
        created_at: updatedItem.created_at.toISOString(),
        updated_at: updatedItem.updated_at.toISOString()
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
}

const storeDeleteUserRoute = (app: OpenAPIHono) => {
  // DELETE /api/items/{id} ルート定義
  const deleteItemRoute = createRoute({
    method: 'delete',
    path: '/api/items/{id}',
    request: { params: IdParamSchema },
    responses: {
      204: {
        description: 'アイテム削除成功'
      },
      404: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'アイテムが見つからない'
      },
      500: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'データベースエラー'
      }
    }
  });

  // DELETE /api/items/{id} エンドポイント実装
  app.openapi(deleteItemRoute, async (c) => {
    const { id } = c.req.valid('param');

    try {
      const result = await db
        .deleteFrom('items')
        .where('id', '=', id)
        .executeTakeFirst();

      if (result.numDeletedRows === 0n) {
        return c.json({
          success: false,
          message: 'Item not found'
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