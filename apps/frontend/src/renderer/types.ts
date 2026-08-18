import type { AbstractEngine } from '@babylonjs/core/Engines/abstractEngine'

export type RendererBackend = 'webgl' | 'webgpu'

export type RendererFallbackReason = 'unsupported' | 'initialization-failed'

export type GamePhase = 'waiting' | 'positioning' | 'settling' | 'game-over'

export interface GameState {
  phase: GamePhase
  score: number
  misses: number
  maxMisses: number
}

export interface RendererInfo {
  requestedBackend: RendererBackend
  activeBackend: RendererBackend
  fallbackReason: RendererFallbackReason | null
}

export interface EngineResult extends RendererInfo {
  engine: AbstractEngine
}
