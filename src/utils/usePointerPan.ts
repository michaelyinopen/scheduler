import { throttle } from 'lodash-es'
import {
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type PointerEventHandler,
  type RefObject,
  useCallback
} from 'react'
import { setViewStartEndTimeMs, useAppStore } from '../store'
import { throttleDelayMs } from '../constants'

const leftClickButtonNumber = 0
const wheelClickButtonNumber = 1
const mousePointerType = 'mouse'
const minPinchSeparationPx = 24

type PointerEventData = {
  pointerTimeMs: number
  pageX: number
  pointerType: string
}

// use a global variable since we only show one schedule
// change to a parameter, which is passed in at the component, which uses an imported global variable
const pointerEventCache: Record<string, PointerEventData> = {} // mutates

export function usePointerPan(containerRef: RefObject<HTMLElement | null>): PointerEventHandler<HTMLElement> {
  const abortControllerRef = useRef<AbortController>(null)

  const onPointerDown = useCallback(
    (downEvent: ReactPointerEvent) => {
      if (!containerRef.current) {
        return
      }
      if (downEvent.button !== leftClickButtonNumber && downEvent.button !== wheelClickButtonNumber) {
        return
      }

      const initialAppState = useAppStore.getState()
      const initialTimeAxisWidthPx = initialAppState.timeAxisWidthPx

      if (initialTimeAxisWidthPx === null || initialTimeAxisWidthPx === 0) {
        return
      }
      const initialWidthToTimeMultiplier = (initialAppState.viewEndTimeMs - initialAppState.viewStartTimeMs) / initialTimeAxisWidthPx

      document.getSelection()?.removeAllRanges()

      pointerEventCache[downEvent.pointerId] = {
        pointerTimeMs: downEvent.nativeEvent.offsetX * initialWidthToTimeMultiplier,
        pageX: downEvent.pageX,
        pointerType: downEvent.pointerType
      }

      const currentAbortController = new AbortController()
      abortControllerRef.current = currentAbortController

      const onPointerMove = throttle(
        (moveEvent: PointerEvent) => {
          const appState = useAppStore.getState()
          const {
            timeAxisWidthPx,
            viewStartTimeMs,
            maxTimeMs,
            minViewDurationMs,
            maxViewDurationMs,
          } = appState
          const viewDurationMs = appState.viewEndTimeMs - appState.viewStartTimeMs

          if (timeAxisWidthPx === null || timeAxisWidthPx === 0) {
            return
          }
          const widthToTimeMultiplier = viewDurationMs / timeAxisWidthPx

          if (Object.keys(pointerEventCache).length === 2 && pointerEventCache[moveEvent.pointerId] !== undefined) {
            // pinch: zoom and pan
            const {
              pointerTimeMs: movedPointerTimeMs,
              pageX: movedPageX,
            } = pointerEventCache[moveEvent.pointerId]

            const otherPointerId = Object.keys(pointerEventCache).find(k => k !== moveEvent.pointerId.toString())!
            const {
              pointerTimeMs: otherPointerTimeMs,
              pageX: otherPageX,
            } = pointerEventCache[otherPointerId]

            const zoomFactor = Math.abs(moveEvent.pageX - otherPageX) > minPinchSeparationPx
              ? Math.abs((movedPageX - otherPageX) / (moveEvent.pageX - otherPageX))
              : 1

            const minZoomFactor = minViewDurationMs / viewDurationMs
            const maxZoomFactor = maxViewDurationMs / viewDurationMs
            const appliedZoomFactor = Math.max(minZoomFactor, Math.min(zoomFactor, maxZoomFactor))

            const draftViewStartMs = otherPointerTimeMs - (otherPointerTimeMs - viewStartTimeMs) * appliedZoomFactor
            const newMaxViewStartMs = maxTimeMs - timeAxisWidthPx * widthToTimeMultiplier * appliedZoomFactor
            const newViewStartMs = Math.max(0, Math.min(draftViewStartMs, newMaxViewStartMs))
            const newViewEndMs = newViewStartMs + viewDurationMs * appliedZoomFactor

            const newMovedPointerTimeMs = newViewStartMs + (movedPointerTimeMs - viewStartTimeMs) * appliedZoomFactor
            const newOtherPointerTimeMs = newViewStartMs + (otherPointerTimeMs - viewStartTimeMs) * appliedZoomFactor

            setViewStartEndTimeMs(newViewStartMs, newViewEndMs)

            pointerEventCache[moveEvent.pointerId] = {
              pointerTimeMs: newMovedPointerTimeMs,
              pageX: moveEvent.pageX,
              pointerType: moveEvent.pointerType,
            }

            pointerEventCache[otherPointerId] = {
              pointerTimeMs: newOtherPointerTimeMs,
              pageX: otherPageX,
              pointerType: moveEvent.pointerType,
            }

            return
          }

          if (Object.keys(pointerEventCache).length === 1 && moveEvent.isPrimary && pointerEventCache[moveEvent.pointerId] !== undefined) {
            // single pointer pan
            const {
              pointerTimeMs: previousPointerTimeMs,
              pageX: previousPageX,
            } = pointerEventCache[moveEvent.pointerId]

            const deltaX = previousPageX - moveEvent.pageX
            const draftViewStartMs = viewStartTimeMs + deltaX * widthToTimeMultiplier

            const newMaxViewStartMs = maxTimeMs - viewDurationMs
            const newViewStartMs = Math.max(0, Math.min(draftViewStartMs, newMaxViewStartMs))
            const newViewEndMs = newViewStartMs + viewDurationMs

            setViewStartEndTimeMs(newViewStartMs, newViewEndMs)

            const newPointerTimeMs = previousPointerTimeMs + (moveEvent.pageX - previousPageX) * widthToTimeMultiplier
            pointerEventCache[moveEvent.pointerId] = {
              pointerTimeMs: newPointerTimeMs,
              pageX: moveEvent.pageX,
              pointerType: moveEvent.pointerType,
            }

            return
          }

          if (pointerEventCache[moveEvent.pointerId] !== undefined) {
            const newPointerTimeMs = pointerEventCache[moveEvent.pointerId].pointerTimeMs + (moveEvent.pageX - pointerEventCache[moveEvent.pointerId].pageX) * widthToTimeMultiplier
            pointerEventCache[moveEvent.pointerId] = {
              pointerTimeMs: newPointerTimeMs,
              pageX: moveEvent.pageX,
              pointerType: moveEvent.pointerType,
            }
          }
        },
        throttleDelayMs,
        { leading: true, trailing: true }
      )

      const clearPointer = (event: PointerEvent) => {
        delete pointerEventCache[event.pointerId]

        if (Object.keys(pointerEventCache).length === 0) {
          if (containerRef.current) {
            containerRef.current.style.cursor = "auto"
          }

          currentAbortController.abort()
        }
      }

      const clearMousePointers = () => {
        for (const key of Object.keys(pointerEventCache)) {
          if (pointerEventCache[key].pointerType === mousePointerType) {
            delete pointerEventCache[key]
          }
        }
        if (Object.keys(pointerEventCache).length === 0) {
          if (containerRef.current) {
            containerRef.current.style.cursor = "auto"
          }

          currentAbortController.abort()
        }
      }

      if (Object.keys(pointerEventCache).length === 1) {
        containerRef.current.style.cursor = "grabbing"

        window.addEventListener("pointermove", onPointerMove, { signal: abortControllerRef.current?.signal, passive: true })
        window.addEventListener("pointerup", clearPointer, { signal: abortControllerRef.current?.signal })
        window.addEventListener("pointercancel", clearPointer, { signal: abortControllerRef.current?.signal })
        document.addEventListener("pointerleave", clearPointer, { signal: abortControllerRef.current?.signal }) // e.g. alt-tab or switch tabs
        window.addEventListener("mouseup", clearMousePointers, { signal: abortControllerRef.current?.signal }) // e.g. right-click while panning
      }
    },
    [containerRef]
  )

  useEffect(() => {
    const container = containerRef.current
    return () => {
      if (container) {
        container.style.cursor = "auto";
      }
      abortControllerRef.current?.abort()
    }
  }, [containerRef]);

  return onPointerDown;
}
