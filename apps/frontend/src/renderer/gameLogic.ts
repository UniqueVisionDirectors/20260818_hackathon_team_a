export const HORIZONTAL_LIMIT = 3.5
export const SPAWN_HEIGHT = 5

const MOVE_SPEED = 2.5
const ROTATION_SPEED = Math.PI / 2

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
