# ドキュメントの drift 耐性

## 適用条件

常時ロード文書（`CLAUDE.md`）/ plan.md / backlog / TODO / report / rule / `design.*.md` 等の durable な自然文ドキュメントで、ソースコード上の関数名・ファイル名・件数・具体構文パターンを記述するとき、または **durable 文書が他文書（特に ephemeral な `report/`）を参照するとき**。`CLAUDE.md` は毎セッション全文がロードされるため drift の影響が特に大きい。

## 背景

移植元プロジェクトでの崩壊事例（PRD-3 のレビュー反復）で以下の drift を発見:

- plan.md のヘルパー enumeration で関数名を二重カウント (`base 4 + variants 5 + ... + assertOwnRecordOrAdmin とその variants`)
- TODO の defensive throws 記述が `if (!body.xxx)` 前提で書かれていたが、後から追加されたファイルは `typeof` check を採用しており pattern が drift
- 「snapshot として凍結されている」等、ファイル間で同じ情報を別表現で解釈する記述

いずれも「自然文で再列挙したものを、ソースが増えるたびに手で追従しない」ことが共通原因。drift しにくい記述形式を選べば再発防止できる。

## 制約

ドキュメントを書くとき、以下の優先順位で **drift 耐性の高い形式** を選ぶ。

### 1. **source を指し、自然文で再列挙しない**

悪い例:
```markdown
`middleware/authz.ts` のヘルパー群: `assertTeamLeaderOrAdmin` / `assertProjectLeaderOrAdmin` / `assertProjectMemberOrAdmin` / `assertOwnRecordOrAdmin` / ...
```

良い例:
```markdown
`middleware/authz.ts` のヘルパー群 (authoritative 一覧は source file を参照)。
```

### 2. **列挙が必要なら件数 + 分類で shape を記述する**

悪い例 (件数・分類が混在して drift する):
```markdown
base 4 + variants 5 + `assertFilterOrAdmin` + `assertAssignedReviewer` + `assertOwnRecordOrAdmin` とその variants
```

良い例 (分類ごとの件数のみ、関数名は省略):
```markdown
| 分類 | 件数 |
|---|---|
| base (admin bypass あり) | N |
| null-handling variants | M |
| クエリ helper | K |
```

### 3. **具体構文を書くなら「不変性 (invariant)」として記述する**

悪い例 (file ごとに pattern が増えると drift する):
```markdown
A.ts / B.ts / C.ts の POST handler に `if (!body.xxx) throw ...` を追加。
```

良い例 (不変性を中心に書き、具体 pattern は例示):
```markdown
複数の POST handler に runtime 型/存在チェックを追加しているが、共通の不変性は
「Zod validation が先行するため unreachable」。pattern は handler により異なる
(`if (!body.xxx)` / `typeof body.xxx !== 'string'` など)。
```

### 4. **位置付けを重複記述せず、対象ファイル冒頭に自己宣言を置く**

悪い例 (plan.md と別 report で「これは snapshot」「これは最新」と解釈が分岐):
```markdown
# plan.md
[audit.md](audit.md) は PRD-2 完了時点の snapshot として凍結されている。

# 別ファイル
[audit.md](audit.md) (PRD-N 時点の歴史的資料) を参照。
```

良い例 (audit.md 自身が冒頭で自己宣言、plan.md はリンクだけ):
```markdown
# audit.md
> ⚠️ このレポートは snapshot 資料です — 本文は不変、各 PRD 完了時の変化は top meta section に追記。

# plan.md
詳細は [audit.md](audit.md) を参照。
```

### 5. **常時ロード文書は権威 source / lazy-load 消費先に委譲する**

`CLAUDE.md` のように毎セッション全文がロードされる文書には、**権威ある source（`package.json` / `src/`）がある列挙**や、**lazy-load 消費先（着手時に必ずロードされる skill / rule）がある手順**を再掲しない。orientation（規約・層構造・横断 gotcha）だけを置き、列挙・手順はポインタに委ねる（§1「source を指す」の常時ロード文書版）。

悪い例 (品質チェックコマンドを常時ロード文書に焼き込む — `package.json` + `/quality-check` skill と三重管理):
```markdown
# CLAUDE.md
npm run lint   # ...
npm run type-check   # ...
npx knip   # ...
```

良い例 (orientation のみ残し、手順は消費先へ委譲):
```markdown
# CLAUDE.md
品質チェックの手順とコマンドは /quality-check を参照。全 script の正は各 package.json。
```

