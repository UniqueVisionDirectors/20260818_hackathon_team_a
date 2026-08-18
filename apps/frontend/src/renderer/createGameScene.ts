import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera'
import type { AbstractEngine } from '@babylonjs/core/Engines/abstractEngine'
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight'
import { PointLight } from '@babylonjs/core/Lights/pointLight'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import type { Mesh } from '@babylonjs/core/Meshes/mesh'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import '@babylonjs/core/Physics/physicsEngineComponent'
import { PhysicsAggregate } from '@babylonjs/core/Physics/v2/physicsAggregate'
import { PhysicsShapeType } from '@babylonjs/core/Physics/v2/IPhysicsEnginePlugin'
import { HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin'
import { Scene } from '@babylonjs/core/scene'
import HavokPhysics from '@babylonjs/havok'
import {
  selectRandomShape,
  SPAWN_HEIGHT,
  updateGameTransform,
  type GameInput,
  type GameShape,
} from './gameLogic'

const OBJECT_MASS = 1
const OBJECT_FRICTION = 0.8
const OBJECT_RESTITUTION = 0.02
const GROUND_SIZE = 9
const GROUND_HALF_SIZE = GROUND_SIZE / 2
const GROUND_GRID_STEP = 1

const inputKeyByCode: Readonly<Partial<Record<string, keyof GameInput>>> = {
  KeyW: 'moveForward',
  KeyS: 'moveBackward',
  KeyA: 'moveLeft',
  KeyD: 'moveRight',
  KeyQ: 'rotateLeft',
  KeyE: 'rotateRight',
}

const createEmptyInput = (): GameInput => ({
  moveForward: false,
  moveBackward: false,
  moveLeft: false,
  moveRight: false,
  rotateLeft: false,
  rotateRight: false,
})

const resetInput = (input: GameInput): void => {
  for (const key of Object.values(inputKeyByCode)) {
    if (key) {
      input[key] = false
    }
  }
}

const createObjectMesh = (shape: GameShape, scene: Scene): Mesh => {
  switch (shape) {
    case 'box':
      return MeshBuilder.CreateBox('game-object-box', { size: 1.2 }, scene)
    case 'sphere':
      return MeshBuilder.CreateSphere(
        'game-object-sphere',
        { diameter: 1.2, segments: 24 },
        scene,
      )
    case 'cylinder':
      return MeshBuilder.CreateCylinder(
        'game-object-cylinder',
        { height: 1.2, diameter: 1.1, tessellation: 32 },
        scene,
      )
  }
}

const getPhysicsShapeType = (shape: GameShape): PhysicsShapeType => {
  switch (shape) {
    case 'box':
      return PhysicsShapeType.BOX
    case 'sphere':
      return PhysicsShapeType.SPHERE
    case 'cylinder':
      return PhysicsShapeType.CYLINDER
  }
}

const createObjectMaterial = (shape: GameShape, scene: Scene): StandardMaterial => {
  const material = new StandardMaterial(`game-object-${shape}-material`, scene)

  switch (shape) {
    case 'box':
      material.diffuseColor = new Color3(0.08, 0.62, 1)
      break
    case 'sphere':
      material.diffuseColor = new Color3(1, 0.28, 0.42)
      break
    case 'cylinder':
      material.diffuseColor = new Color3(0.55, 0.9, 0.2)
      break
  }

  material.emissiveColor = material.diffuseColor.scale(0.16)
  material.specularColor = new Color3(0.75, 0.85, 1)
  return material
}

const createGroundGrid = (scene: Scene): void => {
  const lines: Vector3[][] = []
  const firstGridLine = Math.ceil(-GROUND_HALF_SIZE)
  const lastGridLine = Math.floor(GROUND_HALF_SIZE)

  for (
    let offset = firstGridLine;
    offset <= lastGridLine;
    offset += GROUND_GRID_STEP
  ) {
    lines.push([
      new Vector3(offset, 0.01, -GROUND_HALF_SIZE),
      new Vector3(offset, 0.01, GROUND_HALF_SIZE),
    ])
    lines.push([
      new Vector3(-GROUND_HALF_SIZE, 0.01, offset),
      new Vector3(GROUND_HALF_SIZE, 0.01, offset),
    ])
  }

  const grid = MeshBuilder.CreateLineSystem('ground-grid', { lines }, scene)
  grid.color = new Color3(0.2, 0.55, 0.72)
  grid.alpha = 0.5
  grid.isPickable = false
}

export interface GameSceneResult {
  scene: Scene
  startGame: () => void
}

export const createGameScene = async (
  engine: AbstractEngine,
  canvas: HTMLCanvasElement,
): Promise<GameSceneResult> => {
  const scene = new Scene(engine)

  try {
    scene.clearColor = new Color4(0.025, 0.04, 0.09, 1)

    const camera = new ArcRotateCamera(
      'main-camera',
      -Math.PI / 2,
      Math.PI / 2.55,
      8.5,
      new Vector3(0, 1.5, 0),
      scene,
    )
    camera.lowerRadiusLimit = 4
    camera.upperRadiusLimit = 14
    camera.wheelDeltaPercentage = 0.01
    camera.attachControl(canvas, true)

    const ambientLight = new HemisphericLight(
      'ambient-light',
      new Vector3(0, 1, 0),
      scene,
    )
    ambientLight.intensity = 0.75
    ambientLight.groundColor = new Color3(0.08, 0.12, 0.2)

    const accentLight = new PointLight('accent-light', new Vector3(-3, 6, -2), scene)
    accentLight.diffuse = new Color3(0.42, 0.86, 1)
    accentLight.intensity = 55

    const havokInstance = await HavokPhysics()
    scene.enablePhysics(new Vector3(0, -9.81, 0), new HavokPlugin(true, havokInstance))

    const ground = MeshBuilder.CreateBox(
      'ground',
      { width: GROUND_SIZE, depth: GROUND_SIZE, height: 0.2 },
      scene,
    )
    ground.position.y = -0.1

    const groundMaterial = new StandardMaterial('ground-material', scene)
    groundMaterial.diffuseColor = new Color3(0.12, 0.17, 0.23)
    groundMaterial.emissiveColor = new Color3(0.02, 0.035, 0.05)
    groundMaterial.specularColor = new Color3(0.03, 0.05, 0.07)
    ground.material = groundMaterial
    createGroundGrid(scene)

    new PhysicsAggregate(
      ground,
      PhysicsShapeType.BOX,
      { mass: 0, friction: OBJECT_FRICTION, restitution: OBJECT_RESTITUTION },
      scene,
    )

    const input = createEmptyInput()
    let activeMesh: Mesh | null = null
    let activeShape: GameShape | null = null
    let started = false
    let dropped = false

    const dropActiveObject = (): void => {
      if (!activeMesh || !activeShape || dropped) {
        return
      }

      new PhysicsAggregate(
        activeMesh,
        getPhysicsShapeType(activeShape),
        {
          mass: OBJECT_MASS,
          friction: OBJECT_FRICTION,
          restitution: OBJECT_RESTITUTION,
        },
        scene,
      )
      dropped = true
      resetInput(input)
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (!started) {
        return
      }

      if (event.code === 'Space') {
        event.preventDefault()

        if (!dropped && !event.repeat) {
          dropActiveObject()
        }

        return
      }

      if (dropped) {
        return
      }

      const inputKey = inputKeyByCode[event.code]

      if (inputKey) {
        event.preventDefault()
        input[inputKey] = true
      }
    }

    const handleKeyUp = (event: KeyboardEvent): void => {
      const inputKey = inputKeyByCode[event.code]

      if (inputKey) {
        event.preventDefault()
        input[inputKey] = false
      }
    }

    const handleBlur = (): void => {
      resetInput(input)
    }

    canvas.addEventListener('keydown', handleKeyDown)
    canvas.addEventListener('keyup', handleKeyUp)
    canvas.addEventListener('blur', handleBlur)

    scene.onBeforeRenderObservable.add(() => {
      if (!activeMesh || dropped) {
        return
      }

      const nextTransform = updateGameTransform(
        {
          x: activeMesh.position.x,
          z: activeMesh.position.z,
          rotationY: activeMesh.rotation.y,
        },
        input,
        engine.getDeltaTime() / 1000,
        false,
      )

      activeMesh.position.x = nextTransform.x
      activeMesh.position.z = nextTransform.z
      activeMesh.rotation.y = nextTransform.rotationY
    })

    scene.onDisposeObservable.add(() => {
      canvas.removeEventListener('keydown', handleKeyDown)
      canvas.removeEventListener('keyup', handleKeyUp)
      canvas.removeEventListener('blur', handleBlur)
    })

    return {
      scene,
      startGame: () => {
        if (started) {
          return
        }

        started = true
        activeShape = selectRandomShape(Math.random())
        activeMesh = createObjectMesh(activeShape, scene)
        activeMesh.position.y = SPAWN_HEIGHT
        activeMesh.material = createObjectMaterial(activeShape, scene)
      },
    }
  } catch (error) {
    scene.dispose()
    throw error
  }
}
