import type { GameState } from './types'

export const HORIZONTAL_LIMIT = 3.5

const SPAWN_HEIGHT = 5
const MAX_MISSES = 3
const MOVE_SPEED = 2.5
const ROTATION_SPEED = Math.PI / 2
const STABLE_VELOCITY_THRESHOLD = 0.1
const STABLE_DURATION_SECONDS = 0.75
const CAMERA_BASE_TARGET_Y = 1.5
const SPAWN_CLEARANCE = 3

export type GameShape = 'box' | 'sphere' | 'cylinder'

export interface GameTransform {
  x: number
  z: number
  rotationY: number
}

export interface GameInput {
  moveForward: boolean
  moveBackward: boolean
  moveLeft: boolean
  moveRight: boolean
  rotateLeft: boolean
  rotateRight: boolean
}

export interface ObjectScoreState {
  scored: boolean
  missed: boolean
}

export interface ObjectResolution {
  gameState: GameState
  objectState: ObjectScoreState
}

export const createInitialGameState = (): GameState => ({
  phase: 'waiting',
  score: 0,
  misses: 0,
  maxMisses: MAX_MISSES,
})

export const selectRandomShape = (randomValue: number): GameShape => {
  if (randomValue < 1 / 3) {
    return 'box'
  }

  if (randomValue < 2 / 3) {
    return 'sphere'
  }

  return 'cylinder'
}

const clampToPlayArea = (value: number): number =>
  Math.min(HORIZONTAL_LIMIT, Math.max(-HORIZONTAL_LIMIT, value))

export const updateGameTransform = (
  transform: GameTransform,
  input: GameInput,
  deltaSeconds: number,
  dropped: boolean,
): GameTransform => {
  if (dropped) {
    return transform
  }

  const horizontalDirection = Number(input.moveRight) - Number(input.moveLeft)
  const depthDirection = Number(input.moveForward) - Number(input.moveBackward)
  const rotationDirection = Number(input.rotateRight) - Number(input.rotateLeft)

  return {
    x: clampToPlayArea(transform.x + horizontalDirection * MOVE_SPEED * deltaSeconds),
    z: clampToPlayArea(transform.z + depthDirection * MOVE_SPEED * deltaSeconds),
    rotationY: transform.rotationY + rotationDirection * ROTATION_SPEED * deltaSeconds,
  }
}

export const updateStabilityDuration = (
  currentDuration: number,
  linearSpeed: number,
  angularSpeed: number,
  deltaSeconds: number,
): number => {
  if (
    linearSpeed >= STABLE_VELOCITY_THRESHOLD
    || angularSpeed >= STABLE_VELOCITY_THRESHOLD
  ) {
    return 0
  }

  return currentDuration + deltaSeconds
}

export const hasStabilized = (stableDuration: number): boolean =>
  stableDuration >= STABLE_DURATION_SECONDS

export const resolveObjectStable = (
  gameState: GameState,
  objectState: ObjectScoreState,
): ObjectResolution => {
  if (objectState.scored || objectState.missed || gameState.phase === 'game-over') {
    return { gameState, objectState }
  }

  return {
    gameState: {
      ...gameState,
      phase: 'positioning',
      score: gameState.score + 1,
    },
    objectState: { ...objectState, scored: true },
  }
}

export const resolveObjectMiss = (
  gameState: GameState,
  objectState: ObjectScoreState,
  isCurrentObject: boolean,
): ObjectResolution => {
  if (objectState.missed || gameState.phase === 'game-over') {
    return { gameState, objectState }
  }

  const misses = Math.min(gameState.maxMisses, gameState.misses + 1)

  return {
    gameState: {
      ...gameState,
      phase: misses >= gameState.maxMisses
        ? 'game-over'
        : isCurrentObject ? 'positioning' : gameState.phase,
      score: objectState.scored ? Math.max(0, gameState.score - 1) : gameState.score,
      misses,
    },
    objectState: { ...objectState, missed: true },
  }
}

export const calculateSpawnHeight = (highestScoredPoint: number | null): number =>
  Math.max(SPAWN_HEIGHT, (highestScoredPoint ?? 0) + SPAWN_CLEARANCE)

export const calculateCameraTargetY = (highestScoredPoint: number | null): number =>
  Math.max(CAMERA_BASE_TARGET_Y, (highestScoredPoint ?? 0) / 2)
