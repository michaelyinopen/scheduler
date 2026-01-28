import {
  type ElementId,
  type Event,
  type Operation,
  type VectorClock,
  type FormData,
  applyEvent, // should use formDataCrdtApi.apply
  nextVersion,
  operationType,
  clientMessageType,
  type ReplicatedMessage,
  formDataCrdtApi,
  vectorClockMerge,
  type SubmitMessage,
  getActiveValueBlocks,
  isValueElement,
  type ValueElement,
  type JobValue,
} from '@michaelyinopen/scheduler-common'
import { getNewJobColor } from '../utils/jobColors'
import { calculateTaskPositions, eventsMightChangeTaskPositions } from '../utils/taskStacking'
import { onlineStatus } from '../useConnection'
import { useAppStore } from './useAppStore'
import { defaultProcedureProcessignTimsMs } from '../constants'

function handleSingleOperation(operation: Operation) {
  const { replicaId, sequence, version, crdt, observed } = useAppStore.getState().replicationState!
  const localEvents = useAppStore.getState().localEvents

  const newVersion = nextVersion(replicaId, version)
  const newLocalSequence = sequence + 1

  const event: Event<Operation> = {
    version: newVersion,
    origin: replicaId,
    originSequence: newLocalSequence,
    localSequence: newLocalSequence,
    operation,
  }

  const newCrdt: FormData = applyEvent(event, crdt)

  const newReplicationState = {
    replicaId,
    sequence: event.localSequence,
    crdt: newCrdt,
    version: event.version,
    observed: observed,
  }
  const newLocalEvents = [...localEvents, event]

  const calculatedChanges = getCalculatedChanges(crdt, newCrdt, [event])

  useAppStore.setState({
    replicationState: newReplicationState,
    localEvents: newLocalEvents,
    ...calculatedChanges,
  })

  submitEvents(event.localSequence, [event])
}

// todo: autoTimeOptions 
// todo: viewStart and viewEnd if time option changed
function getCalculatedChanges(previousCrdt: FormData, newCrdt: FormData, events: Event<Operation>[]) {
  if ((previousCrdt !== undefined && previousCrdt === newCrdt) || events.length === 0) {
    return false
  }

  const taskPositionsChange = eventsMightChangeTaskPositions(previousCrdt, newCrdt, events)
    ? { taskPositions: calculateTaskPositions(newCrdt) }
    : undefined

  return taskPositionsChange
}

function submitEvents(sequence: number, events: Event<Operation>[]) {
  const {
    webSocket,
    onlineStatus: appOnlineStatus,
    replicationStateId,
    replicationState,
    hasLoadedReplicationState,
  } = useAppStore.getState()

  if (replicationState === undefined
    || replicationStateId === undefined
    || !hasLoadedReplicationState
    || webSocket === undefined) {
    return
  }

  const replicaId = replicationState.replicaId

  if (appOnlineStatus === onlineStatus.Online) {
    const submitMessage: SubmitMessage = {
      id: replicationStateId,
      replicaId,
      type: clientMessageType.submit,
      toSequence: sequence,
      events: events
    }
    webSocket.send(JSON.stringify(submitMessage))
  }
}

export function handleReplicatedMessage(replicatedMessage: ReplicatedMessage) {
  const {
    from,
    id,
    toSequence,
    events,
  } = replicatedMessage

  const {
    replicationStateId: storeReplicationStateId,
    hasLoadedReplicationState,
    replicationState,
  } = useAppStore.getState()

  if (replicationState === undefined || id !== storeReplicationStateId || !hasLoadedReplicationState) {
    return
  }

  const {
    replicaId,
    sequence,
    crdt,
    version,
    observed,
  } = replicationState

  let observedSequence = observed[from]
  let newLocalSequence = sequence
  let newVersion: VectorClock = version
  let newCrdt = crdt

  for (const event of events) {
    if (formDataCrdtApi.unseen(observedSequence, newVersion, event)) {
      observedSequence = event.localSequence
      newLocalSequence = newLocalSequence + 1 // we do not store these replicated events around. Otherwise, need to update the event's localSequence
      newVersion = vectorClockMerge(event.version, newVersion)
      newCrdt = applyEvent(event, newCrdt)
    }
  }
  const newObserved = observed[from] === toSequence
    ? observed
    : {
      ...observed,
      [from]: Math.max(toSequence, observed[from] ?? 0)
    }

  const newReplicationState = observed === newObserved && sequence === newLocalSequence
    ? replicationState
    : {
      replicaId,
      sequence: newLocalSequence,
      crdt: newCrdt,
      version: newVersion,
      observed: newObserved,
    } as const

  const calculatedChanges = getCalculatedChanges(crdt, newCrdt, events)

  useAppStore.setState({
    replicationState: newReplicationState,
    ...calculatedChanges,
  })
}

