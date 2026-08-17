import type { OpenAPIHono} from '@hono/zod-openapi';
import { createRoute } from '@hono/zod-openapi';
import { authMiddleware } from '../middleware/auth.js';
import {
  ImageListSchema,
  ImageSchema,
  UploadUrlRequestSchema,
  UploadUrlResponseSchema,
  ConfirmUploadSchema
} from '../schemas/images.js';
import { ErrorResponseSchema, IdParamSchema } from '../schemas/common.js';
import type { Selectable } from 'kysely';
import { db } from '../db/connection.js';
import type { Images } from '../db/generated-types.js';
import {
  generateUploadUrl,
  generateDownloadUrl,
  deleteFile,
  getFileMetadata
} from '../utils/minio.js';

/**
 * DB画像データをAPIレスポンス形式に変換（重複ロジックの共通化）
 */
async function formatImageResponse(image: Selectable<Images>) {
  return {
    id: image.id,
    file_key: image.file_key,
    original_name: image.original_name,
    mime_type: image.mime_type,
    size: Number(image.size),
    url: await generateDownloadUrl(image.file_key),
    user_id: image.user_id ?? null,
    created_at: image.created_at.toISOString(),
    updated_at: image.updated_at.toISOString()
  };
}

export const storeImageApi = (app: OpenAPIHono) => {
  app.use('/api/images/*', authMiddleware);
  storeGetImagesRoute(app);
  storeGetImageRoute(app);
  storeRequestUploadUrlRoute(app);
  storeConfirmUploadRoute(app);
  storeDeleteImageRoute(app);
};

