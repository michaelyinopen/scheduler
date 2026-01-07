import {
  elementIdComparer,
  operationType,
  shortCutCondition,
  type ElementId,
  type FormData,
  type JobValue,
  type LwwRegister,
  type MachineValue,
  type Event,
  type Operation,
  type OperationMatcher,
  type ProcedureValue,
  type ValueElement,
  matchesOperation
} from '@michaelyinopen/scheduler-common'
import { maxTaskHeightLevelsIteration } from '../constants'

export type TaskPositionData = {
  jobId: ElementId
  procedureId: ElementId
  machineId: ElementId
  startTimeMs: number
  endTimeMs: number
}

export const taskHeightLevelType = {
  task: 'task',
  placeHolder: 'placeholder',
  dropPreview: 'dropPreview',
}

export type TaskHeightLevelType = typeof taskHeightLevelType[keyof typeof taskHeightLevelType]

export type TaskPositionHeightLevel = {
  jobId: ElementId
  procedureId: ElementId
  machineId: ElementId
  startTimeMs: number
  endTimeMs: number
  type: TaskHeightLevelType
  heightLevel: number
}

export type TaskHeightLevel = {
  type: TaskHeightLevelType
  jobId: ElementId
  procedureId: ElementId
  heightLevel: number
}

export function taskPositionDataEquals(a: TaskPositionData, b: TaskPositionData) {
  if (a === b) {
    return true
  }
  return a.startTimeMs === b.startTimeMs
    && a.endTimeMs === b.endTimeMs
    && a.machineId === b.machineId
    && a.jobId === b.jobId
    && a.procedureId === b.procedureId
}

export function taskHeightLevelEquals(a: TaskHeightLevel, b: TaskHeightLevel) {
  if (a === b) {
    return true
  }
  return a.type === b.type
    && a.jobId === b.jobId
    && a.procedureId === b.procedureId
    && a.heightLevel === b.heightLevel
}

export function taskPositionDataComparer(a: TaskPositionData, b: TaskPositionData) {
  // smaller start time first
  const startTimeComparison = a.startTimeMs - b.startTimeMs
  if (startTimeComparison !== 0) {
    return startTimeComparison
  }

  // greater end time first
  const endTimeComparison = b.endTimeMs - a.endTimeMs
  if (endTimeComparison !== 0) {
    return endTimeComparison
  }

  if (a.machineId !== b.machineId) {
    return elementIdComparer(a.machineId, b.machineId)
  }

  if (a.jobId !== b.jobId) {
    return elementIdComparer(a.jobId, b.jobId)
  }

  if (a.procedureId !== b.procedureId) {
    return elementIdComparer(a.procedureId, b.procedureId)
  }

  return 0
}

export type TaskPositions = Record<ElementId, Record<ElementId, TaskPositionData>>

export function calculateTaskPositions(formData: FormData): TaskPositions {
  const taskPositions: TaskPositions = {} // mutates

  if (formData === undefined || formData.scheduledProcedureStartTimes === undefined) {
    return taskPositions
  }

  const jobStartTimes = formData.scheduledProcedureStartTimes
  for (const jobId in jobStartTimes) {
    const job = formData.jobs?.elements[jobId] as ValueElement<JobValue>

    if (job?.isDeleted) {
      continue // next jobId
    }

    const procedureStartTimes: Record<ElementId, LwwRegister<number>> = jobStartTimes[jobId]

    for (const procedureId in procedureStartTimes) {
      const procedureStartTime: LwwRegister<number> = procedureStartTimes[procedureId]
      const taskStartTime = procedureStartTime.value

      if (taskStartTime === undefined) {
        continue  // next procedureId
      }

      const procedure = job.value.procedures?.elements[procedureId] as ValueElement<ProcedureValue> | undefined

      if (procedure === undefined || procedure.isDeleted) {
        continue  // next procedureId
      }

      const processingTimeMs = procedure.value.processingTimeMs?.value

      if (processingTimeMs === undefined || processingTimeMs === 0) {
        continue  // next procedureId
      }

      const machineId = procedure.value.machineId?.value

      if (machineId === undefined) {
        continue  // next procedureId
      }

      const machine = formData.machines?.elements[machineId] as ValueElement<MachineValue> | undefined

      if (machine === undefined || machine.isDeleted) {
        continue  // next procedureId
      }

      const taskEndTime = taskStartTime + processingTimeMs

      if (taskPositions[jobId as ElementId] === undefined) {
        taskPositions[jobId as ElementId] = {}
      }
      taskPositions[jobId as ElementId][procedureId as ElementId] = {
        jobId: jobId as ElementId,
        procedureId: procedureId as ElementId,
        machineId: machineId as ElementId,
        startTimeMs: taskStartTime,
        endTimeMs: taskEndTime,
      }
    }
  }

  return taskPositions
}

function overlapsPlacedTaskHeightLevels(placed: TaskPositionHeightLevel[], currentHeightLevel: number, task: TaskPositionData): boolean {
  return placed.some(p => p.heightLevel === currentHeightLevel && p.startTimeMs < task.endTimeMs && p.endTimeMs > task.startTimeMs)
}

export type TaskHeightLevelsResult = {
  taskHeightLevels: TaskHeightLevel[]
  maxHeightLevel: number
}