export function scheduledProcedure(jobId: ElementId, procedureId: ElementId, startTime?: number) {
  handleSingleOperation(
    {
      type: operationType.update,
      key: 'scheduledProcedureStartTimes',
      childOperation:
      {
        type: operationType.update,
        key: jobId,
        childOperation:
        {
          type: operationType.update,
          key: procedureId,
          childOperation:
          {
            type: operationType.assign,
            timestamp: new Date().getTime(),
            value: startTime,
          }
        }
      }
    }
  )
}

export function insertJobAtTheEnd() {
  const { replicaId, sequence, version, crdt, observed } = useAppStore.getState().replicationState!
  const jobs = crdt.jobs
  const localEvents = useAppStore.getState().localEvents

  // insert job
  const insertVersion = nextVersion(replicaId, version)
  const insertSequence = sequence + 1
  const jobId = `${replicaId}.${insertSequence}` as const

  const activeValueBlocks = jobs === undefined
    ? undefined
    : getActiveValueBlocks(jobs)

  const originLeftIndex: number | undefined = activeValueBlocks === undefined
    ? undefined
    : activeValueBlocks[activeValueBlocks.length - 1]?.indexInYata

  const originLeft = originLeftIndex === undefined
    ? undefined
    : jobs!.blocks[originLeftIndex]?.id

  const originRight = originLeftIndex === undefined
    ? undefined
    : jobs!.blocks[originLeftIndex + 1]?.id

  const insertEvent = {
    version: insertVersion,
    origin: replicaId,
    originSequence: insertSequence,
    localSequence: insertSequence,
    operation: {
      type: operationType.update,
      key: 'jobs',
      childOperation:
      {
        type: operationType.insertElement,
        id: jobId,
        originLeft,
        originRight,
        elementValue: {},
      }
    }
  }

  // job title
  const titleVersion = nextVersion(replicaId, insertVersion)
  const titleSequence = insertSequence + 1
  const jobNumber = jobs === undefined // 1 + the number of value elements (including deleted elements)
    ? 1
    : jobs.blocks.reduce((acc, block) => {
      const element = jobs.elements[block.id]

      return isValueElement(element)
        ? acc + 1
        : acc
    }, 1)

  const titleEvent: Event<Operation> = {
    version: titleVersion,
    origin: replicaId,
    originSequence: titleSequence,
    localSequence: titleSequence,
    operation: {
      type: operationType.update,
      key: 'jobs',
      childOperation: {
        type: operationType.updateElement,
        id: jobId,
        elementOperation: {
          type: operationType.update,
          key: 'title',
          childOperation: {
            type: operationType.assign,
            timestamp: new Date().getTime(),
            value: `${jobNumber}`,
          }
        }
      }
    },
  }

  // job color
  const excludeColors = jobs === undefined
    ? []
    : Object.values(jobs.elements)
      .reduce((acc, e) => {
        if (isValueElement(e) && !e.isDeleted) {
          const jobColor = e.value.color?.value
          if (jobColor !== undefined) {
            acc.push(jobColor)
          }
        }
        return acc
      }, [] as string[])

  const lastColor = excludeColors[excludeColors.length - 1]
  const color = getNewJobColor(excludeColors, lastColor)

  const jobColorVersion = nextVersion(replicaId, titleVersion)
  const jobColorSequence = titleSequence + 1

  const jobColorEvent: Event<Operation> = {
    version: jobColorVersion,
    origin: replicaId,
    originSequence: jobColorSequence,
    localSequence: jobColorSequence,
    operation: {
      type: operationType.update,
      key: 'jobs',
      childOperation: {
        type: operationType.updateElement,
        id: jobId,
        elementOperation: {
          type: operationType.update,
          key: 'color',
          childOperation: {
            type: operationType.assign,
            timestamp: new Date().getTime(),
            value: color,
          }
        }
      }
    },
  }

  let newCrdt: FormData = applyEvent(insertEvent, crdt)
  newCrdt = applyEvent(titleEvent, newCrdt)
  newCrdt = applyEvent(jobColorEvent, newCrdt)

  const newReplicationState = {
    replicaId,
    sequence: jobColorSequence,
    crdt: newCrdt,
    version: jobColorVersion,
    observed: observed,
  }
  const newLocalEvents = [...localEvents, insertEvent, titleEvent, jobColorEvent]

  const calculatedChanges = getCalculatedChanges(crdt, newCrdt, [insertEvent, titleEvent, jobColorEvent])

  useAppStore.setState({
    replicationState: newReplicationState,
    localEvents: newLocalEvents,
    ...calculatedChanges,
  })

  submitEvents(jobColorSequence, [insertEvent, titleEvent, jobColorEvent])
}

