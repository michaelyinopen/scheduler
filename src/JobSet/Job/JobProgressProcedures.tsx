import { memo } from 'react'
import { Popover } from '@base-ui/react'
import type { ElementId, JobValue, ValueElement } from '@michaelyinopen/scheduler-common'
import { prodcedureIdsSelector, useAppStore } from '../../store'
import { JobProgressProcedure } from './JobProgressProcedure'
import baseClasses from '../../components/base.module.css'
import classes from './Job.module.css'

export type JobProgressProceduresProps = {
  jobId: ElementId
}

const JobProgressProcedures = memo(({ jobId }: JobProgressProceduresProps) => {
  const procedureIds = useAppStore(state => {
    const job = state.replicationState?.crdt.jobs?.elements[jobId] as ValueElement<JobValue> | undefined
    return prodcedureIdsSelector(jobId, job?.value.procedures)
  })

  return (
    <Popover.Description className={baseClasses.popupDescription} render={<div />}>
      <ol className={'list--unstyled' + ' ' + classes.jobProgressProcedures}>
        {procedureIds?.map((id, index) => {
          return (
            <li key={id} className={classes.jobProgressProceduresItem}>
              <JobProgressProcedure jobId={jobId} procedureId={id} sequence={index + 1} />
            </li>
          )
        })}
      </ol>
    </Popover.Description>
  )
})

JobProgressProcedures.displayName = 'JobProgressProcedures'
export { JobProgressProcedures }
