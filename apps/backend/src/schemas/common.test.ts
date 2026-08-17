import { describe, it, expect } from 'vitest';
import { IdParamSchema } from './common.js';

// id パスパラメータの uuid 検証。3 テーブル (users/items/images) は同一の
// IdParamSchema を共有するため、本スキーマの検証で 3 テーブル分を代表する。
describe('IdParamSchema', () => {
  it('有効な uuid のとき success を返す', () => {
    const result = IdParamSchema.safeParse({ id: '3fa85f64-5717-4562-b3fc-2c963f66afa6' });
    expect(result.success).toBe(true);
  });

  it('非 uuid の英字文字列のとき失敗する', () => {
    const result = IdParamSchema.safeParse({ id: 'abc' });
    expect(result.success).toBe(false);
  });

  it('旧 serial の数値文字列のとき失敗する', () => {
    const result = IdParamSchema.safeParse({ id: '1' });
    expect(result.success).toBe(false);
  });

  it('空文字のとき失敗する', () => {
    const result = IdParamSchema.safeParse({ id: '' });
    expect(result.success).toBe(false);
  });

  it('桁が 1 文字欠けた uuid のとき失敗する', () => {
    const result = IdParamSchema.safeParse({ id: '3fa85f64-5717-4562-b3fc-2c963f66afa' });
    expect(result.success).toBe(false);
  });

  it('末尾に余分な文字を持つ uuid のとき失敗する', () => {
    const result = IdParamSchema.safeParse({ id: '3fa85f64-5717-4562-b3fc-2c963f66afa6x' });
    expect(result.success).toBe(false);
  });
});
