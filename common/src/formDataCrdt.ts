import {
  type LwwRegister,
  type VectorClock,
  type Yata,
  type ElementId,
  vectorClockComparer,
  vectorClockOrder,
} from './data/index.ts'
import { type Event, type Operation, applyEvent } from './process/index.ts'

export type MachineValue = Partial<{
  title: LwwRegister<string>
  description: LwwRegister<string>
}>

export type ProcedureValue = Partial<{
  machineId: LwwRegister<string>
  processingTimeMs: LwwRegister<number>
}>

export type JobValue = Partial<{
  title: LwwRegister<string>
  color: LwwRegister<string>
  procedures: Yata<ProcedureValue>
}>

export type ManualTimeOptions = {
  maxTimeMs: number
  viewStartTimeMs: number
  viewEndTimeMs: number
  minViewDurationMs: number
  maxViewDurationMs: number
}

export type FormData = Partial<{
  title: LwwRegister<string>
  description: LwwRegister<string>
  machines: Yata<MachineValue>
  jobs: Yata<JobValue>
  isAutoTimeOptions: boolean
  manualTimeOptions?: ManualTimeOptions
  // nexted object with key of jobId, procedureId, and value of the last-write-win register of the scheduled start time
  scheduledProcedureStartTimes: Record<ElementId, Record<ElementId, LwwRegister<number>>>
  bestTotalTimeMs: number | undefined
}>

const defaultFormData: FormData = {
  isAutoTimeOptions: true,
  scheduledProcedureStartTimes: {}
}

export const formDataCrdtApi = {
  default: defaultFormData,
  apply: (state: FormData, event: Event<Operation>) => {
    return applyEvent(event, state)
  },
  unseen: <TOperation>(observerdSequence: number | undefined, version: VectorClock, event: Event<TOperation>) => {
    if (observerdSequence === undefined) {
      return true
    }

    if (event.localSequence > observerdSequence) {
      return true
    }

    const versionComparison = vectorClockComparer(event.version, version)
    return versionComparison === vectorClockOrder.greaterThan || versionComparison === vectorClockOrder.concurrent
  }
}
