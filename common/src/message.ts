import type { ReplicaId, VectorClock } from './data/index.ts'
import type { Event, Operation } from './process/index.ts'
import type { FormData } from './formDataCrdt.ts'

export const clientMessageType = {
  initialize: 'initialize',
  connect: 'connect',
  submit: 'submit',
}

export type ClientMessageType = typeof clientMessageType[keyof typeof clientMessageType]

export type InitializeMessage = {
  type: typeof clientMessageType['initialize']
  id: number
}

export type ConnectMessage = {
  type: typeof clientMessageType['connect']
  id: number
  replicaId: ReplicaId
  sequence: number // replica's observed sequence of server, assuming the server's replicaId is known (=1)
  latestVersion: VectorClock
}

export type SubmitMessage = {
  type: typeof clientMessageType['submit']
  id: number
  replicaId: ReplicaId
  toSequence: number // replica's sequence
  events: Event<Operation>[]
}

export type ClientMessage =
  InitializeMessage
  | ConnectMessage
  | SubmitMessage

/////////////////////////////////////

export const serverMessageType = {
  reset: 'reset',
  replicate: 'replicate',
  replicated: 'replicated',
}

export type ServerMessageType = typeof serverMessageType[keyof typeof serverMessageType]

export type ResetMessage = {
  type: typeof serverMessageType['reset']
  id: number
  replicaId: ReplicaId
  crdt: FormData
  version: VectorClock
  from: ReplicaId
  toSequence: number
}

// request events not observed by server
export type ReplicateMessage = {
  type: typeof serverMessageType['replicate']
  id: number
  sequence: number
  latestVersion: VectorClock
}

export type ReplicatedMessage = {
  type: typeof serverMessageType['replicated']
  id: number
  from: ReplicaId
  toSequence: number
  events: Event<Operation>[]
}

export type ServerMessage =
  ResetMessage
  | ReplicateMessage
  | ReplicatedMessage
