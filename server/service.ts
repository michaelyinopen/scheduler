import {
  type Operation,
  type ReplicaId,
  type VectorClock,
  type Event,
  type FormData,
  createReplicationState,
  vectorClockComparer,
  vectorClockOrder,
  vectorClockMerge,
  formDataCrdtApi,
  type ReplicationState,
} from '@michaelyinopen/scheduler-common'
import {
  loadSnapshot,
  loadEvents,
  saveEventsAndSnapshot,
  getNextReplicaId as dbGetNextReplicaId,
  saveSnapshot,
} from './db.ts'
import * as cache from './replicationStateCache.ts'
import { exampleFormDatas, exampleOriginalVersions } from './examples.ts'

export const serverReplicaId = 1

export function createOrRecoverExamples(replicaId: ReplicaId) {
  for (const [id, formData] of exampleFormDatas.entries()) {
    let replicationState = loadSnapshot<FormData>(id)
    if (replicationState === undefined) {
      replicationState = createReplicationState(replicaId, formData)
      const exampleOriginalVersion = exampleOriginalVersions.get(id)!
      replicationState.version = exampleOriginalVersion

      saveSnapshot(id, replicationState)
    }
    cache.set(id, replicationState)
  }
}

export function getReplicationState(replicaId: ReplicaId, replicationStateId: number) {
  const cached = cache.get(replicationStateId)
  if (cached !== undefined) {
    return cached
  }

  let replicationState = loadSnapshot<FormData>(replicationStateId)
  if (replicationState === undefined) {
    replicationState = createReplicationState(replicaId, formDataCrdtApi.default)
    saveSnapshot(replicationStateId, replicationState)
  }

  cache.set(replicationStateId, replicationState)
  return replicationState
}

export function getEventsAfter(id: number, sequence: number, version: VectorClock) {
  const eventsAfterSequence = loadEvents<Operation>(id, sequence + 1)
  const eventsFilteredByVersion = eventsAfterSequence.filter(event => {
    const compareResult = vectorClockComparer(event.version, version)
    return compareResult === vectorClockOrder.greaterThan || compareResult === vectorClockOrder.concurrent
  })
  return eventsFilteredByVersion
}

/**
 * apply events to replication state
 * save events and snapshot to database
 */
export function handleEvents(id: number, replicaId: number, toSequence: number, events: Event<Operation>[]): Event<Operation>[] {
  const saveOnlyEvents: Event<Operation>[] = []
  const appliedEvents: Event<Operation>[] = []
  let replicationState = getReplicationState(serverReplicaId, id)
  const originalObserved = replicationState.observed

  for (const event of events) {
    const hardResetHappened = (event.version[serverReplicaId] ?? 0) < (replicationState.version[serverReplicaId] ?? 0)

    if (hardResetHappened) {
      const sequence = replicationState.sequence + 1
      const newEvent = {
        ...event,
        localSequence: sequence
      }

      replicationState = {
        ...replicationState,
        sequence,
      }
      saveOnlyEvents.push(newEvent)
    }

    if (formDataCrdtApi.unseen(replicationState.observed[replicaId], replicationState.version, event) && !hardResetHappened) {
      const sequence = replicationState.sequence + 1
      const newEvent = {
        ...event,
        localSequence: sequence
      }
      const crdt = formDataCrdtApi.apply(replicationState.crdt, newEvent)

      const version = vectorClockMerge(event.version, replicationState.version)
      const observed = {
        ...replicationState.observed,
        [replicaId]: event.localSequence
      }
      replicationState = {
        ...replicationState,
        sequence,
        crdt,
        version,
        observed,
      }
      appliedEvents.push(newEvent)
    }
  }

  if (toSequence > (replicationState.observed[replicaId] ?? 0)) {
    const observed = {
      ...replicationState.observed,
      [replicaId]: toSequence
    }
    replicationState = {
      ...replicationState,
      observed,
    }
  }

  if (appliedEvents.length + saveOnlyEvents.length !== 0) {
    saveEventsAndSnapshot(id, [...appliedEvents, ...saveOnlyEvents], replicationState)
    cache.set(id, replicationState)
  } else if (replicationState.observed !== originalObserved) {
    saveSnapshot(id, replicationState)
    cache.set(id, replicationState)
  }

  return appliedEvents
}

export function getNextReplicaId(id: number) {
  return dbGetNextReplicaId(id)
}

export function hardResetReplicationState(replicationStateId: number, exampleFormData: FormData) {
  if (exampleFormData === undefined) {
    return undefined
  }
  const replicationState = getReplicationState(serverReplicaId, replicationStateId)

  const sequence = replicationState.sequence + 1
  const version: VectorClock = { [serverReplicaId]: (replicationState.version[serverReplicaId] ?? 0) + 1 }
  const observed = {}

  const newReplicationState: ReplicationState<FormData> = {
    replicaId: serverReplicaId,
    sequence,
    crdt: exampleFormData,
    version,
    observed,
  }

  saveSnapshot(replicationStateId, newReplicationState)
  cache.set(replicationStateId, newReplicationState)

  return newReplicationState
}
