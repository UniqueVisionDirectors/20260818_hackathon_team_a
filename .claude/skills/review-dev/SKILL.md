---
name: review-dev
description: 今回の開発内容を第三者目線で徹底レビューし、計画→指摘→修正→再検証まで行う。観点は凝集度・責務分離・DRY・KISS・テスタビリティ。既存実装も対象に含める
user-invocable: true
model: claude-fable-5
---

# 開発内容の第三者レビュー

## トリガー

ユーザーが今回の開発内容のレビューを依頼したとき。`/review-dev` で明示的に呼び出す。

> 将来課題として **記録のみ** する場合は [refactoring-check](../refactoring-check/SKILL.md)。本 skill は **その場で修正まで行う** 徹底レビュー。

## スコープ

- `git diff` 等で **今回の変更ファイルを列挙** し、変更箇所＋影響範囲＋周辺を対象とする。
- 「既存の実装だから」を見逃しの理由にしない。既存実装の抽象度不足など根本原因があれば、影響範囲が多少広がっても根本改修を検討する。**ただし抽象化が常に正ではない**（不要な共通化は結合を増やす）。

## 必須観点（最低限の floor。各対象ファイルに対して評価）

以下は **どの変更でも必ず見る最低限（floor）**。これだけで十分とはみなさず、変更固有のリスクから追加観点を動的に導出して足し込む（原則の正は [`coverage-floor-not-ceiling`](../../rules/coverage-floor-not-ceiling.md)、導出はアクション 1）。

- **凝集度 / 責務分離**: モジュール・関数が単一責務に収まっているか。
- **DRY**: 「知識の重複」を排除する。見た目の重複ではない。共通化で結合が増えるなら重複を残す（CLAUDE.md の DRY 定義に従う）。逆方向も見る — 共通化候補を「見た目の重複 / 偽の対称」と棄却する前に、高次元抽象探索（差分が射影・評価時点・文脈のみか、規則そのものか。正は [`design-quality-gates`](../../rules/design-quality-gates.md)）を経る。
- **KISS**: 要件に対し過剰設計でないか。
- **テスタビリティ**: 純粋関数へのロジック切り出し、ステートレス部分とステートフル部分の分離ができているか。
- **既存実装との整合性**。
- **フロント web プラットフォーム準拠**（フロントの UI / CSS / クライアント JS 変更を含む場合のみ）: 旧パターン（JS 手管理で代替できる新 CSS 機能の不使用など）を採っていないか。観点取得に `/modern-web-guidance` を用いる（正は `.claude/rules/design-quality-gates.md` フロント節）。

## アクション（計画 → 指摘 → 修正 → 再検証）

1. **レビュー計画** を立てる。対象ファイルを読み、変更固有のリスクから**追加観点を動的に導出**して必須観点（floor）に足し込み、**floor + 追加観点**でどのファイルをどの観点で見るかを決める（floor だけで十分とみなさない。原則の正は [`coverage-floor-not-ceiling`](../../rules/coverage-floor-not-ceiling.md)）。
2. 指摘を表で洗い出す:

   | ファイル:行 | 観点 | 重大度 | 根拠 | 対応方針 |
   |---|---|---|---|---|

3. 修正を適用する。修正不要だが将来課題のものは TODO または [refactoring-check](../refactoring-check/SKILL.md) に記録する。
4. 修正後に再検証する（静的品質は [quality-check](../quality-check/SKILL.md) で確認）。

## 制約

- 特定 PRD に依存するコードコメント・ドキュメント記載は禁止（正は `.claude/rules/no-prd-references-in-code.md`）。完了時に grep で残存を確認する。
- 観点の網羅は [`coverage-floor-not-ceiling`](../../rules/coverage-floor-not-ceiling.md) に従う（floor だけで十分としない／変更固有の追加観点を動的に導出する）。
