import { type ElementId } from '@michaelyinopen/scheduler-common'

export const dropType = {
  machineLane: 'machineLane',
  jobSet: 'jobSet',
  procedure: 'procedure',
  job: 'job',
}

export type DropType = typeof dropType[keyof typeof dropType]

export type MachineLaneDropData = {
  type: typeof dropType.machineLane
  machineId: ElementId
}

export type JobSetDropData = {
  type: typeof dropType.jobSet
}

// same as ProcedureDragItem, for reordering procedures
export type ProcedureDropData = {
  type: typeof dropType.procedure
  jobId: ElementId
  procedureId: ElementId
}

// same as JobDragItem, for reordering procedures
export type JobDropData = {
  type: typeof dropType.job
  jobId: ElementId
}

export type DropData =
  MachineLaneDropData
  | JobSetDropData
  | ProcedureDropData
  | JobDropData

export function isMachineLaneDropData(data: DropData): data is MachineLaneDropData {
  return data.type === dropType.machineLane
}

export function isJobSetDropData(data: DropData): data is JobSetDropData {
  return data.type === dropType.jobSet
}

export function isProcedureDropData(data: DropData): data is ProcedureDropData {
  return data.type === dropType.procedure
}

export function isJobDropData(data: DropData): data is JobDropData {
  return data.type === dropType.job
}
