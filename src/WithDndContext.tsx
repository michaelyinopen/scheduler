import {
  clearDragItems,
  CustomDragOverlay,
  isJobSetDropData,
  isMachineLaneDropData,
  isProcedureDragItem,
  isTaskDragItem,
  setProcedureDragItem,
  setTaskDragItem,
  setTaskDropPreviewPosition,
  useDragAndDropStore,
  type DragItem,
  type DropData,
} from './dragAndDrop'
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  pointerWithin,
  type ClientRect,
  type DragMoveEvent,
  MeasuringStrategy,
} from '@dnd-kit/core'
import type { ElementId, JobValue, ProcedureValue, ValueElement } from '@michaelyinopen/scheduler-common'
import { roundToMinute } from './utils/time'
import { scheduledProcedure, useAppStore } from './store'

type CalculateScheduledTimeResult = {
  shouldUpdate: false
} | {
  shouldUpdate: true
  startTimeMs: number
  endTimeMs: number
}

function calculateScheduledTime(
  jobId: ElementId,
  procedureId: ElementId,
  machineId: ElementId,
  newRectLeftPx: number
): CalculateScheduledTimeResult {
  const appState = useAppStore.getState()
  const job = (appState.replicationState?.crdt.jobs?.elements[jobId] as ValueElement<JobValue> | undefined)?.value
  const procedure = (job?.procedures?.elements[procedureId] as ValueElement<ProcedureValue> | undefined)?.value
  const procedureMachineId = procedure?.machineId?.value

  if (machineId !== procedureMachineId) {
    return { shouldUpdate: false }
  }

  const {
    viewStartTimeMs,
    viewEndTimeMs,
    timeAxisWidthPx,
    maxTimeMs,
  } = appState
  const { scheduleBodyClientLeftPx } = useDragAndDropStore.getState()
  const processignTimsMs = procedure?.processingTimeMs?.value

  if (timeAxisWidthPx === null
    || timeAxisWidthPx === 0
    || scheduleBodyClientLeftPx === undefined
    || processignTimsMs === undefined
  ) {
    return { shouldUpdate: false }
  }

  const viewDurationMs = viewEndTimeMs - viewStartTimeMs
  const widthToTimeMultiplier = viewDurationMs / timeAxisWidthPx
  const maxStartTime = maxTimeMs - processignTimsMs

  const scheduledPositionStartTime = viewStartTimeMs + (newRectLeftPx - scheduleBodyClientLeftPx) * widthToTimeMultiplier
  const roundedStartTime = roundToMinute(scheduledPositionStartTime)
  const startTimeMs = Math.max(0, Math.min(roundedStartTime, maxStartTime))
  const endTimeMs = startTimeMs + processignTimsMs

  const previosuStartTime = appState.replicationState?.crdt.scheduledProcedureStartTimes?.[jobId]?.[procedureId]?.value

  if (startTimeMs === previosuStartTime) {
    return { shouldUpdate: false }
  }

  return {
    shouldUpdate: true,
    startTimeMs,
    endTimeMs,
  }
}

function onDragStart(event: DragStartEvent) {
  const data = event.active.data.current as DragItem | undefined
  if (data === undefined) {
    return
  }

  if (isTaskDragItem(data)) {
    setTaskDragItem(data)
  }
  if (isProcedureDragItem(data)) {
    setProcedureDragItem(data)
  }
}

const onDragMove = (event: DragMoveEvent) => {
  const dragItem = event.active.data.current as DragItem | undefined
  const dropData = event.over?.data.current as DropData | undefined

  const translatedRect = event.active.rect.current.translated ?? undefined

  if (dragItem === undefined || dropData === undefined || translatedRect === undefined) {
    setTaskDropPreviewPosition(undefined)
    return
  }

  if (isTaskDragItem(dragItem) && isMachineLaneDropData(dropData)) {
    const result = calculateScheduledTime(dragItem.jobId, dragItem.procedureId, dropData.machineId, translatedRect.left)
    if (result.shouldUpdate) {
      setTaskDropPreviewPosition({
        jobId: dragItem.jobId,
        procedureId: dragItem.procedureId,
        machineId: dropData.machineId,
        startTimeMs: result.startTimeMs,
        endTimeMs: result.endTimeMs,
      })
      return
    }
    setTaskDropPreviewPosition(undefined)
  }

  if (isProcedureDragItem(dragItem) && isMachineLaneDropData(dropData)) {
    const result = calculateScheduledTime(dragItem.jobId, dragItem.procedureId, dropData.machineId, translatedRect.left)
    if (result.shouldUpdate) {
      setTaskDropPreviewPosition({
        jobId: dragItem.jobId,
        procedureId: dragItem.procedureId,
        machineId: dropData.machineId,
        startTimeMs: result.startTimeMs,
        endTimeMs: result.endTimeMs,
      })
      return
    }
    setTaskDropPreviewPosition(undefined)
  }

  // not dragging task or procedure over machine lane
  setTaskDropPreviewPosition(undefined)
}

function onDragEnd(event: DragEndEvent) {
  const dragItem = event.active.data.current as DragItem | undefined
  const dropData = event.over?.data.current as DropData | undefined

  const translatedRect = event.active.rect.current.translated ?? undefined

  handleDrop(dragItem, dropData, translatedRect)
  clearDragItems()
}

function handleDrop(
  dragItem: DragItem | undefined,
  dropData: DropData | undefined,
  translatedRect: ClientRect | undefined
) {
  if (dragItem === undefined || dropData === undefined || translatedRect === undefined) {
    return
  }

  if (isTaskDragItem(dragItem) && isMachineLaneDropData(dropData)) {
    const result = calculateScheduledTime(dragItem.jobId, dragItem.procedureId, dropData.machineId, translatedRect.left)
    if (result.shouldUpdate) {
      scheduledProcedure(dragItem.jobId, dragItem.procedureId, result.startTimeMs)
    }
    return
  }

  if (isProcedureDragItem(dragItem) && isMachineLaneDropData(dropData)) {
    const result = calculateScheduledTime(dragItem.jobId, dragItem.procedureId, dropData.machineId, translatedRect.left)
    if (result.shouldUpdate) {
      scheduledProcedure(dragItem.jobId, dragItem.procedureId, result.startTimeMs)
    }
    return
  }

  if (isTaskDragItem(dragItem) && isJobSetDropData(dropData)) {
    scheduledProcedure(dragItem.jobId, dragItem.procedureId, undefined)
    return
  }
}

function onDragCancel() {
  clearDragItems()
}

export type WithDndContextProps = {
  children: React.ReactNode
}

export const WithDndContext = ({ children }: WithDndContextProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin} // use custom for different drag and drop types
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
      measuring={{ droppable: { strategy: MeasuringStrategy.WhileDragging } }}
    >
      {children}
      <CustomDragOverlay />
    </DndContext>
  )
}
