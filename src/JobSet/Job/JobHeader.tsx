import { useShallow } from 'zustand/shallow'
import { type ElementId, type JobValue, type ValueElement } from '@michaelyinopen/scheduler-common'
import { pickTextColor } from '../../utils/jobColors'
import { useAppStore } from '../../store'
import jobClasses from './Job.module.css'

export type JobHeaderProps = {
  id: ElementId
  className?: string
  inline?: boolean
  puncuation?: string
}

export const JobHeader = ({ id, inline, className, puncuation }: JobHeaderProps) => {
  const [formattedJobTitle, jobColor, jobTextColor] = useAppStore(useShallow(state => {
    const job = (state.replicationState?.crdt.jobs?.elements[id] as ValueElement<JobValue> | undefined)?.value
    const jobTitle = job?.title?.value
    const formattedJobTitle =
      jobTitle === undefined || jobTitle === ''
        ? '\u200b' // zero width space
        : jobTitle
    const jobColor = job?.color?.value
    const jobTextColor = job?.color?.value !== undefined && job?.color?.value.length >= 6
      ? pickTextColor(job?.color?.value)
      : undefined
    return [formattedJobTitle, jobColor, jobTextColor]
  }))

  const propsClassName = className ? ' ' + className : ''
  const inlineJobHeaderClassName = inline ? ` ${jobClasses.jobHeaderInline}` : ''

  return (
    <div className={jobClasses.jobHeader + propsClassName + inlineJobHeaderClassName}>
      <span>
        Job
      </span>
      <span>
        <span className={jobClasses.jobTitle} style={{ backgroundColor: jobColor, color: jobTextColor }}>
          {formattedJobTitle}
        </span>
        {puncuation}
      </span>
    </div>
  )
}
