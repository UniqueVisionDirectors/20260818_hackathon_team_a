/**
 * アイテムエンティティの型定義
 */
export interface Item {
  id: string;
  name: string;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

/**
 * アイテム作成時の入力データ
 */
export interface CreateItemInput {
  name: string;
}

/**
 * アイテム更新時の入力データ
 */
export interface UpdateItemInput {
  name?: string;
}