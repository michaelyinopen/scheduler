import { type ElementId, type JobValue, type ValueElement } from '@michaelyinopen/scheduler-common'
import { useAppStore } from '../store'
import classes from './Procedure.module.css'

export type ProcedureJobLabelProps = {
  jobId: ElementId
  procedureId: ElementId
}

export const ProcedureJobLabel = ({ jobId }: ProcedureJobLabelProps) => {
  const jobTitle = useAppStore(state => {
    const job = (state.replicationState?.crdt.jobs?.elements[jobId] as ValueElement<JobValue> | undefined)?.value
    const title = job?.title?.value
    const formattedJobTitle =
      title === undefined || title === ''
        ? '\u200b' // zero width space
        : title
    return formattedJobTitle
  })
  return (
    <div className={classes.procedureJobLabel}>
      {jobTitle}
    </div>
  )
}
