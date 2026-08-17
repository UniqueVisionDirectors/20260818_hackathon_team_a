---
name: backlog-management
description: backlog/、TODO、TODO.archive、plan.md のいずれかを変更するときの管理手続き。三層構造（plan.md / backlog/ / TODO）+ 退避層（TODO.archive）を操作するフローと整合手順を定める。構造モデルと不変条件の正は backlog-layer-model rule
user-invocable: true
---

# バックログ管理

## トリガー

`backlog/`、`TODO`、`plan.md` のいずれかを変更するとき。

## 構造モデル（正は rule）

backlog 体系の三層構造（`plan.md` / `backlog/` / `TODO`）+ 退避層（`TODO.archive`）の役割、「`TODO` 項目の出口は 2 つだけ」不変条件、パイプライン、層間の整合不変条件の**正は [`.claude/rules/backlog-layer-model.md`](../../rules/backlog-layer-model.md)** を参照する。本 skill はそのモデルを操作する**具体手続き**を定める。

操作前提（要約・詳細は rule）: `TODO` 項目は「PRD 化で解消（→ `backlog/` → `plan.md` → 着手 → 完了 → 削除）」か「`TODO.archive` へ退避（ユーザー判断・再開条件付き）」の 2 出口のいずれかでのみ `TODO` を去る。第 3 の出口（黙って消す）は禁止。

## アクション

### フロー

1. 思いついたことは `TODO` に書く
2. **新しい項目を追加したとき、全体の優先順位を見直す** — 3 軸（直接的価値・相乗効果・伝播防止）で新項目の位置を評価し、既存項目との相対的な優先度を確認する。判断基準の詳細は `todo-prioritization` ルールを参照
3. 整理のタイミングで `TODO` の項目を精査する
4. 設計が十分にできる項目は PRD を書いて `backlog/<name>.md` に配置する（PRD 作成は `prd-template` skill）
5. `backlog/` に移した項目は `TODO` から削除する
6. まだ曖昧・情報不足な項目は `TODO` に残す

### `plan.md` の更新

`plan.md` の本文は「今後の開発計画」と「現在進行中の取り組み」だけを持つ（前向き）。後ろ向きな完了記録は末尾「完了 PRD（番号 + 短タグ）」index に限定する（前向き不変条件・完了痕跡の扱いの正は [`backlog-layer-model`](../../rules/backlog-layer-model.md)）。

- `backlog/` にアイテムが**追加**されたとき — 新アイテムを順序リストの適切な位置に挿入する
- `backlog/` のアイテムが**完了**したとき — 消化順序・進行中の該当エントリを**削除**し、末尾「完了 PRD」index の最上段に 番号 + 短タグ 1 行を追記する（手順の詳細は次項「完了したアイテムの扱い」）
- `plan.md` には PRD 化済みタスクの消化順序のみを記載する（`TODO` の内容を転記しない）

### 完了したアイテムの扱い

- 作業が完了した `backlog/` の PRD ファイルは**削除**する
- `plan.md` の**消化順序・進行中エントリは削除**し、末尾「完了 PRD」index の **最上段に 番号 + 短タグ 1 行を追記**する（消化順序からは消えるが index に痕跡を残す）。index の形式・保持件数・並び順・最古行削除の不変条件は [`backlog-layer-model`](../../rules/backlog-layer-model.md) を正とする
- 短タグは**想起の手がかりに留め、実装詳細（関数名・スキーマ・カラム・分岐等）を列挙しない**（肥大化と drift の原因。正は git log / 完了コミット / report。`documentation-drift-prevention` 準拠）
- 完了の詳細は git history で追える。本文に完了 prose を残す必要はない

### `TODO.archive` への退避（対応見送り）

- ユーザーが「着手・精査の上で対応見送り（現状維持 / 実施しない / 解決・クローズ済み）」と判断した `TODO` 項目を `TODO.archive` へ**転記**し、`TODO` 本文からは削除する
- 転記時は**元の記述内容を保持**する（情報の消失を避ける）。各項目に「**再開条件 / 再発トリガー**」を明記し、満たされたら `TODO` へ戻す
- `TODO.archive` は**削除ではなく退避**（git history でなく現役ファイルとして参照可能に保つ）。完了 PRD（解消済み）とは異なり「やらないと決めた / 解決した」記録のため、現役の探索対象として残す
- **archive するか否かはユーザーの判断**。エージェントは候補を分類・提示し、範囲をユーザーに確認してから移送する（独断で archive しない）

### backlog ファイルの命名

- 形式: `prd-{N}-{kebab-case-name}.md`
  - `{N}`: plan.md の進行中連番。完了 PRD で使われた番号は**再利用しない**（git history と一致させるため）
  - `{kebab-case-name}`: 機能の内容が名前から推測できること
- 例: `prd-12-image-upload-validation.md`, `prd-13-webgpu-fallback.md`

## 禁止事項・検証

backlog 体系の**構造不変条件に対する禁止事項・検証**（第 3 の出口禁止 / `plan.md` の完了項目残置・完了 prose・index 短タグの実装詳細 / 層間の重複・情報消失 / 独断 archive / 転記時の記録欠落 等）の正は [`backlog-layer-model`](../../rules/backlog-layer-model.md) を参照する。`plan.md` / `backlog/` / `TODO` / `TODO.archive` を編集すると同 rule が auto-load されるため、操作の合否は同 rule の「検証」セクションで判定する。

本 skill 固有の操作上の注意:

- 同じ PRD のステータス（実装済・未コミット等）を スナップショット / 進行中 で二重に書かない（1 箇所を詳細・他は 1 行ポインタ）
