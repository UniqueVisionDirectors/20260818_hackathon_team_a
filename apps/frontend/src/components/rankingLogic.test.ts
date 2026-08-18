import { describe, expect, it } from 'vitest';
import type { RankingEntry } from '@/types';
import { buildRankingView, normalizeNickname } from './rankingLogic';

const makeRankings = (count: number): RankingEntry[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `ranking-${String(index + 1)}`,
    nickname: `Player ${String(index + 1)}`,
    score: count - index,
    created_at: '2026-08-18T00:00:00.000Z',
  }));

describe('buildRankingView', () => {
  it('APIの返却順を順位として上位10件を返す', () => {
    const result = buildRankingView(makeRankings(12), null);

    expect(result.topEntries).toHaveLength(10);
    expect(result.topEntries[0]).toMatchObject({ id: 'ranking-1', rank: 1 });
    expect(result.topEntries[9]).toMatchObject({ id: 'ranking-10', rank: 10 });
  });

  it('自分が上位10件内の場合は該当行を特定する', () => {
    const result = buildRankingView(makeRankings(12), 'ranking-3');

    expect(result.currentEntry).toMatchObject({ id: 'ranking-3', rank: 3 });
    expect(result.currentEntryIsOutsideTopTen).toBe(false);
    expect(result.isOutsideTopHundred).toBe(false);
  });

  it('自分が11～100位の場合は別枠表示対象にする', () => {
    const result = buildRankingView(makeRankings(20), 'ranking-15');

    expect(result.currentEntry).toMatchObject({ id: 'ranking-15', rank: 15 });
    expect(result.currentEntryIsOutsideTopTen).toBe(true);
    expect(result.isOutsideTopHundred).toBe(false);
  });

  it('登録IDが取得結果にない場合は100位圏外とする', () => {
    const result = buildRankingView(makeRankings(100), 'ranking-101');

    expect(result.currentEntry).toBeNull();
    expect(result.isOutsideTopHundred).toBe(true);
  });

  it('登録失敗時は同名・同スコアの行を自分として扱わない', () => {
    const rankings = makeRankings(3);
    const result = buildRankingView(rankings, null);

    expect(result.currentEntry).toBeNull();
    expect(result.isOutsideTopHundred).toBe(false);
  });
});

describe('normalizeNickname', () => {
  it('前後の空白を除去する', () => {
    expect(normalizeNickname('  Player 1  ')).toBe('Player 1');
  });

  it('空白だけまたは255文字を超える値を拒否する', () => {
    expect(normalizeNickname('   ')).toBeNull();
    expect(normalizeNickname('a'.repeat(256))).toBeNull();
  });
});
