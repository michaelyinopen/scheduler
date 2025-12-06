import { memo, type CSSProperties, type Ref } from 'react'
import { useShallow } from 'zustand/shallow'
import { type ElementId, type JobValue, type ProcedureValue, type ValueElement } from '@michaelyinopen/scheduler-common'
import { pickTextColor } from '../utils/jobColors'
import { prodcedureIdsSelector, timeToWidthMultiplierSelector, useAppStore } from '../store'
import { ProcedureMachineLabel } from './ProcedureMachineLabel'
import { ProcedureJobLabel } from './ProcedureJobLabel'
import { ProcedureSequenceLabel } from './ProcedureSequenceLabel'
import classes from './Procedure.module.css'

export type ProcedureProps = {
  jobId: ElementId
  procedureId: ElementId
  ref?: Ref<HTMLDivElement>
  className?: string
  style?: CSSProperties
}

const Procedure = memo(({ ref, jobId, procedureId, className, style, ...rest }: ProcedureProps) => {
  const [jobColor, jobTextColor, widthPx, sequence] = useAppStore(useShallow(state => {
    const job = (state.replicationState?.crdt.jobs?.elements[jobId] as ValueElement<JobValue> | undefined)?.value
    const jobColor = job?.color?.value
    const jobTextColor = job?.color?.value !== undefined && job?.color?.value.length >= 6
      ? pickTextColor(job?.color?.value)
      : undefined

    const timeToWidthMultiplier = timeToWidthMultiplierSelector(state)

    const procedure = (job?.procedures?.elements[procedureId] as ValueElement<ProcedureValue> | undefined)?.value
    const processignTimsMs = procedure?.processingTimeMs?.value

    const widthPx = processignTimsMs !== undefined && timeToWidthMultiplier !== null
      ? processignTimsMs * timeToWidthMultiplier
      : undefined

    const procedureIds = prodcedureIdsSelector(jobId, job?.procedures)
    const sequence = procedureIds.indexOf(procedureId) + 1

    return [jobColor, jobTextColor, widthPx, sequence]
  }))

  return (
    <div
      ref={ref}
      className={classes.procedure + (className ? ' ' + className : '')}
      style={{ backgroundColor: jobColor, color: jobTextColor, width: widthPx, ...style }}
      {...rest}
    >
      <ProcedureMachineLabel jobId={jobId} procedureId={procedureId} />
      <ProcedureJobLabel jobId={jobId} procedureId={procedureId} />
      <ProcedureSequenceLabel sequence={sequence} />
    </div>
  )
})

Procedure.displayName = 'Procedure'
export { Procedure }
