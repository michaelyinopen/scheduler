import { memo } from 'react'
import { Popover } from '@base-ui-components/react'
import type { ElementId } from '@michaelyinopen/scheduler-common'
import { ArrowSvg } from '../../components/ArrowSvg'
import baseClasses from '../../components/base.module.css'
import { JobHeader } from './JobHeader'
import { CompletedIcon } from '../../components/CompletedIcon'
import { ConflictIcon } from '../../components/ConflictIcon'
import { JobProgressProcedures } from './JobProgressProcedures'
import jobClasses from './Job.module.css'

export type JobProgressDetailsProps = {
  id: ElementId
  totalCount: number
  completedCount: number
  hasConflict: boolean
}

const JobProgressDetails = memo(({ id, totalCount, completedCount, hasConflict }: JobProgressDetailsProps) => {
  return (
    <Popover.Positioner sideOffset={8} align='start'>
      <Popover.Popup className={baseClasses.popup}>
        <Popover.Arrow className={baseClasses.arrow}>
          <ArrowSvg />
        </Popover.Arrow>
        <Popover.Title className={baseClasses.popupTitle}>
          <JobHeader className={jobClasses.jobProgressTitleJobHeader} id={id} />
          {' '}
          progress {completedCount}/{totalCount}
          {completedCount === totalCount && (
            <>
              {' '}
              <CompletedIcon className={jobClasses.jobProgressTitleIcon} />
            </>
          )}
          {hasConflict && (
            <>
              {' '}
              <ConflictIcon className={jobClasses.jobProgressTitleIcon} />
            </>
          )}
        </Popover.Title>
        {completedCount !== totalCount && (
          <JobProgressProcedures jobId={id} />
        )}
      </Popover.Popup>
    </Popover.Positioner>
  )
})

JobProgressDetails.displayName = 'JobProgressDetails'
export { JobProgressDetails }
