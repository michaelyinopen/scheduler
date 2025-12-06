import type { ReplicaId } from './replicaId.ts';

export type VectorClock = { [key in ReplicaId]: number }

export const emptyVectorClock = {}

export const vectorClockOrder = {
  lessThan: 'lessThan',
  equal: 'equal',
  greaterThan: 'greaterThan',
  concurrent: 'concurrent'
} as const

export type VectorClockOrder = typeof vectorClockOrder[keyof typeof vectorClockOrder]

export function vectorClockComparer(a: VectorClock, b: VectorClock) {
  const keys = new Set(Object.keys(a).concat(Object.keys(b)))

  let orderSoFar: VectorClockOrder = vectorClockOrder.equal
  for (const key of keys) {
    const aValue = a[key] ?? 0
    const bValue = b[key] ?? 0
    if (orderSoFar === vectorClockOrder.equal && aValue > bValue) {
      orderSoFar = vectorClockOrder.greaterThan
    }
    if (orderSoFar === vectorClockOrder.equal && aValue < bValue) {
      orderSoFar = vectorClockOrder.lessThan
    }
    if (orderSoFar === vectorClockOrder.lessThan && aValue > bValue) {
      return vectorClockOrder.concurrent
    }
    if (orderSoFar === vectorClockOrder.greaterThan && aValue < bValue) {
      return vectorClockOrder.concurrent
    }
  }
  return orderSoFar
}

export function vectorClockMerge(a: VectorClock, b: VectorClock) {
  const { updatedClock, isBUpdated } = Object.entries(a).reduce((acc, [replicaId, sequence]) => {
    const newSequence = Math.max(sequence, acc.updatedClock[replicaId] ?? 0)
    acc.isBUpdated = acc.isBUpdated || acc.updatedClock[replicaId] !== newSequence
    acc.updatedClock[replicaId] = newSequence
    return acc
  }, { updatedClock: { ...b }, isBUpdated: false })
  return isBUpdated ? updatedClock : b
}

export function nextVersion(replicaId: ReplicaId, vectorClock: VectorClock) {
  return {
    ...vectorClock,
    [replicaId]: (vectorClock[replicaId] ?? 0) + 1
  }
}
