import { createPortal } from 'react-dom'
import { DragOverlay } from '@dnd-kit/core'
import { useDragAndDropStore } from './useDragAndDropStore'
import { Procedure } from '../Procedure'
import procedureClasses from '../Procedure/Procedure.module.css'
import { useShallow } from 'zustand/shallow'
import { JobDragOverlay } from './JobDragOverlay'

export const CustomDragOverlay = () => {
  const { taskDragItem, procedureDragItem, jobDragItem } = useDragAndDropStore(useShallow(state => {
    return {
      taskDragItem: state.taskDragItem,
      procedureDragItem: state.procedureDragItem,
      jobDragItem: state.jobDragItem,
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
        {jobDragItem && (<JobDragOverlay
          key={`job-${jobDragItem.jobId}`}
          id={jobDragItem.jobId}
        />)}
      </DragOverlay>
    ),
    document.body
  )
}
