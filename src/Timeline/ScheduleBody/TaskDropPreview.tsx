import { memo, useSyncExternalStore } from 'react'
import type { ElementId, JobValue, ValueElement } from '@michaelyinopen/scheduler-common'
import { prodcedureIdsSelector, timeToWidthMultiplierSelector, useAppStore } from '../../store'
import { Procedure } from '../../Procedure'
import classes from './ScheduleBody.module.css'
import procedureClasses from '../../Procedure/Procedure.module.css'
import { useDragAndDropStore } from '../../dragAndDrop'
import { ConflictIcon } from '../../components/ConflictIcon'
import { validateTask } from '../../utils/validateTask'

export type TaskProps = {
  jobId: ElementId
  procedureId: ElementId
  heightLevel: number
}

const TaskDropPreview = memo(({ jobId, procedureId, heightLevel }: TaskProps) => {
  const startTimeMs = useDragAndDropStore(state => state.taskDropPreviewPosition?.startTimeMs) ?? 0
  const timeToWidthMultiplier = useAppStore(timeToWidthMultiplierSelector) ?? 0
  const distanceFromStartPx = startTimeMs * timeToWidthMultiplier

  const isValid = useSyncExternalStore(
    (callback) => {
      const unsubAppStore = useAppStore.subscribe(callback)
      const unsubDragAndDropStore = useDragAndDropStore.subscribe(callback)

      return () => {
        unsubAppStore()
        unsubDragAndDropStore()
      }
    },
    () => {
      const state = useAppStore.getState()
      const { taskDropPreviewPosition } = useDragAndDropStore.getState()

      const job = state.replicationState?.crdt.jobs?.elements[jobId] as ValueElement<JobValue> | undefined
      const procedureIdsOfSameJob = prodcedureIdsSelector(jobId, job?.value.procedures)

      const validateTaskResult = validateTask(
        jobId,
        procedureId,
        state.taskPositions,
        procedureIdsOfSameJob,
        taskDropPreviewPosition,
      )

      return validateTaskResult.isValid
    }
  )

  return (
    <div
      className={classes.task}
      style={{
        '--distance-from-start': `${distanceFromStartPx}px`,
        '--height-level': heightLevel,
      } as React.CSSProperties}
    >
      <Procedure
        key={`task-drop-preview-${procedureId}`}
        jobId={jobId}
        procedureId={procedureId}
        className={procedureClasses.procedureIsDropPreview}
      />
      {!isValid && <ConflictIcon className={classes.taskConflictIcon} />}
      {!isValid && <div className={classes.taskConflictShadow} />}
    </div>
  )
})

TaskDropPreview.displayName = 'TaskDropPreview'
export { TaskDropPreview }