// calculate TaskHeightLevels for taskPositions already filtered by machineId
export function calculateTaskHeightLevels(
  taskPositions: TaskPositionData[],
  taskDropPreviewPosition: TaskPositionData | undefined,
  taskPlaceholderHeightLevel: number | undefined,
): TaskHeightLevelsResult {
  const showPreview =
    taskDropPreviewPosition !== undefined
    && taskPlaceholderHeightLevel !== undefined

  const placedTaskHeightLevels: TaskPositionHeightLevel[] = [] // mutates

  const { remainingTaskPositions, isPreviewScheduled } = // cloned, mutates
    taskPositions
      .reduce((acc, taskPosition) => { // filter the preview
        if (showPreview
          && taskDropPreviewPosition.jobId === taskPosition.jobId
          && taskDropPreviewPosition.procedureId === taskPosition.procedureId
        ) {
          acc.isPreviewScheduled = true
          return acc
        }

        acc.remainingTaskPositions.push({
          ...taskPosition,
          type: taskHeightLevelType.task
        })
        return acc
      }, { remainingTaskPositions: [] as Omit<TaskPositionHeightLevel, 'heightLevel'>[], isPreviewScheduled: false })

  if (showPreview) {
    remainingTaskPositions.push({
      ...taskDropPreviewPosition,
      type: taskHeightLevelType.dropPreview,
    })
  }
  remainingTaskPositions.sort((a, b) => -taskPositionDataComparer(a, b)) // to be processed back-to-front to reduce re-indexing

  let currentHeightLevel = 1
  let currentIteration = 0

  while (remainingTaskPositions.length > 0 && currentIteration <= maxTaskHeightLevelsIteration) {
    currentIteration = currentIteration + 1

    const currentTaskPositionIndex = remainingTaskPositions
      .findLastIndex(r => !overlapsPlacedTaskHeightLevels(placedTaskHeightLevels, currentHeightLevel, r))

    if (currentTaskPositionIndex === -1) {
      currentHeightLevel = currentHeightLevel + 1
      continue
    }

    const currentTimeLabel = remainingTaskPositions[currentTaskPositionIndex] as TaskPositionHeightLevel
    currentTimeLabel.heightLevel = currentHeightLevel

    placedTaskHeightLevels.push(currentTimeLabel)
    remainingTaskPositions.splice(currentTaskPositionIndex, 1)
  }

  if (showPreview && isPreviewScheduled) {
    placedTaskHeightLevels.push({
      ...taskDropPreviewPosition,
      type: taskHeightLevelType.placeHolder,
      heightLevel: taskPlaceholderHeightLevel
    })
    currentHeightLevel = Math.max(taskPlaceholderHeightLevel, currentHeightLevel)
  }

  return { taskHeightLevels: placedTaskHeightLevels, maxHeightLevel: currentHeightLevel }
}

const updateTaskPositionsOperationMatchers: OperationMatcher[] = [
  { // insert job
    type: operationType.update,
    key: 'jobs',
    childOperation: {
      type: operationType.insertElement,
      id: null
    }
  },
  { // delete job
    type: operationType.update,
    key: 'jobs',
    childOperation: {
      type: operationType.deleteElement,
      id: null
    }
  },
  { // update element that undeletes a job
    type: operationType.update,
    key: 'jobs',
    childOperation: {
      type: operationType.updateElement,
      id: null,
      shortCutCondition: shortCutCondition.undelete,
    }
  },
  { // insert procedure
    type: operationType.update,
    key: 'jobs',
    childOperation: {
      type: operationType.updateElement,
      id: null,
      elementOperation: {
        type: operationType.update,
        key: 'procedures',
        childOperation: {
          type: operationType.insertElement,
          id: null
        }
      }
    }
  },
  { // delete job
    type: operationType.update,
    key: 'jobs',
    childOperation: {
      type: operationType.updateElement,
      id: null,
      elementOperation: {
        type: operationType.update,
        key: 'procedures',
        childOperation: {
          type: operationType.deleteElement,
          id: null
        }
      }
    }
  },
  { // update element that undeletes a job
    type: operationType.update,
    key: 'jobs',
    childOperation: {
      type: operationType.updateElement,
      id: null,
      elementOperation: {
        type: operationType.update,
        key: 'procedures',
        childOperation: {
          type: operationType.updateElement,
          id: null,
          shortCutCondition: shortCutCondition.undelete,
        }
      }
    }
  },
  { // update procedure's machineId
    type: operationType.update,
    key: 'jobs',
    childOperation: {
      type: operationType.updateElement,
      id: null,
      elementOperation: {
        type: operationType.update,
        key: 'procedures',
        childOperation: {
          type: operationType.updateElement,
          id: null,
          elementOperation: {
            type: operationType.update,
            key: 'machineId',
            childOperation: {
              type: operationType.assign,
            }
          }
        }
      }
    }
  },
  { // update procedure's processing time
    type: operationType.update,
    key: 'jobs',
    childOperation: {
      type: operationType.updateElement,
      id: null,
      elementOperation: {
        type: operationType.update,
        key: 'procedures',
        childOperation: {
          type: operationType.updateElement,
          id: null,
          elementOperation: {
            type: operationType.update,
            key: 'processingTimeMs',
            childOperation: {
              type: operationType.assign,
            }
          }
        }
      }
    }
  },
  { // assign all procedure's schedule start time
    type: operationType.update,
    key: 'scheduledProcedureStartTimes',
    childOperation: {
      type: operationType.assign,
    }
  },
  { // assign procedure's schedule start time
    type: operationType.update,
    key: 'scheduledProcedureStartTimes',
    childOperation: {
      type: operationType.update,
      key: null, // jobId
      childOperation: {
        type: operationType.update,
        key: null, // procedureId
        childOperation: {
          type: operationType.assign, // start time
        }
      }
    }
  },
]

export function eventsMightTaskPositions(
  previousCrdt: FormData,
  newCrdt: FormData,
  events: Event<Operation>[]
) {
  if (previousCrdt === newCrdt || events.length === 0) {
    return false
  }

  return events.some(e => matchesOperation(
    e.operation,
    {
      newCrdt,
      previousCrdt,
      matchers: updateTaskPositionsOperationMatchers
    }
  ))
}
