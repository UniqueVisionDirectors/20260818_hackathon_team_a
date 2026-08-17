import bcrypt from 'bcrypt'
import { sign, verify } from 'hono/jwt'

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-key-change-in-production'

/**
 * JWT に格納する認証ペイロード
 */
export interface AuthTokenPayload {
  userId: string
  email: string
}

/**
 * Hash a password using bcrypt
 * @param password Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

/**
 * Verify a password against a hash
 * @param password Plain text password
 * @param hash Hashed password
 * @returns True if password matches
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Generate a JWT token
 * @param payload Token payload
 * @returns JWT token string
 */
export async function generateJWT(payload: AuthTokenPayload): Promise<string> {
  // Calculate expiration time (24 hours from now)
  const exp = Math.floor(Date.now() / 1000) + (24 * 60 * 60)

  return sign({ ...payload, exp }, JWT_SECRET, 'HS256')
}

/**
 * Verify and decode a JWT token
 * @param token JWT token string
 * @returns Decoded payload or null if invalid
 */
export async function verifyJWT(token: string): Promise<AuthTokenPayload | null> {
  try {
    const { userId, email } = await verify(token, JWT_SECRET, 'HS256')
    if (typeof userId !== 'string' || typeof email !== 'string') {
      return null
    }
    return { userId, email }
  } catch {
    return null
  }
}
