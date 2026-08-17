import type { OpenAPIHono} from '@hono/zod-openapi';
import { createRoute } from '@hono/zod-openapi'
import { HealthResponseSchema } from '../schemas/common.js'

export const storeHealthApi = (app: OpenAPIHono) => {

  // Health check route definition
  const healthRoute = createRoute({
    method: 'get',
    path: '/health',
    responses: {
      200: {
        content: { 'application/json': { schema: HealthResponseSchema } },
        description: 'システムヘルスステータス'
      }
    }
  });
  
  // Health check
  app.openapi(healthRoute, (c) => {
    return c.json({ status: 'ok' });
  });
};