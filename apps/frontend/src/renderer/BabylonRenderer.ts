import type { AbstractEngine } from '@babylonjs/core/Engines/abstractEngine'
import type { AssetContainer } from '@babylonjs/core/assetContainer'
import type { Scene } from '@babylonjs/core/scene'
import { createDemoScene } from './createDemoScene'
import { createEngine } from './createEngine'
import type { RendererBackend, RendererInfo } from './types'

export interface BabylonRendererOptions {
  backend?: RendererBackend
}

export class BabylonRenderer {
  private readonly canvas: HTMLCanvasElement
  private readonly requestedBackend: RendererBackend
  private engine: AbstractEngine | null = null
  private scene: Scene | null = null
  private disposed = false
  private rendering = false

  private readonly renderFrame = (): void => {
    this.scene?.render()
  }

  constructor(canvas: HTMLCanvasElement, options: BabylonRendererOptions = {}) {
    this.canvas = canvas
    this.requestedBackend = options.backend ?? 'webgl'
  }

  // disposed をプロパティ直読でなくメソッド経由で参照する: TS の narrowing は await を跨いで
  // 維持されるため、initialize() の await 後の再チェックが「常に false」と誤検出される。メソッド
  // 戻り値は narrowing が持続しないためこれを回避する。
  private isDisposed(): boolean {
    return this.disposed
  }

  async initialize(): Promise<RendererInfo> {
    if (this.isDisposed()) {
      throw new Error('Cannot initialize a disposed renderer.')
    }

    const result = await createEngine(this.canvas, this.requestedBackend)

    // await 中に dispose() され得るため再チェックする
    if (this.isDisposed()) {
      result.engine.dispose()
      throw new Error('Renderer was disposed during initialization.')
    }

    this.engine = result.engine

    try {
      this.scene = createDemoScene(result.engine, this.canvas)
      this.startRendering()
    } catch (error) {
      this.engine.dispose()
      this.engine = null
      throw error
    }

    return {
      requestedBackend: result.requestedBackend,
      activeBackend: result.activeBackend,
      fallbackReason: result.fallbackReason,
    }
  }

  resize(): void {
    this.engine?.resize()
  }

  setSuspended(suspended: boolean): void {
    if (suspended) {
      this.stopRendering()
      return
    }

    this.startRendering()
  }

  async loadGltf(source: string | File): Promise<AssetContainer> {
    if (!this.scene) {
      throw new Error('Initialize the renderer before loading an asset.')
    }

    await import('@babylonjs/loaders/glTF')
    const { LoadAssetContainerAsync } = await import('@babylonjs/core/Loading/sceneLoader')
    const container = await LoadAssetContainerAsync(source, this.scene)
    container.addAllToScene()
    return container
  }

  dispose(): void {
    if (this.disposed) {
      return
    }

    this.disposed = true
    this.stopRendering()
    this.scene?.dispose()
    this.engine?.dispose()
    this.scene = null
    this.engine = null
  }

  private startRendering(): void {
    if (this.rendering || this.disposed || !this.engine || !this.scene) {
      return
    }

    this.engine.runRenderLoop(this.renderFrame)
    this.rendering = true
  }

  private stopRendering(): void {
    if (!this.rendering || !this.engine) {
      return
    }

    this.engine.stopRenderLoop(this.renderFrame)
    this.rendering = false
  }
}
