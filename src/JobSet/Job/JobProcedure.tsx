import { memo, useEffect, useMemo, useState, type Ref } from 'react'
import { Popover } from '@base-ui/react/popover'
import type { ElementId } from '@michaelyinopen/scheduler-common'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities';
import { dragType, useDragAndDropStore } from '../../dragAndDrop'
import { useAppStore } from '../../store'
import { ArrowSvg } from '../../components/ArrowSvg'
import { Procedure } from '../../Procedure'
import { ProcedureDetail } from './ProcedureDetail'
import baseClasses from '../../components/base.module.css'
import jobClasses from './Job.module.css'
import classes from '../../Procedure/Procedure.module.css'

type JobProcedureDraggableProps = React.ComponentProps<'div'> & {
  ref: Ref<HTMLDivElement>
  jobId: ElementId
  procedureId: ElementId
}

const JobProcedureDraggable = memo(({ ref, jobId, procedureId, style, ...rest }: JobProcedureDraggableProps) => {
  const isScheduled = useAppStore(state => {
    return state.taskPositions[jobId]?.[procedureId] !== undefined
  })

  const isDragging = useDragAndDropStore((state) => {
    return state.procedureDragItem !== undefined && state.procedureDragItem.jobId === jobId && state.procedureDragItem.procedureId === procedureId
  })

  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (open) {
      const unsubscribe = useDragAndDropStore.subscribe((state) => {
        if (state.procedureDragItem !== undefined && state.procedureDragItem.jobId === jobId && state.procedureDragItem.procedureId === procedureId) {
          setOpen(false)
        }
      })
      return () => {
        unsubscribe()
      }
    }
  }, [jobId, procedureId, open])

  const isScheduledClassName = isScheduled ? classes.procedureIsScheduled : ''
  const isDraggingClassName = isDragging ? ` ${classes.procedureIsDragItem}` : ''

  return (
    <Popover.Root
      open={open}
      onOpenChange={setOpen}
    >
      <Popover.Trigger
        openOnHover={true}
        nativeButton={false}
        className={jobClasses.jobProcedure}
        render={<div />}
      >
        <Procedure
          ref={ref}
          jobId={jobId}
          procedureId={procedureId}
          className={isScheduledClassName + isDraggingClassName}
          style={style}
          {...rest}
        />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8} align='start'>
          <Popover.Popup className={baseClasses.popup}>
            <Popover.Arrow className={baseClasses.arrow}>
              <ArrowSvg />
            </Popover.Arrow>
            <ProcedureDetail jobId={jobId} procedureId={procedureId} />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
})

export type JobProcedureProps = {
  jobId: ElementId
  procedureId: ElementId
}

const JobProcedure = memo(({ jobId, procedureId }: JobProcedureProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: `procedure-${procedureId}`,
    data: {
      type: dragType.procedure,
      jobId,
      procedureId,
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
    <JobProcedureDraggable
      ref={setNodeRef}
      jobId={jobId}
      procedureId={procedureId}
      {...applicableAttributes}
      {...listeners}
      style={style}
    />
  )
})

JobProcedureDraggable.displayName = 'JobProcedureDraggable'
JobProcedure.displayName = 'JobProcedure'
export { JobProcedure }
