import { throttle } from 'lodash-es';
import { useEffect, useEffectEvent, type RefObject } from 'react';
import { throttleDelayMs } from '../constants';
import { setViewStartEndTimeMs, timeToWidthMultiplierSelector, useAppStore } from '../store';

// mouse wheel scroll = zoom
// Shift key + mouse wheel scroll = panning horizontally

const deltaModeLineModeNumber = 1
const deltaLineInPx = 18.2 // 16 * 1.15<line-height>
const wheelPanStep = 0.4
const zoomSensitivity = 0.4
const pointerPanButtons = [1, 4, 5] // Primary button, Auxiliary button or both

// multi-touch and wheel zoom at the same time will cause conflicts, because the wheel could move the pointers' time
// disable wheel pan and zoom when there is at least one non-mouse pointer in pointerEventCache
export function useWheelZoomPan(containerRef: RefObject<HTMLElement | null>) {
  const onWheel = useEffectEvent(throttle(
    (event: WheelEvent) => {
      const appState = useAppStore.getState()
      const timeAxisWidthPx = appState.timeAxisWidthPx
      const timeToWidthMultiplier = timeToWidthMultiplierSelector(appState)
      const viewDurationMs = appState.viewEndTimeMs - appState.viewStartTimeMs
      const viewStartMs = appState.viewStartTimeMs

      if (timeToWidthMultiplier === null || timeToWidthMultiplier === 0 || timeAxisWidthPx === null || timeAxisWidthPx === 0) {
        return
      }
      const widthToTimeMultiplier = viewDurationMs / timeAxisWidthPx

      const deltaModeMultiplier = event.deltaMode === deltaModeLineModeNumber ? deltaLineInPx : 1
      const deltaPx = event.deltaY * deltaModeMultiplier // up is negative

      if (event.shiftKey) {
        // disable wheel-scroll-panning while pointer-panning
        if (pointerPanButtons.includes(event.buttons)) {
          return
        }
        // pan horizontally
        const movedMs = wheelPanStep * deltaPx / timeToWidthMultiplier

        const newMaxViewStartMs = appState.maxTimeMs - viewDurationMs
        const newViewStartMs = Math.max(0, Math.min(viewStartMs + movedMs, newMaxViewStartMs))
        const newViewEndMs = newViewStartMs + viewDurationMs

        setViewStartEndTimeMs(newViewStartMs, newViewEndMs)

        event.preventDefault()
        return
      }
      else {
        // zoom
        const zoomCenterTimeMs = event.offsetX / timeToWidthMultiplier
        // zoom-in then zoom-out to the same wheel position have initial zoom level
        const zoomFactor =
          deltaPx > 0
            ? 1 / (1 - deltaPx / timeAxisWidthPx * zoomSensitivity)
            : 1 + deltaPx / timeAxisWidthPx * zoomSensitivity

        const minZoomFactor = appState.minViewDurationMs / viewDurationMs
        const maxZoomFactor = appState.maxViewDurationMs / viewDurationMs
        const appliedZoomFactor = Math.max(minZoomFactor, Math.min(zoomFactor, maxZoomFactor))

        const newMaxViewStartMs = appState.maxTimeMs - timeAxisWidthPx * widthToTimeMultiplier * appliedZoomFactor
        const newViewStartMs = Math.max(0, Math.min(zoomCenterTimeMs - (zoomCenterTimeMs - viewStartMs) * appliedZoomFactor, newMaxViewStartMs))
        const newViewEndMs = newViewStartMs + viewDurationMs * appliedZoomFactor

        setViewStartEndTimeMs(newViewStartMs, newViewEndMs)

        event.preventDefault()
      }
    },
    throttleDelayMs,
    { leading: true, trailing: true }
  ))

  useEffect(
    () => {
      const abortController = new AbortController()
      const container = containerRef.current
      container?.addEventListener("wheel", onWheel, { signal: abortController.signal })
      return () => abortController.abort()
    },
    [containerRef]
  )
}
