import { type ElementId } from '@michaelyinopen/scheduler-common'

export const dropType = {
  machineLane: 'machineLane',
  jobSet: 'jobSet',
}

export type DropType = typeof dropType[keyof typeof dropType]

export type MachineLaneDropData = {
  type: typeof dropType.machineLane
  machineId: ElementId
}

export type JobSetDropData = {
  type: typeof dropType.jobSet
}

export type DropData =
  MachineLaneDropData
  | JobSetDropData

export function isMachineLaneDropData(data: DropData): data is MachineLaneDropData {
  return data.type === dropType.machineLane
}

export function isJobSetDropData(data: DropData): data is JobSetDropData {
  return data.type === dropType.jobSet
}
