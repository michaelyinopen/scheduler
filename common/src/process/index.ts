export {
  type OperationType,
  type AssignOperation,
  type UpdateOperation,
  type InsertElementOperation,
  type UpdateElementOperation,
  type DeleteElementOperation,
  type Operation,
  operationType,
  foldOperation,
} from './operation.ts'
export { type Event, applyEvent } from './event.ts'
export {
  type MatchesOperationData,
  type OperationMatcher,
  type AssignOperationMatcher,
  type UpdateOperationMatcher,
  type InsertElementOperationMatcher,
  type UpdateElementOperationMatcher,
  type DeleteElementOperationMatcher,
  type ShortcutCondition,
  matchesOperation,
  shortCutCondition,
} from './matchesOperation.ts'
