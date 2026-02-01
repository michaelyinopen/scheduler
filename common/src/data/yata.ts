import type { ReplicaId } from './replicaId.ts'
import type { VectorClock } from './vectorClock.ts'

export type ElementId = `${ReplicaId}.${number}`

export type Block = {
  id: ElementId
  originLeft?: ElementId
  originRight?: ElementId
}

export const elementType = {
  value: 'value',
  moved: 'moved',
} as const

export type ElementType = typeof elementType[keyof typeof elementType]

export type ValueElement<T> = {
  type: typeof elementType.value,
  version: VectorClock // last update or delete
  isDeleted: boolean, // this implementation keeps the deleted value around
  movedTo?: ElementId
  value: T,
}

export type MovedElement = {
  type: typeof elementType.moved,
  from: ElementId,
  priority: number,
}

export type Element<T> = ValueElement<T> | MovedElement

export function isValueElement<T>(element?: Element<T>): element is ValueElement<T> {
  return element !== undefined && element.type === elementType.value
}

export function isMovedElement(element?: Element<unknown>): element is MovedElement {
  return element !== undefined && element.type === elementType.moved
}

export type Yata<T> = {
  blocks: Block[]
  elements: Record<ElementId, Element<T>>
}

export function elementIdComparer(a: ElementId, b: ElementId) {
  const aSplit = a.split('.')
  const bSplit = b.split('.')

  const aReplicaId = parseInt(aSplit[0])
  const bReplicaId = parseInt(bSplit[0])

  if (aReplicaId > bReplicaId) {
    return 1
  }
  if (aReplicaId < bReplicaId) {
    return -1
  }

  const aSequence = parseInt(aSplit[1])
  const bSequence = parseInt(bSplit[1])

  if (aSequence > bSequence) {
    return 1
  }
  if (aSequence < bSequence) {
    return -1
  }

  return 0
}

function findBlockIndexOf(array: Block[], id?: ElementId) {
  return id === undefined
    ? undefined
    : array.findIndex(b => b.id === id)
}

export function integrate(block: Block, array: Block[]) {
  const left = findBlockIndexOf(array, block.originLeft) ?? -1
  const right = findBlockIndexOf(array, block.originRight) ?? array.length

  let destinationIndex = left + 1
  let scanning = false

  for (let i = destinationIndex; destinationIndex < right + 1 /* not necessary, just safeguard */; i++) {
    if (!scanning) {
      destinationIndex = i
    }
    if (i === right) {
      break
    }
    const other = array[i]
    const otherLeft = findBlockIndexOf(array, other.originLeft) ?? -1
    const otherRight = findBlockIndexOf(array, other.originRight) ?? array.length

    if (otherLeft < left
      || (otherLeft === left && otherRight === right && elementIdComparer(block.id, other.id) === -1)
    ) {
      break
    }

    if (otherLeft === left) {
      scanning = otherRight < right
    }
  }

  return [...array.slice(0, destinationIndex), block, ...array.slice(destinationIndex)]
}

export function integrateMoved(block: Block, element: Element<unknown>, yata: Yata<unknown>) {
  if (element.type !== elementType.moved) {
    return yata
  }

  const fromElement = yata.elements[element.from]

  if (fromElement.type !== elementType.value) {
    return yata
  }

  if (fromElement.movedTo === undefined) {
    return {
      blocks: yata.blocks,
      elements: {
        ...yata.elements,
        [element.from]: {
          ...yata.elements[element.from],
          movedTo: block.id,
        }
      }
    }
  }

  const existingMovedToBlock = yata.elements[fromElement.movedTo]

  if (existingMovedToBlock.type !== elementType.moved) {
    return yata
  }

  const higherPrioirty = element.priority > existingMovedToBlock.priority
  const equalPriorityGreaterElementId = element.priority === existingMovedToBlock.priority
    && elementIdComparer(block.id, fromElement.movedTo) > 0

  if (higherPrioirty || equalPriorityGreaterElementId) {
    return {
      blocks: yata.blocks,
      elements: {
        ...yata.elements,
        [element.from]: {
          ...yata.elements[element.from],
          movedTo: block.id,
        }
      }
    }
  }

  return yata
}

// indexInYata is the index of the block representing the position (moved block or value block)
// block is the value block
export function getActiveValueBlocks(yata: Yata<unknown>): { indexInYata: number, block: Block }[] {
  return yata.blocks.reduce((acc, block, index) => {
    const element = yata.elements[block.id]

    if (isValueElement(element) && !element.isDeleted && element.movedTo === undefined) {
      acc.push({ indexInYata: index, block })
    }

    if (isMovedElement(element)) {
      const fromElement = yata.elements[element.from]
      if (
        fromElement.type === elementType.value
        && fromElement.isDeleted !== true
        && fromElement.movedTo === block.id // the moved block matches the 'from' block's movedTo value
      ) {
        const fromBlock = yata.blocks.find(b => b.id === element.from)
        acc.push({ indexInYata: index, block: fromBlock })
      }
    }

    return acc
  }, [] as { indexInYata: number, block: Block }[])
}

export function getActiveElementIds(yata?: Yata<unknown>) {
  if (yata === undefined) {
    return []
  }
  return yata.blocks.reduce((acc, block) => {
    const element = yata.elements[block.id]

    if (isValueElement(element) && !element.isDeleted && element.movedTo === undefined) {
      acc.push(block.id)
    }

    if (isMovedElement(element)) {
      const fromElement = yata.elements[element.from]
      if (
        fromElement.type === elementType.value
        && fromElement.isDeleted !== true
        && fromElement.movedTo === block.id // the moved block matches the 'from' block's movedTo value
      ) {
        acc.push(element.from)
      }
    }

    return acc
  }, [] as ElementId[])
}
