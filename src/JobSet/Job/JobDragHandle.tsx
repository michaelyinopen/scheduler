import { memo } from 'react'
import { DragHandleIcon } from '../../components/DragHandleIcon'
import baseClasses from '../../components/base.module.css'
import jobClasses from './Job.module.css'

export type JobDragHandleProps = React.ComponentProps<'svg'>

const JobDragHandle = memo(({ ref, ...rest }: JobDragHandleProps) => {
  return (
    <DragHandleIcon
      className={baseClasses.dragHandleIcon + ' ' + jobClasses.jobDragHandle}
      ref={ref}
      {...rest}
    />
  )
})

JobDragHandle.displayName = 'JobDragHandle'
export { JobDragHandle }
