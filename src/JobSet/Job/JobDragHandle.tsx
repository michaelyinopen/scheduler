import { memo, type Ref } from 'react'
import { DragHandleIcon } from '../../components/DragHandleIcon'
import baseClasses from '../../components/base.module.css'
import jobClasses from './Job.module.css'

export type JobDragHandleProps = React.ComponentProps<'svg'> & {
  ref: Ref<HTMLElement>
}

const JobDragHandle = memo(({ ref, ...rest }: JobDragHandleProps) => {
  return (
    <DragHandleIcon
      className={baseClasses.dragHandleIcon + ' ' + jobClasses.jobDragHandle}
      ref={ref as Ref<SVGSVGElement>}
      {...rest}
    />
  )
})

JobDragHandle.displayName = 'JobDragHandle'
export { JobDragHandle }
