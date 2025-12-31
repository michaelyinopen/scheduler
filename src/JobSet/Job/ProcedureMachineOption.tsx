import { useId } from 'react'
import { Combobox, Field } from '@base-ui/react'
import { CheckIcon } from '../../components/CheckIcon'
import { ClearIcon } from '../../components/ClearIcon'
import { ChevronDownIcon } from '../../components/ChevronDownIcon'
import fieldClasses from '../../components/Field.module.css'

export const ProcedureMachineOption = () => {
  const id = useId()
  const machines = ['M1', 'M2']

  return (
    <Combobox.Root items={machines}>
      <Field.Root className={fieldClasses.field + ' ' + fieldClasses.fieldInput}>
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
      </Field.Root>
      <Combobox.Portal>
        <Combobox.Positioner className={fieldClasses.Positioner} sideOffset={4}>
          <Combobox.Popup className={fieldClasses.comboPopup}>
            <Combobox.Empty className={fieldClasses.comboEmpty}>No machines found.</Combobox.Empty>
            <Combobox.List className={fieldClasses.comboList}>
              {(item: string) => (
                <Combobox.Item key={item} value={item} className={fieldClasses.comboItem}>
                  <Combobox.ItemIndicator className={fieldClasses.comboItemIndicator}>
                    <CheckIcon className={fieldClasses.comboItemIndicatorIcon} />
                  </Combobox.ItemIndicator>
                  <div className={fieldClasses.comboItemText}>{item}</div>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>

  );
}
