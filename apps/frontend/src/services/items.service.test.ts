import { describe, expect, it, vi } from 'vitest';
import type { ItemResponse } from '@/types';
import type * as apiModule from './api';

const apiMock = vi.hoisted(() =>
  vi.fn<(url: string, options: { method: string }) => Promise<ItemResponse[]>>()
);

vi.mock('./api', async (importOriginal) => {
  const actual = await importOriginal<typeof apiModule>();
  // ApiError(instanceof 判定に使用)は実物を保ち、api 関数だけモックする
  return { ...actual, api: apiMock };
});

import { ApiError } from './api';
import { getItems } from './items.service';

function makeItemResponse(id: string, name: string): ItemResponse {
  return {
    id,
    name,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };
}

describe('getItems', () => {
  it('パラメータなし: クエリ文字列なしの /items を GET し、取得結果を返す', async () => {
    const items = [makeItemResponse('1', 'MacBook Pro')];
    apiMock.mockResolvedValue(items);

    const result = await getItems();

    expect(apiMock).toHaveBeenCalledWith('/items', { method: 'GET' });
    expect(result).toEqual(items);
  });

  it('パラメータあり: page/limit/sort/order が _page/_limit/_sort/_order クエリに変換される', async () => {
    apiMock.mockResolvedValue([]);

    await getItems({ page: 2, limit: 5, sort: 'name', order: 'desc' });

    expect(apiMock).toHaveBeenCalledWith('/items?_page=2&_limit=5&_sort=name&_order=desc', {
      method: 'GET',
    });
  });

  it('api が非 ApiError で reject: 固定メッセージの ApiError に変換される', async () => {
    apiMock.mockRejectedValue(new Error('boom'));

    await expect(getItems()).rejects.toBeInstanceOf(ApiError);
    await expect(getItems()).rejects.toThrow('アイテム一覧の取得に失敗しました');
  });

  it('api が ApiError で reject: 変換されずそのまま再 throw される', async () => {
    const original = new ApiError('認証エラーが発生しました', 401);
    apiMock.mockRejectedValue(original);

    await expect(getItems()).rejects.toBe(original);
  });
});
