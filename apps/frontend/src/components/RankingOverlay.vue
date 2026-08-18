<template>
  <section
    class="ranking-overlay"
    aria-labelledby="ranking-game-over-title"
  >
    <div class="ranking-overlay__panel">
      <h2
        id="ranking-game-over-title"
        class="ranking-overlay__game-over"
      >
        GAME OVER
      </h2>
      <p class="ranking-overlay__final-score">
        FINAL SCORE {{ finalScore }}
      </p>

      <form
        v-if="status === 'entry' || status === 'submitting'"
        class="ranking-overlay__form"
        @submit.prevent="handleSubmit"
      >
        <label for="ranking-nickname">ニックネーム</label>
        <input
          id="ranking-nickname"
          ref="nicknameInputRef"
          v-model="nickname"
          class="ranking-overlay__input"
          name="nickname"
          type="text"
          autocomplete="nickname"
          maxlength="255"
          required
          :disabled="status === 'submitting'"
          :aria-describedby="inputError ? 'ranking-nickname-error' : undefined"
        >
        <p
          v-if="inputError"
          id="ranking-nickname-error"
          class="ranking-overlay__message ranking-overlay__message--error"
          role="alert"
        >
          {{ inputError }}
        </p>
        <button
          class="ranking-overlay__button ranking-overlay__button--primary"
          type="submit"
          :disabled="status === 'submitting'"
        >
          {{ status === 'submitting' ? '登録中…' : 'ランキングに登録' }}
        </button>
      </form>

      <p
        v-if="status === 'submitting' || status === 'loading'"
        class="ranking-overlay__message"
        role="status"
      >
        {{ status === 'submitting' ? 'スコアを登録しています…' : 'ランキングを読み込んでいます…' }}
      </p>

      <div
        v-if="status === 'ready'"
        class="ranking-overlay__results"
      >
        <h3
          ref="resultsHeadingRef"
          class="ranking-overlay__results-title"
          tabindex="-1"
        >
          RANKING
        </h3>

        <p
          v-if="registrationFailed"
          class="ranking-overlay__message ranking-overlay__message--warning"
          aria-live="polite"
        >
          今回のスコアは登録を確認できませんでした。
        </p>

        <div
          v-if="rankingView.topEntries.length > 0"
          class="ranking-overlay__table-wrap"
        >
          <table class="ranking-overlay__table">
            <caption>上位10件</caption>
            <thead>
              <tr>
                <th scope="col">
                  順位
                </th>
                <th scope="col">
                  ニックネーム
                </th>
                <th scope="col">
                  スコア
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="entry in rankingView.topEntries"
                :key="entry.id"
                :class="{ 'ranking-overlay__current-row': entry.id === submittedRankingId }"
              >
                <td>{{ entry.rank }}</td>
                <th scope="row">
                  {{ entry.nickname }}
                </th>
                <td>{{ entry.score }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p
          v-else
          class="ranking-overlay__message"
        >
          ランキングはまだありません。
        </p>

        <p
          v-if="rankingView.currentEntryIsOutsideTopTen && rankingView.currentEntry"
          class="ranking-overlay__current-rank"
        >
          あなたの順位: {{ rankingView.currentEntry.rank }}位
          — {{ rankingView.currentEntry.nickname }} / {{ rankingView.currentEntry.score }}点
        </p>
        <p
          v-else-if="rankingView.isOutsideTopHundred"
          class="ranking-overlay__current-rank"
        >
          あなたの順位: 100位圏外
        </p>
      </div>

      <div
        v-if="status === 'unavailable'"
        class="ranking-overlay__unavailable"
      >
        <h3
          ref="resultsHeadingRef"
          class="ranking-overlay__results-title"
          tabindex="-1"
        >
          ランキングを利用できません
        </h3>
        <p
          class="ranking-overlay__message ranking-overlay__message--error"
          aria-live="polite"
        >
          APIに接続できませんでした。ゲームはそのまま続けられます。
        </p>
        <button
          class="ranking-overlay__button ranking-overlay__button--secondary"
          type="button"
          @click="handleReload"
        >
          ランキングを再読み込み
        </button>
      </div>

      <button
        class="ranking-overlay__button ranking-overlay__button--retry"
        type="button"
        @click="handleRetry"
      >
        RETRY
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, shallowRef } from 'vue'
import { createRanking, getRankings } from '@/services/rankings.service'
import type { RankingEntry } from '@/types'
import { buildRankingView, normalizeNickname } from './rankingLogic'

