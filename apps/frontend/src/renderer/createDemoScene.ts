import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera'
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight'
import { PointLight } from '@babylonjs/core/Lights/pointLight'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { Scene } from '@babylonjs/core/scene'
import type { AbstractEngine } from '@babylonjs/core/Engines/abstractEngine'

export const createDemoScene = (
  engine: AbstractEngine,
  canvas: HTMLCanvasElement,
): Scene => {
  const scene = new Scene(engine)
  scene.clearColor = new Color4(0.025, 0.04, 0.09, 1)

  const camera = new ArcRotateCamera(
    'main-camera',
    -Math.PI / 2,
    Math.PI / 2.55,
    9,
    new Vector3(0, 0.75, 0),
    scene,
  )
  camera.lowerRadiusLimit = 4.5
  camera.upperRadiusLimit = 14
  camera.wheelDeltaPercentage = 0.01
  camera.attachControl(canvas, true)

  const ambientLight = new HemisphericLight('ambient-light', new Vector3(0, 1, 0), scene)
  ambientLight.intensity = 0.7
  ambientLight.groundColor = new Color3(0.08, 0.12, 0.2)

  const accentLight = new PointLight('accent-light', new Vector3(-3, 4, -2), scene)
  accentLight.diffuse = new Color3(0.42, 0.86, 1)
  accentLight.intensity = 45

  const hero = MeshBuilder.CreatePolyhedron('hero', { type: 2, size: 1.65 }, scene)
  hero.position.y = 1.4

  const heroMaterial = new StandardMaterial('hero-material', scene)
  heroMaterial.diffuseColor = new Color3(0.08, 0.46, 0.75)
  heroMaterial.specularColor = new Color3(0.6, 0.88, 1)
  heroMaterial.emissiveColor = new Color3(0.015, 0.08, 0.14)
  hero.material = heroMaterial

  const ring = MeshBuilder.CreateTorus(
    'orbit-ring',
    { diameter: 5.2, thickness: 0.055, tessellation: 96 },
    scene,
  )
  ring.position.y = 0.8
  ring.rotation.x = Math.PI / 2

  const ringMaterial = new StandardMaterial('ring-material', scene)
  ringMaterial.diffuseColor = new Color3(0.1, 0.45, 0.78)
  ringMaterial.emissiveColor = new Color3(0.04, 0.18, 0.36)
  ring.material = ringMaterial

  const ground = MeshBuilder.CreateGround('ground', { width: 18, height: 18 }, scene)
  const groundMaterial = new StandardMaterial('ground-material', scene)
  groundMaterial.diffuseColor = new Color3(0.035, 0.06, 0.11)
  groundMaterial.specularColor = new Color3(0.05, 0.08, 0.12)
  ground.material = groundMaterial

  scene.onBeforeRenderObservable.add(() => {
    const deltaSeconds = engine.getDeltaTime() / 1000
    hero.rotation.y += deltaSeconds * 0.45
    hero.rotation.x += deltaSeconds * 0.12
    ring.rotation.z -= deltaSeconds * 0.08
  })

  return scene
}
