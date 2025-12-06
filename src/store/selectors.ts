import { type ElementId, type ProcedureValue, type Yata, getActiveElementIds } from '@michaelyinopen/scheduler-common'
import { memoizeOne } from '../utils/memoizeOne';
import type { TaskPositions } from '../utils/taskStacking';
import { calculateJobCompletionResult, validateTask } from '../utils/validateTask';
import type { AppState } from './useAppStore';

// for floating point number comparisons, deceided to use reference of 0.01ms
const tolerance = 0.01
let previousViewDuration: number | null = null

const viewDurationMemo = memoizeOne((viewStartTimeMs: number, viewEndTimeMs: number) => {
  const viewDuration = viewEndTimeMs - viewStartTimeMs

  if (previousViewDuration !== null
    && viewDuration !== null
    && viewDuration > viewDuration - tolerance
    && viewDuration < viewDuration + tolerance
  ) {
    return viewDuration
  }

  previousViewDuration = viewDuration
  return viewDuration
})

const timeToWidthMultiplierMemo = memoizeOne((timeAxisWidthPx: number | null, viewDuration: number) => {
  return timeAxisWidthPx === null
    ? null
    : timeAxisWidthPx / viewDuration
})

export const timeToWidthMultiplierSelector = memoizeOne((state: AppState) => {
  const viewDuration = viewDurationMemo(state.viewStartTimeMs, state.viewEndTimeMs)

  return timeToWidthMultiplierMemo(state.timeAxisWidthPx, viewDuration)
})

export const machineIdsSelector = memoizeOne(getActiveElementIds)

export const jobIdsSelector = memoizeOne(getActiveElementIds)

const prodcedureIdsSelectorMap = new Map<ElementId, typeof getActiveElementIds>

export const prodcedureIdsSelector = (jobId: ElementId, yata?: Yata<ProcedureValue>) => {
  const selector = prodcedureIdsSelectorMap.get(jobId)
  if (selector !== undefined) {
    return selector(yata)
  }

  const newSelector = memoizeOne(getActiveElementIds)
  prodcedureIdsSelectorMap.set(jobId, newSelector)

  return newSelector(yata)
}

const taskValidationResultSelectorMap = new Map<ElementId, typeof validateTask>

export const taskValidationResultSelector = (
  currentJobId: ElementId,
  currentProcedureId: ElementId,
  taskPositions: TaskPositions,
  procedureIdsOfSameJob: ElementId[],
) => {
  const selector = taskValidationResultSelectorMap.get(currentProcedureId)
  if (selector !== undefined) {
    return selector(
      currentJobId,
      currentProcedureId,
      taskPositions,
      procedureIdsOfSameJob
    )
  }

  const newSelector = memoizeOne(validateTask)
  taskValidationResultSelectorMap.set(currentProcedureId, newSelector)

  return newSelector(
    currentJobId,
    currentProcedureId,
    taskPositions,
    procedureIdsOfSameJob
  )
}

const jobCompletionResultSelectorMap = new Map<ElementId, typeof calculateJobCompletionResult>

export const jobCompletionResultSelector = (
  jobId: ElementId,
  procedureIds: ElementId[],
  taskPositions: TaskPositions,
) => {
  const selector = jobCompletionResultSelectorMap.get(jobId)
  if (selector !== undefined) {
    return selector(
      jobId,
      procedureIds,
      taskPositions
    )
  }

  const newSelector = memoizeOne(calculateJobCompletionResult)
  jobCompletionResultSelectorMap.set(jobId, newSelector)

  return newSelector(
    jobId,
    procedureIds,
    taskPositions
  )
}
