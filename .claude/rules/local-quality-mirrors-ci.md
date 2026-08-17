# Local quality check は CI と同じ条件・同じ file set で行う

## 適用条件

完了報告(「完了しました」「コミット可能」等)の前に local quality check を行うとき。

## 制約

完了報告前の検証は以下の不変条件を満たすこと。CI(`.github/workflows/ci.yml`)は各 app の `npm run quality` を実行しており、local も同一コマンドを根拠にする。

1. **完了根拠はフルモードのみ**: 変更ファイルに絞った lint / 影響テストのみの軽量チェック(`/quality-check` 軽量モード)は開発中の高速フィードバック専用。完了報告・CI pass の根拠にできるのは各 app の `npm run quality`(lint + type-check + knip + test + build)全通過のみ
2. **一時ファイルを lint 対象に紛れ込ませない**: 実験用・一時 `.ts`/`.vue` は gitignore 済みの場所に置くか報告前に削除する。`git status --short` で untracked を点検する
3. **検査はファイルが存在する状態で行う**: type-check / knip / test は設定の glob でファイルを列挙するため、ファイル削除後に回すと検出漏れになる。quality 実行時点の作業ツリーが commit 予定の内容と一致していることを確認する

## 禁止事項

- 軽量チェックの「0 errors」を完了報告の根拠にすること
- 「ローカルで通った」を根拠に、CI と異なる条件(コマンド・ファイルセット)のまま CI 通過を推定すること
- 一時ファイルを lint されないよう lint 設定の除外で回避すること(gitignore か削除で対応)

## 検証

- 完了報告が両 app(変更があった側)の `npm run quality` 全通過に基づいている
- `git status --short` にコミット対象外の untracked が残っていない

## 関連ルール / skill

- `.claude/skills/quality-check/SKILL.md`(具体手順)
- `.claude/rules/verification.md`(判定基準の事前定義)
