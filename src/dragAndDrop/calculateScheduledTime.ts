import type { ElementId, ValueElement, JobValue, ProcedureValue } from '@michaelyinopen/scheduler-common'
import { useAppStore } from '../store'
import { roundToMinute } from '../utils/time'
import { useDragAndDropStore } from './useDragAndDropStore'

export type CalculateScheduledTimeResult = {
  shouldUpdate: false
} | {
  shouldUpdate: true
  startTimeMs: number
  endTimeMs: number
}

export function calculateScheduledTime(
  jobId: ElementId,
  procedureId: ElementId,
  machineId: ElementId,
  newRectLeftPx: number): CalculateScheduledTimeResult {
  const appState = useAppStore.getState();
  const job = (appState.replicationState?.crdt.jobs?.elements[jobId] as ValueElement<JobValue> | undefined)?.value;
  const procedure = (job?.procedures?.elements[procedureId] as ValueElement<ProcedureValue> | undefined)?.value;
  const procedureMachineId = procedure?.machineId?.value;

  if (machineId !== procedureMachineId) {
    return { shouldUpdate: false };
  }

  const {
    viewStartTimeMs, viewEndTimeMs, timeAxisWidthPx, maxTimeMs,
  } = appState;
  const { scheduleBodyClientLeftPx } = useDragAndDropStore.getState();
  const processignTimsMs = procedure?.processingTimeMs?.value;

  if (timeAxisWidthPx === null
    || timeAxisWidthPx === 0
    || scheduleBodyClientLeftPx === undefined
    || processignTimsMs === undefined) {
    return { shouldUpdate: false };
  }

  const viewDurationMs = viewEndTimeMs - viewStartTimeMs;
  const widthToTimeMultiplier = viewDurationMs / timeAxisWidthPx;
  const maxStartTime = maxTimeMs - processignTimsMs;

  const scheduledPositionStartTime = viewStartTimeMs + (newRectLeftPx - scheduleBodyClientLeftPx) * widthToTimeMultiplier;
  const roundedStartTime = roundToMinute(scheduledPositionStartTime);
  const startTimeMs = Math.max(0, Math.min(roundedStartTime, maxStartTime));
  const endTimeMs = startTimeMs + processignTimsMs;

  const previosuStartTime = appState.replicationState?.crdt.scheduledProcedureStartTimes?.[jobId]?.[procedureId]?.value;

  if (startTimeMs === previosuStartTime) {
    return { shouldUpdate: false };
  }

  return {
    shouldUpdate: true,
    startTimeMs,
    endTimeMs,
  };
}
