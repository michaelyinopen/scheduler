import type { ReplicaId } from '../data/replicaId.ts'
import { type VectorClock, vectorClockComparer, vectorClockOrder, vectorClockMerge, emptyVectorClock } from '../data/vectorClock.ts'
import { type Yata, type ElementId, elementType, integrate, integrateMoved } from '../data/yata.ts'
import { type LwwRegister, lwwRegisterComparer } from '../data/lwwRegister.ts'
import { type AssignOperation, type InsertElementOperation, type MoveElementOperation, type Operation, foldOperation } from './operation.ts'

export type Event<T> = {
  version: VectorClock
  origin: ReplicaId
  originSequence: number
  localSequence: number
  operation: T
}

export function applyEvent(event: Event<Operation>, formData: any) {
  const operation = event.operation

  function fAssign(continuation, assignOperation: AssignOperation, data: any) {
    // assume lwwRegister
    const assignedRegister: LwwRegister<any> = {
      timestamp: assignOperation.timestamp,
      origin: event.origin,
      value: assignOperation.value,
    }
    const newValue = lwwRegisterComparer(assignedRegister, data) > 0
      ? assignedRegister
      : data
    return continuation(newValue)
  }

  function fUpdate(continuation, key: string, currentFormData: any) {
    function newContinuation(innerValue) {
      const newInnerValue = Object.is(currentFormData?.[key], innerValue)
        ? currentFormData
        : {
          ...currentFormData,
          [key]: innerValue
        }
      return continuation(newInnerValue)
    }

    return newContinuation
  }

  function fUpdateData(key: string, data: any) {
    return data?.[key]
  }

  function fInsertElement(continuation, insertElementOperation: InsertElementOperation, data: any) {
    if (data === undefined) {
      data = {
        blocks: [],
        elements: {},
      }
    }
    const block = {
      id: insertElementOperation.id,
      originLeft: insertElementOperation.originLeft,
      originRight: insertElementOperation.originRight,
    }

    const newBlocks = integrate(block, data.blocks)

    const newValue: Yata<any> = {
      blocks: newBlocks,
      elements: {
        ...data.elements,
        [insertElementOperation.id]: {
          type: elementType.value,
          version: event.version,
          isDeleted: false,
          value: insertElementOperation.elementValue,
        }
      }
    }

    return continuation(newValue)
  }

  function fUpdateElement(continuation, id: ElementId, data: any) {
    function newContinuation(innerValue) {
      const newVersion = vectorClockMerge(
        event.version,
        data.elements[id]?.version ?? emptyVectorClock
      )
      const newInnerValue: Yata<any> = {
        ...data,
        elements:
        {
          ...data.elements,
          [id]: {
            type: elementType.value,
            version: newVersion,
            isDeleted: false, // any update concurrent with delete will add-back the element
            movedTo: data.elements[id]?.movedTo,
            value: innerValue,
          }
        }
      }

      return continuation(newInnerValue)
    }

    return newContinuation
  }

  function fUpdateElementData(id: ElementId, data: any) {
    return data.elements[id]?.value
  }

  function fDeleteElement(continuation, id: ElementId, data: any) {
    const wasPreviouslyDeleted = data.elements[id].isDeleted ?? false
    const compareResult = vectorClockComparer(
      event.version,
      data.elements[id].version
    )
    const hasConcurrentChanges = compareResult === vectorClockOrder.concurrent
    const newVersion = vectorClockMerge(
      event.version,
      data.elements[id].version
    )

    const newValue: Yata<any> =
    {
      ...data,
      elements: {
        ...data.elements,
        [id]: {
          type: elementType.value,
          version: newVersion,
          isDeleted: wasPreviouslyDeleted || !hasConcurrentChanges,
          movedTo: data.elements[id].movedTo,
          value: data.elements[id].value,
        }
      }
    }

    return continuation(newValue)
  }

  function fMoveElement(continuation, moveElementOperation: MoveElementOperation, data: any) {
    const movedBlock = {
      id: moveElementOperation.movedBlockId,
      originLeft: moveElementOperation.movedBlockOriginLeft,
      originRight: moveElementOperation.movedBlockOriginRight,
    }
    const movedElement = {
      type: elementType.moved,
      from: moveElementOperation.fromId,
      priority: moveElementOperation.priority,
    }

    const newBlocks = integrate(movedBlock, data.blocks)

    let newValue: Yata<any> = {
      blocks: newBlocks,
      elements: {
        ...data.elements,
        [moveElementOperation.movedBlockId]: movedElement
      }
    }

    newValue = integrateMoved(movedBlock, movedElement, newValue)

    return continuation(newValue)
  }

  const initialAccumulator = (value) => value

  return foldOperation(
    fAssign,
    fUpdate,
    fUpdateData,
    fInsertElement,
    fUpdateElement,
    fUpdateElementData,
    fDeleteElement,
    fMoveElement,
    initialAccumulator,
    operation,
    formData
  )
}
