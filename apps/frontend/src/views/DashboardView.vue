<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="app-header__inner">
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
            <small>3D GAME</small>
          </span>
        </div>

        <div class="account">
          <span class="account__email">{{ authStore.currentUser?.email }}</span>
          <button
            class="button button--ghost"
            type="button"
            @click="handleLogout"
          >
            ログアウト
          </button>
        </div>
      </div>
    </header>

    <main class="dashboard">
      <BabylonCanvas class="dashboard__renderer" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import BabylonCanvas from '@/components/BabylonCanvas.vue'
import { useAuthStore } from '@/stores'

const router = useRouter()
const authStore = useAuthStore()

const handleLogout = async (): Promise<void> => {
  await authStore.logout()
  await router.push('/login')
}
</script>
