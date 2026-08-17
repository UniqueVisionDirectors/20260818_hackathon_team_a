import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.BASE_PATH ? `${process.env.BASE_PATH}/` : '/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // 開発サーバーの最適化
  server: {
    port: 5173,
    host: '0.0.0.0',
    allowedHosts: [process.env.HOST],
    hmr: {
      overlay: true,
    },
    // HTTP/2を有効化（HMR維持）
    https: false,
    // より良いエラーハンドリング
    strictPort: false,
    // ファイルウォームアップで開発時パフォーマンス向上
    warmup: {
      clientFiles: ['./src/components/**/*.vue', './src/views/**/*.vue', './src/stores/**/*.ts']
    },
    fs: {
      allow: ['..']
    }
  },
  // 依存関係の事前ビルド最適化
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'pinia',
      'ofetch',
      'yup',
      'vee-validate',
      '@vee-validate/yup',
    ],
    // アグレッシブな最適化
    entries: [
      './src/main.ts',
      './src/**/*.vue',
    ],
    force: false,
  },
  // ビルド最適化
  build: {
    target: 'es2020',
    // チャンク分割戦略
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('/vue/') || id.includes('/vue-router/') || id.includes('/pinia/')) {
            return 'vue-vendor'
          }
          if (id.includes('/vee-validate/') || id.includes('/@vee-validate/') || id.includes('/yup/')) {
            return 'validation'
          }
          if (id.includes('/ofetch/')) return 'utils'
        },
        // チャンクファイル名の最適化
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() ?? 'chunk' : 'chunk';
          return `js/[name]-${facadeModuleId}-[hash].js`;
        },
        assetFileNames: 'assets/[name]-[hash].[ext]',
        entryFileNames: 'js/[name]-[hash].js',
      },
    },
    // チャンクサイズ警告の調整
    chunkSizeWarningLimit: 1000,
    // CSS Code Splitting
    cssCodeSplit: true,
    // Source Map（開発環境のみ）
    sourcemap: process.env.NODE_ENV === 'development',
    // Vite 8標準のOxcを利用し、追加minifier依存を持たない
    minify: 'oxc',
    // アセットのインライン制限
    assetsInlineLimit: 4096,
  },
})
