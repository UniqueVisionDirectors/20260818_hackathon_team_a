---
name: quality-check
description: 作業完了時(コミット前)の静的品質チェック手順。変更のあった app で lint / type-check / knip / test / build を実行し 0 エラー・0 警告を確認する(静的解析+自動テストの範囲。実機での動作確認は含まない= /check-local の領分)
user-invocable: true
---

# 品質チェック

## モード

- **軽量モード**(開発中の高速フィードバック): 変更ファイルへの `npx eslint <files>` / 対象テストのみの `npx vitest run <file>`。**完了報告の根拠にはできない**(`.claude/rules/local-quality-mirrors-ci.md`)
- **フルモード**(完了報告・コミット前の唯一の根拠): 以下の手順

## フルモード手順

1. **影響 app の特定**: `git status --short` / `git diff --name-only` で `apps/backend` / `apps/frontend` のどちらに変更があるか確認。両方なら両方実行
2. **一時ファイルの点検**: untracked に実験用ファイルが無いか確認(あれば削除か gitignore)
3. **フルチェック実行**(app ごと):

   ```bash
   cd apps/<app>
   npm run quality > /tmp/<app>-quality.txt 2>&1; echo "exit=$?"
   ```

   出力は必ずファイルへリダイレクトし Read ツールで全件確認する(`tail`/`grep` 禁止 — CLAUDE.md Gotchas)。`quality` = lint + type-check + knip + test + build(正は各 `package.json`)
4. **0 化**: エラー・警告は今回の変更に起因しないものも含め全て修正する。テストの削除・弱体化での解消は禁止(`.claude/rules/no-spec-distortion-for-tests.md`)
5. **判定**: テスト件数等の数値も検算し(`.claude/rules/verification.md`)、全 app exit=0・0 エラー・0 警告で合格

## 禁止事項

- 軽量モードの結果で完了報告すること
- lint 出力を `tail` / `grep` で確認すること
- エラー解消のための抑制コメント(`eslint-disable` / `@ts-expect-error` / `@ts-ignore` 等)の追加。誤検出と思われる場合も抑制ではなく実装側の書き換えで解決する(決定記録 D13・全面禁止・例外なし)

## 関連

- rule: `local-quality-mirrors-ci` / `verification` / `testing`
- skill: `/check-local`(実機確認)/ `/test-design`(テスト追加時)
