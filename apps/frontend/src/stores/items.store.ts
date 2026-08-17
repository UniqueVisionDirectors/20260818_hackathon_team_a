import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Item, CreateItemInput, UpdateItemInput } from '@/types';
import * as itemsService from '@/services/items.service';
import { ApiError, toErrorMessage } from '@/services/api';
import { useAuthStore } from './auth.store';

/**
 * アイテム管理ストア
 * アイテムデータのCRUD操作と状態管理
 */
export const useItemsStore = defineStore('items', () => {
  // Auth store for error handling
  const authStore = useAuthStore();

  // State
  const items = ref<Item[]>([]);
  const isInitialized = ref<boolean>(false);

  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);
  const searchQuery = ref<string>('');
  const currentPage = ref<number>(1);
  const perPage = ref<number>(10);

  // Getters
  /**
   * 全アイテム数
   */
  const totalItems = computed(() => items.value.length);

  /**
   * 既存のアイテム名リスト（重複チェック用）
   */
  const existingNames = computed(() =>
    items.value.map(item => item.name.toLowerCase())
  );

  /**
   * 検索フィルタリングされたアイテム
   */
  const filteredItems = computed(() => {
    if (!searchQuery.value) {
      return items.value;
    }

    const query = searchQuery.value.toLowerCase();
    return items.value.filter(item =>
      item.name.toLowerCase().includes(query)
    );
  });

  /**
   * ページネーション適用後のアイテム
   */
  const paginatedItems = computed(() => {
    const start = (currentPage.value - 1) * perPage.value;
    const end = start + perPage.value;
    return filteredItems.value.slice(start, end);
  });

  /**
   * 総ページ数
   */
  const totalPages = computed(() =>
    Math.ceil(filteredItems.value.length / perPage.value)
  );

  // Actions
  /**
   * アイテム追加
   * @param input アイテム作成情報
   * @returns Promise<Item> 作成されたアイテム
   */
  async function addItem(input: CreateItemInput): Promise<Item> {
    loading.value = true;
    error.value = null;

    try {
      // APIを使用してアイテムを作成
      const newItem = await itemsService.createItem({
        name: input.name.trim()
      });

      // ローカルステートを更新
      items.value.push(newItem);
      return newItem;
    } catch (err) {
      // 認証エラー時は認証ストアでナビゲーション処理
      if (err instanceof ApiError && err.status === 401) {
        authStore.handleAuthError();
        throw err;
      }
      error.value = toErrorMessage(err, 'アイテムの追加に失敗しました。');
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * アイテム更新
   * @param id アイテムID
   * @param input 更新情報
   * @returns Promise<Item> 更新されたアイテム
   */
  async function updateItem(id: string, input: UpdateItemInput): Promise<Item> {
    loading.value = true;
    error.value = null;

    try {
      // APIを使用してアイテムを更新
      const updatedItem = await itemsService.updateItem(id, {
        name: input.name?.trim()
      });

      // ローカルステートを更新
      const itemIndex = items.value.findIndex(item => item.id === id);
      if (itemIndex !== -1) {
        items.value[itemIndex] = updatedItem;
      }

      return updatedItem;
    } catch (err) {
      // 認証エラー時は認証ストアでナビゲーション処理
      if (err instanceof ApiError && err.status === 401) {
        authStore.handleAuthError();
        throw err;
      }
      error.value = toErrorMessage(err, 'アイテムの更新に失敗しました。');
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * アイテム削除
   * @param id アイテムID
   */
  async function deleteItem(id: string): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      // APIを使用してアイテムを削除
      await itemsService.deleteItem(id);

      // ローカルステートから削除
      const itemIndex = items.value.findIndex(item => item.id === id);
      if (itemIndex !== -1) {
        items.value.splice(itemIndex, 1);
      }

      // 削除後、現在のページに項目がない場合は前のページに戻る
      if (paginatedItems.value.length === 0 && currentPage.value > 1) {
        currentPage.value--;
      }
    } catch (err) {
      // 認証エラー時は認証ストアでナビゲーション処理
      if (err instanceof ApiError && err.status === 401) {
        authStore.handleAuthError();
        throw err;
      }
      error.value = toErrorMessage(err, 'アイテムの削除に失敗しました。');
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * アイテムをIDで取得
   * @param id アイテムID
   * @returns Item | undefined
   */
  function getItemById(id: string): Item | undefined {
    return items.value.find(item => item.id === id);
  }

  /**
   * 検索クエリを設定
   * @param query 検索文字列
   */
  function setSearchQuery(query: string): void {
    searchQuery.value = query;
    currentPage.value = 1; // 検索時はページをリセット
  }

  /**
   * ページを設定
   * @param page ページ番号
   */
  function setCurrentPage(page: number): void {
    currentPage.value = Math.max(1, Math.min(page, totalPages.value));
  }

  /**
   * アイテム一覧を取得
   */
  async function fetchItems(): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      // APIからアイテム一覧を取得
      const fetchedItems = await itemsService.getItems();
      items.value = fetchedItems;
      isInitialized.value = true;
    } catch (err) {
      // 認証エラー時は認証ストアでナビゲーション処理
      if (err instanceof ApiError && err.status === 401) {
        authStore.handleAuthError();
        return;
      }
      error.value = toErrorMessage(err, 'アイテム一覧の取得に失敗しました。');
    } finally {
      loading.value = false;
    }
  }

  /**
   * エラーのクリア
   */
  function clearError(): void {
    error.value = null;
  }

  // 初期データの取得
  if (!isInitialized.value) {
    // store 初期化時の fire-and-forget(エラーは error state 側で扱う)
    void fetchItems();
  }

  return {
    // State
    items,
    loading,
    error,
    searchQuery,
    currentPage,
    perPage,

    // Getters
    totalItems,
    existingNames,
    filteredItems,
    paginatedItems,
    totalPages,

    // Actions
    fetchItems,
    addItem,
    updateItem,
    deleteItem,
    getItemById,
    setSearchQuery,
    setCurrentPage,
    clearError
  };
});