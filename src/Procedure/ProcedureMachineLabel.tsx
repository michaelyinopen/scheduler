import { type ElementId, type JobValue, type MachineValue, type ProcedureValue, type ValueElement } from '@michaelyinopen/scheduler-common'
import { useAppStore } from '../store'
import classes from './Procedure.module.css'
import { emptyMachineTitle } from '../constants'

export type ProcedureMachineLabelProps = {
  jobId: ElementId
  procedureId: ElementId
}

export const ProcedureMachineLabel = ({ jobId, procedureId }: ProcedureMachineLabelProps) => {
  const machineTitle = useAppStore(state => {
    const job = (state.replicationState?.crdt.jobs?.elements[jobId] as ValueElement<JobValue> | undefined)?.value
    const procedure = (job?.procedures?.elements[procedureId] as ValueElement<ProcedureValue> | undefined)?.value
    const machineId = procedure?.machineId?.value

    if (machineId === undefined) {
      return '\u200b' // zero width space
    }

    const machineElement: ValueElement<MachineValue> | undefined = state.replicationState?.crdt.machines?.elements[machineId]

    if (machineElement === undefined || machineElement?.isDeleted) {
      return emptyMachineTitle
    }

    const title = machineElement?.value.title?.value

    if (title === undefined || title === '') {
      return '\u200b' // zero width space
    }

    return title
  })

  return (
    <div className={classes.procedureMachineLabel}>
      {machineTitle}
    </div>
  )
}
