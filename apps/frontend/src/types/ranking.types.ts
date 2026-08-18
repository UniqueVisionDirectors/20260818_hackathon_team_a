export interface RankingEntry {
  id: string;
  nickname: string;
  score: number;
  created_at: string;
}

export interface CreateRankingRequest {
  nickname: string;
  score: number;
}
