# CLAUDE.md

Vue 3 + Babylon.js + Hono + PostgreSQL + MinIO で構成する Web 3D アプリケーションテンプレートのモノレポ。

私への応答は必ず日本語にしてください。

## Tech Stack

- **Frontend**: Vue 3 + TypeScript + Vite + Pinia + vee-validate/yup + Babylon.js (`@babylonjs/core` / `@babylonjs/loaders`、WebGL 標準・WebGPU 切替可)
- **Backend**: Hono + @hono/zod-openapi + Node.js + TypeScript + Kysely (PostgreSQL)
- **Storage**: MinIO(画像オブジェクト。presigned URL 方式)
- **Development**: Docker Compose(root `compose.yml`)

## Key Commands

> 品質チェック(lint / type-check / knip / test / build)の手順とコマンドは **/quality-check** を参照。各 app の全 script の正は各 `package.json`。本節は「まず動かす」ための最小セットのみ。

### 起動(Docker)

```bash
docker compose up --build -d   # 全サービス起動(初回に migration + デモユーザー作成)
docker compose stop            # 停止
docker compose down -v         # コンテナ+開発データ削除
```

**Services**: frontend (15173) / backend (13000) / postgres (15432) / minio (19000, console 19001)。ホスト側ポートは `.env` で変更可(`.env.example` 参照)。デモログイン: `test1@example.com` / `password123`

### Backend (apps/backend/)

```bash
npm run dev        # tsx watch (port 3000)
npm run migrate    # DB migration
npm run db:generate-types  # Kysely codegen
```

### Frontend (apps/frontend/)

```bash
npm run dev        # Vite dev server (port 5173)
```

## Architecture

### Monorepo Structure

- `apps/backend` — Hono API(層構成は下表)
- `apps/frontend` — Vue SPA + Babylon.js 3D 層
- root — `compose.yml` / `docker/` / `DESIGN.md`(3D 層の設計判断の正)/ `VERIFICATION.md`

npm workspaces ではない(各 app が独立に `package.json` / lock を持つ)。root に package.json は無い。

### Backend (apps/backend/src/)

| ディレクトリ | 役割 |
|-------------|------|
| `apis/` | API エンドポイントハンドラ(auth / users / items / images / health) |
| `middleware/` | JWT 認証 |
| `schemas/` | Zod バリデーションスキーマ(@hono/zod-openapi の createRoute で OpenAPI 駆動) |
| `db/` | Kysely 接続、migration(`db/migrations/`)、生成型(`generated-types.ts`) |
| `utils/` | MinIO presigned URL 等 |
| `types/` | TypeScript 型定義 |

### Frontend (apps/frontend/src/)

| ディレクトリ | 役割 |
|-------------|------|
| `views/` | ページコンポーネント(LoginView / DashboardView) |
| `components/` | ドメインコンポーネント + `BabylonCanvas.vue`(Vue と 3D の境界) |
| `renderer/` | Babylon.js 層。`BabylonRenderer`(Engine/Scene/render loop 所有)、`createEngine`(WebGL/WebGPU 選択とフォールバック)、`createDemoScene` |
| `stores/` | Pinia ストア(auth / items / images) |
| `services/` | API クライアント層(ofetch) |
| `router/` | Vue Router 設定 |
| `types/` / `utils/` | 型定義・ユーティリティ |

**3D 層の設計原則**(詳細な正は `DESIGN.md`): 毎フレームの描画状態を Vue/Pinia の reactive state に入れない。Babylon オブジェクトは `shallowRef` 保持。renderer の lifecycle 契約(initialize / resize / setSuspended / loadGltf / dispose)を維持する。UI へは低頻度イベントのみ emit。

## Core Principles

以下の4原則を常に遵守すること:

