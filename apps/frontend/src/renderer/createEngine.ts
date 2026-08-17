import type { AbstractEngine } from '@babylonjs/core/Engines/abstractEngine'
import { Engine } from '@babylonjs/core/Engines/engine'
import type { EngineResult, RendererBackend, RendererFallbackReason } from './types'

const createWebGlEngine = (canvas: HTMLCanvasElement): AbstractEngine =>
  new Engine(canvas, true, {
    adaptToDeviceRatio: true,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: false,
    stencil: true,
  })

const createWebGpuEngine = async (canvas: HTMLCanvasElement): Promise<AbstractEngine | null> => {
  const { WebGPUEngine } = await import('@babylonjs/core/Engines/webgpuEngine')

  if (!(await WebGPUEngine.IsSupportedAsync)) {
    return null
  }

  return WebGPUEngine.CreateAsync(canvas, {
    adaptToDeviceRatio: true,
    antialias: true,
    powerPreference: 'high-performance',
  })
}

export const createEngine = async (
  canvas: HTMLCanvasElement,
  requestedBackend: RendererBackend,
): Promise<EngineResult> => {
  if (requestedBackend === 'webgl') {
    return {
      engine: createWebGlEngine(canvas),
      requestedBackend,
      activeBackend: 'webgl',
      fallbackReason: null,
    }
  }

  let fallbackReason: RendererFallbackReason = 'unsupported'

  try {
    const webGpuEngine = await createWebGpuEngine(canvas)

    if (webGpuEngine) {
      return {
        engine: webGpuEngine,
        requestedBackend,
        activeBackend: 'webgpu',
        fallbackReason: null,
      }
    }
  } catch (error) {
    fallbackReason = 'initialization-failed'
    console.warn('WebGPU initialization failed. Falling back to WebGL.', error)
  }

  return {
    engine: createWebGlEngine(canvas),
    requestedBackend,
    activeBackend: 'webgl',
    fallbackReason,
  }
}

