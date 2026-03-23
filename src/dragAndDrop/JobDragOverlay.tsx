import { memo } from 'react'
import type { ElementId } from '@michaelyinopen/scheduler-common'
import { JobHeader, JobDragHandle } from '../JobSet'
import classes from './JobDragOverlay.module.css'

export type JobProps = {
  id: ElementId,
}

// spacing for other elements, so that the pointer appears at the drag handler when dragging
const JobDragOverlay = memo(({ id }: JobProps) => {
  return (
  <div className={classes.jobDragOverlay}>
      <div className={classes.jobDragOverlayOption} />
      <div className={classes.jobDragOverlayProgress} />
      <div className={classes.jobDragOverlayJobHeader}>
        <JobDragHandle />
        <JobHeader id={id} />
      </div>
    </div>
  )
})

JobDragOverlay.displayName = 'JobDragOverlay'
export { JobDragOverlay }
