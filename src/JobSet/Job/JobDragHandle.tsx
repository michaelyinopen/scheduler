import { memo } from 'react'
import { DragHandleIcon } from '../../components/DragHandleIcon'
import baseClasses from '../../components/base.module.css'
import jobClasses from './Job.module.css'

export type JobDragHandleProps = React.ComponentProps<'svg'>

const JobDragHandle = memo(({ ref, ...rest }: JobDragHandleProps) => {
  return (
    <div className={jobClasses.jobDragHandle} tabIndex={0}>
      <DragHandleIcon
        className={baseClasses.dragHandleIcon}
        ref={ref}
        {...rest}
      />
    </div>
  )
})

JobDragHandle.displayName = 'JobDragHandle'
export { JobDragHandle }
