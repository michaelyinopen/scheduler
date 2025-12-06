import { memo } from 'react'
import type { ElementId, JobValue, ValueElement } from '@michaelyinopen/scheduler-common'
import { prodcedureIdsSelector, taskValidationResultSelector, useAppStore } from '../../store'
import classes from './Job.module.css'
import { ProcedureSequenceLabel } from '../../Procedure'
import { useShallow } from 'zustand/shallow'
import { NotScheduledIcon } from '../../components/NotScheduledIcon'
import { CompletedIcon } from '../../components/CompletedIcon'
import { ConflictIcon } from '../../components/ConflictIcon'
import { TaskConflicts } from './TaskConflicts'

export type JobProgressProceduresProps = {
  jobId: ElementId
  procedureId: ElementId
  sequence: number
}

const JobProgressProcedure = memo(({ jobId, procedureId, sequence }: JobProgressProceduresProps) => {
  const [isScheduled, validateTaskResult] = useAppStore(useShallow(state => {
    const isScheduled = state.taskPositions[jobId]?.[procedureId] !== undefined

    const job = state.replicationState?.crdt.jobs?.elements[jobId] as ValueElement<JobValue> | undefined
    const procedureIdsOfSameJob = prodcedureIdsSelector(jobId, job?.value.procedures)

    const validateTaskResult = taskValidationResultSelector(
      jobId,
      procedureId,
      state.taskPositions,
      procedureIdsOfSameJob
    )

    return [isScheduled, validateTaskResult]
  }))

  const isCompleted = isScheduled && validateTaskResult?.isValid
  const hasConflict = isScheduled && !validateTaskResult?.isValid

  return (
    <div className={classes.jobProgressProcedure}>
      <div className={classes.jobProgressProcedureSequence}>
        <ProcedureSequenceLabel sequence={sequence} />:
      </div>
      <div className={classes.jobProgressProcedureStatus}>
        {!isScheduled && <NotScheduledIcon />}
        {isCompleted && <CompletedIcon />}
        {hasConflict && <ConflictIcon />}
      </div>
      <div className={classes.jobProgressProcedureRemarks}>
        {!isScheduled && 'Not scheduled'}
        {isCompleted && 'Scheduled'}
        {hasConflict && (
          <TaskConflicts jobId={jobId} procedureId={procedureId} validateTaskResult={validateTaskResult} />
        )}
      </div>
    </div>
  )
})

JobProgressProcedure.displayName = 'JobProgressProcedure'
export { JobProgressProcedure }
