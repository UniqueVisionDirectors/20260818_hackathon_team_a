import { OpenAPIHono } from '@hono/zod-openapi'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { storeUserApi, storeItemApi, storeHealthApi, storeAuthApi, storeImageApi } from './apis/index.js'

const basePath = process.env.BASE_PATH ?? ''

export const app = new OpenAPIHono()

// Middleware
app.use('*', logger())
app.use('*', cors())

// Routes
app.get('/', (c) => {
  return c.text('Hello Hono!')
})

// API Routes - BASE_PATH 配下に配置
// APIファイルのルート定義には既に /api が含まれているため、basePathにはBASE_PATHのみを設定
const apiApp = app.basePath(basePath)

storeHealthApi(apiApp)
storeUserApi(apiApp)
storeItemApi(apiApp)
storeAuthApi(apiApp)
storeImageApi(apiApp)


// OpenAPI仕様書の生成
apiApp.doc('/doc', {
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'Babylon Stack API',
    description: 'Vue + Babylon.js + Hono + PostgreSQL'
  }
})

// Swagger UI エンドポイント
apiApp.get('/swagger-ui', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>API Documentation</title>
      <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@3.52.5/swagger-ui.css" />
    </head>
    <body>
      <div id="swagger-ui"></div>
      <script src="https://unpkg.com/swagger-ui-dist@3.52.5/swagger-ui-bundle.js"></script>
      <script>
        SwaggerUIBundle({
          url: '${basePath}/doc',
          dom_id: '#swagger-ui',
          presets: [
            SwaggerUIBundle.presets.apis,
            SwaggerUIBundle.presets.standalone
          ]
        })
      </script>
    </body>
    </html>
  `)
})
