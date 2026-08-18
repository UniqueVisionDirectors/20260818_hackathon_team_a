import type { CreateRankingRequest, RankingEntry } from '@/types';
import { api, ApiError } from './api';

export async function getRankings(signal?: AbortSignal): Promise<RankingEntry[]> {
  try {
    return await api<RankingEntry[]>('/rankings', {
      method: 'GET',
      signal,
    });
  } catch (error) {
    if (error instanceof ApiError || signal?.aborted) {
      throw error;
    }

    throw new ApiError('ランキングの取得に失敗しました');
  }
}

export async function createRanking(
  request: CreateRankingRequest,
  signal?: AbortSignal,
): Promise<RankingEntry> {
  try {
    return await api<RankingEntry>('/rankings', {
      method: 'POST',
      body: request,
      signal,
    });
  } catch (error) {
    if (error instanceof ApiError || signal?.aborted) {
      throw error;
    }

    throw new ApiError('スコアの登録に失敗しました');
  }
}
