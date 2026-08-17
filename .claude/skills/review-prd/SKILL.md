---
name: review-prd
description: 作成した PRD を第三者目線で徹底レビューし、計画→指摘→修正まで行う。観点は曖昧さの排除・受入基準の検証可能性・スコープ境界・凝集/責務・整合性
user-invocable: true
model: claude-fable-5
---

# PRD の第三者レビュー

## トリガー

ユーザーが作成済み PRD のレビューを依頼したとき。`/review-prd` で明示的に呼び出す。

> PRD の構造・記法の正は [prd-template](../prd-template/SKILL.md)。本 skill は **既存 PRD の品質をレビューし修正する**（作成は prd-template の領分）。

## スコープ

- 今回作成・変更した `backlog/` 配下の PRD を対象とする。
- 既存 PRD・実装・plan.md との整合性も確認する。「既存記載だから」を見逃しの理由にしない。

## 必須観点（最低限の floor）

以下は **どの PRD でも必ず見る最低限（floor）**。これだけで十分とはみなさず、PRD 固有のリスクから追加観点を動的に導出して足し込む（原則の正は [`coverage-floor-not-ceiling`](../../rules/coverage-floor-not-ceiling.md)、導出はアクション 1）。

- **曖昧さの排除**: 解釈の余地のある記述を、観測可能・具体的な表現に直せるか。初出定義のない造語・作業ラベル（目的・対象を省いた抽象名詞句）・一語多役は [`referent-before-label`](../../rules/referent-before-label.md) 違反として指摘する。
- **受入基準の検証可能性**: 各受入基準が定量的・観測可能で、合否判定できるか（PRD におけるテスタビリティ）。
- **スコープ境界**: やること / やらないこと が明確か。過剰スコープ（YAGNI 違反）がないか。
- **凝集度 / 責務分離**: PRD が単一目的に収まっているか。分割すべき複数目的が混在していないか。
- **整合性**: 既存実装・他 PRD・命名と矛盾しないか。

## アクション（計画 → 指摘 → 修正）

1. レビュー計画を立てる。対象 PRD を読み、固有リスクから**追加観点を動的に導出**して必須観点（floor）に足し込み、**floor + 追加観点**の合算を MECE に割り当ててから実施する（floor だけで十分とみなさない。原則の正は [`coverage-floor-not-ceiling`](../../rules/coverage-floor-not-ceiling.md)）。
2. 指摘を表で洗い出す:

   | 箇所 | 観点 | 重大度 | 根拠 | 修正方針 |
   |---|---|---|---|---|

3. PRD を修正する。

## 制約

- ドキュメント間で関数名・件数・具体構文を自然文で再列挙しない（`.claude/rules/documentation-drift-prevention.md`）。
- 観点の網羅は [`coverage-floor-not-ceiling`](../../rules/coverage-floor-not-ceiling.md) に従う（floor だけで十分としない／PRD 固有の追加観点を動的に導出する）。
