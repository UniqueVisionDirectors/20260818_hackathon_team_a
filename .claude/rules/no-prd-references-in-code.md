---
paths:
  - "apps/**/src/**"
  - "apps/**/tests/**"
  - "apps/**/scripts/**"
---
# ソースコード内に PRD 番号を残さない

## 適用条件

`apps/**/src/`、`apps/**/tests/`、`apps/**/scripts/` 等の **ソースコード・テスト・スクリプトファイル** にコメント / docstring / describe ブロック名 / 識別子 / ファイル名を追加・変更するとき。

## 背景

`PRD-15 で...`, `// PRD-17 注意事項`, `(PRD-2 B3 対策)`, `describe('... - PRD-17 集計母集団整合')`, `apis/users-prd13.ts` のような **特定 PRD 番号への参照** を src/ tests/ scripts/ に残すと、後から読む読者 (新規参加メンバー / 数ヶ月後の自分 / コードレビュアー) は PRD 番号を覚えておらず、容易に backlog にアクセスもできないため、**意味が伝わらないノイズ**になる。PRD 番号は git history / commit message / `plan.md` 進行状況テーブルで追跡できれば十分。

## 制約

ソースコード関連ファイル (上記「適用条件」のパス) に対しては以下を守る:

### 1. コメント / docstring は「設計意図」のみ書く

- ❌ `// PRD-17: clamp 撤廃` → ✅ `// 分母 0 のとき null 返却 (clamp 撤廃の方針)` または **コメント削除**
- ❌ `* PRD-22 A-4 で date 列は string 化されたため直接使用` → ✅ `* date 列は DB parser config で string 化済のため直接代入` または **削除**
- ❌ `* PRD-13: users.display_name カラム新設` → ✅ **削除** (関数名で自明)

判断基準: 「読者が PRD 番号の中身を知らずに読んでも意味が通るか」。通らないなら **削除** または **設計意図への書き換え**。

### 2. テスト名 / describe ブロックに PRD 番号を含めない

- ❌ `describe('Daily Metrics API - PRD-17 累積整合 (TZ ずれ + issue_logs snapshot)')` → ✅ `describe('Daily Metrics API - 累積整合 (TZ ずれ + issue_logs snapshot)')`
- ❌ `it('PRD-17: dev_time = 0 (在籍前) の efficiency = null')` → ✅ `it('dev_time = 0 (在籍前) の efficiency = null')`

### 3. ファイル名 / 関数名 / 変数名に PRD 番号を含めない

- ❌ `tests/api/daily-metrics-prd17.test.ts` → ✅ `tests/api/daily-metrics-population.test.ts` (内容を表す名前)
- ❌ `scripts/prd22-audit.sql` → ✅ `scripts/tz-storage-audit.sql`
- ❌ `function validatePRD17Schema()` → ✅ `function validateDevelopmentPopulationSchema()`

### 4. PRD 完了の最終ステップに grep cleanup を含める

各 PRD の「完了処理」フェーズで以下を実行し、本ルールの違反を検出 / 解消する。`{N}` は完了する PRD 番号に置換する:

```bash
grep -rEin "PRD-?{N}\b" apps/*/src apps/*/tests apps/*/scripts
# 期待: 0 件 (例外パスを除く、後述)。-i は必須 — 小文字 prd-N (backlog ファイル名由来の参照や
# テストデータ文字列) を大文字だけの grep は取りこぼす (実例あり)

```

## 例外として残してよい場所

- **`backlog/PRD-N-*.md`** (PRD 本体): 番号がファイル名そのもの
- **`plan.md`** の進行状況テーブル: 各 PRD 完了の歴史的トレース
- **`.claude/rules/*.md` / `.claude/skills/*/SKILL.md`**: 背景・制定契機として PRD 番号に言及することがある meta-doc (`rule-retroactive-application.md` 準拠の遡及適用説明等)
- **`report/*.md`**: 調査レポートは特定 PRD コンテキストで作成されることが多く、PRD 参照が文脈上必要なケースがある
- **`TODO`**: 各 entry の起票理由 (どの PRD レビューで発見されたか) は trace 性のため許容
- **git commit message**: コミット単位の trace
- **PR description**: PR 単位の trace

## 禁止事項

- src/ tests/ scripts/ のコメント / docstring に `PRD-N`, `(PRD-N B3 対策)`, `(PRD-N で xxx 化)` 等の **PRD 番号文字列** を残すこと
- `describe` / `it` のテスト名に `PRD-N` を含めること
- ファイル名 / 関数名 / 変数名 / クラス名に `prdN` / `PRDN` 等の **PRD 番号** を含めること
- 「PRD 完了処理」で grep cleanup を skip すること (`npm run quality` の前に必ず実施)
- PRD 番号を残したまま「打ち消し線で残す」「削除予定とコメント」等の **暫定処理** を行うこと (即削除 or 即書換)
- 「読者が知っているはず」と判断して PRD 番号を残すこと (将来の読者は知らないという前提を取る)

## 検証

- `grep -rEin "PRD-?[0-9]+\b" apps/*/src apps/*/tests apps/*/scripts` の結果が **0 件** (例外パス: 上記「例外として残してよい場所」のみ。大文字・小文字の両形を対象とする)
- 新規追加した test ファイルの describe / it に PRD 番号が含まれていない
- 新規追加 / 変更したファイル名・関数名に PRD 番号が含まれていない
- PRD の「完了処理」セクションに本ルールの grep cleanup ステップが明示されている

## 関連

- [`rule-retroactive-application.md`](rule-retroactive-application.md) (新設ルールの遡及適用要件)
- [`code-comment-quality.md`](code-comment-quality.md) (管理用番号を含めないレビュー観点)
- [`documentation-drift-prevention.md`](documentation-drift-prevention.md) (drift 耐性の高い記述形式)
