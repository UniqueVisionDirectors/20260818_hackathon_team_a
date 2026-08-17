---
paths:
  - "apps/*/src/**/*.test.ts"
  - "apps/backend/vitest.config.ts"
  - "apps/frontend/vitest.config.ts"
---

# テスト規約

## 適用条件

テストコード・vitest 設定を作成・変更するとき。

## 構成

両 app とも vitest の unit テストのみ。配置は実装と同居(`src/**/*.test.ts`)。設定の正は各 app の `vitest.config.ts`(globals なし / restoreMocks: true / backend = node 環境 / frontend = happy-dom 環境)。

## 制約

1. **外部サービスに接続しない**: PostgreSQL / MinIO / HTTP API は `vi.mock` でモジュール境界をモックする(例: `apps/backend/src/utils/minio.test.ts` の `vi.mock('minio')` パターン)。ネットワーク・実 DB に触れるテストを書かない
2. **モックはモジュール境界で行う**: frontend は `@/services/*` または `./api`、backend はドライバ/SDK(`minio`, `pg`)を境界にする。内部実装の関数を spy して挙動を組み替えない
3. **テストデータの型は production 型を再利用する**: fixture の戻り値に独自型を定義しない(`import type { Item } from '@/types'` のように実型を使う)。`as` で型を握りつぶした fixture を作らない
4. **非同期 UI 状態の assert は `vi.waitFor` を使う**(マイクロタスク前提の即時 assert をしない)
5. **テスト名は「条件: 期待結果」形式**で日本語可(`describe` = 対象、`it` = 条件と期待)
6. frontend のテスト対象は stores / services / renderer の純ロジック層。Babylon Engine の実描画・Vue コンポーネントの mount はユニットテストの対象外(実機確認は `/check-local`、将来の E2E は DESIGN.md §11 の方針に従う)

## 禁止事項

- テストのために実装の仕様述語を弱めること(`.claude/rules/no-spec-distortion-for-tests.md`)
- 外部サービス接続を前提としたテスト(CI で落ちる)
- `as any` / `!` を使った fixture・assert(lint でも検出される)

## 関連

- rule: [`no-spec-distortion-for-tests.md`](no-spec-distortion-for-tests.md) / [`verification.md`](verification.md) / [`coverage-floor-not-ceiling.md`](coverage-floor-not-ceiling.md)
- skill: `/test-design`(テスト項目の洗い出し)/ `/quality-check`(実行手順)
