import { create } from 'zustand'
import type { ElementId, ReplicationState, FormData, Event, Operation, ManualTimeOptions } from '@michaelyinopen/scheduler-common'
import { onlineStatus, type OnlineStatus } from '../useConnection'
import type { TaskPositions } from '../utils/taskStacking'

let documentComputedStyle: CSSStyleDeclaration | null = null
const defaultRemToPxMultiplier = 16

export type AppState = {
  //#region view states
  timeAxisWidthPx: number | null
  maxTimeMs: number
  viewStartTimeMs: number
  viewEndTimeMs: number
  minViewDurationMs: number
  maxViewDurationMs: number
  getRemToPxMultiplier: () => number
  //#endregion view states

  //#region Web Socket
  webSocket: WebSocket | undefined
  onlineStatus: OnlineStatus
  //#endregion Web Socket

  hasLoadedReplicationState: boolean // set to true when receiving reset with the matching replicationStateId
  hasLoadedSolution: boolean

  replicationStateId: number | undefined
  isViewingSolution: boolean
  solutionScheduledProcedureStartTimes: Record<ElementId, number> | undefined

  replicationState: ReplicationState<FormData> | undefined
  localEvents: Event<Operation>[]

  //#region calculated
  taskPositions: TaskPositions
  //#endregion calculated
}

export const defaultTimeOptions: ManualTimeOptions = {
  maxTimeMs: 3600000,
  viewStartTimeMs: 0,
  viewEndTimeMs: 3600000,
  minViewDurationMs: 120000,
  maxViewDurationMs: 3600000,
}

export const useAppStore = create<AppState>(() => ({
  //#region view states
  timeAxisWidthPx: null,
  maxTimeMs: defaultTimeOptions.maxTimeMs,
  viewStartTimeMs: defaultTimeOptions.viewStartTimeMs,
  viewEndTimeMs: defaultTimeOptions.viewEndTimeMs,
  minViewDurationMs: defaultTimeOptions.minViewDurationMs,
  maxViewDurationMs: defaultTimeOptions.maxViewDurationMs,
  getRemToPxMultiplier: function () {
    try {
      if (documentComputedStyle === null) {
        documentComputedStyle = getComputedStyle(document.documentElement)
      }

      // seems performant enough to call everytime
      // https://stackoverflow.com/questions/65412124/looping-causes-forced-reflow-while-the-same-code-doesnt-cause-reflow-without-lo
      // https://gist.github.com/paulirish/5d52fb081b3570c81e3a#calling-getcomputedstyle
      return parseFloat(documentComputedStyle.fontSize)
    }
    catch {
      return defaultRemToPxMultiplier
    }
  },
  //#endregion view states

  //#region Web Socket
  webSocket: undefined,
  onlineStatus: onlineStatus.Offline,
  //#endregion Web Socket

  hasLoadedReplicationState: false,
  hasLoadedSolution: false,

  replicationStateId: undefined,
  isViewingSolution: false,
  solutionScheduledProcedureStartTimes: undefined,

  replicationState: undefined,
  localEvents: [],

  //#region calculated
  // autoTimeOptions
  taskPositions: {},
  //#endregion calculated
}))
