import {
  type ElementId,
  type MachineValue,
  type ProcedureValue,
  type ValueElement,
  type Yata,
  getActiveElementIds
} from '@michaelyinopen/scheduler-common'
import { memoizeOne } from '../utils/memoizeOne'
import type { TaskPositions } from '../utils/taskStacking'
import { calculateJobCompletionResult, validateTask } from '../utils/validateTask'
import type { AppState } from './useAppStore'
import { arraysEqualWithComparer } from '../utils/arrayEqivalent'

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

export type MachineTitle = {
  machineId: ElementId,
  title: string | undefined,
}

function machineTitleEquals(a: MachineTitle, b: MachineTitle) {
  return a.machineId === b.machineId && a.title === b.title
}

const machineTitlesArrayComparer = arraysEqualWithComparer(machineTitleEquals)

let previousMachineTitlesArray: MachineTitle[] | null = null

export type MachineTitlesMap = {
  [key in ElementId]: MachineTitle
}

const machineTitlesMapResultMemo = memoizeOne((machineTitlesArray: MachineTitle[]) => {
  const map = machineTitlesArray.reduce(
    (acc, machineTitle: MachineTitle) => {
      acc[machineTitle.machineId] = machineTitle
      return acc
    },
    {} as MachineTitlesMap)

  return {
    array: machineTitlesArray,
    map: map,
  }
})

export type MachineTitlesMapResult = {
  array: MachineTitle[],
  map: MachineTitlesMap,
}

export const machineTitlesMapSelector = (state: AppState): MachineTitlesMapResult => {
  const machineIds = machineIdsSelector(state.replicationState?.crdt.machines)

  const machineTitlesArray = machineIds.map(id => {
    const machineElement = state.replicationState?.crdt.machines?.elements[id] as ValueElement<MachineValue> | undefined
    const title = machineElement?.value.title?.value

    return {
      machineId: id,
      title,
    }
  })

  if (previousMachineTitlesArray !== null
    && machineTitlesArrayComparer(machineTitlesArray, previousMachineTitlesArray)
  ) {
    return machineTitlesMapResultMemo(previousMachineTitlesArray)
  }

  previousMachineTitlesArray = machineTitlesArray
  return machineTitlesMapResultMemo(machineTitlesArray)
}
