import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera'
import type { AbstractEngine } from '@babylonjs/core/Engines/abstractEngine'
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight'
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
  calculateCameraTargetY,
  calculateSpawnHeight,
  createInitialGameState,
  hasStabilized,
  resolveObjectMiss,
  resolveObjectStable,
  selectRandomShape,
  updateStabilityDuration,
  updateGameTransform,
  type GameInput,
  type GameShape,
  type ObjectScoreState,
} from './gameLogic'
import type { GameState } from './types'

const OBJECT_MASS = 1
const OBJECT_FRICTION = 0.8
const OBJECT_RESTITUTION = 0.02
const GROUND_SIZE = 4.5
const GROUND_HALF_SIZE = GROUND_SIZE / 2
const GROUND_GRID_STEP = 1
const FALL_THRESHOLD_Y = -5
const CAMERA_INITIAL_ALPHA = -Math.PI / 2
const CAMERA_INITIAL_BETA = Math.PI / 2.55
const CAMERA_INITIAL_RADIUS = 8.5
const CAMERA_FOLLOW_SPEED = 3

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
      material.diffuseColor = new Color3(0.04, 0.12, 0.68)
      break
    case 'sphere':
      material.diffuseColor = new Color3(0.72, 0.035, 0.045)
      break
    case 'cylinder':
      material.diffuseColor = new Color3(0.035, 0.48, 0.1)
      break
  }

  material.emissiveColor = material.diffuseColor.scale(0.2)
  material.specularColor = new Color3(0.35, 0.4, 0.48)
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
  restartGame: () => void
}

export interface GameSceneOptions {
  onGameStateChange?: (state: GameState) => void
}

interface GameObjectRecord extends ObjectScoreState {
  mesh: Mesh
  shape: GameShape
  aggregate: PhysicsAggregate | null
  stableDuration: number
}

