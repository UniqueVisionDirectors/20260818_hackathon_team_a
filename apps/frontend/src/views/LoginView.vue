<template>
  <main class="auth-page">
    <section class="auth-panel">
      <div
        class="brand"
        aria-label="Babylon Stack"
      >
        <span
          class="brand__mark"
          aria-hidden="true"
        >B</span>
        <span>
          <strong>Babylon Stack</strong>
          <small>Vue · Hono · PostgreSQL</small>
        </span>
      </div>

      <h1>ログイン</h1>
      <p class="auth-panel__lead">
        アカウント情報を入力して、3Dワークスペースを開きます。
      </p>

      <form
        class="auth-form"
        @submit.prevent="handleSubmit"
      >
        <div class="auth-field">
          <label for="email">メールアドレス</label>
          <input
            id="email"
            v-model="email"
            type="email"
            autocomplete="email"
            placeholder="you@example.com"
            required
          >
        </div>

        <div class="auth-field">
          <label for="password">パスワード</label>
          <input
            id="password"
            v-model="password"
            type="password"
            autocomplete="current-password"
            placeholder="6文字以上"
            required
          >
        </div>

        <p
          v-if="error"
          class="auth-error"
          role="alert"
        >
          {{ error }}
        </p>

        <button
          class="button button--primary"
          type="submit"
          :disabled="!isFormValid || loading"
        >
          {{ loading ? 'ログイン中…' : 'ログイン' }}
        </button>
      </form>
    </section>

    <aside
      class="auth-visual"
      aria-label="テンプレートの概要"
    >
      <div class="auth-visual__content">
        <span>BROWSER-NATIVE 3D</span>
        <h2>Interface meets immersive space.</h2>
        <p>
          Babylon.js のレンダリングを Vue のライフサイクルから分離。
          API、データ、3D表現をそれぞれ安全に拡張できます。
        </p>
      </div>
    </aside>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores'

const router = useRouter()
const authStore = useAuthStore()
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const isEmailValid = computed(() =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value),
)
const isPasswordValid = computed(() => password.value.length >= 6)
const isFormValid = computed(() => isEmailValid.value && isPasswordValid.value)

const handleSubmit = async (): Promise<void> => {
  if (!isFormValid.value) {
    return
  }

  loading.value = true
  error.value = ''

  try {
    const success = await authStore.login({
      email: email.value,
      password: password.value,
    })

    if (success) {
      email.value = ''
      password.value = ''
      await router.push('/dashboard')
      return
    }

    error.value = authStore.error
      ?? 'ログインに失敗しました。メールアドレスとパスワードを確認してください。'
  } catch {
    error.value = 'ログインに失敗しました。メールアドレスとパスワードを確認してください。'
  } finally {
    loading.value = false
  }
}
</script>
