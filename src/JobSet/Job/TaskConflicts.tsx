import { memo } from 'react'
import type { ElementId, JobValue, ProcedureValue, ValueElement } from '@michaelyinopen/scheduler-common'
import type { ValidateTaskResult } from '../../utils/validateTask'
import { useAppStore } from '../../store'
import { MachineHeader } from '../../Timeline'
import { JobHeader } from './JobHeader'

export type TaskConflictsProps = {
  jobId: ElementId
  procedureId: ElementId
  validateTaskResult: ValidateTaskResult
  className?: string
}

const TaskConflicts = memo(({ jobId, procedureId, validateTaskResult, className }: TaskConflictsProps) => {
  const machineId = useAppStore(state => {
    const job = (state.replicationState?.crdt.jobs?.elements[jobId] as ValueElement<JobValue> | undefined)?.value
    const procedure = (job?.procedures?.elements[procedureId] as ValueElement<ProcedureValue> | undefined)?.value
    const machineId = procedure?.machineId?.value as ElementId | undefined

    return machineId
  })

  if (validateTaskResult.isValid || machineId === undefined) {
    return null
  }
  const additionalClassName = className !== undefined ? ` ${className}` : ''

  return (
    <ol className={'list--unstyled' + additionalClassName}>
      {validateTaskResult.overlapsOnMachine && <li>Cannot overlap with other procedures that uses <MachineHeader id={machineId} inline={true} />.</li>}
      {validateTaskResult.overlapsWithOtherOfSameJob && <li>Cannot overlap with other procedures of the <JobHeader id={jobId} inline={true} />.</li>}
      {validateTaskResult.precedingNotScheduled && <li>Not all preceding procedures of <JobHeader id={jobId} inline={true} /> are scheduled.</li>}
      {validateTaskResult.precedingNotFinished && <li>Not all preceding procedures of <JobHeader id={jobId} inline={true} /> are finished.</li>}
    </ol>
  )
})

TaskConflicts.displayName = 'TaskConflicts'
export { TaskConflicts }
