import { memo } from 'react'
import { useShallow } from 'zustand/shallow'
import { machineIdsSelector, useAppStore } from '../store'
import classes from './Timeline.module.css'
import { Spinner } from '../components/Spinner'

export type TimelineProps = {
  children: React.ReactNode
}

const Timeline = memo(({ children }: TimelineProps) => {
  const [hasLoadedReplicationState, machineCount] = useAppStore(useShallow((state) => {
    const hasLoadedReplicationState = state.hasLoadedReplicationState
    const machineIds = hasLoadedReplicationState && state.replicationState !== undefined
      ? machineIdsSelector(state.replicationState.crdt.machines)
      : undefined

    const machineCount = machineIds?.length ?? 0

    return [hasLoadedReplicationState, machineCount]
  }))

  if (!hasLoadedReplicationState) {
    return (
      <div className={classes.jobSetLoader}>
        <Spinner width='2rem' height='2rem' />
      </div>
    )
  }

  return (
    <div className={classes.timeline} style={{ '--group-count': machineCount } as React.CSSProperties}>
      {children}
    </div>
  )
})

Timeline.displayName = 'Timeline'
export { Timeline }
