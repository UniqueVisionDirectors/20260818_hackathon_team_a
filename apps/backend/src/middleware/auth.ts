import type { Context, Next } from 'hono'
import { verifyJWT } from '../utils/auth.js'
import { db } from '../db/connection.js'

/**
 * 認証済みユーザー情報(authMiddleware が context に設定する)
 */
export interface AuthUser {
  id: string
  name: string
  email: string
}

declare module 'hono' {
  interface ContextVariableMap {
    // authMiddleware を通らないルートでは未設定のため undefined を含める
    user: AuthUser | undefined
  }
}

/**
 * Authentication middleware for protected routes
 * Verifies Bearer token and attaches user to context
 */
export async function authMiddleware(c: Context, next: Next) {
  const authorization = c.req.header('Authorization')

  if (!authorization?.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401)
  }

  // Extract token from "Bearer <token>" format
  const token = authorization.slice(7)
  const payload = await verifyJWT(token)

  if (!payload) {
    return c.json({ success: false, error: 'Invalid token' }, 401)
  }

  // Fetch user information from database
  const user = await db
    .selectFrom('users')
    .select(['id', 'name', 'email'])
    .where('id', '=', payload.userId)
    .where('active', '=', true)
    .executeTakeFirst()

  if (!user) {
    return c.json({ success: false, error: 'User not found' }, 401)
  }

  // Attach user to context for use in route handlers
  c.set('user', user)
  await next()
}
