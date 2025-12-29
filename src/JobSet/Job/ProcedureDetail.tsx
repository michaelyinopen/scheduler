import { memo } from 'react'
import { useShallow } from 'zustand/shallow'
import { Button, Field, Input, Popover } from '@base-ui/react'
import { type ElementId, type JobValue, type ProcedureValue, type ValueElement } from '@michaelyinopen/scheduler-common'
import { msToFormattedHourMinute } from '../../utils/time'
import { deleteProcedure, prodcedureIdsSelector, useAppStore } from '../../store'
import { DeleteIcon } from '../../components/DeleteIcon'
import { MachineHeader } from '../../Timeline'
import { JobHeader } from './JobHeader'
import fieldClasses from '../../components/Field.module.css'
import baseClasses from '../../components/base.module.css'

export type ProcedureDetailProps = {
  jobId: ElementId
  procedureId: ElementId
}

const ProcedureDetail = memo(({ jobId, procedureId }: ProcedureDetailProps) => {
  const [machineId, processignTimsMs, sequence, isExpandMode] = useAppStore(useShallow(state => {
    const job = (state.replicationState?.crdt.jobs?.elements[jobId] as ValueElement<JobValue> | undefined)?.value
    const procedure = (job?.procedures?.elements[procedureId] as ValueElement<ProcedureValue> | undefined)?.value

    const machineId = procedure?.machineId?.value as ElementId | undefined
    const processignTimsMs = procedure?.processingTimeMs?.value

    const procedureIds = prodcedureIdsSelector(jobId, job?.procedures)
    const sequence = procedureIds.indexOf(procedureId) + 1

    const isExpandMode = state.isExpandMode

    return [machineId, processignTimsMs, sequence, isExpandMode]
  }))

  return isExpandMode
    ? popoverDescriptionExapndMode(jobId, procedureId, machineId, processignTimsMs, sequence)
    : popoverDescription(jobId, machineId, processignTimsMs, sequence)
})

function popoverDescription(
  jobId: ElementId,
  machineId: ElementId | undefined,
  processignTimsMs: number | undefined,
  sequence: number
) {
  return (
    <Popover.Description className={baseClasses.popupDescription} render={<div />}>
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
    </Popover.Description>
  )
}

function popoverDescriptionExapndMode(
  jobId: ElementId,
  procedureId: ElementId,
  machineId: ElementId | undefined,
  processignTimsMs: number | undefined,
  sequence: number
) {
  return (
    <Popover.Description className={baseClasses.popupDescription + ' ' + baseClasses.popupDescriptionExpandMode} render={<div />}>
      {/* machine */}
      <div className={fieldClasses.field + ' ' + fieldClasses.fieldInput + ' ' + fieldClasses.fieldInputControl + ' ' + fieldClasses.disabled}>
        <JobHeader id={jobId} inline={true} className={fieldClasses.control} />
        <div className={fieldClasses.label}>Job</div>
      </div>
      <Field.Root disabled>
        <div className={fieldClasses.field + ' ' + fieldClasses.fieldInput + ' ' + fieldClasses.disabled}>
          <Input
            className={fieldClasses.input + ' ' + fieldClasses.inputShortWidth}
            type='number'
            placeholder='Sequence'
            value={sequence}
          />
          <Field.Label className={fieldClasses.label}>Sequence</Field.Label>
        </div>
        <Field.Description className={fieldClasses.description}>
          Drag to reorder
        </Field.Description>
      </Field.Root>
      {/* processing time */}
      <Button
        className={baseClasses.iconButton + ' ' + 'pointer'}
        aria-label='Delete procedure'
        title='Delete procedure'
        onClick={() => deleteProcedure(jobId, procedureId)}
      >
        <DeleteIcon />
      </Button>
    </Popover.Description>
  )
}

ProcedureDetail.displayName = 'ProcedureDetail'
export { ProcedureDetail }
