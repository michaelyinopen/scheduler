import { memo, useMemo, type Ref } from 'react'
import type { ElementId } from '@michaelyinopen/scheduler-common'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { JobProcedures } from './JobProcedures'
import { JobOption } from './JobOption'
import { JobProgress } from './JobProgress'
import { JobHeader } from './JobHeader'
import classes from '../JobSet.module.css'
import { dragType } from '../../dragAndDrop'

export type JobDraggableProps = React.ComponentProps<'div'> & {
  id: ElementId,
  ref: Ref<HTMLDivElement>
}

const JobDraggable = memo(({ id, ref, style, ...rest }: JobDraggableProps) => {
  return (
    <div ref={ref} className={classes.job} style={style} {...rest}>
      <JobOption id={id} />
      <JobProgress id={id} />
      <JobHeader id={id} className={classes.jobSetJobHeader} puncuation=':' />
      <JobProcedures jobId={id} />
    </div>
  )
})

export type JobProps = {
  id: ElementId,
}

const Job = memo(({ id }: JobProps) => {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition } = useSortable({
    id: `job-${id}`,
    data: {
      type: dragType.job,
      jobId: id,
    },
  })
  const { tabIndex, ...applicableAttributes } = attributes
  const style = useMemo(
    () => ({
      transform: CSS.Transform.toString(transform),
      transition,
    }),
    [transform, transition]
  )

  return (
    <JobDraggable
      id={id}
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...applicableAttributes}
    />
  )
})

JobDraggable.displayName = 'JobDraggable'
Job.displayName = 'Job'
export { Job }
