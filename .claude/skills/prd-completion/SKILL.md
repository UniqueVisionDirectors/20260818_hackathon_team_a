---
name: prd-completion
description: 完了処理タスク列の最終タスク（コミット前）。PRD/TODO/plan.md のファイル処理 + PRD 番号 cleanup + 完了報告のみを行う。前段（refactoring-check → review-dev → quality-check → todo-audit → check-local）は /tdd ステップ0 で個別タスク登録され、本 skill はその列の最後に実行される
user-invocable: true
---

# PRD 完了処理（最終タスク）

## トリガー

完了処理タスク列（`/tdd` ステップ0 で登録する固定列。順序の正は `/tdd` ステップ0）の前段（refactoring-check / review-dev / quality-check / todo-audit / check-local）が**全て検証込みで通過した後**、列の**最後**に実行する。

> 本 skill が担うのは PRD 固有の glue（ファイル削除 / index 追記 / 番号 cleanup）と完了報告のみ。完了処理列の順序の正は `/tdd` ステップ0、前段各ステップの手順は各 skill（`quality-check` / `refactoring-check` / `todo-audit` / `check-local` / `review-dev`）を正とし、本 skill 内に再掲しない（DRY）。

## アクション

以下を順に実行する。**前段 1〜6 の全検証が通過していることが前提**（未通過で plan.md を完了確定してはならない）。複数ステップ作業として `task-tracking` rule に従いタスク管理ツールで追跡する。

1. **backlog / plan.md 更新** — `/backlog-management`（構造の正は `backlog-layer-model` rule）:
   - `backlog/prd-<N>-*.md` を削除する
   - `plan.md` の消化順序・進行中から該当エントリを削除し、**末尾「完了 PRD」index の最上段に「番号 + 短タグ」1 行を追記**する（短タグに実装詳細＝関数名/スキーマ/カラム/分岐を列挙しない）。index の形式・保持件数・並び順・最古行削除の不変条件は [`backlog-layer-model`](../../rules/backlog-layer-model.md) を正とする
   - トラック等のクロス参照（「項目 N」「N(b)」等）が renumber でずれていないか確認する
   - 関連 `TODO` 項目が解消済み（削除 or `TODO.archive` 退避）であることを再確認する
2. **PRD 番号参照 cleanup** — `no-prd-references-in-code` rule に従い grep（`<N>` は完了 PRD 番号）:
   ```bash
   grep -rEin "PRD-?<N>\b" apps/*/src apps/*/tests apps/*/scripts
   # 期待 0 件（例外パス: backlog/ plan.md .claude/rules/*.md report/ TODO）
   ```
   hit があれば設計意図のみの記述へ書換 or 削除する。あわせて削除/改名したファイルへの**ダングリング参照**（他 src/test のコメント・rule・report からの旧パス参照）も grep で点検する。
3. **完了報告** — 完了処理列の全タスク（refactoring-check 〜 本 skill）の検証結果（テスト件数 / lint 0 / build 成功 / 等価性 等）を提示して完了報告する。**コミット・push・ステージングはユーザーの操作のため実行しない**（lint は staging に依存せず untracked も対象にするため `git add` は不要＝`local-quality-mirrors-ci`）。

## 禁止事項

- 前段（quality-check 等）の検証が未通過のまま backlog/plan.md を「完了」へ更新すること（`verification` rule）。検証通過後にファイルを再編集したら影響 workspace の再検証タスクを立てる（`task-tracking` / `local-quality-mirrors-ci`）。
- 完了処理列を本 skill 内で再オーケストレーションすること（列の順序の正は `/tdd` ステップ0。本 skill はその最終タスクで、前段を呼び直さない）。
- `plan.md` の消化順序・進行中に完了済み項目を残すこと / 完了 index 短タグに実装詳細を列挙すること / 本文に完了イベントの履歴 prose を残すこと（`backlog-layer-model` rule）。
- 完了処理の最後に `git commit` / `git push` を実行すること（ユーザーの特権）。
- 各参照先 skill/rule の手順を本 skill 内に再掲し二重管理すること（DRY: 詳細は参照先が正）。

## 検証

- アクション 1〜3 が順序通りに実行され、前段の全検証通過を前提に plan.md を完了確定している。
- `backlog/` に完了した PRD ファイルが残っていない。`plan.md` 完了 index に「番号 + 短タグ」が追記され、消化順序・進行中から削除されている（`backlog-layer-model` の検証セクションを満たす）。
- PRD 番号 grep cleanup が 0 件（例外パス除く）+ 削除/改名ファイルへのダングリング参照 0 件。
- コミット未実行（ユーザー操作待ち）。

## 関連

- 完了処理列の順序の正: `/tdd` ステップ0。前段の各 skill: `refactoring-check` / `review-dev` / `quality-check` / `todo-audit` / `check-local`。
- `prd-template`（PRD 作成側。PRD 本文の「完了後処理」チェックリストは本 skill のファイル処理の instance）/ `backlog-management`（plan.md 操作手順）
- rule: `backlog-layer-model`（plan.md 構造の正）/ `local-quality-mirrors-ci` / `no-prd-references-in-code` / `verification` / `task-tracking` / `documentation-drift-prevention`
