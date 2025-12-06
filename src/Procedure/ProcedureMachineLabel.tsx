import { type ElementId, type JobValue, type MachineValue, type ProcedureValue, type ValueElement } from '@michaelyinopen/scheduler-common'
import { useAppStore } from '../store'
import classes from './Procedure.module.css'

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
      return undefined
    }

    const machine = (state.replicationState?.crdt.machines?.elements[machineId] as ValueElement<MachineValue> | undefined)?.value
    return machine?.title?.value
  })

  return (
    <div className={classes.procedureMachineLabel}>
      {machineTitle}
    </div>
  )
}
