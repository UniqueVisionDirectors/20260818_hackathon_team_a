import { describe, expect, it } from 'vitest'
import {
  calculateCameraTargetY,
  calculateSpawnHeight,
  createInitialGameState,
  HORIZONTAL_LIMIT,
  hasStabilized,
  resolveObjectMiss,
  resolveObjectStable,
  selectRandomShape,
  updateStabilityDuration,
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

describe('turn resolution', () => {
  it('requires low linear and angular velocity for the full stable duration', () => {
    const almostStable = updateStabilityDuration(0, 0.09, 0.09, 0.5)
    const stable = updateStabilityDuration(almostStable, 0.05, 0.05, 0.25)

    expect(hasStabilized(almostStable)).toBe(false)
    expect(hasStabilized(stable)).toBe(true)
  })

  it('resets accumulated stability when either velocity exceeds the threshold', () => {
    expect(updateStabilityDuration(0.6, 0.11, 0.02, 0.1)).toBe(0)
    expect(updateStabilityDuration(0.6, 0.02, 0.11, 0.1)).toBe(0)
  })

  it('scores an object only once when it becomes stable', () => {
    const initialState = { ...createInitialGameState(), phase: 'settling' as const }
    const firstResult = resolveObjectStable(initialState, { scored: false, missed: false })
    const secondResult = resolveObjectStable(firstResult.gameState, firstResult.objectState)

    expect(firstResult.gameState).toMatchObject({ score: 1, phase: 'positioning' })
    expect(secondResult.gameState.score).toBe(1)
  })

  it('does not reduce score when the current unscored object misses', () => {
    const initialState = {
      ...createInitialGameState(),
      phase: 'settling' as const,
      score: 2,
    }
    const result = resolveObjectMiss(initialState, { scored: false, missed: false }, true)

    expect(result.gameState).toMatchObject({ score: 2, misses: 1, phase: 'positioning' })
  })

  it('reduces score when a previously scored object misses', () => {
    const initialState = {
      ...createInitialGameState(),
      phase: 'settling' as const,
      score: 2,
    }
    const result = resolveObjectMiss(initialState, { scored: true, missed: false }, false)

    expect(result.gameState).toMatchObject({ score: 1, misses: 1, phase: 'settling' })
  })

  it('does not count the same missed object twice', () => {
    const initialState = { ...createInitialGameState(), phase: 'settling' as const }
    const firstResult = resolveObjectMiss(
      initialState,
      { scored: false, missed: false },
      true,
    )
    const secondResult = resolveObjectMiss(
      firstResult.gameState,
      firstResult.objectState,
      false,
    )

    expect(secondResult.gameState.misses).toBe(1)
  })

  it('caps misses and enters game over at the maximum', () => {
    const initialState = {
      ...createInitialGameState(),
      phase: 'settling' as const,
      misses: 2,
    }
    const result = resolveObjectMiss(initialState, { scored: false, missed: false }, true)

    expect(result.gameState).toMatchObject({ misses: 3, phase: 'game-over' })
  })
})

describe('tower tracking', () => {
  it('spawns at the base height until the tower requires more clearance', () => {
    expect(calculateSpawnHeight(null)).toBe(5)
    expect(calculateSpawnHeight(1.2)).toBe(5)
    expect(calculateSpawnHeight(4)).toBe(7)
  })

  it('targets the middle of a tall tower while retaining the base target', () => {
    expect(calculateCameraTargetY(null)).toBe(1.5)
    expect(calculateCameraTargetY(2)).toBe(1.5)
    expect(calculateCameraTargetY(8)).toBe(4)
  })
})

describe('game reset', () => {
  it('creates the complete initial state used by retry', () => {
    expect(createInitialGameState()).toEqual({
      phase: 'waiting',
      score: 0,
      misses: 0,
      maxMisses: 3,
    })
  })
})