- **KISS**: 過剰設計を避けよ。最小限の複雑さで現在の要件を満たすこと。
- **YAGNI**: 要求されていない機能・改善・拡張を作るな。今必要なものだけを実装せよ。
- **DRY + 直交性**: DRYは「知識の重複」を排除する原則であり、「コードの見た目の重複」を排除する原則ではない。共通化によってモジュール間の結合が増えるなら、重複を残せ。逆に、見た目が違っても抽象度を上げると同一の知識(同一の規則・不変条件)である場合は、コア + アダプタで知識部分を統一せよ。判定は双方向とも、差分が「射影・評価時点・文脈」か「規則そのもの」かを分類してから下す(手順の正は `design-quality-gates` rule)。
- **対称性**: 抽象レベルで同一視すべきものは同一の構造・扱いで表現せよ。扱いを変えるなら、それは抽象レベルの実際の差異を反映していなければならない。恣意的な非対称も、別物を無理に揃える偽の対称も排除せよ。

## ルール索引(編集時に自動ロードされる path-scope rule)

以下の rule は**対象ファイルを context に入れると自動ロード**される(frontmatter の `paths` で scope)。命令形サマリのみ示す。詳細は各 rule 本文を正とする。

| rule | 編集時にすべきこと(命令形) |
|---|---|
| **code-comment-quality** | コメントは**コードから読み取れないこと(制約・不変条件 / 設計意図 / 外部要因)のみ**書く。言い換え・変更経緯・管理用番号は書かない。実装変更時は周辺コメントを同時追従。 |
| **soft-vs-hard-delete-policy** | エンティティテーブルの削除は**物理削除が既定**、論理削除は「削除後も参照・監査追跡が要る」場合のみの例外で根拠を migration に co-locate。 |
| **ux-evaluation** | View / user-facing component 編集時、**UX floor(loading/空/エラーの状態視認性・破壊操作の確認 UI・一貫性・a11y baseline)を満たす**。フル評価は `/ux-design` review に委譲。 |
| **backlog-layer-model** | `plan.md` / `backlog/` / `TODO` / `TODO.archive` 編集時、**三層構造 + 退避層の役割・「TODO 出口は 2 つだけ」・層間整合の不変条件を維持**。操作手続きは `/backlog-management`。 |
| **referent-before-label** | 設計文書・PRD・調査報告・TODO 起票・命名時、**語より先に指示対象を固定**する。文書級は referent table を先に scratchpad へ保存。 |

この他、以下も path-scope で遅延ロードされる: `testing`(test 編集時)/ `no-spec-distortion-for-tests`(test 編集時。テストのために仕様を歪めない)/ `dependencies`(`package.json` 編集時)/ `design-quality-gates`(`**/src/**` 編集時。KISS/YAGNI/DRY・対称性・直交性の判断軸 + 割れ窓調査観点)/ `coverage-floor-not-ceiling`(`**/src/**`・`backlog/**`・test 編集時。列挙した観点は floor であって十分条件でない)/ `no-prd-references-in-code`(src/tests/scripts 編集時。PRD 番号を残さない)/ `todo-prioritization`(`TODO` / `backlog/**` / `plan.md` 編集時。優先順位 3 軸)。

常時ロードの broad rule: `verification` / `debugging` / `documentation` / `analysis` / `local-quality-mirrors-ci` / `task-tracking`(3 ステップ以上の作業はタスク管理ツールで全ステップ追跡)/ `rule-retroactive-application` / `documentation-drift-prevention`。

## Testing

テストは両 app とも **vitest の unit テスト**で、`src/**/*.test.ts` に実装と同居配置(各 `vitest.config.ts` が正)。外部サービス(PostgreSQL / MinIO / HTTP API)には接続せず `vi.mock` でモックする。frontend は happy-dom 環境で stores / services / renderer の純ロジック層を対象とし、Babylon Engine の実描画・コンポーネント mount は対象外(実機確認は `/check-local`)。詳細規約は test 編集時に自動ロードされる `.claude/rules/testing.md` を正とする。

## Code Conventions

- `any` 型の使用禁止・非 null assertion (`!`) の使用禁止 — lint がエラーにする(例外: `src/db/migrations/**` の `Kysely<any>`)
- production コードでは `T | undefined` 等を `as T` で narrow することも禁止(実行時検査を伴わず null / undefined を消す断定のため)。正しい代替は**型ガード**または**明示 throw**
- typed lint は ESLint flat config + typescript-eslint `strictTypeChecked` + `stylisticTypeChecked`(設定の正は各 app の `eslint.config.mjs`)
- ES Modules (`"type": "module"`)