const storeGetImagesRoute = (app: OpenAPIHono) => {
  // GET /api/images ルート定義
  const getImagesRoute = createRoute({
    method: 'get',
    path: '/api/images',
    responses: {
      200: {
        content: { 'application/json': { schema: ImageListSchema } },
        description: '画像一覧を取得'
      },
      500: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'データベースエラー'
      }
    }
  });

  // GET /api/images エンドポイント実装
  app.openapi(getImagesRoute, async (c) => {
    try {
      const images = await db
        .selectFrom('images')
        .select(['id', 'file_key', 'original_name', 'mime_type', 'size', 'user_id', 'created_at', 'updated_at'])
        .orderBy('created_at', 'desc')
        .execute();

      const formattedImages = await Promise.all(
        images.map(image => formatImageResponse(image))
      );

      return c.json(formattedImages, 200);
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

const storeGetImageRoute = (app: OpenAPIHono) => {
  // GET /api/images/{id} ルート定義
  const getImageRoute = createRoute({
    method: 'get',
    path: '/api/images/{id}',
    request: { params: IdParamSchema },
    responses: {
      200: {
        content: { 'application/json': { schema: ImageSchema } },
        description: '画像情報を取得'
      },
      404: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: '画像が見つからない'
      },
      500: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'データベースエラー'
      }
    }
  });

  // GET /api/images/{id} エンドポイント実装
  app.openapi(getImageRoute, async (c) => {
    const { id } = c.req.valid('param');

    try {
      const image = await db
        .selectFrom('images')
        .select(['id', 'file_key', 'original_name', 'mime_type', 'size', 'user_id', 'created_at', 'updated_at'])
        .where('id', '=', id)
        .executeTakeFirst();

      if (!image) {
        return c.json({
          success: false,
          message: 'Image not found'
        }, 404);
      }

      return c.json(await formatImageResponse(image), 200);
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

const storeRequestUploadUrlRoute = (app: OpenAPIHono) => {
  const requestUploadUrlRoute = createRoute({
    method: 'post',
    path: '/api/images/upload-url',
    request: {
      body: {
        content: { 'application/json': { schema: UploadUrlRequestSchema } }
      }
    },
    responses: {
      200: {
        content: { 'application/json': { schema: UploadUrlResponseSchema } },
        description: '署名付きURL生成成功'
      },
      500: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'MinIOエラー'
      }
    }
  });

  app.openapi(requestUploadUrlRoute, async (c) => {
    const { filename, content_type } = c.req.valid('json');

    try {
      const { uploadUrl, fileKey } = await generateUploadUrl(filename, content_type);

      return c.json({
        upload_url: uploadUrl,
        file_key: fileKey,
        expires_in: 600
      }, 200);
    } catch (error) {
      console.error('MinIO error:', error);
      return c.json({
        success: false,
        message: 'Failed to generate upload URL',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });
};

const storeConfirmUploadRoute = (app: OpenAPIHono) => {
  const confirmUploadRoute = createRoute({
    method: 'post',
    path: '/api/images/confirm',
    request: {
      body: {
        content: { 'application/json': { schema: ConfirmUploadSchema } }
      }
    },
    responses: {
      201: {
        content: { 'application/json': { schema: ImageSchema } },
        description: '画像メタデータ保存成功'
      },
      400: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'ファイルが存在しない'
      },
      500: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'データベースエラー'
      }
    }
  });

  app.openapi(confirmUploadRoute, async (c) => {
    const body = c.req.valid('json');
    const { file_key, original_name, mime_type } = body;
    let size = body.size;

    try {
      // ⭐ ファイルの存在確認とメタデータ取得
      const metadata = await getFileMetadata(file_key);

      if (!metadata.exists || metadata.size === undefined) {
        return c.json({
          success: false,
          message: 'File not found in storage'
        }, 400);
      }

      // ⭐ サイズの二重チェック
      const MAX_SIZE = 10 * 1024 * 1024; // 10MB
      const actualSize = metadata.size;

      if (actualSize > MAX_SIZE) {
        // サイズ超過の場合はファイルを削除
        await deleteFile(file_key);
        console.warn(`⚠️ File size exceeds limit: ${String(actualSize)} bytes (max: ${String(MAX_SIZE)})`);
        return c.json({
          success: false,
          message: 'File size exceeds limit'
        }, 400);
      }

      // クライアントが送信したサイズと実際のサイズを比較
      if (actualSize !== size) {
        console.warn(`⚠️ Size mismatch for ${file_key}: expected ${String(size)}, got ${String(actualSize)}`);
        size = actualSize; // 実際のサイズを使用
      }

      const user = c.get('user');
      const userId = user?.id ?? null;

      const newImage = await db
        .insertInto('images')
        .values({
          file_key,
          original_name,
          mime_type,
          size: BigInt(size),
          user_id: userId
        })
        .returning(['id', 'file_key', 'original_name', 'mime_type', 'size', 'user_id', 'created_at', 'updated_at'])
        .executeTakeFirstOrThrow();

      return c.json(await formatImageResponse(newImage), 201);
    } catch (error) {
      console.error('❌ Database error:', error);
      return c.json({
        success: false,
        message: 'Failed to save image metadata',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });
};

const storeDeleteImageRoute = (app: OpenAPIHono) => {
  // DELETE /api/images/{id} ルート定義
  const deleteImageRoute = createRoute({
    method: 'delete',
    path: '/api/images/{id}',
    request: { params: IdParamSchema },
    responses: {
      204: {
        description: '画像削除成功'
      },
      404: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: '画像が見つからない'
      },
      500: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'データベースまたはMinIOエラー'
      }
    }
  });

  // DELETE /api/images/{id} エンドポイント実装
  app.openapi(deleteImageRoute, async (c) => {
    const { id } = c.req.valid('param');

    try {
      // 画像情報を取得
      const image = await db
        .selectFrom('images')
        .select(['file_key'])
        .where('id', '=', id)
        .executeTakeFirst();

      if (!image) {
        return c.json({
          success: false,
          message: 'Image not found'
        }, 404);
      }

      // MinIOからファイルを削除
      await deleteFile(image.file_key);

      // DBから削除
      await db
        .deleteFrom('images')
        .where('id', '=', id)
        .executeTakeFirst();

      return c.body(null, 204);
    } catch (error) {
      console.error('Delete error:', error);
      return c.json({
        success: false,
        message: 'Failed to delete image',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });
};
