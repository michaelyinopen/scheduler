import { useShallow } from 'zustand/shallow'
import { Popover } from '@base-ui-components/react'
import type { ElementId, MachineValue, ValueElement } from '@michaelyinopen/scheduler-common'
import { useAppStore } from '../../store'
import { ArrowSvg } from '../../components/ArrowSvg'
import baseClasses from '../../components/base.module.css'
import classes from '../Timeline.module.css'

export type MachineHeaderProps = {
  id: ElementId
  className?: string
  inline?: boolean
}

export const MachineHeader = ({ id, className, inline }: MachineHeaderProps) => {
  const [title, description] = useAppStore(useShallow(state => {
    const machine = state.replicationState?.crdt.machines?.elements[id] as ValueElement<MachineValue> | undefined
    const title = machine?.value.title?.value
    const description = machine?.value.description?.value

    return [title, description]
  }))

  const propsClassName = className ? ' ' + className : ''
  const inlineMachineHeaderClassName = inline ? ` ${classes.machineHeaderInline}` : ''

  return (
    <Popover.Root openOnHover={true}>
      <Popover.Trigger nativeButton={false} render={<div className={classes.machineHeader + propsClassName + inlineMachineHeaderClassName} />}>
        {title}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side='top' sideOffset={4}>
          <Popover.Popup className={baseClasses.popup + ' ' + baseClasses.tooltip}>
            <Popover.Arrow className={baseClasses.arrow}>
              <ArrowSvg />
            </Popover.Arrow>
            <Popover.Description className={baseClasses.popupDescription}>
              {description}
            </Popover.Description>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
