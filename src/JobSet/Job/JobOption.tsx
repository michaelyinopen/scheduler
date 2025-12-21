import { Popover } from '@base-ui-components/react/popover'
import { useShallow } from 'zustand/shallow'
import { debounce } from 'lodash-es'
import { Button } from '@base-ui/react'
import type { ElementId, JobValue, ValueElement } from '@michaelyinopen/scheduler-common'
import { colorPickerDebounceDelayMs } from '../../constants'
import { pickTextColor } from '../../utils/jobColors'
import { changeJobColorToNextPresetColor, deleteJob, setJobColor, useAppStore } from '../../store'
import { ArrowSvg } from '../../components/ArrowSvg'
import { RenewIcon } from '../../components/RenewIcon'
import { DeleteIcon } from '../../components/DeleteIcon'
import { OptionIcon } from './OptionIcon'
import { JobHeader } from './JobHeader'
import baseClasses from '../../components/base.module.css'
import jobSetClasses from '../JobSet.module.css'
import jobClasses from './Job.module.css'

export type JobOptionProps = {
  id: ElementId,
}

const debouncedSetJobColor = debounce(setJobColor, colorPickerDebounceDelayMs)

export const JobOption = ({ id }: JobOptionProps) => {
  const [jobTitle, jobColor, jobTextColor, isExpandMode] = useAppStore(useShallow(state => {
    const job = (state.replicationState?.crdt.jobs?.elements[id] as ValueElement<JobValue> | undefined)?.value
    const jobTitle = job?.title?.value
    const jobColor = job?.color?.value
    const jobTextColor = job?.color?.value !== undefined && job?.color?.value.length >= 6
      ? pickTextColor(job?.color?.value)
      : undefined
    const isExpandMode = state.isExpandMode
    return [jobTitle, jobColor, jobTextColor, isExpandMode]
  }))

  return (
    <div className={jobSetClasses.jobOption}>
      <div className={jobClasses.lineHeightBox}>
        <Popover.Root>
          <Popover.Trigger className={baseClasses.iconButton}>
            <OptionIcon />
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner sideOffset={8} align='start'>
              <Popover.Popup className={baseClasses.popup}>
                <Popover.Arrow className={baseClasses.arrow}>
                  <ArrowSvg />
                </Popover.Arrow>
                <Popover.Title className={baseClasses.popupTitle}><JobHeader id={id} inline={true} /> options</Popover.Title>
                {isExpandMode
                  ? popoverDescriptionExapndMode(id, jobTitle, jobColor, jobTextColor)
                  : popoverDescription(jobTitle, jobColor, jobTextColor)
                }
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      </div>
    </ div>
  )
}

function popoverDescription(
  jobTitle: string | undefined,
  jobColor: string | undefined,
  jobTextColor: string | undefined
) {
  return (
    <Popover.Description className={baseClasses.popupDescription} render={<div />}>
      <table className={'table--unstyled' + ' ' + jobClasses.jobOptionDetail}>
        <tbody>
          <tr>
            <th>Title:</th>
            <td>
              {jobTitle}
            </td>
          </tr>
          <tr>
            <th>Color:</th>
            <td>
              <span
                className={jobClasses.jobTitle + ' ' + jobClasses.jobTitleInline}
                style={{ backgroundColor: jobColor, color: jobTextColor }}
              >
                {jobColor}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </Popover.Description>
  )
}

function popoverDescriptionExapndMode(
  id: ElementId,
  jobTitle: string | undefined,
  jobColor: string | undefined,
  jobTextColor: string | undefined
) {
  return (
    <Popover.Description className={baseClasses.popupDescription} render={<div />}>
      <table className={'table--unstyled' + ' ' + jobClasses.jobOptionDetail}>
        <tbody>
          <tr>
            <th>Title:</th>
            <td>
              {jobTitle}
            </td>
          </tr>
          <tr>
            <th>Color:</th>
            <td>
              <div className='flex--center'>
                <span
                  className={jobClasses.jobColorEditing}
                  style={{ backgroundColor: jobColor, color: jobTextColor }}
                >
                  {jobColor}
                  <Button
                    className={jobClasses.changeColorIconButton}
                    onClick={() => { changeJobColorToNextPresetColor(id) }}
                    style={{ '--job-text-color': jobTextColor } as React.CSSProperties}
                  >
                    <RenewIcon />
                  </Button>
                </span>
                <input
                  type='color'
                  value={jobColor}
                  onChange={e => {
                    const color = e.target.value
                    debouncedSetJobColor(id, color)
                  }}
                />
              </div>
            </td>
          </tr>
          <tr>
            <td>
              <Button
                className={baseClasses.iconButton}
                aria-label={`Delete job ${jobTitle ?? ''}`}
                title={`Delete job ${jobTitle ?? ''}`}
                onClick={() => deleteJob(id)}
              >
                <DeleteIcon />
              </Button>
            </td>
          </tr>
        </tbody>
      </table>
    </Popover.Description>
  )
}