export function deleteJob(jobId: ElementId) {
  handleSingleOperation(
    {
      type: operationType.update,
      key: 'jobs',
      childOperation:
      {
        type: operationType.deleteElement,
        id: jobId,
      }
    }
  )
}

export function setJobTitle(jobId: ElementId, title: string) {
  handleSingleOperation(
    {
      type: operationType.update,
      key: 'jobs',
      childOperation: {
        type: operationType.updateElement,
        id: jobId,
        elementOperation: {
          type: operationType.update,
          key: 'title',
          childOperation: {
            type: operationType.assign,
            timestamp: new Date().getTime(),
            value: title,
          }
        }
      }
    },
  )
}

export function setJobColor(jobId: ElementId, color: string) {
  handleSingleOperation(
    {
      type: operationType.update,
      key: 'jobs',
      childOperation: {
        type: operationType.updateElement,
        id: jobId,
        elementOperation: {
          type: operationType.update,
          key: 'color',
          childOperation: {
            type: operationType.assign,
            timestamp: new Date().getTime(),
            value: color,
          }
        }
      }
    },
  )
}

export function changeJobColorToNextPresetColor(jobId: ElementId) {
  const jobs = useAppStore.getState().replicationState?.crdt.jobs

  const excludeColors = jobs === undefined
    ? []
    : Object.values(jobs.elements)
      .reduce((acc, e) => {
        if (isValueElement(e) && !e.isDeleted) {
          const jobColor = e.value.color?.value
          if (jobColor !== undefined) {
            acc.push(jobColor)
          }
        }
        return acc
      }, [] as string[])

  const lastColor = (jobs?.elements[jobId] as ValueElement<JobValue> | undefined)?.value.color?.value
  const color = getNewJobColor(excludeColors, lastColor)

  handleSingleOperation(
    {
      type: operationType.update,
      key: 'jobs',
      childOperation: {
        type: operationType.updateElement,
        id: jobId,
        elementOperation: {
          type: operationType.update,
          key: 'color',
          childOperation: {
            type: operationType.assign,
            timestamp: new Date().getTime(),
            value: color,
          }
        }
      }
    },
  )
}

export function setMachineTitle(machineId: ElementId, title: string) {
  handleSingleOperation(
    {
      type: operationType.update,
      key: 'machines',
      childOperation: {
        type: operationType.updateElement,
        id: machineId,
        elementOperation: {
          type: operationType.update,
          key: 'title',
          childOperation: {
            type: operationType.assign,
            timestamp: new Date().getTime(),
            value: title,
          }
        }
      }
    },
  )
}

export function setMachineDescription(machineId: ElementId, description: string) {
  handleSingleOperation(
    {
      type: operationType.update,
      key: 'machines',
      childOperation: {
        type: operationType.updateElement,
        id: machineId,
        elementOperation: {
          type: operationType.update,
          key: 'description',
          childOperation: {
            type: operationType.assign,
            timestamp: new Date().getTime(),
            value: description,
          }
        }
      }
    },
  )
}

