import type { ElementId } from '@michaelyinopen/scheduler-common'
import type { ProcedureDragItem, TaskDragItem } from './dragTypes'
import { useDragAndDropStore } from './useDragAndDropStore'
import { taskPositionDataEquals, type TaskPositionData } from '../utils/taskStacking'

export function setScheduleBodyClientLeftPx(value: number | undefined) {
  useDragAndDropStore.setState({
    scheduleBodyClientLeftPx: value,
  })
}

export function clearDragItems() {
  useDragAndDropStore.setState({
    taskDragItem: undefined,
    procedureDragItem: undefined,
    taskDropPreviewPosition: undefined,
    taskPlaceholderHeightLevel: undefined,
  })
}

export function setTaskDragItem(value: TaskDragItem) {
  const previousValue = useDragAndDropStore.getState().taskDragItem
  if (previousValue !== undefined && value !== undefined && previousValue.jobId === value.jobId && previousValue.procedureId === value.procedureId) {
    return
  }
  useDragAndDropStore.setState({
    taskDragItem: value,
  })
}

export function setTaskPlaceholderHeightLevel(machineId: ElementId, heightLevel: number | undefined) {
  const previousPlaceholderHeightLevel = useDragAndDropStore.getState().taskPlaceholderHeightLevel
  const machineIdChanged = previousPlaceholderHeightLevel?.machineId !== machineId
  const heightLevelChanged = previousPlaceholderHeightLevel?.heightLevel !== heightLevel

  if (heightLevel === undefined && !machineIdChanged) {
    useDragAndDropStore.setState({ taskPlaceholderHeightLevel: undefined })
    return
  }

  if (heightLevel !== undefined && (machineIdChanged || heightLevelChanged)) {
    useDragAndDropStore.setState({ taskPlaceholderHeightLevel: { machineId, heightLevel } })
    return
  }
}

export function setTaskDropPreviewPosition(value: TaskPositionData | undefined) {
  const previousValue = useDragAndDropStore.getState().taskDropPreviewPosition
  if (previousValue !== undefined && value !== undefined && taskPositionDataEquals(previousValue, value)) {
    return
  }
  useDragAndDropStore.setState({
    taskDropPreviewPosition: value,
  })
}

export function setProcedureDragItem(value: ProcedureDragItem) {
  const previousValue = useDragAndDropStore.getState().procedureDragItem
  if (previousValue !== undefined && value !== undefined && previousValue.jobId === value.jobId && previousValue.procedureId === value.procedureId) {
    return
  }
  useDragAndDropStore.setState({
    procedureDragItem: value,
  })
}
