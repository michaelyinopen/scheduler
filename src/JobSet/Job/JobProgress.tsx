import { useShallow } from 'zustand/shallow'
import { Popover } from '@base-ui/react'
import type { ElementId, JobValue, ValueElement } from '@michaelyinopen/scheduler-common'
import { jobCompletionResultSelector, prodcedureIdsSelector, useAppStore } from '../../store'
import { closeDelayMs } from '../../constants'
import { ConflictIcon } from '../../components/ConflictIcon'
import { JobProgressDetails } from './JobProgressDetail'
import baseClasses from '../../components/base.module.css'
import jobSetClasses from '../JobSet.module.css'
import jobClasses from './Job.module.css'

const pathLength = 360

export type JobProgressProps = {
  id: ElementId
}

export const JobProgress = ({ id }: JobProgressProps) => {
  const [totalCount, completedCount, hasConflict] = useAppStore(useShallow((state) => {
    const job = state.replicationState?.crdt.jobs?.elements[id] as ValueElement<JobValue> | undefined
    const procedureIds = prodcedureIdsSelector(id, job?.value.procedures)

    const totalCount = procedureIds.length

    const { completedCount, hasConflict } = jobCompletionResultSelector(id, procedureIds, state.taskPositions)

    return [totalCount, completedCount, hasConflict]
  }))

  const dashLength = totalCount === 0 ? pathLength : Math.round(pathLength * completedCount / totalCount)
  const checkmarkVisible = completedCount === totalCount
  const gapLength = pathLength - dashLength
  const strokeDasharray = `${dashLength} ${gapLength}`
  const strokeDashoffset = 90

  return (
    <div className={jobSetClasses.jobProgress}>
      <div className={jobClasses.lineHeightBox}>
        <Popover.Root>
          <Popover.Trigger openOnHover={true} closeDelay={closeDelayMs} className={baseClasses.iconButton}>
            {hasConflict ?
              <ConflictIcon />
              : (
                <svg
                  className={jobClasses.jobProgressIcon + (checkmarkVisible ? ` ${jobClasses.jobProgressIconCompleted}` : '')}
                  viewBox='-120 -120 240 240'
                >
                  <circle r={92} strokeWidth={16} />
                  <circle
                    className={jobClasses.jobProgressSector}
                    r={50}
                    strokeWidth={100}
                    pathLength={pathLength}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                  />
                  <path
                    className={jobClasses.jobProgressCheckMark}
                    d="M-64 0 L-24 40 L64 -48"
                    fill="none"
                    pathLength={180}
                    strokeDasharray={180}
                    strokeDashoffset={checkmarkVisible ? 0 : 180}
                    style={{ visibility: checkmarkVisible ? 'visible' : 'hidden' }}
                  />
                </svg>)}
          </Popover.Trigger>
          <Popover.Portal>
            <JobProgressDetails id={id} totalCount={totalCount} completedCount={completedCount} hasConflict={hasConflict} />
          </Popover.Portal>
        </Popover.Root>
      </div>
    </ div>
  )
}
