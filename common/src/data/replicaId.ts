export type ReplicaId = number

export function replicaIdComparer(a: ReplicaId, b: ReplicaId) {
  return a - b
}
