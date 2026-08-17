import type { AbstractEngine } from '@babylonjs/core/Engines/abstractEngine'

export type RendererBackend = 'webgl' | 'webgpu'

export type RendererFallbackReason = 'unsupported' | 'initialization-failed'

export interface RendererInfo {
  requestedBackend: RendererBackend
  activeBackend: RendererBackend
  fallbackReason: RendererFallbackReason | null
}

export interface EngineResult extends RendererInfo {
  engine: AbstractEngine
}

