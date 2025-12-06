import { type ElementId, type JobValue, type ValueElement } from '@michaelyinopen/scheduler-common'
import { prodcedureIdsSelector, useAppStore } from '../../store'
import { JobProcedure } from './JobProcedure'
import classes from '../JobSet.module.css'

export type JobProceduresProps = {
  jobId: ElementId
}

export const JobProcedures = ({ jobId }: JobProceduresProps) => {
  const procedureIds = useAppStore(state => {
    const job = state.replicationState?.crdt.jobs?.elements[jobId] as ValueElement<JobValue> | undefined
    return prodcedureIdsSelector(jobId, job?.value.procedures)
  })

  return (
    <ol className={'list--unstyled' + ' ' + classes.procedures}>
      {procedureIds?.map((id) => {
        return (
          <li key={id}>
            <JobProcedure jobId={jobId} procedureId={id} />
          </li>
        )
      })}
    </ol>
  )
}
