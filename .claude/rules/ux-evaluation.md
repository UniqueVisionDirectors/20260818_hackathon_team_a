---
paths:
  - "apps/frontend/src/views/**"
  - "apps/frontend/src/components/**"
  - "**/src/views/**"
---
# UX 評価 floor 規約

## 適用条件

`apps/frontend/src/views/*.vue`（ルーティングされる画面）または `apps/frontend/src/components/**`（ドメイン / インタラクティブ component）で、**user-facing な UI を追加・変更するとき**（表示要素・操作・状態表現・フォーム・フィードバックの追加/変更）。backend のみ・UI 変更なしの場合は対象外。

## 背景

本プロジェクトは機能開発のたびに UX を都度・場当たり的に検討しがちで、UX 品質の最低ラインを規約として固定しないと画面ごとに状態表現・操作性・アクセシビリティのばらつきが生じる。本 rule は **受動 floor**（編集時に自動ロードされる最低ライン）を担い、**能動的なフル評価手順は `/ux-design` review モード**（ヒューリスティック評価 + 認知的ウォークスルー + a11y）に委譲する。

## 制約

UI の追加・変更は、最低限 **UX floor** を満たすこと。これは floor であり ceiling ではない（[`coverage-floor-not-ceiling.md`](coverage-floor-not-ceiling.md)）。対象画面固有のリスクからチェック項目を動的に追加する。

### floor 1: 状態の視認性（Nielsen 原則①⑨）

非同期処理・データ取得を伴う UI は、**loading / 成功 / 失敗 / 空（データ0件）の各状態を可視化**する。エラーは原因と次の行動が分かるメッセージで**ユーザー可視 UI** に伝える（`console.error` 止まりにしない＝prd-template §3.1「本来あるべき実装」と整合）。

### floor 2: 操作の安全性（Nielsen 原則③⑤）

- **取消不能・破壊的操作（削除 / 不可逆な状態遷移）には確認 UI** を置く。
- 入力には制約（必須 / 形式 / 値域）を与え、submit 前に即時フィードバックする（frontend バリデーション。backend ガードは別途必須）。

### floor 3: 一貫性（Nielsen 原則②④）

- 用語はユーザーの語彙に合わせる。同種の操作・表示は既存画面と同じパターン・同じ component を使う（独自実装で対称を崩さない）。

### floor 4: アクセシビリティ baseline（WCAG AA 抜粋）

- **キーボードのみで全操作可能** / フォーカスリングが可視 / フォーム要素に `label`（または aria-label）/ 画像に `alt` / **色のみに状態を依存させない** / エラーがテキストで識別できる。

## 責務分界

- **ページレイアウトの一貫性は既存 View の構造を踏襲する**（本 rule は重複してレイアウト幅・spacing を扱わない）。
- 本 rule は **操作性・状態表現・一貫性・a11y** を担う。
- T2 以上（新規 View / 多段フロー）や完了処理時の**フル評価（10原則の全点検・認知的ウォークスルー・a11y 手動テスト）は `/ux-design` review モード**で行う。本 rule の floor はその下限。

## 禁止事項

- loading / 空 / エラー状態のいずれかを欠いたまま非同期 UI を実装すること（状態視認性違反）。
- エラーを `console.error` 止まりにし、ユーザー可視 UI に伝えないこと。
- 破壊的・不可逆操作に確認 UI を置かないこと。
- キーボード操作不能な UI（クリック専用ハンドラのみ等）を追加すること。
- 状態・エラーを**色のみ**で表現すること（テキスト/アイコン併用なし）。
- floor を満たしたことをもって「UX 検証は完了」とすること（floor は最低ライン。T2 以上は `/ux-design` review が正）。

## 関連ルール / skill

- [`.claude/skills/ux-design/SKILL.md`](../skills/ux-design/SKILL.md)（フル評価の能動手順。本 rule はその floor）
- [`coverage-floor-not-ceiling.md`](coverage-floor-not-ceiling.md)（floor は十分条件でない）
- [`design-quality-gates.md`](design-quality-gates.md)（フロント節・割れ窓観点）
