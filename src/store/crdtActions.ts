import {
  type ElementId,
  type Event,
  type Operation,
  type ReplicaId,
  type VectorClock,
  type FormData,
  applyEvent, // should use formDataCrdtApi.apply
  nextVersion,
  operationType,
  clientMessageType,
  type ReplicatedMessage,
  formDataCrdtApi,
  vectorClockMerge,
  type SubmitMessage
} from '@michaelyinopen/scheduler-common'
import { useAppStore } from './useAppStore'
import { calculateTaskPositions, eventsMightTaskPositions } from '../utils/taskStacking'
import { onlineStatus } from '../useConnection'

function prepare(replicaId: ReplicaId, sequence: number, version: VectorClock, operation: Operation) {
  const newVersion = nextVersion(replicaId, version)
  const newLocalSequence = sequence + 1

  const event: Event<Operation> = {
    version: newVersion,
    origin: replicaId,
    originSequence: newLocalSequence,
    localSequence: newLocalSequence,
    operation,
  }

  return event
}

// todo: autoTimeOptions 
// todo: viewStart and viewEnd if time option changed
function getCalculatedChanges(previousCrdt: FormData, newCrdt: FormData, events: Event<Operation>[]) {
  if ((previousCrdt !== undefined && previousCrdt === newCrdt) || events.length === 0) {
    return false
  }

  const taskPositionsChange = eventsMightTaskPositions(previousCrdt, newCrdt, events)
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
  const { replicaId, sequence, version, crdt, observed } = useAppStore.getState().replicationState!
  const localEvents = useAppStore.getState().localEvents

  const event = prepare(
    replicaId,
    sequence,
    version,
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
