import { memo, useEffect, useLayoutEffect, useRef, useSyncExternalStore, type Ref } from 'react'
import { useDndContext, useDroppable, type UniqueIdentifier } from '@dnd-kit/core'
import { type ElementId, type JobValue, type ProcedureValue, type ValueElement } from '@michaelyinopen/scheduler-common'
import { memoizeOne } from '../../utils/memoizeOne'
import { arraysEqualWithComparer } from '../../utils/arrayEqivalent'
import {
  calculateTaskHeightLevels,
  taskHeightLevelEquals,
  taskHeightLevelType,
  taskPositionDataEquals,
  type TaskHeightLevelsResult,
  type TaskPositionData,
  type TaskPositions,
} from '../../utils/taskStacking'
import { dropType, setTaskPlaceholderHeightLevel, useDragAndDropStore } from '../../dragAndDrop'
import { machineIdsSelector, timeToWidthMultiplierSelector, useAppStore } from '../../store'
import { Task } from './Task'
import { TaskDropPreview } from './TaskDropPreview'
import classes from './ScheduleBody.module.css'

function currentMachineTaskPositions(machineId: ElementId, allTaskPositions: TaskPositions): TaskPositionData[] {
  const result: TaskPositionData[] = [] // mutates

  for (const jobId in allTaskPositions) {
    const jobTaskPositions = allTaskPositions[jobId as ElementId]

    for (const procedureId in jobTaskPositions) {
      const taskPositionData = jobTaskPositions[procedureId as ElementId]
      if (taskPositionData.machineId === machineId) {
        result.push(taskPositionData)
      }
    }
  }

  return result
}

const taskPositionDataComparer = arraysEqualWithComparer(taskPositionDataEquals)

// param[0] - taskPositions: TaskPositionData[]
// param[1] - taskDropPreviewPosition: TaskPositionData | undefined
// param[2] - taskPlaceholderHeightLevel: number | undefined
const calculateTaskHeightLevelsParametersComparer = (
  a: Parameters<typeof calculateTaskHeightLevels>,
  b: Parameters<typeof calculateTaskHeightLevels>
) => {
  return taskPositionDataComparer(a[0], b[0])
    && a[1] === b[1]
    && a[2] === b[2]
}

const taskHeightLevelsEquals = arraysEqualWithComparer(taskHeightLevelEquals)

type MachineLaneDroppableProps = {
  ref: Ref<HTMLDivElement>
  id: ElementId
  isOver: boolean
  measureDroppableContainers: (ids: UniqueIdentifier[]) => void
}

