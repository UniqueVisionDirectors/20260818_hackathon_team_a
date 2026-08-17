import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import type { Item } from '@/types';

const serviceMocks = vi.hoisted(() => ({
  getItems: vi.fn<() => Promise<Item[]>>(() => Promise.resolve([])),
  createItem: vi.fn(),
  updateItem: vi.fn(),
  deleteItem: vi.fn(),
}));

vi.mock('@/services/items.service', () => serviceMocks);

import { useItemsStore } from './items.store';

function makeItem(id: string, name: string): Item {
  return {
    id,
    name,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };
}

describe('useItemsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('検索クエリ設定時: 部分一致(大文字小文字無視)でフィルタされ、ページが 1 にリセットされる', () => {
    const store = useItemsStore();
    store.items = [makeItem('1', 'MacBook Pro'), makeItem('2', 'iPhone 15'), makeItem('3', 'iPad Air')];
    store.setCurrentPage(1);

    store.setSearchQuery('ip');

    expect(store.filteredItems.map(i => i.name)).toEqual(['iPhone 15', 'iPad Air']);
    expect(store.currentPage).toBe(1);
  });

  it('ページ設定時: 範囲外の値は 1..totalPages に丸められる', () => {
    const store = useItemsStore();
    store.items = Array.from({ length: 25 }, (_, i) => makeItem(String(i), `item-${String(i)}`));

    store.setCurrentPage(99);
    expect(store.currentPage).toBe(3); // 25 件 / perPage 10 = 3 ページ

    store.setCurrentPage(0);
    expect(store.currentPage).toBe(1);
  });

  it('fetchItems 失敗時(非 401): error にメッセージが入り loading が解除される', async () => {
    // useItemsStore() は store 生成時に fetchItems() を自動発火するため、
    // mockRejectedValueOnce だと自動発火側が先に消費してしまう。Value(常時 reject)を使う
    serviceMocks.getItems.mockRejectedValue(new Error('network down'));
    const store = useItemsStore();

    await store.fetchItems();

    expect(store.error).toBe('network down');
    expect(store.loading).toBe(false);
  });
});