例外: 「まず動かす」ための起動・ビルド・DB・docker の最小セットは baseline orientation として残してよい（任意のタスクで ad-hoc に使い、特定 skill の専有でないため）。判定軸 = 「特定 skill/rule が着手時に必ずロードして使う手順か（→委譲）／任意タスクで使う起動系か（→最小維持）」。

### 6. **durable な成果物は ephemeral な `report/` に知識依存しない（rule / skill / `design.*.md` 等）**

§1 の「source を指す」は **durable な権威 source（`package.json` / `src/`）** が対象。**`report/` は一時的な一次調査レポートで、いつ削除されてもおかしくない ephemeral 文書**であり source-of-truth ではない。永続的に効くべき durable 成果物（`.claude/rules/*.md` / `.claude/skills/*/SKILL.md` / `design.*.md` 等）が report に内容（判断根拠・スコープ理由・手順・**前提資料 / authoritative 参照 / 背景調査**）を委譲すると、report 消滅で参照切れ＝知識喪失になる（durable と ephemeral の耐久性の非対称）。「report に書いてある」ことは**知識化を意味しない**（ephemeral ＝ knowledge ではない）。

**この非対称は移植元プロジェクトで実際に崩壊した実績がある**: かつての `design.rbac.md` / `design.issue-sync.md`（過渡的な設計ドキュメント・`domain/` bundle 整備で削除済み）が削除済みの調査レポートを「前提資料」「authoritative なエンドポイント一覧」「背景調査」として参照し、レポート削除で dangling 化していた。durable 文書が ephemeral を「authoritative」と呼ぶのは耐久性の取り違えである。

durable 成果物が report の内容に依存する場合、その**要点を抽出して durable 本文に書き切る**か、**真に authoritative な durable source（`src/` / `apis/` / `package.json`）を指す**。report への link や「詳細は report 参照」「authoritative 一覧は report §X 参照」「前提資料 / 背景は report」を残さない。

悪い例（rule が判断根拠を report に委譲）:
```markdown
# testing.md
mutation の対象スコープと「なぜ絞るか」は report/<調査レポート>.md の §5–6 を参照。
```

良い例（要点を inline・report link なし）:
```markdown
# testing.md
外部サービスに触れるテストは `vi.mock` で境界をモックする（実 DB/HTTP に触れない・CI で落ちない）。
```

## 禁止事項

- ソースコードの関数名/ファイル名を **自然文で再列挙** すること (source file を参照で済む)
- **総件数と内訳件数を同時に自然文で書く** こと (片方を省略、または表にする)
- 具体的構文を file 名と紐付けて列挙すること (pattern drift の原因)
- ファイルの位置付け (snapshot / living / 凍結 等) を **参照元側で解釈する** こと (対象ファイル冒頭で自己宣言させる)
- 常時ロード文書 (`CLAUDE.md`) に、**`package.json` / `src/` に正がある列挙**や、**着手時ロードされる skill/rule に正がある手順**を再掲すること (orientation のみ残しポインタに委ねる。起動・ビルド等の baseline 最小セットは例外)
- durable 成果物（`.claude/rules/*.md` / `.claude/skills/*/SKILL.md` / `design.*.md` 等）から **`report/*.md` への link や「詳細は report 参照」「前提資料 / authoritative / 背景は report」で内容・権威を委譲する**こと (report は ephemeral。要点を inline するか durable source を指す。出力先言及・例外パス列挙・`paths` scope・カテゴリ言及は例外)

## 検証

- plan.md / TODO 等の変更 PR で、関数名の列挙が 3 つ以上ある場合、source file リンクで代替可能か確認
- 件数が登場する記述で、総計と内訳が同時に書かれている場合、どちらか片方に統一
- 特定構文 (`if (!body.xxx)` 等) がファイル名と並んで列挙されている場合、不変性記述に書き換え可能か確認
- 同じファイルへの参照が 2 箇所以上あるとき、各々で異なる位置付け記述があれば当該ファイル冒頭への移動を検討
- durable 成果物（`.claude/rules/` / `.claude/skills/` / `design.*.md` 等）の変更で `report/` への知識依存（link・前提資料・authoritative 参照・背景）が増えていないか確認。あれば要点を inline 化、または durable source 参照に置換して link を除去（例外: 出力先言及・例外パス列挙・`paths` scope・カテゴリ言及）
