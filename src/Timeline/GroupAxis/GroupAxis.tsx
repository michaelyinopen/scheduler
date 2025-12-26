import { memo } from 'react'
import { useShallow } from 'zustand/shallow'
import { Button } from '@base-ui/react'
import { insertMachineAtTheEnd, machineIdsSelector, useAppStore } from '../../store'
import { PlusIcon } from '../../components/PlusIcon'
import { MachineHeader } from './MachineHeader'
import baseClasses from '../../components/base.module.css'
import classes from '../Timeline.module.css'

const GroupAxis = memo(() => {
  const [machineIds, isExpandMode] = useAppStore(useShallow((state) => {
    const hasLoadedReplicationState = state.hasLoadedReplicationState
    const machineIds = hasLoadedReplicationState && state.replicationState !== undefined
      ? machineIdsSelector(state.replicationState.crdt.machines)
      : undefined
    const isExpandMode = state.isExpandMode

    return [machineIds, isExpandMode]
  }))

  return (
    <>
      <ol className={'list--unstyled' + ' ' + classes.groupAxis}>
        {machineIds?.map(id => {
          return (<li className={classes.groupHeader} key={id}><MachineHeader id={id} canEdit={true} /></li>)
        })}
      </ol>
      {isExpandMode && (
        <div className={classes.newGroupArea}>
          <Button
            onClick={insertMachineAtTheEnd}
            className={baseClasses.iconButton + ' ' + 'pointer'}
            aria-label='Insert machine'
            title='Insert machine'
          >
            <PlusIcon />
          </Button>
        </div>
      )}
    </>
  )
})

GroupAxis.displayName = 'GroupAxis'
export { GroupAxis }
