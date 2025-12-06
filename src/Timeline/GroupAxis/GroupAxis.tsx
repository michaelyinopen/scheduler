import { memo } from 'react'
import { machineIdsSelector, useAppStore } from '../../store'
import { MachineHeader } from './MachineHeader'
import classes from '../Timeline.module.css'

const GroupAxis = memo(() => {
  const machineIds = useAppStore((state) => {
    const hasLoadedReplicationState = state.hasLoadedReplicationState
    return hasLoadedReplicationState && state.replicationState !== undefined
      ? machineIdsSelector(state.replicationState.crdt.machines)
      : undefined
  })

  return (
    <ol className={'list--unstyled' + ' ' + classes.groupAxis}>
      {machineIds?.map(id => {
        return (<li className={classes.groupHeader} key={id}><MachineHeader id={id} /></li>)
      })}
    </ol>
  )
})

GroupAxis.displayName = 'GroupAxis'
export { GroupAxis }
