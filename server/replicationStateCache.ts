import {
  type ReplicationState,
  type FormData
} from '@michaelyinopen/scheduler-common';

const replicationStateCache: Record<number, ReplicationState<FormData>> = {}

export function get(id: number): ReplicationState<FormData> | undefined {
  return replicationStateCache[id]
}

export function set(id: number, replicationState: ReplicationState<FormData>) {
  replicationStateCache[id] = replicationState
}
