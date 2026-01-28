import { memo, useCallback, useMemo } from 'react'
import { Toggle } from '@base-ui/react/toggle'
import { ToggleGroup } from '@base-ui/react/toggle-group'
import { setIsExpandMode, useAppStore, } from '../store'
import classes from './EditModes.module.css'
import { useShallow } from 'zustand/shallow'

const expandModeValue = 'Expand mode'
const scheduleModeValue = 'Schedule Mode'

const EditModes = memo(() => {
  const [allowExpand, isExpandMode] = useAppStore(useShallow(state => {
    const allowExpand = state.replicationState?.crdt.allowExpand ?? false
    const isExpandMode = state.isExpandMode

    return [allowExpand, isExpandMode]
  }))
  const value = useMemo(() => {
    return [isExpandMode ? expandModeValue : scheduleModeValue]
  }, [isExpandMode])

  const onValueChange = useCallback((groupValue: any[]) => {
    if (groupValue.length !== 1) {
      return
    }

    const newValue = groupValue[0]
    setIsExpandMode(newValue === expandModeValue)
  }, [])

  if (!allowExpand) {
    return null
  }

  return (
    <ToggleGroup
      className={classes.panel}
      value={value}
      onValueChange={onValueChange}
    >
      <Toggle aria-label="Schedule mode" value={scheduleModeValue} className={classes.button}>
        Schedule mode
      </Toggle>
      <Toggle aria-label="Expand mode" value={expandModeValue} className={classes.button}>
        Expand mode
      </Toggle>
    </ToggleGroup>
  )
})

EditModes.displayName = 'EditModes'
export { EditModes }
