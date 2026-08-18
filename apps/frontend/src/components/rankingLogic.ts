import type { RankingEntry } from '@/types';

const TOP_RANKING_COUNT = 10;
const MAX_NICKNAME_LENGTH = 255;

interface RankedEntry extends RankingEntry {
  rank: number;
}

interface RankingView {
  topEntries: RankedEntry[];
  currentEntry: RankedEntry | null;
  currentEntryIsOutsideTopTen: boolean;
  isOutsideTopHundred: boolean;
}

export const normalizeNickname = (nickname: string): string | null => {
  const normalized = nickname.trim();

  if (normalized.length === 0 || normalized.length > MAX_NICKNAME_LENGTH) {
    return null;
  }

  return normalized;
};

export const buildRankingView = (
  entries: RankingEntry[],
  submittedRankingId: string | null,
): RankingView => {
  const rankedEntries = entries.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
  const currentEntry = submittedRankingId === null
    ? null
    : rankedEntries.find(entry => entry.id === submittedRankingId) ?? null;

  return {
    topEntries: rankedEntries.slice(0, TOP_RANKING_COUNT),
    currentEntry,
    currentEntryIsOutsideTopTen: currentEntry !== null
      && currentEntry.rank > TOP_RANKING_COUNT,
    isOutsideTopHundred: submittedRankingId !== null && currentEntry === null,
  };
};
