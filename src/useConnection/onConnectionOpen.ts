
import { clientMessageType, type ConnectMessage, type InitializeMessage } from '@michaelyinopen/scheduler-common'
import { useAppStore } from '../store'
import { isValidJobSetId, serverReplicaId } from '../constants'

export function onConnectionOpen() {
  const webSocket = useAppStore.getState().webSocket!
  const replicationStateId = useAppStore.getState().replicationStateId
  const replicationState = useAppStore.getState().replicationState

  if (replicationStateId === undefined || !isValidJobSetId(replicationStateId)) {
    return
  }

  if (replicationState === undefined) {
    // initialize
    const initializeMessage: InitializeMessage = {
      type: clientMessageType.initialize,
      id: replicationStateId,
    }
    webSocket.send(JSON.stringify(initializeMessage))
    return
  }

  // connect
  // the replicaId, replicationState and localEvents are only kept for the current replicationStateId, not for other replicationStateIds
  const connectMessage: ConnectMessage = {
    type: clientMessageType.connect,
    id: replicationStateId,
    replicaId: replicationState.replicaId,
    sequence: replicationState.observed[serverReplicaId] ?? 0,
    latestVersion: replicationState.version,
  }
  webSocket.send(JSON.stringify(connectMessage))

  // solution?
}