export function insertMachineAtTheEnd() {
  const { replicaId, sequence, version, crdt, observed } = useAppStore.getState().replicationState!
  const machines = crdt.machines
  const localEvents = useAppStore.getState().localEvents

  // insert machine
  const insertVersion = nextVersion(replicaId, version)
  const insertSequence = sequence + 1
  const machineId = `${replicaId}.${insertSequence}` as const

  const activeValueBlocks = machines === undefined
    ? undefined
    : getActiveValueBlocks(machines)

  const originLeftIndex: number | undefined = activeValueBlocks === undefined
    ? undefined
    : activeValueBlocks[activeValueBlocks.length - 1]?.indexInYata

  const originLeft = originLeftIndex === undefined
    ? undefined
    : machines!.blocks[originLeftIndex]?.id

  const originRight = originLeftIndex === undefined
    ? undefined
    : machines!.blocks[originLeftIndex + 1]?.id

  const insertEvent = {
    version: insertVersion,
    origin: replicaId,
    originSequence: insertSequence,
    localSequence: insertSequence,
    operation: {
      type: operationType.update,
      key: 'machines',
      childOperation:
      {
        type: operationType.insertElement,
        id: machineId,
        originLeft,
        originRight,
        elementValue: {},
      }
    }
  }

  // machine title
  const titleVersion = nextVersion(replicaId, insertVersion)
  const titleSequence = insertSequence + 1
  const machineNumber = machines === undefined // 1 + the number of value elements (including deleted elements)
    ? 1
    : machines.blocks.reduce((acc, block) => {
      const element = machines.elements[block.id]

      return isValueElement(element)
        ? acc + 1
        : acc
    }, 1)

  const titleEvent: Event<Operation> = {
    version: titleVersion,
    origin: replicaId,
    originSequence: titleSequence,
    localSequence: titleSequence,
    operation: {
      type: operationType.update,
      key: 'machines',
      childOperation: {
        type: operationType.updateElement,
        id: machineId,
        elementOperation: {
          type: operationType.update,
          key: 'title',
          childOperation: {
            type: operationType.assign,
            timestamp: new Date().getTime(),
            value: `M${machineNumber}`,
          }
        }
      }
    },
  }

  // machine description
  const descriptionVersion = nextVersion(replicaId, titleVersion)
  const descriptionSequence = titleSequence + 1

  const descriptionEvent: Event<Operation> = {
    version: descriptionVersion,
    origin: replicaId,
    originSequence: descriptionSequence,
    localSequence: descriptionSequence,
    operation: {
      type: operationType.update,
      key: 'machines',
      childOperation: {
        type: operationType.updateElement,
        id: machineId,
        elementOperation: {
          type: operationType.update,
          key: 'description',
          childOperation: {
            type: operationType.assign,
            timestamp: new Date().getTime(),
            value: `Machine ${machineNumber}`,
          }
        }
      }
    },
  }

  let newCrdt: FormData = applyEvent(insertEvent, crdt)
  newCrdt = applyEvent(titleEvent, newCrdt)
  newCrdt = applyEvent(descriptionEvent, newCrdt)

  const newReplicationState = {
    replicaId,
    sequence: descriptionSequence,
    crdt: newCrdt,
    version: descriptionVersion,
    observed: observed,
  }
  const newLocalEvents = [...localEvents, insertEvent, titleEvent, descriptionEvent]

  const calculatedChanges = getCalculatedChanges(crdt, newCrdt, [insertEvent, titleEvent, descriptionEvent])

  useAppStore.setState({
    replicationState: newReplicationState,
    localEvents: newLocalEvents,
    ...calculatedChanges,
  })

  submitEvents(descriptionSequence, [insertEvent, titleEvent, descriptionEvent])
}

export function deleteMachine(machineId: ElementId) {
  handleSingleOperation(
    {
      type: operationType.update,
      key: 'machines',
      childOperation:
      {
        type: operationType.deleteElement,
        id: machineId,
      }
    }
  )
}

export function deleteProcedure(jobId: ElementId, procedureId: ElementId) {
  handleSingleOperation(
    {
      type: operationType.update,
      key: 'jobs',
      childOperation:
      {
        type: operationType.updateElement,
        id: jobId,
        elementOperation: {
          type: operationType.update,
          key: 'procedures',
          childOperation:
          {
            type: operationType.deleteElement,
            id: procedureId,
          }
        }
      }
    }
  )
}

export function setProcedureMachineId(jobId: ElementId, procedureId: ElementId, machineId: ElementId | undefined) {
  handleSingleOperation(
    {
      type: operationType.update,
      key: 'jobs',
      childOperation:
      {
        type: operationType.updateElement,
        id: jobId,
        elementOperation: {
          type: operationType.update,
          key: 'procedures',
          childOperation:
          {
            type: operationType.updateElement,
            id: procedureId,
            elementOperation: {
              type: operationType.update,
              key: 'machineId',
              childOperation: {
                type: operationType.assign,
                timestamp: new Date().getTime(),
                value: machineId,
              }
            }
          }
        }
      }
    }
  )
}

