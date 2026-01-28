import { useCallback, useId } from 'react'
import { Combobox, Field } from '@base-ui/react'
import { type ElementId } from '@michaelyinopen/scheduler-common'
import { CheckIcon } from '../../components/CheckIcon'
import { ClearIcon } from '../../components/ClearIcon'
import { ChevronDownIcon } from '../../components/ChevronDownIcon'
import fieldClasses from '../../components/Field.module.css'
import { machineTitlesMapSelector, setProcedureMachineId, useAppStore, type MachineTitle } from '../../store'

export type ProcedureMachineSelectProps = {
  jobId: ElementId,
  procedureId: ElementId,
  machineId: ElementId | undefined,
}

export const ProcedureMachineSelect = ({
  jobId,
  procedureId,
  machineId,
}: ProcedureMachineSelectProps) => {
  const id = useId()
  const { array: machineTitles, map: machineTitlesMap } = useAppStore(machineTitlesMapSelector)

  const onValueChange = useCallback(
    (value: MachineTitle | null) => {
      setProcedureMachineId(jobId, procedureId, value?.machineId ?? undefined)
    },
    [jobId, procedureId]
  )

  const itemToStringLabel = useCallback(
    (value: MachineTitle | null) => {
      if (value === null) {
        return ''
      }
      if (value?.title === undefined || value?.title === '') {
        return '\u200b'
      }

      return value?.title
    },
    []
  )

  const isMachineDeleted = machineId !== undefined && machineTitlesMap[machineId] === undefined

  return (
    <Combobox.Root
      items={machineTitles}
      value={machineId === undefined ? null : machineTitlesMap[machineId] ?? null}
      onValueChange={onValueChange}
      itemToStringLabel={itemToStringLabel}
    >
      <Field.Root>
        <div className={fieldClasses.field + ' ' + fieldClasses.fieldInput}>
          <Combobox.Input
            placeholder="Machine"
            id={id}
            className={fieldClasses.input + ' ' + fieldClasses.inputComboBox}
          />
          <div className={fieldClasses.actionButtons}>
            <Combobox.Clear className={fieldClasses.clear} aria-label="Clear selection">
              <ClearIcon className={fieldClasses.clearIcon} />
            </Combobox.Clear>
            <Combobox.Trigger className={fieldClasses.trigger} aria-label="Open popup">
              <ChevronDownIcon className={fieldClasses.triggerIcon} />
            </Combobox.Trigger>
          </div>
          <Field.Label className={fieldClasses.label}>Machine</Field.Label>
        </div>
        {isMachineDeleted &&
          <Field.Description className={fieldClasses.description}>
            Assigned machine deleted
          </Field.Description>
        }
      </Field.Root>
      <Combobox.Portal>
        <Combobox.Positioner sideOffset={4}>
          <Combobox.Popup className={fieldClasses.comboPopup}>
            <Combobox.Empty className={fieldClasses.comboEmpty}>No machines found.</Combobox.Empty>
            <Combobox.List className={fieldClasses.comboList}>
              {(item: MachineTitle) => (
                <Combobox.Item key={item.machineId} value={item} className={fieldClasses.comboItem}>
                  <Combobox.ItemIndicator className={fieldClasses.comboItemIndicator}>
                    <CheckIcon className={fieldClasses.comboItemIndicatorIcon} />
                  </Combobox.ItemIndicator>
                  <div className={fieldClasses.comboItemText}>{item?.title === undefined || item?.title === '' ? '\u200b' : item?.title}</div>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>

  );
}
