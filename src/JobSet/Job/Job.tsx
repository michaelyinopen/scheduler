import type { ElementId } from '@michaelyinopen/scheduler-common'
import { JobProcedures } from './JobProcedures'
import { JobOption } from './JobOption'
import { JobProgress } from './JobProgress'
import { JobHeader } from './JobHeader'
import classes from '../JobSet.module.css'
import { memo } from 'react'

export type JobProps = {
  id: ElementId,
}

const Job = memo(({ id }: JobProps) => {
  return (
    <div className={classes.job}>
      <JobOption id={id} />
      <JobProgress id={id} />
      <JobHeader id={id} className={classes.jobSetJobHeader} puncuation=':' />
      <JobProcedures jobId={id} />
    </div>
  )
})

Job.displayName = 'Job'
export { Job }
