<template>
  <figure class="babylon-viewer">
    <div class="babylon-viewer__viewport">
      <canvas
        ref="canvasRef"
        class="babylon-viewer__canvas"
        tabindex="0"
        aria-label="3D積み木ゲーム。W、A、S、Dで移動、QとEで回転、SpaceでDROPします。"
      >
        このブラウザは Canvas に対応していません。
      </canvas>

      <div
        v-if="status !== 'ready'"
        class="babylon-viewer__overlay"
        :class="{ 'babylon-viewer__overlay--error': status === 'error' }"
        role="status"
      >
        <span
          class="babylon-viewer__status-mark"
          aria-hidden="true"
        />
        <span>{{ statusMessage }}</span>
      </div>

      <div
        v-if="status === 'ready' && !gameStarted"
        class="babylon-viewer__start"
      >
        <button
          class="babylon-viewer__start-button"
          type="button"
          @click="handleStartGame"
        >
          START
        </button>
      </div>
    </div>

    <figcaption class="babylon-viewer__caption">
      <span>{{ engineLabel }}</span>
      <span>W / A / S / D: 移動</span>
      <span>Q / E: 回転</span>
      <span>Space: DROP</span>
      <span>ドラッグ: カメラ回転</span>
      <span>ホイール: ズーム</span>
    </figcaption>
  </figure>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, shallowRef } from 'vue'
import type { BabylonRenderer } from '@/renderer/BabylonRenderer'
import type { RendererInfo } from '@/renderer/types'

type ViewerStatus = 'idle' | 'initializing' | 'ready' | 'error'

const emit = defineEmits<{
  ready: [info: RendererInfo]
  error: [error: Error]
}>()

const canvasRef = shallowRef<HTMLCanvasElement | null>(null)
const rendererRef = shallowRef<BabylonRenderer | null>(null)
const status = ref<ViewerStatus>('idle')
const gameStarted = ref(false)
const rendererInfo = shallowRef<RendererInfo | null>(null)
let resizeObserver: ResizeObserver | null = null
let unmounted = false

const requestedBackend = import.meta.env.VITE_BABYLON_RENDERER === 'webgpu'
  ? 'webgpu'
  : 'webgl'

const statusMessage = computed(() => {
  if (status.value === 'error') {
    return '3Dゲームを初期化できませんでした。WebGLとWebAssemblyの利用可否を確認してください。'
  }

  return '3Dシーンを初期化しています…'
})

const engineLabel = computed(() => {
  const info = rendererInfo.value

  if (!info) {
    return requestedBackend.toUpperCase()
  }

  if (info.fallbackReason) {
    return `${info.activeBackend.toUpperCase()}（WebGPUからフォールバック）`
  }

  return info.activeBackend.toUpperCase()
})

const handleVisibilityChange = (): void => {
  rendererRef.value?.setSuspended(document.hidden)
}

const handleStartGame = async (): Promise<void> => {
  const renderer = rendererRef.value

  if (!renderer) {
    return
  }

  try {
    renderer.startGame()
    gameStarted.value = true
    await nextTick()
    canvasRef.value?.focus()
  } catch (cause) {
    const error = cause instanceof Error ? cause : new Error('Unknown game start error')
    status.value = 'error'
    emit('error', error)
  }
}

onMounted(async () => {
  const canvas = canvasRef.value

  if (!canvas) {
    return
  }

  status.value = 'initializing'

  try {
    const { BabylonRenderer } = await import('@/renderer/BabylonRenderer')

    if (unmounted) {
      return
    }

    const renderer = new BabylonRenderer(canvas, { backend: requestedBackend })
    rendererRef.value = renderer
    resizeObserver = new ResizeObserver(() => { renderer.resize(); })
    resizeObserver.observe(canvas)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    const info = await renderer.initialize()

    if (rendererRef.value !== renderer) {
      return
    }

    rendererInfo.value = info
    renderer.setSuspended(document.hidden)
    status.value = 'ready'
    emit('ready', info)
  } catch (cause) {
    if (unmounted) {
      return
    }

    const error = cause instanceof Error ? cause : new Error('Unknown renderer error')
    rendererRef.value?.dispose()
    rendererRef.value = null
    status.value = 'error'
    emit('error', error)
  }
})

onUnmounted(() => {
  unmounted = true
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  resizeObserver?.disconnect()
  resizeObserver = null
  rendererRef.value?.dispose()
  rendererRef.value = null
})
</script>

<style scoped>
.babylon-viewer {
  display: grid;
  margin: 0;
  overflow: hidden;
  border: 1px solid rgba(137, 196, 255, 0.2);
  border-radius: 1.25rem;
  background: #06101f;
  box-shadow: 0 1.5rem 4rem rgba(0, 12, 32, 0.35);
}

.babylon-viewer__viewport {
  position: relative;
  min-height: 26rem;
}

.babylon-viewer__canvas {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 26rem;
  outline: none;
  touch-action: none;
}

.babylon-viewer__canvas:focus-visible {
  box-shadow: inset 0 0 0 3px #56c8ff;
}

.babylon-viewer__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem;
  color: #d8edff;
  background: rgba(4, 13, 29, 0.82);
  text-align: center;
}

.babylon-viewer__overlay--error {
  color: #ffd5d9;
}

.babylon-viewer__start {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(4, 13, 29, 0.5);
}

.babylon-viewer__start-button {
  min-width: 10rem;
  min-height: 3.5rem;
  padding: 0.8rem 1.6rem;
  border: 1px solid rgba(126, 229, 255, 0.7);
  border-radius: 0.8rem;
  color: #03243a;
  background: linear-gradient(145deg, #7ee5ff, #1ba4ea);
  box-shadow: 0 0.8rem 2rem rgba(28, 156, 220, 0.32);
  font-weight: 800;
  letter-spacing: 0.12em;
  transition: box-shadow 160ms ease, transform 160ms ease;
}

.babylon-viewer__start-button:hover {
  box-shadow: 0 1rem 2.4rem rgba(28, 156, 220, 0.48);
  transform: translateY(-1px);
}

.babylon-viewer__start-button:focus-visible {
  outline: 3px solid #ffffff;
  outline-offset: 3px;
}

.babylon-viewer__start-button:active {
  transform: translateY(1px);
}

.babylon-viewer__status-mark {
  width: 0.75rem;
  height: 0.75rem;
  flex: 0 0 auto;
  border-radius: 50%;
  background: #52d5ff;
  box-shadow: 0 0 1rem #52d5ff;
  animation: pulse 1.2s ease-in-out infinite;
}

.babylon-viewer__overlay--error .babylon-viewer__status-mark {
  background: #ff6e7e;
  box-shadow: 0 0 1rem #ff6e7e;
  animation: none;
}

.babylon-viewer__caption {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.25rem;
  padding: 0.8rem 1rem;
  border-top: 1px solid rgba(137, 196, 255, 0.14);
  color: #91abc5;
  background: #071526;
  font-size: 0.78rem;
  letter-spacing: 0.04em;
}

.babylon-viewer__caption span:first-child {
  color: #6ed7ff;
  font-weight: 700;
}

@keyframes pulse {
  50% {
    opacity: 0.4;
    transform: scale(0.72);
  }
}

@media (max-width: 640px) {
  .babylon-viewer__viewport,
  .babylon-viewer__canvas {
    min-height: 20rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .babylon-viewer__status-mark {
    animation: none;
  }
}
</style>
