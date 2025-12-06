export {
  type ReplicaId,
  replicaIdComparer,
} from './replicaId.ts'
export {
  type VectorClock,
  type VectorClockOrder,
  vectorClockOrder,
  vectorClockComparer,
  vectorClockMerge,
  nextVersion,
} from './vectorClock.ts'
export {
  type LwwRegister,
  lwwRegisterComparer,
} from './lwwRegister.ts'
export {
  type ReplicationState,
  createReplicationState,
} from './replicationState.ts'
export {
  type ElementId,
  type Block,
  type ElementType,
  type ValueElement,
  type MovedElement,
  type Element,
  type Yata,
  elementType,
  isValueElement,
  isMovedElement,
  elementIdComparer,
  integrate,
  integrateMoved,
  activeValueBlocks,
  getActiveElementIds,
} from './yata.ts'
