import { type ElementId } from '@michaelyinopen/scheduler-common'
import type { TaskPositionData, TaskPositions } from './taskStacking'
import { taskValidationResultSelector } from '../store'
export type ValidateTaskResult = {
  isValid: true
} | {
  isValid: false
  overlapsOnMachine: boolean
  precedingNotScheduled: boolean
  precedingNotFinished: boolean
}

export function validateTask(
  currentJobId: ElementId,
  currentProcedureId: ElementId,
  taskPositions: TaskPositions,
  procedureIdsOfSameJob: ElementId[],
  taskDropPreviewPosition?: TaskPositionData // todo
): ValidateTaskResult {
  const currentTaskPosition =
    taskDropPreviewPosition !== undefined && taskDropPreviewPosition.procedureId === currentProcedureId
      ? taskDropPreviewPosition
      : taskPositions[currentJobId]?.[currentProcedureId]


  if (currentTaskPosition === undefined) {
    return { isValid: true }
  }

  const otherTaskPositions: TaskPositionData[] = [] // mutates when initilizing

  for (const jobId in taskPositions) {
    const jobTaskPositions = taskPositions[jobId as ElementId]

    for (const procedureId in jobTaskPositions) {
      const taskPositionData = jobTaskPositions[procedureId as ElementId]
      if (taskPositionData.procedureId !== currentProcedureId && taskPositionData.procedureId !== taskDropPreviewPosition?.procedureId) {
        otherTaskPositions.push(taskPositionData)
      }
    }
  }

  if (taskDropPreviewPosition !== undefined && taskDropPreviewPosition.procedureId !== currentProcedureId) {
    otherTaskPositions.push(taskDropPreviewPosition)
  }
  // otherTaskPositions initialized

  const overlapsOnMachine = otherTaskPositions.some(p => {
    return p.machineId === currentTaskPosition.machineId
      && p.startTimeMs < currentTaskPosition.endTimeMs
      && p.endTimeMs > currentTaskPosition.startTimeMs
  })

  const { allPrecedingScheduled, allPrecedingFinished } = getAreAllPrecedingScheduledAndFinished(
    currentProcedureId,
    currentTaskPosition,
    procedureIdsOfSameJob, // ordered
    otherTaskPositions
  )
  const precedingNotScheduled = !allPrecedingScheduled
  const precedingNotFinished = !allPrecedingFinished

  const isValid = !overlapsOnMachine && !precedingNotScheduled && !precedingNotFinished

  return {
    isValid,
    overlapsOnMachine,
    precedingNotScheduled,
    precedingNotFinished,
  }
}

function getAreAllPrecedingScheduledAndFinished(
  currentProcedureId: ElementId,
  currentTaskPosition: TaskPositionData,
  procedureIdsOfSameJob: ElementId[], // ordered
  flatTaskPositions: TaskPositionData[]
) {
  let allPrecedingScheduled = true
  let allPrecedingFinished = true

  for (const otherProcedureId of procedureIdsOfSameJob) {
    if (otherProcedureId === currentProcedureId) {
      break
    }

    const otherTaskPositionData = flatTaskPositions.find(p => p.procedureId === otherProcedureId)
    const otherIsScheduled = otherTaskPositionData !== undefined
    allPrecedingScheduled = allPrecedingScheduled && otherIsScheduled

    if (otherIsScheduled) {
      const otherIsFinished = otherTaskPositionData.endTimeMs <= currentTaskPosition.startTimeMs
      allPrecedingFinished = allPrecedingFinished && otherIsFinished
    }

    if (!allPrecedingScheduled && !allPrecedingFinished) {
      break
    }
  }

  return { allPrecedingScheduled, allPrecedingFinished }
}

export type JobCompletionResult = {
  completedCount: number
  hasConflict: boolean
}

export function calculateJobCompletionResult(
  jobId: ElementId,
  procedureIds: ElementId[],
  taskPositions: TaskPositions,
): JobCompletionResult {
  return procedureIds.reduce(
    (acc, pId) => {
      const validateTaskResult = taskValidationResultSelector(
        jobId,
        pId,
        taskPositions,
        procedureIds
      )

      if (taskPositions[jobId]?.[pId] !== undefined && validateTaskResult.isValid) {
        acc.completedCount = acc.completedCount + 1
      }

      if (!validateTaskResult.isValid) {
        acc.hasConflict = true
      }

      return acc
    },
    { completedCount: 0, hasConflict: false } as JobCompletionResult
  )
}
