import {
  clearDragItems,
  CustomDragOverlay,
  isJobDragItem,
  isJobDropData,
  isJobSetDropData,
  isMachineLaneDropData,
  isProcedureDragItem,
  isProcedureDropData,
  isTaskDragItem,
  setJobDragItem,
  setProcedureDragItem,
  setTaskDragItem,
  setTaskDropPreviewPosition,
  type DragItem,
  type DropData,
  collisionDetectionAlgorithm,
  calculateMoveProcedure,
  useProcedureSortingStore,
  clearPocedureDropPreviewIndicator,
  setPocedureDropPreviewIndicator,
  calculateScheduledTime,
  calcualtePosition,
} from './dragAndDrop'
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type ClientRect,
  type DragMoveEvent,
} from '@dnd-kit/core'
import { moveJob, moveProcedure, scheduledProcedure } from './store'

function onDragStart(event: DragStartEvent) {
  const data = event.active.data.current as DragItem | undefined
  if (data === undefined) {
    return
  }

  if (isTaskDragItem(data)) {
    setTaskDragItem(data)
    return
  }
  if (isProcedureDragItem(data)) {
    setProcedureDragItem(data)
    return
  }
  if (isJobDragItem(data)) {
    setJobDragItem(data)
    return
  }
}

function onDragMove(event: DragMoveEvent) {
  const dragItem = event.active.data.current as DragItem | undefined
  const dropData = event.over?.data.current as DropData | undefined

  const translatedRect = event.active.rect.current.translated ?? undefined
  const overRect = event.over?.rect

  PreviewTaskDrop(dragItem, dropData, translatedRect)
  PreviewProcedureDropIndicator(dragItem, dropData, translatedRect, overRect)
}

function PreviewTaskDrop(dragItem: DragItem | undefined, dropData: DropData | undefined, translatedRect: ClientRect | undefined) {
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
  }

  // not dragging task or procedure over machine lane
  setTaskDropPreviewPosition(undefined)
}

function PreviewProcedureDropIndicator(
  dragItem: DragItem | undefined,
  dropData: DropData | undefined,
  translatedRect: ClientRect | undefined,
  overRect: ClientRect | undefined
) {
  if (dragItem === undefined || dropData === undefined || translatedRect === undefined || overRect === undefined) {
    clearPocedureDropPreviewIndicator()
    return
  }

  if (isProcedureDragItem(dragItem) && isProcedureDropData(dropData)
    && dragItem.jobId === dropData.jobId
    && dragItem.procedureId !== dropData.procedureId
  ) {
    const isJobWrapping = useProcedureSortingStore.getState().jobIsWrappingMap[dragItem.jobId] ?? false

    if (isJobWrapping) {
      const position = calcualtePosition(translatedRect, overRect)
      const moveProcedureResult = calculateMoveProcedure(dragItem.jobId, dragItem.procedureId, dropData.procedureId, position)

      if (moveProcedureResult !== undefined) {
        setPocedureDropPreviewIndicator(dropData.procedureId, position)

        return
      }
    }
  }

  clearPocedureDropPreviewIndicator()
}

function onDragEnd(event: DragEndEvent) {
  const dragItem = event.active.data.current as DragItem | undefined
  const dropData = event.over?.data.current as DropData | undefined

  const translatedRect = event.active.rect.current.translated ?? undefined
  const overRect = event.over?.rect

  handleDrop(dragItem, dropData, translatedRect, overRect)
  clearDragItems()
  clearPocedureDropPreviewIndicator()
}

function handleDrop(
  dragItem: DragItem | undefined,
  dropData: DropData | undefined,
  translatedRect: ClientRect | undefined,
  overRect: ClientRect | undefined,
) {
  if (dragItem === undefined || dropData === undefined || translatedRect === undefined || overRect === undefined) {
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

  if (isProcedureDragItem(dragItem) && isProcedureDropData(dropData)
    && dragItem.jobId === dropData.jobId
    && dragItem.procedureId !== dropData.procedureId
  ) {
    const isJobWrapping = useProcedureSortingStore.getState().jobIsWrappingMap[dragItem.jobId] ?? false

    const position = isJobWrapping
      ? calcualtePosition(translatedRect, overRect)
      : 'distant'

    const moveProcedureResult = calculateMoveProcedure(dragItem.jobId, dragItem.procedureId, dropData.procedureId, position)
    moveProcedure(dragItem.jobId, dragItem.procedureId, moveProcedureResult)
    return
  }

  if (isJobDragItem(dragItem) && isJobDropData(dropData)
    && dragItem.jobId !== dropData.jobId
  ) {
    moveJob(dragItem.jobId, dropData.jobId)
    return
  }
}

function onDragCancel() {
  clearDragItems()
  clearPocedureDropPreviewIndicator()
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
      collisionDetection={collisionDetectionAlgorithm}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
    >
      {children}
      <CustomDragOverlay />
    </DndContext>
  )
}