## Quality Standards

全ての変更に対し **0 エラー・0 警告** を維持すること:

1. TypeScript エラー 0 件
2. lint エラー・警告 0 件
3. テスト全件合格
4. ビルド成功

**今回の変更に起因しないエラーも修正すること。**
テストを削除・弱体化してエラーを消すことは禁止。

## Gotchas

- 静的解析の出力確認は、必ずファイルにリダイレクトしてから Read ツールで確認する。`tail` や `grep` でのフィルタリングは出力が切れるリスクがあるため禁止

  ```bash
  npm run lint > /tmp/lint-result.txt 2>&1
  npm run type-check > /tmp/typecheck-result.txt 2>&1
  ```

- Node.js は `.node-version`(24 系)に従う
- 長時間コマンドは `run_in_background` で実行し**完了通知を待つ**。`while ps aux | grep ...; do sleep; done` 型の手動ポーリングは書かない(待機ループが自己マッチして無限ループ化する)

## モデル運用

メイン会話は常に Opus(正は `.claude/settings.json` の `model` / `fallbackModel`)。**コーディング作業(実装・コード編集・テスト実行・調査のための大量ファイル読み込み)は `coder` サブエージェント(Opus)へ委譲する**。設計判断・タスク管理・レビュー・評価はメインで行う。スキル/コマンド単位のモデル固定は各 frontmatter が正。セッション途中の `/model` 切替はキャッシュ無効化を伴うため原則行わない。

## ワークフロー

以下の状況では対応する Skill を必ず呼び出すこと:

- 新機能・バグ修正の着手 → /tdd
- テストコードを新規作成・変更する前 → /test-design (= /tdd 内のステップ 1 で必須呼出、独立利用も可)
- UI(frontend View / インタラクティブ component)を伴う機能の着手・PRD 作成時 → /ux-design discovery(UI を伴う変更の完了処理時は /ux-design review)
- 作業完了時(コミット前) → /quality-check
- 機能追加完了後 → /refactoring-check
- 開発セッションの最後(コミット前) → /todo-audit
- backlog/ の操作 → /backlog-management
- backlog/ が空で作業依頼を受けた → /backlog-replenishment
- PRD の作成 → /prd-template
- PRD の完了処理(全作業完了・コミット前) → 完了処理タスク列(refactoring-check / review-dev /〔UI を伴う変更のみ〕ux-design review / quality-check / todo-audit / check-local / prd-completion)を着手時に /tdd ステップ0 で登録し順に実行する。**列の登録・順序の正は /tdd ステップ0**
- TODO が空で作業依頼を受けた → /todo-replenishment
- 調査タスク → /investigation
- ルールの作成・変更・削除 → /rule-maintenance(1 ルールの書き方は、この中で /rule-writing を参照する)

## 行動規範

- **判断軸のある質問**: 選択肢・メリデメ・推奨案を提示して確認する。「これでよいですか?」のような判断軸のない質問をしない。自分で判断できることは判断して進める
- **後回しの記録**: スコープ外の課題を発見したら、内容と理由を `TODO` に詳細に記録する
- **ドキュメント同期**: コード変更時に plan.md, README.md, CLAUDE.md, DESIGN.md, doc コメントが不正確になっていないか確認・更新する

## 自発的改善の原則

問題や不整合を発見したら、ユーザーに指摘される前に自発的に調査・修正すること:

- 警告・エラー・不整合を「一時的な問題」として安易に無視しない
- 問題の根本原因を特定してから対処する
- 開発環境・ツールチェインの問題も自分の責任範囲として扱う
- 「動いているから良い」ではなく「正しい状態か」を基準にする

## 学習プロトコル

ユーザーから Claude 自身の挙動に関する修正指示を受けたとき:

1. 指示を一般化・抽象化する(特定のケースではなくパターンとして)
2. 保存先を判断する:
   - プロジェクト固有の制約 → `.claude/rules/` に追記または新規作成
   - プロジェクト固有の手続き → `.claude/skills/<name>/SKILL.md` に作成
   - 個人的な好み → `~/.claude/CLAUDE.md` に追記
3. 書き込む内容と保存先をユーザーに提示し、確認を得てから書き込む
