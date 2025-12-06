import { createPortal } from 'react-dom'
import { DragOverlay } from '@dnd-kit/core'
import { useDragAndDropStore } from './useDragAndDropStore'
import { Procedure } from '../Procedure'
import procedureClasses from '../Procedure/Procedure.module.css'
import { useShallow } from 'zustand/shallow'

export const CustomDragOverlay = () => {
  const { taskDragItem, procedureDragItem } = useDragAndDropStore(useShallow(state => {
    return {
      taskDragItem: state.taskDragItem,
      procedureDragItem: state.procedureDragItem,
    }
  }))

  return createPortal(
    (
      <DragOverlay dropAnimation={null}>
        {taskDragItem && (<Procedure
          key={`task-${taskDragItem.procedureId}`}
          jobId={taskDragItem.jobId}
          procedureId={taskDragItem.procedureId}
          className={procedureClasses.procedureIsDragPreview}
        />)}
        {procedureDragItem && (<Procedure
          key={`procedure-${procedureDragItem.procedureId}`}
          jobId={procedureDragItem.jobId}
          procedureId={procedureDragItem.procedureId}
          className={procedureClasses.procedureIsDragPreview}
        />)}
      </DragOverlay>
    ),
    document.body
  )
}
