import { describe, it, expect, beforeAll } from 'vitest';
import { sign } from 'hono/jwt';
import type { generateJWT as GenerateJWTFn, verifyJWT as VerifyJWTFn } from './auth.js';

// JWT payload の userId は uuid 化に伴い string。verifyJWT が string userId のみを
// 受理し、旧 number userId (uuid 化前に発行された token) を拒否することを固定する。
// auth.js は import 時に JWT_SECRET を読むため、env を設定してから dynamic import する。
const JWT_SECRET = 'test-jwt-secret';
process.env.JWT_SECRET = JWT_SECRET;

const UUID = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
const futureExp = Math.floor(Date.now() / 1000) + 3600;

let generateJWT: typeof GenerateJWTFn;
let verifyJWT: typeof VerifyJWTFn;

beforeAll(async () => {
  const mod = await import('./auth.js');
  generateJWT = mod.generateJWT;
  verifyJWT = mod.verifyJWT;
});

describe('verifyJWT', () => {
  it('generateJWT で発行した string userId の token を復号すると payload が一致する', async () => {
    const token = await generateJWT({ userId: UUID, email: 'user@example.com' });
    const payload = await verifyJWT(token);
    expect(payload).toEqual({ userId: UUID, email: 'user@example.com' });
  });

  it('userId が number の token のとき null を返す', async () => {
    const token = await sign({ userId: 1, email: 'user@example.com', exp: futureExp }, JWT_SECRET, 'HS256');
    const payload = await verifyJWT(token);
    expect(payload).toBeNull();
  });

  it('email を欠く token のとき null を返す', async () => {
    const token = await sign({ userId: UUID, exp: futureExp }, JWT_SECRET, 'HS256');
    const payload = await verifyJWT(token);
    expect(payload).toBeNull();
  });

  it('不正な token 文字列のとき null を返す', async () => {
    const payload = await verifyJWT('not-a-token');
    expect(payload).toBeNull();
  });
});
