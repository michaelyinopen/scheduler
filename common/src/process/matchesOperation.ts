import {
  foldOperation,
  operationType,
  type AssignOperation,
  type InsertElementOperation,
  type MoveElementOperation,
  type Operation,
} from './operation.ts'
import { isValueElement } from '../data/yata.ts'

export const shortCutCondition = {
  undelete: 'undelete', // an update element operation re-inserts a previously deleted element 
} as const

export type ShortcutCondition = typeof shortCutCondition[keyof typeof shortCutCondition]

export type AssignOperationMatcher = {
  type: typeof operationType.assign,
}

export type UpdateOperationMatcher = {
  type: typeof operationType.update,
  key: string | null,// null for any property 
  childOperation: OperationMatcher
}

export type InsertElementOperationMatcher = {
  type: typeof operationType.insertElement,
  id: string | null, // null for any element 
}

export type UpdateElementOperationMatcher = {
  type: typeof operationType.updateElement,
  id: string | null, // null for any element 
  elementOperation?: OperationMatcher,
  shortCutCondition?: ShortcutCondition,
}

export type DeleteElementOperationMatcher = {
  type: typeof operationType.deleteElement,
  id: string | null, // null for any element 
}

export type MoveElementOperationMatcher = {
  type: typeof operationType.moveElement,
  fromId: string | null, // null for any element 
  movedBlockId: string | null, // null for any element 
}

export type OperationMatcher =
  AssignOperationMatcher
  | UpdateOperationMatcher
  | InsertElementOperationMatcher
  | UpdateElementOperationMatcher
  | DeleteElementOperationMatcher
  | MoveElementOperationMatcher

export type MatchesOperationData = {
  matchers: OperationMatcher[],
  newCrdt?: any,
  previousCrdt?: any,
}

type MatchOperationAccumulator = {
  shortcutResult?: boolean, // if defined, ignores subsequence recursions
  accumulatedResult: boolean,
}

/**
 * **a** match the operation type of any one of **b**'s operationMatchers
 */
export function matchesOperation(operation: Operation, matchesOperationData: MatchesOperationData) {
  function fAssign(acc: MatchOperationAccumulator, _assignOperation: AssignOperation, data: MatchesOperationData) {
    return acc.shortcutResult ?? (acc.accumulatedResult && data.matchers.some(m => m.type === operationType.assign))
  }

  function fUpdate(acc: MatchOperationAccumulator, _key: string, _data: MatchesOperationData) {
    return acc
  }

  function fUpdateData(key: string, data: MatchesOperationData) {
    const matchers = data.matchers.reduce(
      (acc, m) => {
        if (
          m.type === operationType.update
          && (m.key === null || m.key === key)
        ) {
          acc.push((m as UpdateOperationMatcher).childOperation!)
        }
        return acc
      },
      [] as OperationMatcher[]
    )
    const newCrdt = data.newCrdt?.[key]
    const previousCrdt = data.previousCrdt?.[key]
    return {
      matchers,
      newCrdt,
      previousCrdt
    }
  }

  function fInsertElement(acc: MatchOperationAccumulator, insertElementOperation: InsertElementOperation, data: MatchesOperationData) {
    return acc.shortcutResult ??
      (acc.accumulatedResult && data.matchers.some(m =>
        m.type === operationType.insertElement &&
        (m.id === null || m.id === insertElementOperation.id)))
  }

  function fUpdateElement(acc: MatchOperationAccumulator, id: string, data: MatchesOperationData) {
    if (acc.shortcutResult !== undefined) {
      return acc
    }

    const hasUndeleteMatchers = data.matchers.some(m =>
      m.type === operationType.updateElement
      && m.shortCutCondition === shortCutCondition.undelete
      && (m.id === null || m.id === id))

    const previousElement = data.previousCrdt?.elements[id]
    const newElement = data.newCrdt?.elements[id]

    const isUndeleted = hasUndeleteMatchers
      && isValueElement(previousElement)
      && previousElement.isDeleted === true
      && isValueElement(newElement)
      && newElement.isDeleted === false

    if (acc.accumulatedResult && isUndeleted) {
      return {
        shortcutResult: true,
        accumulatedResult: true,
      }
    }

    return acc
  }

  function fUpdateElementData(id: string, data: MatchesOperationData) {
    const matchers = data.matchers.reduce(
      (acc, m) => {
        if (
          m.type === operationType.updateElement
          && (m.id === null || m.id === id)
          && (m as UpdateElementOperationMatcher).shortCutCondition === undefined
        ) {
          acc.push((m as UpdateElementOperationMatcher).elementOperation!)
        }
        return acc
      },
      [] as OperationMatcher[]
    )
    const newCrdt = data.newCrdt?.elements[id]
    const previousCrdt = data.previousCrdt?.elements[id]
    return {
      matchers,
      newCrdt,
      previousCrdt
    }
  }

  function fDeleteElement(acc: MatchOperationAccumulator, id: string, data: MatchesOperationData) {
    return acc.shortcutResult ??
      (acc.accumulatedResult && data.matchers.some(m =>
        m.type === operationType.deleteElement &&
        (m.id === null || m.id === id)))
  }

  function moveElement(acc: MatchOperationAccumulator, moveElementOperation: MoveElementOperation, data: MatchesOperationData) {
    return acc.shortcutResult ??
      (acc.accumulatedResult && data.matchers.some(m =>
        m.type === operationType.moveElement &&
        (m.fromId === null || m.fromId === moveElementOperation.fromId)&&
        (m.movedBlockId === null || m.movedBlockId === moveElementOperation.movedBlockId)
      ))
  }

  return foldOperation<MatchOperationAccumulator, MatchesOperationData, boolean>(
    fAssign,
    fUpdate,
    fUpdateData,
    fInsertElement,
    fUpdateElement,
    fUpdateElementData,
    fDeleteElement,
    moveElement,
    { accumulatedResult: true, },
    operation,
    matchesOperationData
  )
}
