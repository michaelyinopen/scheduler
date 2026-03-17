import {
  type ElementId,
  getActiveValueBlocks,
  type ValueElement,
  type JobValue,
  elementType,
  type ProcedureValue,
  type Yata,
} from '@michaelyinopen/scheduler-common'
import type { ClientRect } from '@dnd-kit/core'
import { useAppStore, type MovedBlockOrigins } from '../store'
import { memoizeOne } from '../utils/memoizeOne'

// returns which side of the over/target to drop to
export function calcualtePosition(activeClientRect: ClientRect, overClientRect: ClientRect): 'left' | 'right' {
  return (activeClientRect.left + activeClientRect.right) <= (overClientRect.left + overClientRect.right) ? 'left' : 'right'
}

function calculateMoveProcedureInner(
  procedures: Yata<ProcedureValue> | undefined,
  sourceProcedureId: ElementId,
  targetProcedureId: ElementId,
  position: 'left' | 'right' | 'distant'
) {
  if (procedures === undefined) {
    return
  }

  const activeValueBlocks = getActiveValueBlocks(procedures)

  const sourceIndexInActive = activeValueBlocks.findIndex(activeValueBlock => activeValueBlock.block.id === sourceProcedureId)
  const targetIndexInActive = activeValueBlocks.findIndex(activeValueBlock => activeValueBlock.block.id === targetProcedureId)
  if (sourceIndexInActive === -1 || targetIndexInActive === -1 || sourceIndexInActive === targetIndexInActive) {
    return
  }

  const targetElement = procedures.elements[targetProcedureId]

  if (targetElement.type !== elementType.value) {
    return
  }

  const targetIndexInYata = activeValueBlocks[targetIndexInActive].indexInYata

  if (targetIndexInActive === sourceIndexInActive + 1 && position === 'left') {
    // target is immediately right of source, not moving when position is the left of target
    return
  }
  if (targetIndexInActive === sourceIndexInActive - 1 && position === 'right') {
    // target is immediately left of source, not moving when position is the right of target
    return
  }

  const moveToLeftOfTarget = position === 'distant'
    ? sourceIndexInActive > targetIndexInActive
    : position === 'left'

  const { movedBlockOriginLeft, movedBlockOriginRight } = moveToLeftOfTarget
    ? { // Move source to the left of target
      movedBlockOriginLeft: procedures.blocks[targetIndexInYata - 1]?.id,
      movedBlockOriginRight: procedures.blocks[targetIndexInYata]?.id
    }
    : { // Move source to the right of target
      movedBlockOriginLeft: procedures.blocks[targetIndexInYata]?.id,
      movedBlockOriginRight: procedures.blocks[targetIndexInYata + 1]?.id
    }

  return { movedBlockOriginLeft, movedBlockOriginRight }
}

const calculateMoveProcedureInnerMemo = memoizeOne(calculateMoveProcedureInner)

export function calculateMoveProcedure(jobId: ElementId, sourceProcedureId: ElementId, targetProcedureId: ElementId, position: 'left' | 'right' | 'distant')
  : MovedBlockOrigins | undefined { // returning undefined means not moved
  const { crdt } = useAppStore.getState().replicationState!
  const job = crdt.jobs?.elements[jobId] as ValueElement<JobValue> | undefined
  const procedures = job?.value.procedures

  return calculateMoveProcedureInnerMemo(procedures, sourceProcedureId, targetProcedureId, position)
}
