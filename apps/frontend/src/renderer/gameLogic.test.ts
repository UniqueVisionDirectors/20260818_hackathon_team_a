import { describe, expect, it } from 'vitest'
import {
  HORIZONTAL_LIMIT,
  selectRandomShape,
  updateGameTransform,
  type GameInput,
  type GameTransform,
} from './gameLogic'

const activeInput: GameInput = {
  moveForward: true,
  moveBackward: false,
  moveLeft: false,
  moveRight: true,
  rotateLeft: false,
  rotateRight: true,
}

describe('selectRandomShape', () => {
  it.each([
    [0, 'box'],
    [0.32, 'box'],
    [1 / 3, 'sphere'],
    [0.65, 'sphere'],
    [2 / 3, 'cylinder'],
    [0.99, 'cylinder'],
  ] as const)('selects a shape for random value %s', (randomValue, expected) => {
    expect(selectRandomShape(randomValue)).toBe(expected)
  })
})

describe('updateGameTransform', () => {
  it('clamps movement to the horizontal play area', () => {
    const transform: GameTransform = {
      x: HORIZONTAL_LIMIT - 0.1,
      z: HORIZONTAL_LIMIT - 0.1,
      rotationY: 0,
    }

    const result = updateGameTransform(transform, activeInput, 1, false)

    expect(result.x).toBe(HORIZONTAL_LIMIT)
    expect(result.z).toBe(HORIZONTAL_LIMIT)
  })

  it('clamps movement to the negative horizontal boundary', () => {
    const transform: GameTransform = {
      x: -HORIZONTAL_LIMIT + 0.1,
      z: -HORIZONTAL_LIMIT + 0.1,
      rotationY: 0,
    }
    const negativeInput: GameInput = {
      ...activeInput,
      moveForward: false,
      moveBackward: true,
      moveLeft: true,
      moveRight: false,
    }

    const result = updateGameTransform(transform, negativeInput, 1, false)

    expect(result.x).toBe(-HORIZONTAL_LIMIT)
    expect(result.z).toBe(-HORIZONTAL_LIMIT)
  })

  it('does not apply controls after the object is dropped', () => {
    const transform: GameTransform = { x: 1, z: -1, rotationY: 0.5 }

    expect(updateGameTransform(transform, activeInput, 1, true)).toEqual(transform)
  })
})
