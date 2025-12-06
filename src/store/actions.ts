import {
  clientMessageType,
  type InitializeMessage,
  type ManualTimeOptions,
  type ReplicationState,
  type FormData,
  formDataCrdtApi,
  vectorClockMerge,
} from '@michaelyinopen/scheduler-common'
import { onlineStatus, type OnlineStatus } from '../useConnection';
import { defaultTimeOptions, useAppStore } from './useAppStore';
import { isValidJobSetId, serverReplicaId } from '../constants';
import { calculateTaskPositions } from '../utils/taskStacking';

export function setTimeAxisWidthPx(value: number | null) {
  useAppStore.setState({
    timeAxisWidthPx: value
  })
}

export function setViewStartEndTimeMs(startTimeMs: number, endTimeMs: number) {
  useAppStore.setState({
    viewStartTimeMs: startTimeMs,
    viewEndTimeMs: endTimeMs,
  })
}

export function setTimeOptions(timeOptions: ManualTimeOptions) {
  useAppStore.setState({
    maxTimeMs: timeOptions.maxTimeMs,
    viewStartTimeMs: timeOptions.viewStartTimeMs,
    viewEndTimeMs: timeOptions.viewEndTimeMs,
    minViewDurationMs: timeOptions.minViewDurationMs,
    maxViewDurationMs: timeOptions.maxViewDurationMs
  })
}

export function setWebSocket(value: WebSocket) {
  useAppStore.setState({
    webSocket: value,
  })
}

export function setOnlineStatus(value: OnlineStatus) {
  useAppStore.setState({
    onlineStatus: value,
  })
}

// sets ReplicationStateId, the loading state and sends initialize message if applicable
export function updateReplicationStateId(value: number | undefined) {
  const {
    replicationStateId: storeReplicationStateId,
    onlineStatus: storeOnlineStatus,
    webSocket
  } = useAppStore.getState()

  if (value !== storeReplicationStateId) {
    useAppStore.setState({
      replicationStateId: value,
      hasLoadedReplicationState: false,
      replicationState: undefined,
      localEvents: useAppStore.getInitialState().localEvents
    })

    if (value !== undefined
      && isValidJobSetId(value)
      && storeOnlineStatus === onlineStatus.Online
      && webSocket !== undefined
    ) {
      const initializeMessage: InitializeMessage = {
        type: clientMessageType.initialize,
        id: value,
      }
      webSocket.send(JSON.stringify(initializeMessage))
    }
  }
}

export function resetReplicationState(id: number, replicationState: ReplicationState<FormData>) {
  const {
    replicationStateId: storeReplicationStateId,
    localEvents,
  } = useAppStore.getState()

  if (storeReplicationStateId !== id) {
    return
  }

  let newReplicationState = replicationState
  for (const event of localEvents) {
    if (event.localSequence === newReplicationState.sequence + 1) { // assuming local events are ordered
      // if hard reset happened, do not apply event to crdt and do not merge version 
      const hardResetHappened = (event.version[serverReplicaId] ?? 0) < (replicationState.version[serverReplicaId] ?? 0)

      const sequence = newReplicationState.sequence + 1

      const crdt = hardResetHappened ? newReplicationState.crdt : formDataCrdtApi.apply(newReplicationState.crdt, event)

      const version = hardResetHappened ? newReplicationState.version : vectorClockMerge(event.version, newReplicationState.version)

      newReplicationState = {
        ...newReplicationState,
        sequence,
        crdt,
        version,
      }
    }
  }

  const timeOptions: ManualTimeOptions | undefined = newReplicationState.crdt.isAutoTimeOptions === false
    ? newReplicationState.crdt.manualTimeOptions
    : defaultTimeOptions // calculate auto timeOptions

  const taskPositions = calculateTaskPositions(newReplicationState.crdt)

  useAppStore.setState({
    replicationState: newReplicationState,
    hasLoadedReplicationState: true,
    ...timeOptions,
    taskPositions,
  })
}

export function setIsViewingSolution(value: boolean) {
  useAppStore.setState({
    isViewingSolution: value,
  })
}
