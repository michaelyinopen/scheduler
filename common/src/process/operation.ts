import type { ElementId } from '../data/yata.ts'

export const operationType = {
  assign: 'assign',
  update: 'update',
  insertElement: 'insertElement',
  updateElement: 'updateElement',
  deleteElement: 'deleteElement',
  moveElement: 'moveElement',
} as const

export type OperationType = typeof operationType[keyof typeof operationType]

export type AssignOperation = {
  type: typeof operationType.assign,
  timestamp: number, // milliseconds since epoch
  value: any,
}

export type UpdateOperation = {
  type: typeof operationType.update,
  key: string,
  childOperation: Operation
}

export type InsertElementOperation = {
  type: typeof operationType.insertElement,
  id: ElementId,
  originLeft: ElementId | undefined,
  originRight: ElementId | undefined,
  elementValue: any, // prefer to insert default object? otherwise might affect tracing changes of nested children
}

export type UpdateElementOperation = {
  type: typeof operationType.updateElement,
  id: ElementId,
  elementOperation: Operation,
}

export type DeleteElementOperation = {
  type: typeof operationType.deleteElement,
  id: ElementId,
}

export type MoveElementOperation = {
  type: typeof operationType.moveElement,
  fromId: ElementId,
  priority: number,
  movedBlockId: ElementId, // id of the moved block
  movedBlockOriginLeft: ElementId | undefined,
  movedBlockOriginRight: ElementId | undefined,
}

export type Operation =
  AssignOperation
  | UpdateOperation
  | InsertElementOperation
  | UpdateElementOperation
  | DeleteElementOperation
  | MoveElementOperation

// This is a fold with an additional TData parameters, and functions fUpdateData and fUpdateElementData added.
// Possibly, could use a state monad and have a normal fold, but the state monad is hard to learn.
// Also, the state monad might be unnatural to implement in ECMAScript, from my undeveloped understanding.
export function foldOperation<TAccumulator, TData, TReturnValue>(
  fAssign: (accumulator: TAccumulator, assignOperation: AssignOperation, data: TData) => TReturnValue,
  fUpdate: (accumulator: TAccumulator, key: string, data: TData) => TAccumulator,
  fUpdateData: (key: string, data: TData) => TData,
  fInsertElement: (accumulator: TAccumulator, insertElementOperation: InsertElementOperation, data: TData) => TReturnValue,
  fUpdateElement: (accumulator: TAccumulator, id: ElementId, data: TData) => TAccumulator,
  fUpdateElementData: (id: ElementId, data: TData) => TData,
  fDeleteElement: (accumulator: TAccumulator, id: ElementId, data: TData) => TReturnValue,
  fMoveElement: (accumulator: TAccumulator, moveElementOperation: MoveElementOperation, data: TData) => TReturnValue,
  accumulator: TAccumulator,
  operation: Operation,
  data: TData
): TReturnValue {
  if (operation.type === operationType.assign) {
    const assignedValue = fAssign(accumulator, operation, data)
    return assignedValue
  }

  if (operation.type === operationType.update) {
    const newAccumulator = fUpdate(accumulator, operation.key, data)
    const newData = fUpdateData(operation.key, data)
    return foldOperation(
      fAssign,
      fUpdate,
      fUpdateData,
      fInsertElement,
      fUpdateElement,
      fUpdateElementData,
      fDeleteElement,
      fMoveElement,
      newAccumulator,
      operation.childOperation,
      newData)
  }

  if (operation.type === operationType.insertElement) {
    return fInsertElement(accumulator, operation, data)
  }

  if (operation.type === operationType.updateElement) {
    const newAccumulator = fUpdateElement(accumulator, operation.id, data)
    const newData = fUpdateElementData(operation.id, data)
    return foldOperation(
      fAssign,
      fUpdate,
      fUpdateData,
      fInsertElement,
      fUpdateElement,
      fUpdateElementData,
      fDeleteElement,
      fMoveElement,
      newAccumulator,
      operation.elementOperation,
      newData)
  }

  if (operation.type === operationType.deleteElement) {
    return fDeleteElement(accumulator, operation.id, data)
  }

  if (operation.type === operationType.moveElement) {
    return fMoveElement(accumulator, operation, data)
  }

  throw new Error('unexpected operation.type')
}
