import type { PointerEvent } from 'react'

export function stopPointerPropagation(event: PointerEvent) {
  event.stopPropagation()
}
