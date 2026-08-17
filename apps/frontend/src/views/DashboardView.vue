<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="app-header__inner">
        <RouterLink
          class="brand"
          to="/dashboard"
          aria-label="Babylon Stack ホーム"
        >
          <span
            class="brand__mark"
            aria-hidden="true"
          >B</span>
          <span>
            <strong>Babylon Stack</strong>
            <small>Vue · Hono · PostgreSQL</small>
          </span>
        </RouterLink>

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
      <section class="hero">
        <div class="hero__copy">
          <p class="eyebrow">
            REAL-TIME 3D TEMPLATE
          </p>
          <h1>Webアプリと3D体験を、<br>ひとつの型安全な基盤から。</h1>
          <p>
            VueのUI、Babylon.jsのレンダリング、Hono API、PostgreSQLを分離しながら、
            すぐに拡張できるテンプレートです。
          </p>
          <div
            class="tech-list"
            aria-label="採用技術"
          >
            <span>Vue 3</span>
            <span>Babylon.js</span>
            <span>Hono</span>
            <span>PostgreSQL</span>
          </div>
        </div>

        <BabylonCanvas class="hero__viewer" />
      </section>

      <section
        class="workspace"
        aria-labelledby="workspace-title"
      >
        <div class="section-heading">
          <div>
            <p class="eyebrow">
              CONNECTED DATA
            </p>
            <h2 id="workspace-title">
              アプリケーション機能
            </h2>
          </div>
          <p>既存の認証・CRUD・オブジェクトストレージ機能もそのまま利用できます。</p>
        </div>

        <div class="workspace__grid">
          <article class="panel">
            <div class="panel__heading">
              <div>
                <span class="panel__number">01</span>
                <h3>アイテム</h3>
              </div>
              <span class="count-badge">{{ itemsStore.filteredItems.length }} 件</span>
            </div>

            <form
              class="inline-form"
              @submit.prevent="handleAddItem"
            >
              <label
                class="sr-only"
                for="new-item"
              >アイテム名</label>
              <input
                id="new-item"
                v-model="newItemName"
                type="text"
                placeholder="アイテム名を入力"
              >
              <button
                class="button button--primary"
                type="submit"
                :disabled="!newItemName.trim() || itemsStore.loading"
              >
                {{ itemsStore.loading ? '処理中…' : '追加' }}
              </button>
            </form>

            <p
              v-if="itemsStore.error"
              class="feedback feedback--error"
            >
              {{ itemsStore.error }}
            </p>
            <p
              v-if="itemsStore.loading && itemsStore.filteredItems.length === 0"
              class="feedback"
            >
              読み込み中…
            </p>
            <div
              v-else-if="itemsStore.filteredItems.length > 0"
              class="table-wrap"
            >
              <table>
                <thead>
                  <tr>
                    <th scope="col">
                      #
                    </th>
                    <th scope="col">
                      名前
                    </th>
                    <th scope="col">
                      <span class="sr-only">操作</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(item, index) in itemsStore.filteredItems"
                    :key="item.id"
                  >
                    <td>{{ String(index + 1).padStart(2, '0') }}</td>
                    <td>{{ item.name }}</td>
                    <td class="table-actions">
                      <button
                        class="text-button text-button--danger"
                        type="button"
                        @click="handleDeleteItem(item.id)"
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p
              v-else
              class="empty-state"
            >
              アイテムが登録されていません。
            </p>
          </article>

          <article class="panel">
            <div class="panel__heading">
              <div>
                <span class="panel__number">02</span>
                <h3>画像アセット</h3>
              </div>
              <span class="count-badge">{{ imagesStore.sortedImages.length }} 件</span>
            </div>

            <input
              ref="fileInputRef"
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              hidden
              @change="handleFileSelect"
            >
            <button
              class="upload-zone"
              type="button"
              :disabled="imagesStore.uploading"
              @click="triggerFileInput"
            >
              <span
                class="upload-zone__icon"
                aria-hidden="true"
              >↑</span>
              <span>
                <strong>{{ imagesStore.uploading ? 'アップロード中…' : '画像をアップロード' }}</strong>
                <small>JPEG / PNG / GIF / WebP · 最大10MB</small>
              </span>
            </button>

            <p
              v-if="imagesStore.error"
              class="feedback feedback--error"
            >
              {{ imagesStore.error }}
            </p>
            <p
              v-if="imagesStore.loading && imagesStore.sortedImages.length === 0"
              class="feedback"
            >
              読み込み中…
            </p>
            <div
              v-else-if="imagesStore.sortedImages.length > 0"
              class="asset-list"
            >
              <div
                v-for="image in imagesStore.sortedImages"
                :key="image.id"
                class="asset-row"
              >
                <img
                  :src="image.url"
                  :alt="image.original_name"
                  width="48"
                  height="48"
                >
                <span class="asset-row__name">{{ image.original_name }}</span>
                <button
                  class="text-button text-button--danger"
                  type="button"
                  @click="handleDeleteImage(image.id)"
                >
                  削除
                </button>
              </div>
            </div>
            <p
              v-else
              class="empty-state"
            >
              画像が登録されていません。
            </p>
          </article>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import BabylonCanvas from '@/components/BabylonCanvas.vue'
import { useAuthStore, useImagesStore, useItemsStore } from '@/stores'

const router = useRouter()
const authStore = useAuthStore()
const itemsStore = useItemsStore()
const imagesStore = useImagesStore()
const newItemName = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)

const handleLogout = async (): Promise<void> => {
  await authStore.logout()
  await router.push('/login')
}

const handleAddItem = async (): Promise<void> => {
  const name = newItemName.value.trim()

  if (!name) {
    return
  }

  try {
    await itemsStore.addItem({ name })
    newItemName.value = ''
  } catch {
    // Store exposes the user-facing error.
  }
}

const handleDeleteItem = async (id: string): Promise<void> => {
  try {
    await itemsStore.deleteItem(id)
  } catch {
    // Store exposes the user-facing error.
  }
}

const triggerFileInput = (): void => {
  fileInputRef.value?.click()
}

const handleFileSelect = async (event: Event): Promise<void> => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) {
    return
  }

  try {
    await imagesStore.uploadImage(file)
  } catch {
    // Store exposes the user-facing error.
  } finally {
    input.value = ''
  }
}

const handleDeleteImage = async (id: string): Promise<void> => {
  try {
    await imagesStore.deleteImage(id)
  } catch {
    // Store exposes the user-facing error.
  }
}
</script>

