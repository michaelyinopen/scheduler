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
  ref: Ref<HTMLDivElement>,
  activatorNodeRef: Ref<HTMLElement>,
  isExpandMode: boolean,
  listeners: any
}

const JobDraggable = memo(({ id, ref, activatorNodeRef, isExpandMode, listeners, style, ...rest }: JobDraggableProps) => {
  return (
    <div ref={ref} className={classes.job} style={style} {...rest}>
      <JobOption id={id} />
      <JobProgress id={id} />
      <div className={classes.jobSetJobHeader}>
        {isExpandMode && <JobDragHandle ref={activatorNodeRef} {...listeners} />}
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
  const isExpandMode = useAppStore(state => state.isExpandMode)
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition } = useSortable({
    id: `job-${id}`,
    data: {
      type: dragType.job,
      jobId: id,
    },
    disabled: !isExpandMode,
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
      activatorNodeRef={setActivatorNodeRef}
      isExpandMode={isExpandMode}
      style={style}
      listeners={listeners}
      {...applicableAttributes}
    />
  )
})

JobDraggable.displayName = 'JobDraggable'
Job.displayName = 'Job'
export { Job }
