import { memo } from 'react'
import type { ElementId } from '@michaelyinopen/scheduler-common'
import { JobHeader } from '../JobSet'

export type JobProps = {
  id: ElementId,
}

// spacing for other elements, so that the pointer appears at the drag handler when dragging
const JobDragOverlay = memo(({ id }: JobProps) => {
  return (
    <div>
      <JobHeader id={id} puncuation=':' />
    </div>
  )
})

JobDragOverlay.displayName = 'JobDragOverlay'
export { JobDragOverlay }