type RankingStatus = 'entry' | 'submitting' | 'loading' | 'ready' | 'unavailable'

const props = defineProps<{
  finalScore: number
}>()

const emit = defineEmits<{
  retry: []
}>()

const nicknameInputRef = shallowRef<HTMLInputElement | null>(null)
const resultsHeadingRef = shallowRef<HTMLHeadingElement | null>(null)
const nickname = ref('')
const inputError = ref<string | null>(null)
const status = ref<RankingStatus>('entry')
const rankings = ref<RankingEntry[]>([])
const submittedRankingId = ref<string | null>(null)
const registrationFailed = ref(false)
let requestController: AbortController | null = null
let disposed = false

const rankingView = computed(() =>
  buildRankingView(rankings.value, submittedRankingId.value),
)

const focusResults = async (): Promise<void> => {
  await nextTick()

  if (!disposed) {
    resultsHeadingRef.value?.focus()
  }
}

const loadRankings = async (controller: AbortController): Promise<void> => {
  status.value = 'loading'

  try {
    const result = await getRankings(controller.signal)

    if (disposed || controller.signal.aborted || requestController !== controller) {
      return
    }

    rankings.value = result
    status.value = 'ready'
    await focusResults()
  } catch {
    if (disposed || controller.signal.aborted || requestController !== controller) {
      return
    }

    status.value = 'unavailable'
    await focusResults()
  }
}

const handleSubmit = async (): Promise<void> => {
  if (status.value !== 'entry') {
    return
  }

  const normalizedNickname = normalizeNickname(nickname.value)

  if (!normalizedNickname) {
    inputError.value = 'ニックネームを1～255文字で入力してください。'
    return
  }

  nickname.value = normalizedNickname
  inputError.value = null
  registrationFailed.value = false
  requestController?.abort()
  const controller = new AbortController()
  requestController = controller
  status.value = 'submitting'

  try {
    const createdRanking = await createRanking(
      { nickname: normalizedNickname, score: props.finalScore },
      controller.signal,
    )

    if (disposed || controller.signal.aborted || requestController !== controller) {
      return
    }

    submittedRankingId.value = createdRanking.id
  } catch {
    if (disposed || controller.signal.aborted || requestController !== controller) {
      return
    }

    registrationFailed.value = true
  }

  await loadRankings(controller)
}

const handleReload = async (): Promise<void> => {
  requestController?.abort()
  const controller = new AbortController()
  requestController = controller
  await loadRankings(controller)
}

const handleRetry = (): void => {
  requestController?.abort()
  emit('retry')
}

onMounted(async () => {
  await nextTick()
  nicknameInputRef.value?.focus()
})

onUnmounted(() => {
  disposed = true
  requestController?.abort()
  requestController = null
})
</script>

<style scoped>
.ranking-overlay {
  position: absolute;
  z-index: 2;
  inset: 0;
  overflow-y: auto;
  padding: 1rem;
  color: #eef9ff;
  background: rgba(4, 13, 29, 0.88);
}

.ranking-overlay__panel {
  display: grid;
  width: min(34rem, 100%);
  min-height: 100%;
  margin: 0 auto;
  place-content: center;
  justify-items: stretch;
  gap: 0.8rem;
  text-align: center;
}

.ranking-overlay__game-over,
.ranking-overlay__final-score,
.ranking-overlay__results-title,
.ranking-overlay__message,
.ranking-overlay__current-rank {
  margin: 0;
}