export function setProcedureProcessignTimsMs(jobId: ElementId, procedureId: ElementId, timeMs: number) {
  handleSingleOperation(
    {
      type: operationType.update,
      key: 'jobs',
      childOperation:
      {
        type: operationType.updateElement,
        id: jobId,
        elementOperation: {
          type: operationType.update,
          key: 'procedures',
          childOperation:
          {
            type: operationType.updateElement,
            id: procedureId,
            elementOperation: {
              type: operationType.update,
              key: 'processingTimeMs',
              childOperation: {
                type: operationType.assign,
                timestamp: new Date().getTime(),
                value: timeMs,
              }
            }
          }
        }
      }
    }
  )
}

export function insertProcedureAtTheEnd(jobId: ElementId) {
  const { replicaId, sequence, version, crdt, observed } = useAppStore.getState().replicationState!
  const job = crdt.jobs?.elements[jobId] as ValueElement<JobValue> | undefined
  const procedures = job?.value.procedures
  const localEvents = useAppStore.getState().localEvents

  // insert procedure
  const insertVersion = nextVersion(replicaId, version)
  const insertSequence = sequence + 1
  const procedureId = `${replicaId}.${insertSequence}` as const

  const activeValueBlocks = procedures === undefined
    ? undefined
    : getActiveValueBlocks(procedures)

  const originLeftIndex: number | undefined = activeValueBlocks === undefined
    ? undefined
    : activeValueBlocks[activeValueBlocks.length - 1]?.indexInYata

  const originLeft = originLeftIndex === undefined
    ? undefined
    : procedures!.blocks[originLeftIndex]?.id

  const originRight = originLeftIndex === undefined
    ? undefined
    : procedures!.blocks[originLeftIndex + 1]?.id

  const insertEvent = {
    version: insertVersion,
    origin: replicaId,
    originSequence: insertSequence,
    localSequence: insertSequence,
    operation: {
      type: operationType.update,
      key: 'jobs',
      childOperation:
      {
        type: operationType.updateElement,
        id: jobId,
        elementOperation: {
          type: operationType.update,
          key: 'procedures',
          childOperation: {
            type: operationType.insertElement,
            id: procedureId,
            originLeft,
            originRight,
            elementValue: {},
          }
        }
      }
    }
  }

  // processing time
  const processingTimeMsVersion = nextVersion(replicaId, insertVersion)
  const processingTimeMsSequence = insertSequence + 1

  const processingTimeMsEvent: Event<Operation> = {
    version: processingTimeMsVersion,
    origin: replicaId,
    originSequence: processingTimeMsSequence,
    localSequence: processingTimeMsSequence,
    operation: {
      type: operationType.update,
      key: 'jobs',
      childOperation: {
        type: operationType.updateElement,
        id: jobId,
        elementOperation: {
          type: operationType.update,
          key: 'procedures',
          childOperation: {
            type: operationType.updateElement,
            id: procedureId,
            elementOperation: {
              type: operationType.update,
              key: 'processingTimeMs',
              childOperation: {
                type: operationType.assign,
                timestamp: new Date().getTime(),
                value: defaultProcedureProcessignTimsMs,
              }
            }
          }
        }
      }
    },
  }

  let newCrdt: FormData = applyEvent(insertEvent, crdt)
  newCrdt = applyEvent(processingTimeMsEvent, newCrdt)

  const newReplicationState = {
    replicaId,
    sequence: processingTimeMsSequence,
    crdt: newCrdt,
    version: processingTimeMsVersion,
    observed: observed,
  }
  const newLocalEvents = [...localEvents, insertEvent, processingTimeMsEvent, processingTimeMsEvent]

  const calculatedChanges = getCalculatedChanges(crdt, newCrdt, [insertEvent, processingTimeMsEvent])

  useAppStore.setState({
    replicationState: newReplicationState,
    localEvents: newLocalEvents,
    ...calculatedChanges,
  })

  submitEvents(processingTimeMsSequence, [insertEvent, processingTimeMsEvent])
}
