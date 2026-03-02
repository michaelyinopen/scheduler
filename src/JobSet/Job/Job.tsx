import { memo, useMemo, type Ref } from 'react'
import type { ElementId } from '@michaelyinopen/scheduler-common'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { dragType } from '../../dragAndDrop'
import { useAppStore } from '../../store'
import { JobProcedures } from './JobProcedures'
import { JobOption } from './JobOption'
import { JobProgress } from './JobProgress'
import { JobHeader } from './JobHeader'
import { JobDragHandle } from './JobDragHandle'
import classes from '../JobSet.module.css'

export type JobDraggableProps = React.ComponentProps<'div'> & {
  id: ElementId,
  ref: Ref<HTMLDivElement>
}

const JobDraggable = memo(({ id, ref, style, ...rest }: JobDraggableProps) => {
  const isExpandMode = useAppStore(state => state.isExpandMode)
  return (
    <div ref={ref} className={classes.job} style={style} {...rest}>
      <JobOption id={id} />
      <JobProgress id={id} />
      <div className={classes.jobSetJobHeader}>
        {isExpandMode && <JobDragHandle />}
        <JobHeader id={id} puncuation=':' />
      </div>
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
