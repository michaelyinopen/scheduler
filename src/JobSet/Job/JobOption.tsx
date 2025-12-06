import { Popover } from '@base-ui-components/react/popover'
import { useShallow } from 'zustand/shallow'
import type { ElementId, JobValue, ValueElement } from '@michaelyinopen/scheduler-common'
import { pickTextColor } from '../../utils/jobColors'
import { useAppStore } from '../../store'
import { ArrowSvg } from '../../components/ArrowSvg'
import { OptionIcon } from './OptionIcon'
import { JobHeader } from './JobHeader'
import baseClasses from '../../components/base.module.css'
import jobSetClasses from '../JobSet.module.css'
import jobClasses from './Job.module.css'

export type JobOptionProps = {
  id: ElementId,
}

export const JobOption = ({ id }: JobOptionProps) => {
  const [jobTitle, jobColor, jobTextColor] = useAppStore(useShallow(state => {
    const job = (state.replicationState?.crdt.jobs?.elements[id] as ValueElement<JobValue> | undefined)?.value
    const jobTitle = job?.title?.value
    const jobColor = job?.color?.value
    const jobTextColor = job?.color?.value !== undefined && job?.color?.value.length >= 6
      ? pickTextColor(job?.color?.value)
      : undefined
    return [jobTitle, jobColor, jobTextColor]
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
                <Popover.Description className={baseClasses.popupDescription} render={<div />}>
                  <table className={'table--unstyled' + ' '+ jobClasses.jobOptionDetail}>
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
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      </div>
    </ div>
  )
}