.ranking-overlay__game-over {
  color: #ff7585;
  font-size: clamp(1.8rem, 5vw, 3rem);
  font-weight: 900;
  letter-spacing: 0.12em;
  text-shadow: 0 0 1.5rem rgba(255, 72, 94, 0.42);
}

.ranking-overlay__final-score {
  font-size: clamp(1rem, 3vw, 1.35rem);
  font-weight: 800;
  letter-spacing: 0.08em;
}

.ranking-overlay__form {
  display: grid;
  gap: 0.55rem;
  text-align: left;
}

.ranking-overlay__input {
  width: 100%;
  min-height: 2.75rem;
  padding: 0.65rem 0.8rem;
  border: 1px solid rgba(126, 229, 255, 0.55);
  border-radius: 0.65rem;
  color: #eef9ff;
  background: rgba(5, 22, 42, 0.94);
  font: inherit;
}

.ranking-overlay__input:focus-visible,
.ranking-overlay__button:focus-visible,
.ranking-overlay__results-title:focus-visible {
  outline: 3px solid #ffffff;
  outline-offset: 3px;
}

.ranking-overlay__message {
  color: #bfefff;
  font-size: 0.88rem;
}

.ranking-overlay__message--error {
  color: #ffb6bf;
}

.ranking-overlay__message--warning {
  color: #ffe29a;
}

.ranking-overlay__results,
.ranking-overlay__unavailable {
  display: grid;
  gap: 0.65rem;
}

.ranking-overlay__results-title {
  color: #7ee5ff;
  font-size: 1.25rem;
  letter-spacing: 0.1em;
}

.ranking-overlay__table-wrap {
  max-height: 13rem;
  overflow: auto;
  border: 1px solid rgba(126, 229, 255, 0.25);
  border-radius: 0.65rem;
}

.ranking-overlay__table {
  width: 100%;
  border-collapse: collapse;
  font-variant-numeric: tabular-nums;
}

.ranking-overlay__table caption {
  padding: 0.45rem;
  color: #bfefff;
  font-weight: 700;
}

.ranking-overlay__table th,
.ranking-overlay__table td {
  padding: 0.38rem 0.55rem;
  border-top: 1px solid rgba(126, 229, 255, 0.16);
  text-align: left;
}

.ranking-overlay__table th:first-child,
.ranking-overlay__table td:first-child,
.ranking-overlay__table th:last-child,
.ranking-overlay__table td:last-child {
  text-align: center;
}

.ranking-overlay__table tbody th {
  font-weight: 500;
}

.ranking-overlay__current-row {
  color: #ffffff;
  background: rgba(27, 164, 234, 0.28);
  box-shadow: inset 3px 0 #7ee5ff;
}

.ranking-overlay__current-rank {
  padding: 0.55rem;
  border-radius: 0.55rem;
  color: #ffffff;
  background: rgba(27, 164, 234, 0.2);
  font-weight: 700;
}

.ranking-overlay__button {
  min-height: 2.75rem;
  padding: 0.65rem 1rem;
  border: 1px solid rgba(126, 229, 255, 0.6);
  border-radius: 0.65rem;
  font: inherit;
  font-weight: 800;
  letter-spacing: 0.06em;
  cursor: pointer;
}

.ranking-overlay__button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.ranking-overlay__button--primary,
.ranking-overlay__button--retry {
  color: #03243a;
  background: linear-gradient(145deg, #7ee5ff, #1ba4ea);
}

.ranking-overlay__button--secondary {
  color: #dff7ff;
  background: rgba(7, 42, 70, 0.9);
}

.ranking-overlay__button--retry {
  width: min(12rem, 100%);
  margin-top: 0.75rem;
  justify-self: center;
}

@media (max-width: 640px) {
  .ranking-overlay {
    padding: 0.75rem;
  }

  .ranking-overlay__panel {
    gap: 0.6rem;
  }

  .ranking-overlay__table th,
  .ranking-overlay__table td {
    padding: 0.3rem 0.4rem;
    font-size: 0.78rem;
  }
}
</style>
