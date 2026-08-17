/**
 * Items Service
 * Handles all item-related API calls
 */
import { api, ApiError } from './api';
import type {
  ItemResponse,
  CreateItemRequest,
  UpdateItemRequest,
  PaginationParams,
} from '@/types';

/**
 * Get all items
 */
export async function getItems(params?: PaginationParams): Promise<ItemResponse[]> {
  try {
    const queryParams = new URLSearchParams();

    if (params?.page) {
      queryParams.append('_page', params.page.toString());
    }
    if (params?.limit) {
      queryParams.append('_limit', params.limit.toString());
    }
    if (params?.sort) {
      queryParams.append('_sort', params.sort);
    }
    if (params?.order) {
      queryParams.append('_order', params.order);
    }

    const query = queryParams.toString();
    const url = `/items${query ? `?${query}` : ''}`;

    const items = await api<ItemResponse[]>(url, {
      method: 'GET',
    });

    return items;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('アイテム一覧の取得に失敗しました');
  }
}

/**
 * Create new item
 */
export async function createItem(data: CreateItemRequest): Promise<ItemResponse> {
  try {
    const item = await api<ItemResponse>('/items', {
      method: 'POST',
      body: data,
    });

    return item;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('アイテムの作成に失敗しました');
  }
}

/**
 * Update item
 */
export async function updateItem(
  id: string,
  data: UpdateItemRequest
): Promise<ItemResponse> {
  try {
    const item = await api<ItemResponse>(`/items/${id}`, {
      method: 'PUT',
      body: data,
    });

    return item;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('アイテム情報の更新に失敗しました');
  }
}

/**
 * Delete item
 */
export async function deleteItem(id: string): Promise<void> {
  try {
    await api(`/items/${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('アイテムの削除に失敗しました');
  }
}
