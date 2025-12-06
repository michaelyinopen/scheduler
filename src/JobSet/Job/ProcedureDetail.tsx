import { memo } from 'react'
import { useShallow } from 'zustand/shallow'
import { type ElementId, type JobValue, type ProcedureValue, type ValueElement } from '@michaelyinopen/scheduler-common'
import { msToFormattedHourMinute } from '../../utils/time'
import { prodcedureIdsSelector, useAppStore } from '../../store'
import { MachineHeader } from '../../Timeline'
import { JobHeader } from './JobHeader'

export type ProcedureDetailProps = {
  jobId: ElementId
  procedureId: ElementId
}

const ProcedureDetail = memo(({ jobId, procedureId }: ProcedureDetailProps) => {
  const [machineId, processignTimsMs, sequence] = useAppStore(useShallow(state => {
    const job = (state.replicationState?.crdt.jobs?.elements[jobId] as ValueElement<JobValue> | undefined)?.value
    const procedure = (job?.procedures?.elements[procedureId] as ValueElement<ProcedureValue> | undefined)?.value

    const machineId = procedure?.machineId?.value as ElementId | undefined
    const processignTimsMs = procedure?.processingTimeMs?.value

    const procedureIds = prodcedureIdsSelector(jobId, job?.procedures)
    const sequence = procedureIds.indexOf(procedureId) + 1

    return [machineId, processignTimsMs, sequence]
  }))

  return (
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
        {processignTimsMs !== undefined && processignTimsMs !== 0 && <tr>
          <th>Time:</th>
          <td>
            {msToFormattedHourMinute(processignTimsMs)}
          </td>
        </tr>}
      </tbody>
    </table>
  )
})

ProcedureDetail.displayName = 'ProcedureDetail'
export { ProcedureDetail }
