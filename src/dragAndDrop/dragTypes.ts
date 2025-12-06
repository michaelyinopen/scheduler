import { type ElementId } from '@michaelyinopen/scheduler-common'

export const dragType = {
  task: 'task',
  procedure: 'procedure',
}

export type DragType = typeof dragType[keyof typeof dragType]

export type TaskDragItem = {
  type: typeof dragType.task
  jobId: ElementId
  procedureId: ElementId
}

export type ProcedureDragItem = {
  type: typeof dragType.procedure
  jobId: ElementId
  procedureId: ElementId
}


export type DragItem =
  TaskDragItem
  | ProcedureDragItem

export function isTaskDragItem(data: DragItem): data is TaskDragItem {
  return data.type === dragType.task
}

export function isProcedureDragItem(data: DragItem): data is ProcedureDragItem {
  return data.type === dragType.procedure
}