export const createGameScene = async (
  engine: AbstractEngine,
  canvas: HTMLCanvasElement,
  options: GameSceneOptions = {},
): Promise<GameSceneResult> => {
  const scene = new Scene(engine)

  try {
    scene.clearColor = new Color4(0.025, 0.04, 0.09, 1)

    const camera = new ArcRotateCamera(
      'main-camera',
      CAMERA_INITIAL_ALPHA,
      CAMERA_INITIAL_BETA,
      CAMERA_INITIAL_RADIUS,
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
    ambientLight.intensity = 1.05
    ambientLight.diffuse = new Color3(1, 1, 1)
    ambientLight.groundColor = new Color3(0.38, 0.4, 0.46)

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
    const gameObjects = new Set<GameObjectRecord>()
    let activeObject: GameObjectRecord | null = null
    let gameState = createInitialGameState()

    const publishGameState = (): void => {
      options.onGameStateChange?.({ ...gameState })
    }

    const updateGameState = (nextState: GameState): void => {
      gameState = nextState
      publishGameState()
    }

    const isGameOver = (): boolean => gameState.phase === 'game-over'

    const getHighestScoredPoint = (): number | null => {
      let highestPoint: number | null = null

      for (const gameObject of gameObjects) {
        if (!gameObject.scored || gameObject.missed) {
          continue
        }

        gameObject.mesh.computeWorldMatrix(true)
        const objectTop = gameObject.mesh.getBoundingInfo().boundingBox.maximumWorld.y
        highestPoint = highestPoint === null ? objectTop : Math.max(highestPoint, objectTop)
      }

      return highestPoint
    }

    const disposeGameObject = (gameObject: GameObjectRecord): void => {
      gameObject.aggregate?.dispose()
      gameObject.mesh.material?.dispose()
      gameObject.mesh.dispose()
      gameObjects.delete(gameObject)
    }

    const disposeAllGameObjects = (): void => {
      for (const gameObject of [...gameObjects]) {
        disposeGameObject(gameObject)
      }

      activeObject = null
    }

    const spawnNextObject = (): void => {
      if (gameState.phase === 'game-over') {
        return
      }

      const shape = selectRandomShape(Math.random())
      const mesh = createObjectMesh(shape, scene)
      mesh.position.y = calculateSpawnHeight(getHighestScoredPoint())
      mesh.material = createObjectMaterial(shape, scene)

      activeObject = {
        mesh,
        shape,
        aggregate: null,
        stableDuration: 0,
        scored: false,
        missed: false,
      }
      gameObjects.add(activeObject)
      updateGameState({ ...gameState, phase: 'positioning' })
    }

    const dropActiveObject = (): void => {
      if (
        gameState.phase !== 'positioning'
        || !activeObject
        || activeObject.aggregate
      ) {
        return
      }

      activeObject.aggregate = new PhysicsAggregate(
        activeObject.mesh,
        getPhysicsShapeType(activeObject.shape),
        {
          mass: OBJECT_MASS,
          friction: OBJECT_FRICTION,
          restitution: OBJECT_RESTITUTION,
        },
        scene,
      )
      activeObject.stableDuration = 0
      resetInput(input)
      updateGameState({ ...gameState, phase: 'settling' })
    }

    const resolveMissForObject = (gameObject: GameObjectRecord): boolean => {
      const isCurrentObject = gameObject === activeObject
      const result = resolveObjectMiss(gameState, gameObject, isCurrentObject)
      gameObject.scored = result.objectState.scored
      gameObject.missed = result.objectState.missed

      if (isCurrentObject) {
        activeObject = null
      }

      disposeGameObject(gameObject)
      updateGameState(result.gameState)
      return isCurrentObject
    }

    const resolveStableActiveObject = (): void => {
      if (!activeObject) {
        return
      }

      const result = resolveObjectStable(gameState, activeObject)
      activeObject.scored = result.objectState.scored
      activeObject.missed = result.objectState.missed
      activeObject = null
      updateGameState(result.gameState)
      spawnNextObject()
    }

    const updateCameraTarget = (deltaSeconds: number): void => {
      const desiredTargetY = calculateCameraTargetY(getHighestScoredPoint())
      const followAmount = 1 - Math.exp(-CAMERA_FOLLOW_SPEED * deltaSeconds)
      const nextTargetY = camera.target.y
        + (desiredTargetY - camera.target.y) * followAmount
      camera.setTarget(new Vector3(camera.target.x, nextTargetY, camera.target.z))
    }

    const resetCamera = (): void => {
      camera.alpha = CAMERA_INITIAL_ALPHA
      camera.beta = CAMERA_INITIAL_BETA
      camera.radius = CAMERA_INITIAL_RADIUS
      camera.inertialAlphaOffset = 0
      camera.inertialBetaOffset = 0
      camera.inertialRadiusOffset = 0
      camera.inertialPanningX = 0
      camera.inertialPanningY = 0
      camera.setTarget(new Vector3(0, 1.5, 0))
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (gameState.phase === 'waiting' || gameState.phase === 'game-over') {
        return
      }

      if (event.code === 'Space') {
        event.preventDefault()

        if (gameState.phase === 'positioning' && !event.repeat) {
          dropActiveObject()
        }

        return
      }

      if (gameState.phase !== 'positioning') {
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
      if (gameState.phase === 'game-over') {
        return
      }

      const deltaSeconds = Math.min(engine.getDeltaTime() / 1000, 0.1)
      let currentObjectMissed = false

      for (const gameObject of [...gameObjects]) {
        if (
          gameObject.aggregate
          && !gameObject.missed
          && gameObject.mesh.position.y < FALL_THRESHOLD_Y
        ) {
          currentObjectMissed = resolveMissForObject(gameObject) || currentObjectMissed

          if (isGameOver()) {
            resetInput(input)
            return
          }
        }
      }

      if (currentObjectMissed) {
        spawnNextObject()
      }

      if (
        gameState.phase === 'positioning'
        && activeObject
        && !activeObject.aggregate
      ) {
        const nextTransform = updateGameTransform(
          {
            x: activeObject.mesh.position.x,
            z: activeObject.mesh.position.z,
            rotationY: activeObject.mesh.rotation.y,
          },
          input,
          deltaSeconds,
          false,
        )

        activeObject.mesh.position.x = nextTransform.x
        activeObject.mesh.position.z = nextTransform.z
        activeObject.mesh.rotation.y = nextTransform.rotationY
      } else if (
        gameState.phase === 'settling'
        && activeObject?.aggregate
      ) {
        activeObject.stableDuration = updateStabilityDuration(
          activeObject.stableDuration,
          activeObject.aggregate.body.getLinearVelocity().length(),
          activeObject.aggregate.body.getAngularVelocity().length(),
          deltaSeconds,
        )

        if (hasStabilized(activeObject.stableDuration)) {
          resolveStableActiveObject()
        }
      }

      updateCameraTarget(deltaSeconds)
    })

    scene.onDisposeObservable.add(() => {
      canvas.removeEventListener('keydown', handleKeyDown)
      canvas.removeEventListener('keyup', handleKeyUp)
      canvas.removeEventListener('blur', handleBlur)
      gameObjects.clear()
    })

    publishGameState()

    return {
      scene,
      startGame: () => {
        if (gameState.phase !== 'waiting') {
          return
        }

        spawnNextObject()
      },
      restartGame: () => {
        disposeAllGameObjects()
        resetInput(input)
        resetCamera()
        gameState = createInitialGameState()
        spawnNextObject()
      },
    }
  } catch (error) {
    scene.dispose()
    throw error
  }
}
