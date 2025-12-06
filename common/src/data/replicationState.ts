import type { ReplicaId } from './replicaId.ts'
import { type VectorClock } from './vectorClock.ts'

export type ReplicationState<TCrdt> = {
  replicaId: ReplicaId // should be named replicaId
  sequence: number
  crdt: TCrdt
  version: VectorClock
  observed: { [key in ReplicaId]: number }
}

export function createReplicationState<TCrdt>(replicaId: ReplicaId, crdt: TCrdt): ReplicationState<TCrdt> {
  return {
    replicaId,
    sequence: 0,
    crdt,
    version: {},
    observed: {},
  }
}
