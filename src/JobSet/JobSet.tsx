import { memo } from 'react'
import { useShallow } from 'zustand/shallow'
import { useDroppable } from '@dnd-kit/core'
import { Button } from '@base-ui/react'
import { Spinner } from '../components/Spinner'
import { dropType, useDragAndDropStore } from '../dragAndDrop'
import { insertJobAtTheEnd, jobIdsSelector, useAppStore } from '../store'
import { Job } from './Job'
import { PlusIcon } from '../components/PlusIcon'
import baseClasses from '../components/base.module.css'
import classes from './JobSet.module.css'

const JobSet = memo(() => {
  const [hasLoadedReplicationState, jobIds, isExpandMode] = useAppStore(useShallow((state) => {
    const hasLoadedReplicationState = state.hasLoadedReplicationState
    const jobIds = hasLoadedReplicationState && state.replicationState !== undefined
      ? jobIdsSelector(state.replicationState.crdt.jobs)
      : undefined
    const isExpandMode = state.isExpandMode

    return [hasLoadedReplicationState, jobIds, isExpandMode]
  }))

  const { setNodeRef, isOver } = useDroppable({
    id: 'jobSet',
    data: {
      type: dropType.jobSet,
    },
  })

  const canDrop = useDragAndDropStore(state => {
    return state.taskDragItem !== undefined
  })

  if (!hasLoadedReplicationState) {
    return (
      <div className={classes.jobSetLoader}>
        <Spinner width='2rem' height='2rem' />
      </div>
    )
  }

  const jobSetCanDropClassName = canDrop && isOver ? ` ${classes.jobSetCanDrop}` : ''

  return (
    <ol ref={setNodeRef} className={'list--unstyled' + ' ' + classes.jobSet + jobSetCanDropClassName}>
      {jobIds === undefined || jobIds.length === 0 && (
        <li key='empty-job' className={classes.emptyJobItem}>
          No jobs
        </li>
      )}
      {jobIds?.map(id => {
        return (
          <li key={id} className={classes.jobSetItem}>
            <Job id={id} />
          </li>
        )
      })}
      {isExpandMode && (
        <li key='insert-job' className={classes.insertJobItem}>
          <Button
            onClick={insertJobAtTheEnd}
            className={baseClasses.iconButton + ' ' + 'pointer'}
            aria-label='Insert job'
            title='Insert job'
          >
            <PlusIcon />
          </Button>
        </li>
      )}
    </ol>
  )
})

JobSet.displayName = 'JobSet'
export { JobSet }
