import { create } from 'zustand'
import type { TaskDragItem } from './dragTypes'
import type { TaskPositionData } from '../utils/taskStacking'
import type { ElementId } from '@michaelyinopen/scheduler-common'

export type DragAndDropState = {
  scheduleBodyClientLeftPx: number | undefined
  taskDragItem: TaskDragItem | undefined
  procedureDragItem: TaskDragItem | undefined
  taskDropPreviewPosition: TaskPositionData | undefined // endTimeMs could be affected when procedure's processing time changes
  taskPlaceholderHeightLevel: { // max height level of all tasks of the machine just before hovering
    machineId: ElementId
    heightLevel: number
  } | undefined
}

export const useDragAndDropStore = create<DragAndDropState>(() => ({
  scheduleBodyClientLeftPx: undefined,
  taskDragItem: undefined,
  procedureDragItem: undefined,
  taskDropPreviewPosition: undefined,
  taskPlaceholderHeightLevel: undefined,
}))
