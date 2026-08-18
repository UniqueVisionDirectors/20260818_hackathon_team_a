import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CreateRankingRequest, RankingEntry } from '@/types';
import type * as apiModule from './api';

const apiMock = vi.hoisted(() => vi.fn());

vi.mock('./api', async (importOriginal) => {
  const actual = await importOriginal<typeof apiModule>();
  return { ...actual, api: apiMock };
});

import { ApiError } from './api';
import { createRanking, getRankings } from './rankings.service';

const ranking: RankingEntry = {
  id: 'ranking-1',
  nickname: 'Player 1',
  score: 12,
  created_at: '2026-08-18T00:00:00.000Z',
};

describe('rankings service', () => {
  beforeEach(() => {
    apiMock.mockReset();
  });

  it('GET /rankingsでランキング一覧を取得する', async () => {
    const controller = new AbortController();
    apiMock.mockResolvedValue([ranking]);

    await expect(getRankings(controller.signal)).resolves.toEqual([ranking]);
    expect(apiMock).toHaveBeenCalledWith('/rankings', {
      method: 'GET',
      signal: controller.signal,
    });
  });

  it('POST /rankingsでnicknameとscoreを登録する', async () => {
    const request: CreateRankingRequest = { nickname: 'Player 1', score: 12 };
    const controller = new AbortController();
    apiMock.mockResolvedValue(ranking);

    await expect(createRanking(request, controller.signal)).resolves.toEqual(ranking);
    expect(apiMock).toHaveBeenCalledWith('/rankings', {
      method: 'POST',
      body: request,
      signal: controller.signal,
    });
  });

  it.each([
    ['取得', () => getRankings(), 'ランキングの取得に失敗しました'],
    ['登録', () => createRanking({ nickname: 'Player 1', score: 12 }), 'スコアの登録に失敗しました'],
  ] as const)('%s時の不明な例外をApiErrorへ変換する', async (_label, action, message) => {
    apiMock.mockRejectedValue(new Error('network error'));

    await expect(action()).rejects.toEqual(expect.objectContaining({
      name: 'ApiError',
      message,
    }));
  });

  it.each([
    ['取得', () => getRankings()],
    ['登録', () => createRanking({ nickname: 'Player 1', score: 12 })],
  ] as const)('%s時のApiErrorをそのまま再throwする', async (_label, action) => {
    const error = new ApiError('API error', 500);
    apiMock.mockRejectedValue(error);

    await expect(action()).rejects.toBe(error);
  });
});
