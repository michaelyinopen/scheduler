import { memo } from 'react';
import { Popover } from '@base-ui-components/react';
import { useShallow } from 'zustand/shallow';
import type { ElementId, JobValue, ProcedureValue, ValueElement } from '@michaelyinopen/scheduler-common';
import { msToFormattedHourMinute } from '../../utils/time';
import { prodcedureIdsSelector, taskValidationResultSelector, useAppStore } from '../../store';
import { ArrowSvg } from '../../components/ArrowSvg';
import { ConflictIcon } from '../../components/ConflictIcon';
import { JobHeader, TaskConflicts } from '../../JobSet';
import { MachineHeader } from '../GroupAxis';
import baseClasses from '../../components/base.module.css'
import classes from './ScheduleBody.module.css'

export type TaskDetailProps = {
  jobId: ElementId
  procedureId: ElementId
}

const TaskDetail = memo(({ jobId, procedureId }: TaskDetailProps) => {
  const { validateTaskResult, machineId, sequence, startTimeMs, endTimeMs } = useAppStore(useShallow(state => {
    const job = (state.replicationState?.crdt.jobs?.elements[jobId] as ValueElement<JobValue> | undefined)?.value
    const procedure = (job?.procedures?.elements[procedureId] as ValueElement<ProcedureValue> | undefined)?.value

    const machineId = procedure?.machineId?.value as ElementId | undefined
    const processignTimsMs = procedure?.processingTimeMs?.value

    const procedureIds = prodcedureIdsSelector(jobId, job?.procedures)
    const sequence = procedureIds.indexOf(procedureId) + 1

    const startTimeMs = state.replicationState?.crdt.scheduledProcedureStartTimes?.[jobId]?.[procedureId]?.value
    const endTimeMs = (startTimeMs ?? 0) + (processignTimsMs ?? 0)

    const validateTaskResult = taskValidationResultSelector(
      jobId,
      procedureId,
      state.taskPositions,
      procedureIds
    )

    return { validateTaskResult, machineId, sequence, startTimeMs, endTimeMs }
  }))

  const isValid = validateTaskResult.isValid

  if (machineId === undefined || startTimeMs === undefined || endTimeMs === 0) {
    return null
  }

  return (
    <Popover.Portal>
      <Popover.Positioner sideOffset={6} align='start'>
        <Popover.Popup className={baseClasses.popup + ' ' + baseClasses.popupStrong}>
          <Popover.Arrow className={baseClasses.arrow}>
            <ArrowSvg />
          </Popover.Arrow>
          {!isValid && <Popover.Title className={baseClasses.popupTitle + ' ' + 'flex'}><ConflictIcon /> Conflicts</Popover.Title>}
          <Popover.Description className={baseClasses.popupDescription} render={<div />}>
            {!isValid && (
              <>
                <div>
                  <TaskConflicts jobId={jobId} procedureId={procedureId} validateTaskResult={validateTaskResult} className={classes.taskConflictList} />
                </div>
                <hr />
              </ >
            )}
            <table className='table--unstyled'>
              <tbody>
                {machineId && (<tr>
                  <th>Machine:</th>
                  <td>
                    <MachineHeader id={machineId} inline={true} />
                  </td>
                </tr>)}
                <tr>
                  <th>Job:</th>
                  <td>
                    <JobHeader id={jobId} inline={true} />
                  </td>
                </tr>
                <tr>
                  <th>Sequence:</th>
                  <td>
                    {sequence}
                  </td>
                </tr>
                <tr>
                  <th>Start time:</th>
                  <td>
                    {msToFormattedHourMinute(startTimeMs)}
                  </td>
                </tr>
                <tr>
                  <th>End time:</th>
                  <td>
                    {msToFormattedHourMinute(endTimeMs)}
                  </td>
                </tr>
              </tbody>
            </table>
          </Popover.Description>
        </Popover.Popup>
      </Popover.Positioner>
    </Popover.Portal>
  )
})

TaskDetail.displayName = 'TaskDetail'
export { TaskDetail }
