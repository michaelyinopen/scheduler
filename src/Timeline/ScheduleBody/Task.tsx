import { memo, useEffect, useMemo, useRef, useState, useSyncExternalStore, type Ref, } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { Popover } from '@base-ui-components/react'
import type { ElementId, JobValue, ValueElement } from '@michaelyinopen/scheduler-common'
import { stopPointerPropagation } from '../../utils/stopPointerPropagation'
import { type TaskHeightLevelType, taskHeightLevelType } from '../../utils/taskStacking'
import { validateTask } from '../../utils/validateTask'
import { memoizeOne } from '../../utils/memoizeOne'
import { prodcedureIdsSelector, taskValidationResultSelector, timeToWidthMultiplierSelector, useAppStore } from '../../store'
import { dragType, useDragAndDropStore } from '../../dragAndDrop'
import { ConflictIcon } from '../../components/ConflictIcon'
import { Procedure } from '../../Procedure'
import { TaskDetail } from './TaskDetail'
import procedureClasses from '../../Procedure/Procedure.module.css'
import classes from './ScheduleBody.module.css'

type TaskDraggableProps = {
  ref: Ref<HTMLDivElement>
  type: TaskHeightLevelType
  jobId: ElementId
  procedureId: ElementId
  heightLevel: number
}

const TaskDraggable = memo(({ ref, type, jobId, procedureId, heightLevel, ...rest }: TaskDraggableProps) => {
  const distanceFromStartPx = useAppStore(state => {
    const timeToWidthMultiplier = timeToWidthMultiplierSelector(state)

    const startTimeMs = state.replicationState?.crdt.scheduledProcedureStartTimes?.[jobId]?.[procedureId]?.value
    const distanceFromStartPx = startTimeMs !== undefined && timeToWidthMultiplier !== null
      ? startTimeMs * timeToWidthMultiplier
      : undefined

    return distanceFromStartPx
  })

  const isDragging = useDragAndDropStore((state) => {
    return state.taskDragItem !== undefined && state.taskDragItem.jobId === jobId && state.taskDragItem.procedureId === procedureId
  })

  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (open) {
      const unsubscribe = useDragAndDropStore.subscribe((state) => {
        if (state.taskDragItem !== undefined && state.taskDragItem.jobId === jobId && state.taskDragItem.procedureId === procedureId) {
          setOpen(false)
        }
      })
      return () => {
        unsubscribe()
      }
    }
  }, [jobId, procedureId, open])

  const isValidWithDropPreviewRef = useRef(memoizeOne(validateTask))

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
      if (type === taskHeightLevelType.placeHolder) {
        return true
      }
      const state = useAppStore.getState()
      const { taskDropPreviewPosition } = useDragAndDropStore.getState()

      const job = state.replicationState?.crdt.jobs?.elements[jobId] as ValueElement<JobValue> | undefined
      const procedureIdsOfSameJob = prodcedureIdsSelector(jobId, job?.value.procedures)

      if (taskDropPreviewPosition === undefined) {
        const validateTaskResult = taskValidationResultSelector(
          jobId,
          procedureId,
          state.taskPositions,
          procedureIdsOfSameJob
        )

        return validateTaskResult.isValid
      }

      const validateTaskResult = isValidWithDropPreviewRef.current(
        jobId,
        procedureId,
        state.taskPositions,
        procedureIdsOfSameJob,
        taskDropPreviewPosition
      )
      return validateTaskResult.isValid
    }
  )

  const isDraggingClassName = isDragging ? ` ${procedureClasses.procedureIsDragItem}` : ''
  const placeholderClassName = type === taskHeightLevelType.placeHolder ? ` ${classes.taskPlaceholder}` : ''

  const style = useMemo(() => {
    return {
      '--distance-from-start': `${distanceFromStartPx}px`,
      '--height-level': heightLevel,
    } as React.CSSProperties
  }, [distanceFromStartPx, heightLevel])

  return (
    <Popover.Root
      delay={500}
      openOnHover={true}
      open={open}
      onOpenChange={setOpen}
    >
      <Popover.Trigger nativeButton={false} render={(
        <div
          className={classes.task}
          style={style}
          onPointerDown={stopPointerPropagation}
        />
      )}
      >
        <Procedure
          ref={ref}
          jobId={jobId}
          procedureId={procedureId}
          className={isDraggingClassName + placeholderClassName}
          {...rest}
        />
        {!isValid && <ConflictIcon className={classes.taskConflictIcon} />}
        {!isValid && <div className={classes.taskConflictShadow} />}
      </Popover.Trigger>
      <TaskDetail jobId={jobId} procedureId={procedureId} />
    </Popover.Root>
  )
})

export type TaskProps = {
  type: TaskHeightLevelType
  jobId: ElementId
  procedureId: ElementId
  heightLevel: number
}

const Task = memo(({ type, jobId, procedureId, heightLevel }: TaskProps) => {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `task-${procedureId}`,
    data: {
      type: dragType.task,
      jobId,
      procedureId,
    },
  })

  const { tabIndex, ...applicableAttributes } = attributes

  return (
    <TaskDraggable
      type={type}
      jobId={jobId}
      procedureId={procedureId}
      heightLevel={heightLevel}
      ref={setNodeRef}
      {...listeners}
      {...applicableAttributes}
    />
  )
})

TaskDraggable.displayName = 'TaskDraggable'
Task.displayName = 'Task'
export { Task }
