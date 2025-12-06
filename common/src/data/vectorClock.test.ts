import { describe, expect, test } from 'vitest'
import { type VectorClock, vectorClockOrder, vectorClockComparer, vectorClockMerge } from './vectorClock.ts'

describe('vector clock comparer', () => {
  test('greater than', () => {
    const a: VectorClock = {
      1: 2,
      2: 2,
    }

    const b: VectorClock = {
      1: 1,
      2: 2,
    }

    const result = vectorClockComparer(a, b)
    expect(result).toBe(vectorClockOrder.greaterThan)
  })

  test('merge', () => {
    const a: VectorClock = {
      1: 1,
      2: 1,
    }

    const b: VectorClock = {
      1: 2,
    }

    const expected: VectorClock = {
      1: 2,
      2: 1,
    }

    const result = vectorClockMerge(a, b)
    expect(result).toEqual(expected)
  })
})
