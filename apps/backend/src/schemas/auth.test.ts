import { describe, it, expect } from 'vitest';
import { LoginResponseSchema, SessionResponseSchema } from './auth.js';

const UUID = '3fa85f64-5717-4562-b3fc-2c963f66afa6';

// user.id の型統一 (uuid 化に伴い number → string)。auth 経路が number を返すと
// /api/users との id 表現が割れるため、string のみを受理することを回帰として固定する。
describe('LoginResponseSchema', () => {
  it('user.id が string(uuid) のとき success を返す', () => {
    const result = LoginResponseSchema.safeParse({
      success: true,
      data: {
        token: 'jwt-token',
        user: { id: UUID, name: 'John Doe', email: 'user@example.com' }
      }
    });
    expect(result.success).toBe(true);
  });

  it('user.id が number のとき失敗する', () => {
    const result = LoginResponseSchema.safeParse({
      success: true,
      data: {
        token: 'jwt-token',
        user: { id: 1, name: 'John Doe', email: 'user@example.com' }
      }
    });
    expect(result.success).toBe(false);
  });
});

describe('SessionResponseSchema', () => {
  it('user.id が string(uuid) のとき success を返す', () => {
    const result = SessionResponseSchema.safeParse({
      success: true,
      data: {
        user: { id: UUID, name: 'John Doe', email: 'user@example.com' }
      }
    });
    expect(result.success).toBe(true);
  });

  it('user.id が number のとき失敗する', () => {
    const result = SessionResponseSchema.safeParse({
      success: true,
      data: {
        user: { id: 1, name: 'John Doe', email: 'user@example.com' }
      }
    });
    expect(result.success).toBe(false);
  });
});
