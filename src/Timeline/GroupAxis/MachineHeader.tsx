import { useShallow } from 'zustand/shallow'
import { Popover } from '@base-ui-components/react'
import { Button, Field, Input } from '@base-ui/react'
import type { ElementId, MachineValue, ValueElement } from '@michaelyinopen/scheduler-common'
import { deleteMachine, setMachineDescription, setMachineTitle, useAppStore } from '../../store'
import { ArrowSvg } from '../../components/ArrowSvg'
import { DeleteIcon } from '../../components/DeleteIcon'
import baseClasses from '../../components/base.module.css'
import fieldClasses from '../../components/Field.module.css'
import classes from '../Timeline.module.css'
import { emptyMachineTitle } from '../../constants'

export type MachineHeaderProps = {
  id: ElementId
  className?: string
  inline?: boolean
  canEdit?: boolean
}

export const MachineHeader = ({ id, className, inline, canEdit = false }: MachineHeaderProps) => {
  const [title, description, isExpandMode] = useAppStore(useShallow(state => {
    const machineElement = state.replicationState?.crdt.machines?.elements[id] as ValueElement<MachineValue> | undefined
    const title = machineElement?.value.title?.value
    const description = machineElement?.value.description?.value

    const isDeleted = machineElement?.isDeleted
    const finalTitle = isDeleted ? emptyMachineTitle : title
    const finalDescription = isDeleted ? `Deleted (${title} — ${description})` : description

    const isExpandMode = state.isExpandMode

    return [finalTitle, finalDescription, isExpandMode]
  }))

  const propsClassName = className ? ' ' + className : ''
  const inlineMachineHeaderClassName = inline ? ` ${classes.machineHeaderInline}` : ''
  const expandModeClassName = isExpandMode && canEdit ? ` ${classes.machineHeaderExpandMode}` : ''

  return (
    <Popover.Root openOnHover={!isExpandMode || !canEdit}>
      <Popover.Trigger
        nativeButton={isExpandMode && canEdit}
        className={classes.machineHeader + propsClassName + inlineMachineHeaderClassName + expandModeClassName}
        render={isExpandMode && canEdit ? <button /> : <div />}
      >
        {title}
      </Popover.Trigger>
      {isExpandMode && canEdit
        ? expandModePopup(id, title, description)
        : tooltipPopup(description)}
    </Popover.Root>
  )
}

function tooltipPopup(description: string | undefined) {
  return (
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
  )
}

function expandModePopup(id: ElementId, title: string | undefined, description: string | undefined) {
  return (
    <Popover.Portal>
      <Popover.Positioner sideOffset={8} align='start'>
        <Popover.Popup className={baseClasses.popup + ' ' + baseClasses.popupStrong}>
          <Popover.Arrow className={baseClasses.arrow}>
            <ArrowSvg />
          </Popover.Arrow>
          <Popover.Description className={baseClasses.popupDescription + ' ' + baseClasses.popupDescriptionExpandMode} render={<div />}>
            <Field.Root className={fieldClasses.field + ' ' + fieldClasses.fieldInput}>
              <Input
                id={`machine-title-input-${id}`}
                className={fieldClasses.input + ' ' + fieldClasses.inputShortWidth}
                placeholder='Title'
                value={title}
                onChange={e => setMachineTitle(id, e.target.value)}
              />
              <Field.Label htmlFor={`machine-title-input-${id}`} className={fieldClasses.label}>Title</Field.Label>
            </Field.Root>
            <Field.Root className={fieldClasses.field + ' ' + fieldClasses.fieldInput}>
              <Input
                id={`machine-description-input-${id}`}
                className={fieldClasses.input + ' ' + fieldClasses.inputShortWidth}
                placeholder='Description'
                value={description}
                onChange={e => setMachineDescription(id, e.target.value)}
              />
              <Field.Label htmlFor={`machine-description-input-${id}`} className={fieldClasses.label}>Description</Field.Label>
            </Field.Root>
            <Button
              className={baseClasses.iconButton + ' ' + 'pointer'}
              aria-label={`Delete machine ${title ?? ''}`}
              title={`Delete machine ${title ?? ''}`}
              onClick={() => deleteMachine(id)}
            >
              <DeleteIcon />
            </Button>
          </Popover.Description>
        </Popover.Popup>
      </Popover.Positioner>
    </Popover.Portal>
  )
}