const MachineLaneDroppable = memo(({ ref, id, isOver, measureDroppableContainers }: MachineLaneDroppableProps) => {
  const currentMachineTaskPositionsSelectorRef = useRef(memoizeOne(currentMachineTaskPositions))
  const taskHeightLevelsSelectorRef = useRef(memoizeOne(calculateTaskHeightLevels, calculateTaskHeightLevelsParametersComparer))

  // immitates useShallow from zustand, but using custom comparer
  const prevTaskHeightLevelsResultRef = useRef<TaskHeightLevelsResult>(undefined)

  const { taskHeightLevels, maxHeightLevel } = useSyncExternalStore(
    (callback) => {
      const unsubAppStore = useAppStore.subscribe(callback)
      const unsubDragAndDropStore = useDragAndDropStore.subscribe(callback)

      return () => {
        unsubAppStore()
        unsubDragAndDropStore()
      }
    },
    () => {
      const allTaskPositions = useAppStore.getState().taskPositions
      const machineTaskPositions = currentMachineTaskPositionsSelectorRef.current(id, allTaskPositions)

      const dragAndDropState = useDragAndDropStore.getState()
      const taskDropPreviewPosition = dragAndDropState.taskDropPreviewPosition?.machineId === id
        ? dragAndDropState.taskDropPreviewPosition
        : undefined
      const taskPlaceholderHeightLevelValue = dragAndDropState.taskPlaceholderHeightLevel?.machineId === id
        ? dragAndDropState.taskPlaceholderHeightLevel.heightLevel
        : undefined
      const result = taskHeightLevelsSelectorRef.current(
        machineTaskPositions,
        taskDropPreviewPosition,
        taskPlaceholderHeightLevelValue
      )

      const previousResult = prevTaskHeightLevelsResultRef.current
      if (previousResult !== undefined
        && taskHeightLevelsEquals(previousResult.taskHeightLevels, result.taskHeightLevels)
        && previousResult.maxHeightLevel === result.maxHeightLevel
      ) {
        return previousResult
      }

      prevTaskHeightLevelsResultRef.current = result
      return result
    }
  )

  useLayoutEffect(() => {
    const machineIds = machineIdsSelector(useAppStore.getState().replicationState?.crdt.machines)
    // use machine ids as droppable unique identitiers
    measureDroppableContainers(machineIds)
  }, [id, maxHeightLevel, measureDroppableContainers]);

  const timeToWidthMultiplier = useAppStore(timeToWidthMultiplierSelector)

  const canDrop = useSyncExternalStore(
    (callback) => {
      const unsubAppStore = useAppStore.subscribe(callback)
      const unsubDragAndDropStore = useDragAndDropStore.subscribe(callback)

      return () => {
        unsubAppStore()
        unsubDragAndDropStore()
      }
    },
    () => {
      const {
        taskDragItem,
        procedureDragItem,
      } = useDragAndDropStore.getState()

      if (taskDragItem !== undefined) {
        const { jobId, procedureId } = taskDragItem
        const state = useAppStore.getState()
        const job = (state.replicationState?.crdt.jobs?.elements[jobId] as ValueElement<JobValue> | undefined)?.value
        const procedure = (job?.procedures?.elements[procedureId] as ValueElement<ProcedureValue> | undefined)?.value
        const machineId = procedure?.machineId?.value

        return machineId === id
      }

      if (procedureDragItem !== undefined) {
        const { jobId, procedureId } = procedureDragItem
        const state = useAppStore.getState()
        const job = (state.replicationState?.crdt.jobs?.elements[jobId] as ValueElement<JobValue> | undefined)?.value
        const procedure = (job?.procedures?.elements[procedureId] as ValueElement<ProcedureValue> | undefined)?.value
        const machineId = procedure?.machineId?.value

        return machineId === id
      }

      return false
    }
  )

  const previousMachineTaskPositions = useRef<TaskPositionData[]>(null)

  useEffect(() => {
    if (!canDrop) {
      setTaskPlaceholderHeightLevel(id, undefined)
      return
    }

    const machineTaskPositions = currentMachineTaskPositionsSelectorRef.current(id, useAppStore.getState().taskPositions)

    const result = taskHeightLevelsSelectorRef.current(
      machineTaskPositions,
      undefined,
      undefined
    )
    setTaskPlaceholderHeightLevel(id, result.maxHeightLevel)

    // if app store changed during the drag
    const unsubscribe = useAppStore.subscribe(state => {
      const machineTaskPositions = currentMachineTaskPositionsSelectorRef.current(id, state.taskPositions)

      if (previousMachineTaskPositions.current === null || previousMachineTaskPositions.current !== machineTaskPositions) {
        previousMachineTaskPositions.current = machineTaskPositions
        const result = calculateTaskHeightLevels(
          machineTaskPositions,
          undefined,
          undefined
        )
        setTaskPlaceholderHeightLevel(id, result.maxHeightLevel)
      }
    })

    return () => {
      setTaskPlaceholderHeightLevel(id, undefined)
      unsubscribe()
    }
  }, [canDrop, id])

  if (timeToWidthMultiplier === null) {
    return null
  }

  const canDropClassName = canDrop && !isOver ? ' ' + classes.machineLaneCanDrop : ''
  const isOverClassName = canDrop && isOver ? ' ' + classes.machineLaneIsOver : ''

  return (
    <div
      ref={ref}
      key={`machine-${id}`}
      className={classes.machineLane + canDropClassName + isOverClassName}
    >
      {taskHeightLevels?.map(t => {
        if (t.type === taskHeightLevelType.dropPreview) {
          return (
            <TaskDropPreview
              key={`${t.type}-${t.procedureId}`}
              jobId={t.jobId}
              procedureId={t.procedureId}
              heightLevel={t.heightLevel}
            />
          )
        }
        return (
          <Task
            key={`${t.type}-${t.procedureId}`}
            type={t.type}
            jobId={t.jobId}
            procedureId={t.procedureId}
            heightLevel={t.heightLevel}
          />
        )
      })}
    </div>
  )
})

export type MachineLaneProps = {
  id: ElementId
}

const MachineLane = memo(({ id }: MachineLaneProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
    data: {
      type: dropType.machineLane,
      machineId: id,
    },
  })
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const { measureDroppableContainers } = useDndContext()

  return (
    <MachineLaneDroppable
      ref={setNodeRef}
      id={id}
      isOver={isOver}
      measureDroppableContainers={measureDroppableContainers}
    />
  )
})

MachineLaneDroppable.displayName = 'MachineLaneDroppable'
MachineLane.displayName = 'MachineLane'
export { MachineLane }
