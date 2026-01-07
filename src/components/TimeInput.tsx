import { useCallback, useEffect, useRef, type KeyboardEvent } from 'react'
import { msToFormattedHourMinute } from '../utils/time'
import classes from './TimeInput.module.css'

const DEFAULT_VALUE = '00:00'
const MAX_LENGTH = 5
const colon = ':'

type OmittedInputPropKeys = 'onBlur' | 'onChange' | 'onKeyDown' | 'ref' | 'type' | 'value'
export type TimeInputProps = Omit<React.ComponentProps<'input'>, OmittedInputPropKeys> & {
  valueMs: number | undefined
  setValueMs: (valueMs: number) => void
}

export const TimeInput = ({ valueMs, setValueMs, ...inputProps }: TimeInputProps) => {
  const {
    className,
    onBlur: _onBlur,
    onChange: _onChange,
    onKeyDown: _onKeyDown,
    ref: _ref,
    type: _type,
    value: _value,
    ...restInputProps
  } = inputProps as React.ComponentProps<'input'>
  const timeInputClassName = classes.timeInput + (className ? ' ' + className : '')

  const inputRef = useRef<HTMLInputElement>(null)
  const previousValueRef = useRef<string>(null)
  const hasPendingChangesRef = useRef(false)

  useEffect(() => {
    if (!inputRef.current) {
      return
    }
    const previousValue = previousValueRef.current === null
      ? validateTimeAndCursor(msToFormattedHourMinute(valueMs ?? 0), DEFAULT_VALUE).validatedValue
      : inputRef.current.value

    const { validatedValue } = validateTimeAndCursor(
      msToFormattedHourMinute(valueMs ?? 0),
      previousValue
    )
    inputRef.current.value = validatedValue

    if (previousValueRef.current !== validatedValue) {
      hasPendingChangesRef.current = false
      previousValueRef.current = validatedValue
    }
  }, [valueMs])

  useEffect(() => {
    const currentInput = inputRef.current
    if (!currentInput) {
      return
    }

    const abortController = new AbortController()
    currentInput.addEventListener('input', (event) => {
      if (!event.target) {
        return
      }
      const inputEl = event.target as HTMLInputElement
      const oldValue = previousValueRef.current ?? DEFAULT_VALUE
      const inputValue = inputEl.value
      const position = inputEl.selectionEnd || 0
      const isTyped = inputValue.length > oldValue.length
      const cursorCharacter = inputValue[position - 1]
      const addedCharacter = isTyped ? cursorCharacter : null
      const removedCharacter = isTyped ? null : oldValue[position]
      const replacedSingleCharacter = inputValue.length === oldValue.length ? oldValue[position - 1] : null

      let newValue = oldValue
      let newPosition = position

      if (addedCharacter !== null) {
        if (position > MAX_LENGTH) {
          newPosition = MAX_LENGTH
        } else if ((position === 3) && addedCharacter === colon) {
          newValue = inputValue.substring(0, position - 1) + colon + inputValue.substring(position + 1)
        } else if ((position === 3) && isNumber(addedCharacter)) {
          newValue = inputValue.substring(0, position - 1) + colon + addedCharacter + inputValue.substring(position + 2)
          newPosition = position + 1
        } else if (isNumber(addedCharacter)) {
          // user typed a number
          newValue = inputValue.substring(0, position - 1) + addedCharacter + inputValue.substring(position + 1)
          if (position === 2) {
            newPosition = position + 1
          }
        } else {
          // if user typed NOT a number, then keep old value & position
          newPosition = position - 1
        }
      } else if (replacedSingleCharacter !== null) {
        // user replaced only a single character
        if (isNumber(cursorCharacter)) {
          if (position - 1 === 2) {
            newValue = `${inputValue.substring(0, position - 1)}${colon}${inputValue.substring(position)}`
          } else {
            newValue = inputValue
          }
        } else {
          // user replaced a number on some non-number character
          newValue = oldValue
          newPosition = position - 1
        }
      } else if (typeof cursorCharacter !== 'undefined' && cursorCharacter !== colon && !isNumber(cursorCharacter)) {
        // set of characters replaced by non-number
        newValue = oldValue
        newPosition = position - 1
      } else if (removedCharacter !== null) {
        if ((position === 2) && removedCharacter === colon) {
          newValue = inputValue.substring(0, position - 1) + '0' + colon + inputValue.substring(position)
          newPosition = position - 1
        } else {
          // user removed a number
          newValue = inputValue.substring(0, position) + 0 + inputValue.substring(position)
        }
      }

      const { validatedValue, cursorPosition: validatedCursorPosition } = validateTimeAndCursor(
        newValue,
        oldValue,
        newPosition
      )

      currentInput.value = validatedValue
      currentInput.selectionStart = validatedCursorPosition
      currentInput.selectionEnd = validatedCursorPosition

      if (previousValueRef.current !== validatedValue) {
        hasPendingChangesRef.current = true
        previousValueRef.current = validatedValue
      }
    }, { signal: abortController.signal })

    return () => {
      abortController.abort()
    }
  }, [])

  const onBlur = useCallback(() => {
    if (!inputRef.current || hasPendingChangesRef.current === false) {
      return
    }

    const inputValue = inputRef.current.value
    setValueMs(formattedTimeToMs(inputValue))
    hasPendingChangesRef.current = false
  }, [setValueMs])

  const onKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (!inputRef.current || hasPendingChangesRef.current === false) {
      return
    }
    if (e.key === 'Enter') {
      const inputValue = inputRef.current.value
      setValueMs(formattedTimeToMs(inputValue))
      hasPendingChangesRef.current = false
    }
  }, [setValueMs])

  return (
    <input
      type="text"
      ref={inputRef}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      className={timeInputClassName}
      {...restInputProps}
    />
  )
}

function formatTimeItem(value?: string | number): string {
  return `${value || ''}00`.substring(0, 2)
}

type ValidateTimeAndCursorResult = {
  validatedValue: string
  cursorPosition: number
}

function validateTimeAndCursor(value = '', oldValue = '', cursorPosition = 0): ValidateTimeAndCursorResult {
  const [oldH, oldM] = oldValue.split(colon)

  let newCursorPosition = Number(cursorPosition)
  let [newH, newM] = String(value).split(colon)

  newH = formatTimeItem(newH)
  if (Number(newH[0]) > 2) {
    newH = oldH
    newCursorPosition -= 1
  } else if (Number(newH[0]) === 2) {
    if (Number(oldH[0]) === 2 && Number(newH[1]) > 3) {
      newH = `2${oldH[1]}`
      newCursorPosition -= 2
    } else if (Number(newH[1]) > 3) {
      newH = '23'
    }
  }

  newM = formatTimeItem(newM)
  if (Number(newM[0]) > 5) {
    newM = oldM
    newCursorPosition -= 1
  }

  const validatedValue = `${newH}${colon}${newM}`

  return {
    validatedValue,
    cursorPosition: newCursorPosition,
  }
}

function isNumber<T>(value: T): boolean {
  const number = Number(value);
  return !isNaN(number) && String(value) === String(number);
}


function parseIntEnsureNumber(str: string) {
  const parsed = parseInt(str, 10)
  if (isNaN(parsed)) { return 0 }
  return parsed
}

function formattedTimeToMs(str: string): number {
  const sections = str.split(":")
  const hoursString = sections[0]
  const minutesString = sections[1]

  const hoursInMilliseconds = parseIntEnsureNumber(hoursString) * 1000 * 60 * 60
  const minutesInMilliseconds = parseIntEnsureNumber(minutesString) * 1000 * 60

  return hoursInMilliseconds + minutesInMilliseconds
}
