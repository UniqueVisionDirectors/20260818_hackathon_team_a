import pluginVue from 'eslint-plugin-vue'
import { withVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import eslintComments from '@eslint-community/eslint-plugin-eslint-comments'

export default withVueTs(
  // 第 1 引数はプロジェクトオプション(config と区別するため明示的に指定)
  {
    rootDir: import.meta.dirname,
    // 既定 true は no-unsafe-* 系を緩和してしまうため、strictTypeChecked を全ファイルに適用する
    allowComponentTypeUnsafety: false,
  },
  { ignores: ['dist/**'] },
  pluginVue.configs['flat/recommended'],
  vueTsConfigs.strictTypeChecked,
  vueTsConfigs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        // tsconfig の include 外にある設定ファイルは default project で型付けする
        projectService: {
          allowDefaultProject: ['eslint.config.mjs', 'vite.config.ts', 'knip.config.js'],
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
)
