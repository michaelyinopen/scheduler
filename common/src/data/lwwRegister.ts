import { type ReplicaId, replicaIdComparer } from './replicaId.ts'

export type LwwRegister<T> = {
  timestamp: number // milliseconds since epoch
  origin: ReplicaId
  value?: T
}

export function lwwRegisterComparer<T>(a?: LwwRegister<T>, b?: LwwRegister<T>) {
  if (a === undefined && b === undefined) {
    return 0
  }
  if (a === undefined) {
    return -1
  }
  if (b === undefined) {
    return 1
  }
  if (a.timestamp > b.timestamp) {
    return 1
  }
  if (a.timestamp < b.timestamp) {
    return -1
  }
  return replicaIdComparer(a.origin, b.origin)
}
