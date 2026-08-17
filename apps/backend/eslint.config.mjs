import { defineConfig } from 'eslint/config'
import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import eslintComments from '@eslint-community/eslint-plugin-eslint-comments'

export default defineConfig(
  { ignores: ['dist/**'] },
  eslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          // eslint.config.mjs / knip.config.js は tsconfig の include 外のため default project で lint する
          allowDefaultProject: ['eslint.config.mjs', 'knip.config.js'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      '@eslint-community/eslint-comments': eslintComments,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      // 抑制ディレクティブの使用自体を全面禁止する
      '@eslint-community/eslint-comments/no-use': 'error',
      // ts-expect-error / ts-ignore / ts-nocheck も全面禁止(ts-check は検査有効化なので許容)
      '@typescript-eslint/ban-ts-comment': ['error', {
        'ts-expect-error': true,
        'ts-ignore': true,
        'ts-nocheck': true,
        'ts-check': false,
      }],
    },
  },
  {
    // migration は実行時点スキーマへの操作であり generated-types と型を共有しない
    // (Kysely 公式推奨の Kysely<any> パターンを許容する。決定記録 D3)
    files: ['src/db/migrations/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },
)
