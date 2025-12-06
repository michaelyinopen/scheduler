
import {
  clientMessageType,
  type ReplicatedMessage,
  type ReplicateMessage,
  createReplicationState,
  type ResetMessage,
  type ServerMessage,
  serverMessageType,
  vectorClockComparer,
  vectorClockOrder,
  type SubmitMessage,
} from '@michaelyinopen/scheduler-common'
import {
  useAppStore,
  resetReplicationState,
  handleReplicatedMessage,
} from '../store'
import { serverReplicaId } from '../constants'

export function onMessage(message: ServerMessage) {
  if (message.type === serverMessageType.reset) {
    const {
      id,
      replicaId,
      crdt,
      version,
      from,
      toSequence,
    } = message as ResetMessage

    const { replicationStateId: storeReplicationStateId } = useAppStore.getState()

    if (id === storeReplicationStateId) {
      const replicationState = createReplicationState(replicaId, crdt)
      replicationState.sequence = version[replicaId] ?? 0 // does not work with multiple servers?
      replicationState.version = version
      replicationState.observed = { [from]: toSequence }
      resetReplicationState(id, replicationState)
    }

    return
  }

  if (message.type === serverMessageType.replicated) {
    handleReplicatedMessage(message as ReplicatedMessage)

    return
  }

  if (message.type === serverMessageType.replicate) {
    const {
      id,
      sequence: serverObservedSequence,
      latestVersion,
    } = message as ReplicateMessage

    const {
      replicationStateId: storeReplicationStateId,
      hasLoadedReplicationState,
      replicationState,
      localEvents,
    } = useAppStore.getState()

    if (replicationState === undefined || id !== storeReplicationStateId || !hasLoadedReplicationState) {
      return
    }

    const { sequence, replicaId } = replicationState

    const filteredEvents = localEvents.filter(event => {
      const hardResetHappened = (event.version[serverReplicaId] ?? 0) < (latestVersion[serverReplicaId] ?? 0)

      if (hardResetHappened) {
        return false
      }

      if (event.localSequence <= serverObservedSequence) {
        return false
      }

      const compareResult = vectorClockComparer(event.version, latestVersion)

      return compareResult === vectorClockOrder.greaterThan || compareResult === vectorClockOrder.concurrent
    })

    if (filteredEvents.length !== 0) {
      const webSocket = useAppStore.getState().webSocket!
      const sumbitMessage: SubmitMessage = {
        type: clientMessageType.submit,
        id,
        replicaId,
        toSequence: sequence,
        events: filteredEvents,
      }
      webSocket.send(JSON.stringify(sumbitMessage))
    }
  }
}
